import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
export declare const EVENT_PAYROLL_PSC_APPROVED = "payroll.psc.approved";
export declare const EVENT_AP_DOCUMENT_APPROVED = "ap.document.approved";
export declare class IntegrationEventsService {
    private readonly prisma;
    private readonly logger;
    constructor(prisma: PrismaService);
    emit(eventId: string, type: string, sourceId: string, payload: Prisma.InputJsonValue): Promise<{
        error: string | null;
        id: string;
        eventId: string;
        type: string;
        sourceId: string;
        payload: Prisma.JsonValue;
        status: string;
        processedAt: Date | null;
        createdAt: Date;
    }>;
    markProcessed(eventId: string): Promise<{
        error: string | null;
        id: string;
        eventId: string;
        type: string;
        sourceId: string;
        payload: Prisma.JsonValue;
        status: string;
        processedAt: Date | null;
        createdAt: Date;
    }>;
    markFailed(eventId: string, error: string): Promise<{
        error: string | null;
        id: string;
        eventId: string;
        type: string;
        sourceId: string;
        payload: Prisma.JsonValue;
        status: string;
        processedAt: Date | null;
        createdAt: Date;
    }>;
}
