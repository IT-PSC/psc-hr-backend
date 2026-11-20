import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import {
  EVENT_PAYROLL_PSC_APPROVED,
  IntegrationEventsService,
} from '../../common/events/integration-events.service';
import { FinanceBridgeService } from '../finance/finance-bridge.service';

@Injectable()
export class PayrollPscService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly events: IntegrationEventsService,
    private readonly financeBridge: FinanceBridgeService,
  ) {}

  runs() {
    return this.prisma.pscPayrollRun.findMany({
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  }

  async createDraft(periodYm: string, totalAmount: number) {
    return this.prisma.pscPayrollRun.create({
      data: {
        periodYm,
        totalAmount,
        status: 'draft',
        currency: 'USD',
      },
    });
  }

  async approveMd(runId: string, actorId?: string) {
    const run = await this.prisma.pscPayrollRun.findUnique({
      where: { id: runId },
    });
    if (!run) throw new NotFoundException('Payroll run not found');
    if (run.status === 'md_approved' || run.status === 'paid') {
      throw new BadRequestException(`Run already ${run.status}`);
    }

    const updated = await this.prisma.pscPayrollRun.update({
      where: { id: runId },
      data: { status: 'md_approved', approvedAt: new Date() },
    });

    const eventId = `payroll.psc.approved:${runId}`;
    const event = await this.events.emit(
      eventId,
      EVENT_PAYROLL_PSC_APPROVED,
      runId,
      {
        payrollRunId: runId,
        periodYm: run.periodYm,
        amount: Number(run.totalAmount),
        currency: run.currency,
        actorId: actorId ?? null,
      },
    );

    await this.financeBridge.handlePayrollApproved(event.eventId, {
      payrollRunId: runId,
      amount: Number(run.totalAmount),
      currency: run.currency,
    });

    return { run: updated, eventId };
  }
}
