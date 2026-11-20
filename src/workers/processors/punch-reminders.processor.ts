import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { QUEUE_PUNCH_REMINDERS } from '../../modules/queue/queue.constants';

@Processor(QUEUE_PUNCH_REMINDERS)
export class PunchRemindersProcessor extends WorkerHost {
  private readonly logger = new Logger(PunchRemindersProcessor.name);

  async process(job: Job<{ employeeId: string; kind: string }>): Promise<void> {
    this.logger.log(
      `[stub] punch reminder job=${job.id} employee=${job.data.employeeId} kind=${job.data.kind}`,
    );
  }
}
