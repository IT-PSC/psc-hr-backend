import { InjectQueue } from '@nestjs/bullmq';
import { Injectable, Optional } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { Queue } from 'bullmq';
import { PrismaService } from '../../common/prisma/prisma.service';
import {
  QUEUE_EXPORTS,
  QUEUE_PUNCH_REMINDERS,
  QUEUE_TELEGRAM,
} from './queue.constants';

@Injectable()
export class QueueService {
  constructor(
    private readonly prisma: PrismaService,
    @Optional()
    @InjectQueue(QUEUE_PUNCH_REMINDERS)
    private readonly punchQ?: Queue,
    @Optional()
    @InjectQueue(QUEUE_TELEGRAM)
    private readonly telegramQ?: Queue,
    @Optional()
    @InjectQueue(QUEUE_EXPORTS)
    private readonly exportsQ?: Queue,
  ) {}

  private async recordJob(input: {
    queue: string;
    jobName: string;
    bullJobId?: string | null;
    status: string;
    payload?: Prisma.InputJsonValue;
    requestedBy?: string;
    error?: string;
    finishedAt?: Date | null;
  }) {
    return this.prisma.jobRun.create({
      data: {
        queue: input.queue,
        jobName: input.jobName,
        bullJobId: input.bullJobId ?? undefined,
        status: input.status,
        payload: input.payload,
        requestedBy: input.requestedBy,
        error: input.error,
        finishedAt: input.finishedAt ?? undefined,
      },
    });
  }

  async enqueuePunchReminder(
    employeeId: string,
    kind: 'check_in' | 'check_out',
  ) {
    const payload = { employeeId, kind };
    if (!this.punchQ) {
      const run = await this.recordJob({
        queue: QUEUE_PUNCH_REMINDERS,
        jobName: 'remind',
        status: 'skipped',
        payload,
        error: 'redis-disabled',
        finishedAt: new Date(),
      });
      return { id: run.id, status: 'skipped', reason: 'redis-disabled' };
    }
    const job = await this.punchQ.add('remind', payload, {
      removeOnComplete: 100,
    });
    const run = await this.recordJob({
      queue: QUEUE_PUNCH_REMINDERS,
      jobName: 'remind',
      bullJobId: String(job.id),
      status: 'queued',
      payload,
    });
    return { id: run.id, bullJobId: job.id, status: 'queued' };
  }

  async enqueueTelegram(
    message: string,
    chatId?: string,
    messageKm?: string,
    requestedBy?: string,
    outboxId?: string,
  ) {
    const payload = { message, chatId, messageKm, outboxId };
    if (!this.telegramQ) {
      const run = await this.recordJob({
        queue: QUEUE_TELEGRAM,
        jobName: 'send',
        status: 'skipped',
        payload,
        requestedBy,
        error: 'redis-disabled',
        finishedAt: new Date(),
      });
      return { id: run.id, status: 'skipped', reason: 'redis-disabled' };
    }
    const job = await this.telegramQ.add('send', payload, {
      removeOnComplete: 100,
    });
    const run = await this.recordJob({
      queue: QUEUE_TELEGRAM,
      jobName: 'send',
      bullJobId: String(job.id),
      status: 'queued',
      payload,
      requestedBy,
    });
    return { id: run.id, bullJobId: job.id, status: 'queued' };
  }

  async enqueueExport(
    type: string,
    requestedBy: string,
    filters?: Record<string, unknown>,
  ) {
    const payload = { type, requestedBy, filters };
    if (!this.exportsQ) {
      const run = await this.recordJob({
        queue: QUEUE_EXPORTS,
        jobName: 'export',
        status: 'skipped',
        payload: payload as Prisma.InputJsonValue,
        requestedBy,
        error: 'redis-disabled',
        finishedAt: new Date(),
      });
      return { id: run.id, status: 'skipped', reason: 'redis-disabled' };
    }
    const job = await this.exportsQ.add('export', payload, {
      removeOnComplete: 50,
    });
    const run = await this.recordJob({
      queue: QUEUE_EXPORTS,
      jobName: 'export',
      bullJobId: String(job.id),
      status: 'queued',
      payload: payload as Prisma.InputJsonValue,
      requestedBy,
    });
    return { id: run.id, bullJobId: job.id, status: 'queued' };
  }

  async markJob(
    bullJobId: string,
    status: 'active' | 'completed' | 'failed',
    patch?: { result?: Prisma.InputJsonValue; error?: string },
  ) {
    const existing = await this.prisma.jobRun.findFirst({
      where: { bullJobId },
      orderBy: { createdAt: 'desc' },
    });
    if (!existing) return null;
    return this.prisma.jobRun.update({
      where: { id: existing.id },
      data: {
        status,
        result: patch?.result,
        error: patch?.error,
        finishedAt:
          status === 'completed' || status === 'failed'
            ? new Date()
            : undefined,
      },
    });
  }

  async listJobs(queue?: string, take = 50) {
    const rows = await this.prisma.jobRun.findMany({
      where: queue ? { queue } : undefined,
      orderBy: { createdAt: 'desc' },
      take,
    });
    return {
      items: rows.map((r) => ({
        id: r.id,
        queue: r.queue,
        jobName: r.jobName,
        bullJobId: r.bullJobId ?? undefined,
        status: r.status,
        payload: r.payload ?? undefined,
        result: r.result ?? undefined,
        error: r.error ?? undefined,
        requestedBy: r.requestedBy ?? undefined,
        createdAt: r.createdAt.toISOString(),
        finishedAt: r.finishedAt?.toISOString(),
      })),
    };
  }
}
