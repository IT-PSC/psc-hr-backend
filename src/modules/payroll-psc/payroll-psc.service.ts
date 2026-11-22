import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import {
  EVENT_PAYROLL_PSC_APPROVED,
  IntegrationEventsService,
} from '../../common/events/integration-events.service';
import { PrismaService } from '../../common/prisma/prisma.service';
import { FinanceBridgeService } from '../finance/finance-bridge.service';
import {
  CreatePayrollRunDto,
  PayrollLineDto,
} from './dto/payroll.dto';

const EDITABLE = new Set(['draft', 'returned']);
const SUBMITTABLE = new Set(['draft', 'returned']);
const APPROVABLE = new Set(['awaiting_md_approval', 'submitted']);

@Injectable()
export class PayrollPscService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly events: IntegrationEventsService,
    private readonly financeBridge: FinanceBridgeService,
  ) {}

  private mapRun(
    run: Prisma.PscPayrollRunGetPayload<{ include: { lines: true } }>,
  ) {
    const lines = run.lines.map((l) => ({
      id: l.id,
      runId: l.runId,
      employeeId: l.employeeId,
      personLabel: l.personLabel,
      taxOnly: l.taxOnly,
      gross: Number(l.gross),
      employeeTax: Number(l.employeeTax),
      companyTax: Number(l.companyTax),
      netPay: Number(l.netPay),
      snapshot: l.snapshot,
    }));
    return {
      id: run.id,
      periodYm: run.periodYm,
      month: run.periodYm,
      status: run.status,
      settlementStatus: run.settlementStatus,
      currency: run.currency,
      totalAmount: Number(run.totalAmount),
      branchCode: run.branchCode,
      revision: run.revision,
      notes: run.notes,
      submittedAt: run.submittedAt?.toISOString() ?? null,
      approvedAt: run.approvedAt?.toISOString() ?? null,
      paidAt: run.paidAt?.toISOString() ?? null,
      createdAt: run.createdAt.toISOString(),
      updatedAt: run.updatedAt.toISOString(),
      lines,
    };
  }

  private sumNet(lines: PayrollLineDto[]): number {
    return Math.round(lines.reduce((s, l) => s + Number(l.netPay), 0) * 100) / 100;
  }

  async runs(status?: string) {
    const rows = await this.prisma.pscPayrollRun.findMany({
      where: status ? { status } : undefined,
      include: { lines: true },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
    return rows.map((r) => this.mapRun(r));
  }

  async getRun(id: string) {
    const run = await this.prisma.pscPayrollRun.findUnique({
      where: { id },
      include: { lines: true },
    });
    if (!run) throw new NotFoundException('Payroll run not found');
    return this.mapRun(run);
  }

  async createDraft(dto: CreatePayrollRunDto) {
    const lines = dto.lines ?? [];
    const totalAmount =
      dto.totalAmount ?? (lines.length ? this.sumNet(lines) : 0);
    const run = await this.prisma.pscPayrollRun.create({
      data: {
        periodYm: dto.periodYm,
        totalAmount,
        status: 'draft',
        settlementStatus: 'unpaid',
        currency: 'USD',
        branchCode: dto.branchCode,
        notes: dto.notes,
        lines: lines.length
          ? {
              create: lines.map((l) => ({
                employeeId: l.employeeId,
                personLabel: l.personLabel,
                taxOnly: l.taxOnly ?? false,
                gross: l.gross,
                employeeTax: l.employeeTax,
                companyTax: l.companyTax,
                netPay: l.netPay,
                snapshot: (l.snapshot as Prisma.InputJsonValue) ?? undefined,
              })),
            }
          : undefined,
      },
      include: { lines: true },
    });
    return this.mapRun(run);
  }

  async replaceLines(runId: string, lines: PayrollLineDto[]) {
    const run = await this.prisma.pscPayrollRun.findUnique({
      where: { id: runId },
    });
    if (!run) throw new NotFoundException('Payroll run not found');
    if (!EDITABLE.has(run.status)) {
      throw new BadRequestException(`Cannot edit lines in status ${run.status}`);
    }
    const totalAmount = this.sumNet(lines);
    const updated = await this.prisma.$transaction(async (tx) => {
      await tx.pscPayrollLine.deleteMany({ where: { runId } });
      await tx.pscPayrollLine.createMany({
        data: lines.map((l) => ({
          runId,
          employeeId: l.employeeId,
          personLabel: l.personLabel,
          taxOnly: l.taxOnly ?? false,
          gross: l.gross,
          employeeTax: l.employeeTax,
          companyTax: l.companyTax,
          netPay: l.netPay,
          snapshot: (l.snapshot as Prisma.InputJsonValue) ?? undefined,
        })),
      });
      return tx.pscPayrollRun.update({
        where: { id: runId },
        data: {
          totalAmount,
          revision: run.revision + 1,
          status: run.status === 'returned' ? 'draft' : run.status,
        },
        include: { lines: true },
      });
    });
    return this.mapRun(updated);
  }

  async submit(runId: string) {
    const run = await this.prisma.pscPayrollRun.findUnique({
      where: { id: runId },
      include: { lines: true },
    });
    if (!run) throw new NotFoundException('Payroll run not found');
    if (!SUBMITTABLE.has(run.status)) {
      throw new BadRequestException(`Cannot submit from status ${run.status}`);
    }
    if (run.lines.length === 0 && Number(run.totalAmount) <= 0) {
      throw new BadRequestException('Add lines or totalAmount before submit');
    }
    const updated = await this.prisma.pscPayrollRun.update({
      where: { id: runId },
      data: {
        status: 'awaiting_md_approval',
        submittedAt: new Date(),
      },
      include: { lines: true },
    });
    return this.mapRun(updated);
  }

  async returnRun(runId: string, note?: string) {
    const run = await this.prisma.pscPayrollRun.findUnique({
      where: { id: runId },
      include: { lines: true },
    });
    if (!run) throw new NotFoundException('Payroll run not found');
    if (run.status !== 'awaiting_md_approval' && run.status !== 'submitted') {
      throw new BadRequestException(`Cannot return from status ${run.status}`);
    }
    const updated = await this.prisma.pscPayrollRun.update({
      where: { id: runId },
      data: {
        status: 'returned',
        notes: note ?? run.notes,
        revision: run.revision + 1,
      },
      include: { lines: true },
    });
    return this.mapRun(updated);
  }

  async approveMd(runId: string, actorId?: string) {
    const run = await this.prisma.pscPayrollRun.findUnique({
      where: { id: runId },
      include: { lines: true },
    });
    if (!run) throw new NotFoundException('Payroll run not found');
    if (run.status === 'md_approved' || run.status === 'paid') {
      throw new BadRequestException(`Run already ${run.status}`);
    }
    // Prefer awaiting_md_approval; draft/submitted kept for earlier thin clients
    if (
      !APPROVABLE.has(run.status) &&
      run.status !== 'draft'
    ) {
      throw new BadRequestException(
        `Run must be awaiting_md_approval (got ${run.status})`,
      );
    }

    const amount =
      run.lines.length > 0
        ? run.lines.reduce((s, l) => s + Number(l.netPay), 0)
        : Number(run.totalAmount);

    const updated = await this.prisma.pscPayrollRun.update({
      where: { id: runId },
      data: {
        status: 'md_approved',
        approvedAt: new Date(),
        totalAmount: amount,
      },
      include: { lines: true },
    });

    const eventId = `payroll.psc.approved:${runId}`;
    const event = await this.events.emit(
      eventId,
      EVENT_PAYROLL_PSC_APPROVED,
      runId,
      {
        payrollRunId: runId,
        periodYm: run.periodYm,
        amount,
        currency: run.currency,
        actorId: actorId ?? null,
      },
    );

    await this.financeBridge.handlePayrollApproved(event.eventId, {
      payrollRunId: runId,
      amount,
      currency: run.currency,
      periodYm: run.periodYm,
    });

    return { run: this.mapRun(updated), eventId };
  }

  async markPaid(runId: string) {
    const run = await this.prisma.pscPayrollRun.findUnique({
      where: { id: runId },
      include: { lines: true },
    });
    if (!run) throw new NotFoundException('Payroll run not found');
    if (run.status !== 'md_approved') {
      throw new BadRequestException('Only md_approved runs can be marked paid');
    }
    const updated = await this.prisma.pscPayrollRun.update({
      where: { id: runId },
      data: {
        status: 'paid',
        settlementStatus: 'fully_paid',
        paidAt: new Date(),
      },
      include: { lines: true },
    });
    return this.mapRun(updated);
  }
}
