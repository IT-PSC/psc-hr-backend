import { Injectable, Logger } from '@nestjs/common';
import { IntegrationEventsService } from '../../common/events/integration-events.service';
import { PrismaService } from '../../common/prisma/prisma.service';

@Injectable()
export class FinanceBridgeService {
  private readonly logger = new Logger(FinanceBridgeService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly events: IntegrationEventsService,
  ) {}

  async handlePayrollApproved(
    eventId: string,
    data: {
      payrollRunId: string;
      amount: number;
      currency: string;
      periodYm?: string;
    },
  ) {
    try {
      await this.prisma.finPayrollPosting.upsert({
        where: { eventId },
        create: {
          eventId,
          payrollRunId: data.payrollRunId,
          amount: data.amount,
          currency: data.currency,
          periodYm: data.periodYm,
          status: 'draft',
        },
        update: {},
      });
      await this.events.markProcessed(eventId);
      this.logger.log(`FinPayrollPosting draft for ${data.payrollRunId}`);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      await this.events.markFailed(eventId, msg);
      throw e;
    }
  }

  async handleApApproved(
    eventId: string,
    data: { apDocumentId: string; amount: number; currency: string },
  ) {
    try {
      await this.prisma.finApPaymentProposal.upsert({
        where: { eventId },
        create: {
          eventId,
          apDocumentId: data.apDocumentId,
          amount: data.amount,
          currency: data.currency,
          status: 'draft',
        },
        update: {},
      });
      await this.events.markProcessed(eventId);
      this.logger.log(`FinApPaymentProposal draft for ${data.apDocumentId}`);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      await this.events.markFailed(eventId, msg);
      throw e;
    }
  }
}
