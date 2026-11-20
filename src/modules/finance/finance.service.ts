import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';

@Injectable()
export class FinanceService {
  constructor(private readonly prisma: PrismaService) {}

  async summary() {
    const [payrollDrafts, apProposals] = await Promise.all([
      this.prisma.finPayrollPosting.count({ where: { status: 'draft' } }),
      this.prisma.finApPaymentProposal.count({ where: { status: 'draft' } }),
    ]);
    return {
      currency: 'USD',
      cashOnHand: 125000,
      receivables: 48200,
      payables: 31650,
      payrollAccrual: 89000,
      draftPayrollPostings: payrollDrafts,
      draftApPaymentProposals: apProposals,
    };
  }

  payrollPostings() {
    return this.prisma.finPayrollPosting.findMany({
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  }

  apPaymentProposals() {
    return this.prisma.finApPaymentProposal.findMany({
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  }

  events() {
    return this.prisma.integrationEvent.findMany({
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  }
}
