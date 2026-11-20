import { PrismaService } from '../../common/prisma/prisma.service';
import { IntegrationEventsService } from '../../common/events/integration-events.service';
import { FinanceBridgeService } from '../finance/finance-bridge.service';
export declare class PayrollPscService {
    private readonly prisma;
    private readonly events;
    private readonly financeBridge;
    constructor(prisma: PrismaService, events: IntegrationEventsService, financeBridge: FinanceBridgeService);
    runs(): import(".prisma/client").Prisma.PrismaPromise<{
        id: string;
        status: string;
        createdAt: Date;
        currency: string;
        approvedAt: Date | null;
        updatedAt: Date;
        periodYm: string;
        totalAmount: import("@prisma/client/runtime/library").Decimal;
    }[]>;
    createDraft(periodYm: string, totalAmount: number): Promise<{
        id: string;
        status: string;
        createdAt: Date;
        currency: string;
        approvedAt: Date | null;
        updatedAt: Date;
        periodYm: string;
        totalAmount: import("@prisma/client/runtime/library").Decimal;
    }>;
    approveMd(runId: string, actorId?: string): Promise<{
        run: {
            id: string;
            status: string;
            createdAt: Date;
            currency: string;
            approvedAt: Date | null;
            updatedAt: Date;
            periodYm: string;
            totalAmount: import("@prisma/client/runtime/library").Decimal;
        };
        eventId: string;
    }>;
}
