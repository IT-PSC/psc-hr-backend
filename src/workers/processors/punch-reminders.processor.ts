import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { PrismaService } from '../../common/prisma/prisma.service';
import { NotificationsService } from '../../modules/notifications/notifications.service';
import { QUEUE_PUNCH_REMINDERS } from '../../modules/queue/queue.constants';
import { QueueService } from '../../modules/queue/queue.service';

@Processor(QUEUE_PUNCH_REMINDERS)
export class PunchRemindersProcessor extends WorkerHost {
  private readonly logger = new Logger(PunchRemindersProcessor.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
    private readonly queues: QueueService,
  ) {
    super();
  }

  async process(job: Job<{ employeeId: string; kind: string }>): Promise<void> {
    await this.queues.markJob(String(job.id), 'active');
    const { employeeId, kind } = job.data;
    const label = kind === 'check_out' ? 'check-out' : 'check-in';
    const title = `Reminder: ${label}`;
    const titleKm = kind === 'check_out' ? 'រំលឹក៖ ចុះឈ្មោះចេញ' : 'រំលឹក៖ ចុះឈ្មោះចូល';
    const message = `Please complete your attendance ${label}.`;
    const messageKm =
      kind === 'check_out'
        ? 'សូមបញ្ចប់ការចុះឈ្មោះចេញរបស់អ្នក។'
        : 'សូមបញ្ចប់ការចុះឈ្មោះចូលរបស់អ្នក។';

    try {
      const created = await this.notifications.notifyEmployee(employeeId, {
        title,
        titleKm,
        message,
        messageKm,
        type: 'system',
        link: '/attendance',
        meta: { kind, source: 'punch-reminder' },
      });

      const user = await this.prisma.user.findFirst({
        where: { employeeId },
        select: { id: true },
      });
      if (user) {
        const chatId = await this.notifications.getTelegramTarget(user.id);
        if (chatId) {
          await this.queues.enqueueTelegram(message, chatId, messageKm);
        }
      }

      await this.queues.markJob(String(job.id), 'completed', {
        result: { notificationId: created?.id ?? null },
      });
      this.logger.log(
        `punch reminder job=${job.id} employee=${employeeId} kind=${kind}`,
      );
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      await this.queues.markJob(String(job.id), 'failed', { error: msg });
      throw err;
    }
  }
}
