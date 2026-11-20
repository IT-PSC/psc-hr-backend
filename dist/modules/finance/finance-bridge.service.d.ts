import { PrismaService } from '../../common/prisma/prisma.service';
import { IntegrationEventsService } from '../../common/events/integration-events.service';
export declare class FinanceBridgeService {
    private readonly prisma;
    private readonly events;
    private readonly logger;
    constructor(prisma: PrismaService, events: IntegrationEventsService);
    handlePayrollApproved(eventId: string, data: {
        payrollRunId: string;
        amount: number;
        currency: string;
    }): Promise<void>;
    handleApApproved(eventId: string, data: {
        apDocumentId: string;
        amount: number;
        currency: string;
    }): Promise<void>;
}
