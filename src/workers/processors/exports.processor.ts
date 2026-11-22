import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { FilesService } from '../../modules/files/files.service';
import { NotificationsService } from '../../modules/notifications/notifications.service';
import { QUEUE_EXPORTS } from '../../modules/queue/queue.constants';
import { QueueService } from '../../modules/queue/queue.service';

@Processor(QUEUE_EXPORTS)
export class ExportsProcessor extends WorkerHost {
  private readonly logger = new Logger(ExportsProcessor.name);

  constructor(
    private readonly files: FilesService,
    private readonly notifications: NotificationsService,
    private readonly queues: QueueService,
  ) {
    super();
  }

  async process(
    job: Job<{
      type: string;
      requestedBy: string;
      filters?: Record<string, unknown>;
    }>,
  ): Promise<void> {
    await this.queues.markJob(String(job.id), 'active');
    const { type, requestedBy, filters } = job.data;
    try {
      const stamp = new Date().toISOString().replace(/[:.]/g, '-');
      const fileName = `export-${type}-${stamp}.csv`;
      const header = 'type,requestedBy,generatedAt,filtersJson\n';
      const line = [
        type,
        requestedBy,
        new Date().toISOString(),
        JSON.stringify(filters ?? {}).replace(/"/g, '""'),
      ]
        .map((c) => `"${c}"`)
        .join(',');
      const buffer = Buffer.from(header + line + '\n', 'utf8');

      const stored = await this.files.storeGenerated({
        originalName: fileName,
        mimeType: 'text/csv',
        buffer,
        uploadedById: requestedBy,
        docType: 'other',
        visibility: 'hr_only',
      });

      await this.notifications.createInternal({
        userId: requestedBy,
        title: `Export ready: ${type}`,
        titleKm: `នាំចេញរួចរាល់៖ ${type}`,
        message: `Your ${type} export is ready to download.`,
        messageKm: `ការនាំចេញ ${type} របស់អ្នករួចរាល់ហើយ។`,
        type: 'success',
        link: `/files/${stored.id}`,
        meta: { fileId: stored.id, exportType: type },
      });

      await this.queues.markJob(String(job.id), 'completed', {
        result: { fileId: stored.id, fileName },
      });
      this.logger.log(
        `export job=${job.id} type=${type} file=${stored.id}`,
      );
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      await this.queues.markJob(String(job.id), 'failed', { error: msg });
      throw err;
    }
  }
}
