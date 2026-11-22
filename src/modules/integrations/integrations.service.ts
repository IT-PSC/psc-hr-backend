import { BadRequestException, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../common/prisma/prisma.service';
import type { JwtPayload } from '../../common/roles/types';
import { QueueService } from '../queue/queue.service';
import {
  EnqueueTelegramDto,
  TelegramOutboxQueryDto,
} from './dto/telegram.dto';

const DEMO_CONNECTION = {
  id: 'tg-demo',
  channel: 'telegram',
  connected: true,
  username: 'psc_hr_demo',
  connectedAt: '2026-11-01T00:00:00.000Z',
  eventPrefs: {
    approvals: true,
    leave: true,
    payroll: true,
    announcements: true,
    reminders: false,
  },
};

@Injectable()
export class IntegrationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly queues: QueueService,
  ) {}

  async health() {
    const [queued, sent, failed, skipped] = await Promise.all([
      this.prisma.telegramOutbox.count({ where: { status: 'queued' } }),
      this.prisma.telegramOutbox.count({ where: { status: 'sent' } }),
      this.prisma.telegramOutbox.count({ where: { status: 'failed' } }),
      this.prisma.telegramOutbox.count({ where: { status: 'skipped' } }),
    ]);
    return {
      status: 'ok',
      integrations: [
        {
          id: 'telegram',
          name: 'Telegram',
          status: 'outbox',
          outbox: { queued, sent, failed, skipped },
        },
      ],
    };
  }

  connections() {
    return { items: [DEMO_CONNECTION], status: 'ok' as const };
  }

  async listOutbox(query: TelegramOutboxQueryDto) {
    const limit = query.limit ?? 50;
    const where: Prisma.TelegramOutboxWhereInput = {};
    if (query.status) where.status = query.status;
    const items = await this.prisma.telegramOutbox.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
    return {
      items: items.map((row) => this.mapOutbox(row)),
      status: 'ok' as const,
    };
  }

  async enqueue(dto: EnqueueTelegramDto, payload: JwtPayload) {
    const message =
      dto.message ??
      (typeof dto.payload?.message === 'string' ? dto.payload.message : '');
    if (!message.trim()) {
      throw new BadRequestException('message is required');
    }
    const body: Prisma.InputJsonValue = {
      ...(dto.payload ?? {}),
      message,
      messageKm: dto.messageKm,
      eventType: dto.eventType,
    };
    const row = await this.prisma.telegramOutbox.create({
      data: {
        channel: 'telegram',
        eventType: dto.eventType,
        recipient: dto.recipient,
        payload: body,
        status: 'queued',
      },
    });
    const run = await this.queues.enqueueTelegram(
      message,
      dto.recipient,
      dto.messageKm,
      payload.employeeId ?? payload.sub,
      row.id,
    );
    const skipped = run.status === 'skipped';
    const updated = await this.prisma.telegramOutbox.update({
      where: { id: row.id },
      data: {
        jobRunId: run.id,
        status: skipped ? 'skipped' : 'queued',
        error: skipped ? 'redis-disabled' : null,
      },
    });
    return this.mapOutbox(updated);
  }

  private mapOutbox(row: {
    id: string;
    channel: string;
    eventType: string;
    recipient: string | null;
    payload: Prisma.JsonValue | null;
    status: string;
    error: string | null;
    jobRunId: string | null;
    createdAt: Date;
    sentAt: Date | null;
  }) {
    return {
      id: row.id,
      channel: row.channel,
      eventType: row.eventType,
      recipient: row.recipient ?? undefined,
      payload: row.payload ?? undefined,
      status: row.status,
      error: row.error ?? undefined,
      jobRunId: row.jobRunId ?? undefined,
      createdAt: row.createdAt.toISOString(),
      sentAt: row.sentAt?.toISOString(),
    };
  }
}
