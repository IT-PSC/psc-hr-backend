import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import {
  EVENT_AP_DOCUMENT_APPROVED,
  IntegrationEventsService,
} from '../../common/events/integration-events.service';
import { PrismaService } from '../../common/prisma/prisma.service';
import { FinanceBridgeService } from '../finance/finance-bridge.service';
import { ApLineDto, CreateApDocumentDto } from './dto/ap.dto';

@Injectable()
export class AccountsPayableService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly events: IntegrationEventsService,
    private readonly financeBridge: FinanceBridgeService,
  ) {}

  private map(
    doc: Prisma.ApDocumentGetPayload<{ include: { lines: true } }>,
  ) {
    return {
      id: doc.id,
      docNumber: doc.docNumber,
      docType: doc.docType,
      type: doc.docType,
      supplier: doc.supplier,
      purpose: doc.purpose,
      currency: doc.currency,
      amount: Number(doc.amount),
      openBalance: Number(doc.openBalance),
      status: doc.status,
      settlementStatus: doc.settlementStatus,
      preparerId: doc.preparerId,
      checkerId: doc.checkerId,
      approverId: doc.approverId,
      checkedAt: doc.checkedAt?.toISOString() ?? null,
      approvedAt: doc.approvedAt?.toISOString() ?? null,
      returnReason: doc.returnReason,
      revision: doc.revision,
      createdAt: doc.createdAt.toISOString(),
      updatedAt: doc.updatedAt.toISOString(),
      lines: doc.lines.map((l) => ({
        id: l.id,
        description: l.description,
        category: l.category,
        currency: l.currency,
        amount: Number(l.amount),
        invoiceRef: l.invoiceRef,
        invoiceDate: l.invoiceDate?.toISOString().slice(0, 10) ?? null,
      })),
    };
  }

  private sumLines(lines: ApLineDto[]): number {
    return Math.round(lines.reduce((s, l) => s + Number(l.amount), 0) * 100) / 100;
  }

  async requests(status?: string) {
    const rows = await this.prisma.apDocument.findMany({
      where: status ? { status } : undefined,
      include: { lines: true },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
    return rows.map((r) => this.map(r));
  }

  async getOne(id: string) {
    const doc = await this.prisma.apDocument.findUnique({
      where: { id },
      include: { lines: true },
    });
    if (!doc) throw new NotFoundException('A/P document not found');
    return this.map(doc);
  }

  async createDraft(input: CreateApDocumentDto, preparerId?: string) {
    const lines = input.lines ?? [];
    const amount =
      input.amount ?? (lines.length ? this.sumLines(lines) : 0);
    if (amount <= 0) {
      throw new BadRequestException('amount or lines required');
    }
    const doc = await this.prisma.apDocument.create({
      data: {
        docNumber: input.docNumber,
        docType: input.docType ?? 'PR',
        supplier: input.supplier,
        purpose: input.purpose,
        amount,
        openBalance: amount,
        currency: input.currency ?? 'USD',
        status: 'draft',
        settlementStatus: 'unpaid',
        preparerId,
        lines: lines.length
          ? {
              create: lines.map((l) => ({
                description: l.description,
                category: l.category,
                currency: l.currency ?? input.currency ?? 'USD',
                amount: l.amount,
                invoiceRef: l.invoiceRef,
                invoiceDate: l.invoiceDate
                  ? new Date(l.invoiceDate)
                  : undefined,
              })),
            }
          : undefined,
      },
      include: { lines: true },
    });
    return this.map(doc);
  }

  async submit(id: string) {
    const doc = await this.require(id);
    if (doc.status !== 'draft' && doc.status !== 'returned') {
      throw new BadRequestException(`Cannot submit from ${doc.status}`);
    }
    return this.map(
      await this.prisma.apDocument.update({
        where: { id },
        data: {
          status: 'awaiting_checking',
          returnReason: null,
          revision: doc.status === 'returned' ? doc.revision + 1 : doc.revision,
        },
        include: { lines: true },
      }),
    );
  }

  async check(id: string, checkerId?: string) {
    const doc = await this.require(id);
    if (doc.status !== 'awaiting_checking') {
      throw new BadRequestException(`Cannot check from ${doc.status}`);
    }
    return this.map(
      await this.prisma.apDocument.update({
        where: { id },
        data: {
          status: 'awaiting_approval',
          checkerId,
          checkedAt: new Date(),
        },
        include: { lines: true },
      }),
    );
  }

  async returnDoc(id: string, reason?: string) {
    const doc = await this.require(id);
    if (
      doc.status !== 'awaiting_checking' &&
      doc.status !== 'awaiting_approval'
    ) {
      throw new BadRequestException(`Cannot return from ${doc.status}`);
    }
    return this.map(
      await this.prisma.apDocument.update({
        where: { id },
        data: {
          status: 'returned',
          returnReason: reason,
          revision: doc.revision + 1,
        },
        include: { lines: true },
      }),
    );
  }

  async cancel(id: string) {
    const doc = await this.require(id);
    if (!['draft', 'returned', 'awaiting_checking'].includes(doc.status)) {
      throw new BadRequestException(`Cannot cancel from ${doc.status}`);
    }
    return this.map(
      await this.prisma.apDocument.update({
        where: { id },
        data: { status: 'cancelled' },
        include: { lines: true },
      }),
    );
  }

  async approve(docId: string, actorId?: string) {
    const doc = await this.prisma.apDocument.findUnique({
      where: { id: docId },
      include: { lines: true },
    });
    if (!doc) throw new NotFoundException('A/P document not found');
    if (doc.status === 'approved' || doc.status === 'paid') {
      throw new BadRequestException(`Document already ${doc.status}`);
    }
    // Prefer awaiting_approval; draft kept for earlier thin API clients
    if (
      doc.status !== 'awaiting_approval' &&
      doc.status !== 'draft' &&
      doc.status !== 'awaiting_checking'
    ) {
      throw new BadRequestException(
        `Cannot approve from status ${doc.status}`,
      );
    }

    const updated = await this.prisma.apDocument.update({
      where: { id: docId },
      data: {
        status: 'approved',
        approvedAt: new Date(),
        approverId: actorId,
      },
      include: { lines: true },
    });

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
      return { document: this.map(updated), eventId };
    }

    return { document: this.map(updated), eventId: null };
  }

  async markPaid(id: string) {
    const doc = await this.require(id);
    if (doc.status !== 'approved') {
      throw new BadRequestException('Only approved documents can be paid');
    }
    return this.map(
      await this.prisma.apDocument.update({
        where: { id },
        data: {
          status: 'paid',
          settlementStatus: 'fully_paid',
          openBalance: 0,
        },
        include: { lines: true },
      }),
    );
  }

  private async require(id: string) {
    const doc = await this.prisma.apDocument.findUnique({
      where: { id },
      include: { lines: true },
    });
    if (!doc) throw new NotFoundException('A/P document not found');
    return doc;
  }
}
