import { WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
export declare class ExportsProcessor extends WorkerHost {
    private readonly logger;
    process(job: Job<{
        type: string;
        requestedBy: string;
        filters?: Record<string, unknown>;
    }>): Promise<void>;
}
