import { FinanceService } from './finance.service';
export declare class FinanceController {
    private readonly finance;
    constructor(finance: FinanceService);
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
    apProposals(): import(".prisma/client").Prisma.PrismaPromise<{
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
