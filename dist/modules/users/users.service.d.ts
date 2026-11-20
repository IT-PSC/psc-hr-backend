import { PrismaService } from '../../common/prisma/prisma.service';
import type { AppRole } from '../../common/roles/types';
export declare class UsersService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    me(userId: string): Promise<{
        id: string;
        email: string;
        employeeId: string | null;
        roles: AppRole[];
        firstName: string | null;
        lastName: string | null;
        active: boolean;
    }>;
    findAll(): Promise<{
        id: string;
        email: string;
        employeeId: string | null;
        roles: AppRole[];
        firstName: string | null;
        lastName: string | null;
        active: boolean;
    }[]>;
}
