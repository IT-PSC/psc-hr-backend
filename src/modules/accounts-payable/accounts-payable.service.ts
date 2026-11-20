import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import {
  EVENT_AP_DOCUMENT_APPROVED,
  IntegrationEventsService,
} from '../../common/events/integration-events.service';
import { FinanceBridgeService } from '../finance/finance-bridge.service';

@Injectable()
export class AccountsPayableService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly events: IntegrationEventsService,
    private readonly financeBridge: FinanceBridgeService,
  ) {}

  requests() {
    return this.prisma.apDocument.findMany({
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  }

  async createDraft(input: {
    docNumber: string;
    supplier: string;
    amount: number;
    currency?: string;
  }) {
    return this.prisma.apDocument.create({
      data: {
        docNumber: input.docNumber,
        supplier: input.supplier,
        amount: input.amount,
        openBalance: input.amount,
        currency: input.currency ?? 'USD',
        status: 'draft',
      },
    });
  }

  async approve(docId: string, actorId?: string) {
    const doc = await this.prisma.apDocument.findUnique({ where: { id: docId } });
    if (!doc) throw new NotFoundException('A/P document not found');
    if (doc.status === 'approved' || doc.status === 'paid') {
      throw new BadRequestException(`Document already ${doc.status}`);
    }

    const updated = await this.prisma.apDocument.update({
      where: { id: docId },
      data: { status: 'approved', approvedAt: new Date() },
    });

    // Only USD open balance creates finance proposal (mirrors SPA bridge)
    if (doc.currency === 'USD' && Number(doc.openBalance) > 0) {
      const eventId = `ap.document.approved:${docId}`;
      const event = await this.events.emit(
        eventId,
        EVENT_AP_DOCUMENT_APPROVED,
        docId,
        {
          apDocumentId: docId,
          amount: Number(doc.openBalance),
          currency: doc.currency,
          actorId: actorId ?? null,
        },
      );
      await this.financeBridge.handleApApproved(event.eventId, {
        apDocumentId: docId,
        amount: Number(doc.openBalance),
        currency: doc.currency,
      });
      return { document: updated, eventId };
    }

    return { document: updated, eventId: null };
  }
}
