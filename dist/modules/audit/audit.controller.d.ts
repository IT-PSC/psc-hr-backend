import { AuditService } from './audit.service';
export declare class AuditController {
    private readonly audit;
    constructor(audit: AuditService);
    list(): Promise<{
        items: {
            id: string;
            createdAt: Date;
            module: string;
            action: string;
            actorId: string | null;
            targetId: string | null;
            detail: string | null;
            detailKm: string | null;
        }[];
        status: string;
        message: string | undefined;
    }>;
}
