import { Queue } from 'bullmq';
export declare class QueueService {
    private readonly punchQ;
    private readonly telegramQ;
    private readonly exportsQ;
    constructor(punchQ: Queue, telegramQ: Queue, exportsQ: Queue);
    enqueuePunchReminder(employeeId: string, kind: 'check_in' | 'check_out'): Promise<import("bullmq").Job<any, any, string, import("bullmq").JobProgress>>;
    enqueueTelegram(message: string, chatId?: string, messageKm?: string): Promise<import("bullmq").Job<any, any, string, import("bullmq").JobProgress>>;
    enqueueExport(type: string, requestedBy: string, filters?: Record<string, unknown>): Promise<import("bullmq").Job<any, any, string, import("bullmq").JobProgress>>;
}
