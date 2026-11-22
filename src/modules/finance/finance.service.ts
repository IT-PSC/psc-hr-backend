import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';

@Injectable()
export class FinanceService {
  constructor(private readonly prisma: PrismaService) {}

  async summary() {
    const cashAccounts = await this.prisma.finAccount.findMany({
      where: { type: { in: ['cash', 'bank'] } },
      select: { id: true },
    });
    const cashIds = cashAccounts.map((account) => account.id);

    const [
      payrollDrafts,
      payrollPosted,
      apProposalsDraft,
      apProposalsPaid,
      openAp,
      mdApprovedPayroll,
      openInvoices,
    ] = await Promise.all([
      this.prisma.finPayrollPosting.count({ where: { status: 'draft' } }),
      this.prisma.finPayrollPosting.count({ where: { status: 'posted' } }),
      this.prisma.finApPaymentProposal.count({ where: { status: 'draft' } }),
      this.prisma.finApPaymentProposal.count({ where: { status: 'paid' } }),
      this.prisma.apDocument.aggregate({
        where: { status: { in: ['approved', 'awaiting_approval', 'awaiting_checking'] } },
        _sum: { openBalance: true },
      }),
      this.prisma.pscPayrollRun.aggregate({
        where: { status: { in: ['md_approved', 'paid'] } },
        _sum: { totalAmount: true },
      }),
      this.prisma.finInvoice.findMany({
        where: { status: { in: ['posted', 'partial'] } },
        select: {
          gross: true,
          receipts: {
            where: { confirmationStatus: 'confirmed' },
            select: { amount: true, confirmedAmount: true },
          },
        },
      }),
    ]);

    let cashOnHand = 0;
    if (cashIds.length) {
      const cashAgg = await this.prisma.finJournalLine.aggregate({
        where: {
          accountId: { in: cashIds },
          journal: { status: 'posted' },
        },
        _sum: { debit: true, credit: true },
      });
      cashOnHand =
        Math.round(
          (Number(cashAgg._sum.debit ?? 0) - Number(cashAgg._sum.credit ?? 0)) *
            100,
        ) / 100;
    }

    let receivables = 0;
    for (const invoice of openInvoices) {
      const confirmed = invoice.receipts.reduce(
        (sum, receipt) =>
          sum + Number(receipt.confirmedAmount ?? receipt.amount),
        0,
      );
      receivables += Math.max(0, Number(invoice.gross) - confirmed);
    }
    receivables = Math.round(receivables * 100) / 100;

    const payablesOpen = Number(openAp._sum.openBalance ?? 0);
    const payrollAccrual = Number(mdApprovedPayroll._sum.totalAmount ?? 0);

    return {
      currency: 'USD',
      /** Computed from live AP open balances */
      payablesOpen,
      /** Sum of MD-approved / paid PSC runs */
      payrollAccrual,
      draftPayrollPostings: payrollDrafts,
      postedPayrollPostings: payrollPosted,
      draftApPaymentProposals: apProposalsDraft,
      paidApPaymentProposals: apProposalsPaid,
      /** Posted cash/bank journal lines (debit − credit) */
      cashOnHand,
      /** Posted/partial invoice gross minus confirmed receipts */
      receivables,
      notes:
        'cashOnHand is posted journal activity on accounts typed cash or bank. receivables is open invoice gross minus confirmed receipts. payablesOpen and payrollAccrual are live aggregates.',
    };
  }

  async payrollPostings(status?: string) {
    const rows = await this.prisma.finPayrollPosting.findMany({
      where: status ? { status } : undefined,
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
    return rows.map((r) => ({
      ...r,
      amount: Number(r.amount),
      postedAt: r.postedAt?.toISOString() ?? null,
      createdAt: r.createdAt.toISOString(),
      updatedAt: r.updatedAt.toISOString(),
    }));
  }

  async apPaymentProposals(status?: string) {
    const rows = await this.prisma.finApPaymentProposal.findMany({
      where: status ? { status } : undefined,
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
    return rows.map((r) => ({
      ...r,
      amount: Number(r.amount),
      postedAt: r.postedAt?.toISOString() ?? null,
      paidAt: r.paidAt?.toISOString() ?? null,
      createdAt: r.createdAt.toISOString(),
      updatedAt: r.updatedAt.toISOString(),
    }));
  }

  events() {
    return this.prisma.integrationEvent.findMany({
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  }

  async postPayrollPosting(id: string, actorId?: string) {
    const row = await this.prisma.finPayrollPosting.findUnique({
      where: { id },
    });
    if (!row) throw new NotFoundException('Payroll posting not found');
    if (row.status !== 'draft') {
      throw new BadRequestException(`Cannot post from status ${row.status}`);
    }
    return this.prisma.finPayrollPosting.update({
      where: { id },
      data: {
        status: 'posted',
        postedAt: new Date(),
        postedById: actorId,
      },
    });
  }

  async voidPayrollPosting(id: string) {
    const row = await this.prisma.finPayrollPosting.findUnique({
      where: { id },
    });
    if (!row) throw new NotFoundException('Payroll posting not found');
    if (row.status === 'void') {
      throw new BadRequestException('Already void');
    }
    return this.prisma.finPayrollPosting.update({
      where: { id },
      data: { status: 'void' },
    });
  }

  async postApProposal(id: string, actorId?: string) {
    const row = await this.prisma.finApPaymentProposal.findUnique({
      where: { id },
    });
    if (!row) throw new NotFoundException('AP payment proposal not found');
    if (row.status !== 'draft') {
      throw new BadRequestException(`Cannot post from status ${row.status}`);
    }
    return this.prisma.finApPaymentProposal.update({
      where: { id },
      data: {
        status: 'posted',
        postedAt: new Date(),
        postedById: actorId,
      },
    });
  }

  async markApProposalPaid(id: string) {
    const row = await this.prisma.finApPaymentProposal.findUnique({
      where: { id },
    });
    if (!row) throw new NotFoundException('AP payment proposal not found');
    if (row.status !== 'posted' && row.status !== 'draft') {
      throw new BadRequestException(`Cannot mark paid from ${row.status}`);
    }
    return this.prisma.finApPaymentProposal.update({
      where: { id },
      data: {
        status: 'paid',
        paidAt: new Date(),
        postedAt: row.postedAt ?? new Date(),
      },
    });
  }
}
