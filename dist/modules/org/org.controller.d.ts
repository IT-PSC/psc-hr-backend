import { OrgService } from './org.service';
export declare class OrgController {
    private readonly org;
    constructor(org: OrgService);
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
