import { WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
export declare class TelegramProcessor extends WorkerHost {
    private readonly logger;
    process(job: Job<{
        chatId?: string;
        message: string;
        messageKm?: string;
    }>): Promise<void>;
}
