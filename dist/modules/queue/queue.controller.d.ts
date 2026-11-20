import type { JwtPayload } from '../../common/roles/types';
import { QueueService } from './queue.service';
export declare class QueueController {
    private readonly queues;
    constructor(queues: QueueService);
    punch(body: {
        employeeId: string;
        kind: 'check_in' | 'check_out';
    }): Promise<import("bullmq").Job<any, any, string, import("bullmq").JobProgress>>;
    telegram(body: {
        message: string;
        chatId?: string;
        messageKm?: string;
    }): Promise<import("bullmq").Job<any, any, string, import("bullmq").JobProgress>>;
    export(user: JwtPayload, body: {
        type: string;
        filters?: Record<string, unknown>;
    }): Promise<import("bullmq").Job<any, any, string, import("bullmq").JobProgress>>;
}
