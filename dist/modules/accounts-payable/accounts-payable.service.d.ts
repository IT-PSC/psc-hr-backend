import { PrismaService } from '../../common/prisma/prisma.service';
import { IntegrationEventsService } from '../../common/events/integration-events.service';
import { FinanceBridgeService } from '../finance/finance-bridge.service';
export declare class AccountsPayableService {
    private readonly prisma;
    private readonly events;
    private readonly financeBridge;
    constructor(prisma: PrismaService, events: IntegrationEventsService, financeBridge: FinanceBridgeService);
    requests(): import(".prisma/client").Prisma.PrismaPromise<{
        id: string;
        status: string;
        createdAt: Date;
        amount: import("@prisma/client/runtime/library").Decimal;
        currency: string;
        docNumber: string;
        supplier: string;
        openBalance: import("@prisma/client/runtime/library").Decimal;
        approvedAt: Date | null;
        updatedAt: Date;
    }[]>;
    createDraft(input: {
        docNumber: string;
        supplier: string;
        amount: number;
        currency?: string;
    }): Promise<{
        id: string;
        status: string;
        createdAt: Date;
        amount: import("@prisma/client/runtime/library").Decimal;
        currency: string;
        docNumber: string;
        supplier: string;
        openBalance: import("@prisma/client/runtime/library").Decimal;
        approvedAt: Date | null;
        updatedAt: Date;
    }>;
    approve(docId: string, actorId?: string): Promise<{
        document: {
            id: string;
            status: string;
            createdAt: Date;
            amount: import("@prisma/client/runtime/library").Decimal;
            currency: string;
            docNumber: string;
            supplier: string;
            openBalance: import("@prisma/client/runtime/library").Decimal;
            approvedAt: Date | null;
            updatedAt: Date;
        };
        eventId: string;
    } | {
        document: {
            id: string;
            status: string;
            createdAt: Date;
            amount: import("@prisma/client/runtime/library").Decimal;
            currency: string;
            docNumber: string;
            supplier: string;
            openBalance: import("@prisma/client/runtime/library").Decimal;
            approvedAt: Date | null;
            updatedAt: Date;
        };
        eventId: null;
    }>;
}
