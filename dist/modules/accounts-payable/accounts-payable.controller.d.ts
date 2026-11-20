import type { JwtPayload } from '../../common/roles/types';
import { CreateApDocumentDto } from './dto/ap.dto';
import { AccountsPayableService } from './accounts-payable.service';
export declare class AccountsPayableController {
    private readonly ap;
    constructor(ap: AccountsPayableService);
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
    create(dto: CreateApDocumentDto): Promise<{
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
    approve(id: string, user: JwtPayload): Promise<{
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
