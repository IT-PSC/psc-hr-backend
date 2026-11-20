import { PrismaService } from '../../common/prisma/prisma.service';
export declare class FinanceService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    summary(): Promise<{
        currency: string;
        cashOnHand: number;
        receivables: number;
        payables: number;
        payrollAccrual: number;
        draftPayrollPostings: number;
        draftApPaymentProposals: number;
    }>;
    payrollPostings(): import(".prisma/client").Prisma.PrismaPromise<{
        id: string;
        eventId: string;
        status: string;
        createdAt: Date;
        payrollRunId: string;
        amount: import("@prisma/client/runtime/library").Decimal;
        currency: string;
    }[]>;
    apPaymentProposals(): import(".prisma/client").Prisma.PrismaPromise<{
        id: string;
        eventId: string;
        status: string;
        createdAt: Date;
        amount: import("@prisma/client/runtime/library").Decimal;
        currency: string;
        apDocumentId: string;
    }[]>;
    events(): import(".prisma/client").Prisma.PrismaPromise<{
        error: string | null;
        id: string;
        eventId: string;
        type: string;
        sourceId: string;
        payload: import("@prisma/client/runtime/library").JsonValue;
        status: string;
        processedAt: Date | null;
        createdAt: Date;
    }[]>;
}
