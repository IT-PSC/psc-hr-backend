import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { QUEUE_TELEGRAM } from '../../modules/queue/queue.constants';

@Processor(QUEUE_TELEGRAM)
export class TelegramProcessor extends WorkerHost {
  private readonly logger = new Logger(TelegramProcessor.name);

  async process(
    job: Job<{ chatId?: string; message: string; messageKm?: string }>,
  ): Promise<void> {
    // TELEGRAM_BOT_TOKEN stays server-side only — never expose to SPA
    this.logger.log(
      `[stub] telegram job=${job.id} chat=${job.data.chatId ?? 'n/a'} msg=${job.data.message.slice(0, 80)}`,
    );
  }
}
