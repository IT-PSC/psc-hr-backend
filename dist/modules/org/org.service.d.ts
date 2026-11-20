import { PrismaService } from '../../common/prisma/prisma.service';
export declare class OrgService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    departments(): import(".prisma/client").Prisma.PrismaPromise<{
        id: string;
        name: string;
        code: string;
        nameKm: string | null;
    }[]>;
    positions(): import(".prisma/client").Prisma.PrismaPromise<({
        department: {
            id: string;
            name: string;
            code: string;
            nameKm: string | null;
        } | null;
    } & {
        id: string;
        name: string;
        departmentId: string | null;
        code: string;
        nameKm: string | null;
    })[]>;
}
