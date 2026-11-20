import { PrismaService } from '../../common/prisma/prisma.service';
export declare class AuditService {
    private readonly prisma;
    constructor(prisma: PrismaService);
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
