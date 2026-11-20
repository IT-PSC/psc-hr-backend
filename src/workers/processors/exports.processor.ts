import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { QUEUE_EXPORTS } from '../../modules/queue/queue.constants';

@Processor(QUEUE_EXPORTS)
export class ExportsProcessor extends WorkerHost {
  private readonly logger = new Logger(ExportsProcessor.name);

  async process(
    job: Job<{ type: string; requestedBy: string; filters?: Record<string, unknown> }>,
  ): Promise<void> {
    this.logger.log(
      `[stub] export job=${job.id} type=${job.data.type} by=${job.data.requestedBy}`,
    );
  }
}
