import type { JwtPayload } from '../../common/roles/types';
import { CreatePayrollRunDto } from './dto/payroll.dto';
import { PayrollPscService } from './payroll-psc.service';
export declare class PayrollPscController {
    private readonly payroll;
    constructor(payroll: PayrollPscService);
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
    create(dto: CreatePayrollRunDto): Promise<{
        id: string;
        status: string;
        createdAt: Date;
        currency: string;
        approvedAt: Date | null;
        updatedAt: Date;
        periodYm: string;
        totalAmount: import("@prisma/client/runtime/library").Decimal;
    }>;
    approveMd(id: string, user: JwtPayload): Promise<{
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
