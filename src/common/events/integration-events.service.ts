import { Injectable, Logger } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

export const EVENT_PAYROLL_PSC_APPROVED = 'payroll.psc.approved';
export const EVENT_AP_DOCUMENT_APPROVED = 'ap.document.approved';

@Injectable()
export class IntegrationEventsService {
  private readonly logger = new Logger(IntegrationEventsService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Persist an idempotent event. Returns existing row if eventId already seen.
   */
  async emit(
    eventId: string,
    type: string,
    sourceId: string,
    payload: Prisma.InputJsonValue,
  ) {
    const existing = await this.prisma.integrationEvent.findUnique({
      where: { eventId },
    });
    if (existing) {
      this.logger.log(`Idempotent skip eventId=${eventId} type=${type}`);
      return existing;
    }
    return this.prisma.integrationEvent.create({
      data: { eventId, type, sourceId, payload, status: 'pending' },
    });
  }

  async markProcessed(eventId: string) {
    return this.prisma.integrationEvent.update({
      where: { eventId },
      data: { status: 'processed', processedAt: new Date(), error: null },
    });
  }

  async markFailed(eventId: string, error: string) {
    return this.prisma.integrationEvent.update({
      where: { eventId },
      data: { status: 'failed', error },
    });
  }
}
