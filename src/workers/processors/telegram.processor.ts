import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Prisma } from '@prisma/client';
import { Job } from 'bullmq';
import { PrismaService } from '../../common/prisma/prisma.service';
import { QUEUE_TELEGRAM } from '../../modules/queue/queue.constants';
import { QueueService } from '../../modules/queue/queue.service';

type TelegramJob = {
  chatId?: string;
  message: string;
  messageKm?: string;
  outboxId?: string;
};

@Processor(QUEUE_TELEGRAM)
export class TelegramProcessor extends WorkerHost {
  private readonly logger = new Logger(TelegramProcessor.name);

  constructor(
    private readonly config: ConfigService,
    private readonly queues: QueueService,
    private readonly prisma: PrismaService,
  ) {
    super();
  }

  async process(job: Job<TelegramJob>): Promise<void> {
    await this.queues.markJob(String(job.id), 'active');
    const token = this.config.get<string>('TELEGRAM_BOT_TOKEN')?.trim();
    const chatId =
      job.data.chatId ||
      this.config.get<string>('TELEGRAM_DEFAULT_CHAT_ID')?.trim();
    const text = [job.data.message, job.data.messageKm]
      .filter(Boolean)
      .join('\n');

    if (!token || !chatId) {
      this.logger.warn(
        `telegram job=${job.id} skipped (missing token or chatId)`,
      );
      await this.touchOutbox(job, 'skipped', 'missing_token_or_chat');
      await this.queues.markJob(String(job.id), 'completed', {
        result: { skipped: true, reason: 'missing_token_or_chat' },
      });
      return;
    }

    try {
      const res = await fetch(
        `https://api.telegram.org/bot${token}/sendMessage`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: chatId,
            text: text.slice(0, 4000),
          }),
        },
      );
      const body = (await res.json()) as { ok?: boolean; description?: string };
      if (!res.ok || !body.ok) {
        throw new Error(body.description ?? `HTTP ${res.status}`);
      }
      await this.touchOutbox(job, 'sent');
      await this.queues.markJob(String(job.id), 'completed', {
        result: { ok: true, chatId },
      });
      this.logger.log(`telegram job=${job.id} sent chat=${chatId}`);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      await this.touchOutbox(job, 'failed', message);
      await this.queues.markJob(String(job.id), 'failed', { error: message });
      throw err;
    }
  }

  private async touchOutbox(
    job: Job<TelegramJob>,
    status: 'sent' | 'failed' | 'skipped',
    error?: string,
  ) {
    try {
      const sentAt = status === 'sent' ? new Date() : undefined;
      const data = {
        status,
        error: error ?? null,
        sentAt,
        recipient: job.data.chatId,
      };
      if (job.data.outboxId) {
        await this.prisma.telegramOutbox.update({
          where: { id: job.data.outboxId },
          data,
        });
        return;
      }
      const run = await this.prisma.jobRun.findFirst({
        where: { bullJobId: String(job.id) },
        orderBy: { createdAt: 'desc' },
      });
      const existing = run
        ? await this.prisma.telegramOutbox.findFirst({
            where: { jobRunId: run.id },
          })
        : null;
      if (existing) {
        await this.prisma.telegramOutbox.update({
          where: { id: existing.id },
          data,
        });
        return;
      }
      const payload: Prisma.InputJsonValue = {
        message: job.data.message,
        messageKm: job.data.messageKm,
        bullJobId: String(job.id),
      };
      await this.prisma.telegramOutbox.create({
        data: {
          channel: 'telegram',
          eventType: 'worker.send',
          recipient: job.data.chatId,
          payload,
          status,
          error,
          jobRunId: run?.id,
          sentAt,
        },
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      this.logger.warn(`telegram outbox job=${job.id} not recorded: ${message}`);
    }
  }
}
