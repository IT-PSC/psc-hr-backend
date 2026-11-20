import { PrismaService } from '../../common/prisma/prisma.service';
import type { JwtPayload } from '../../common/roles/types';
export declare class EmployeesService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    private toCurrentUser;
    findAll(payload: JwtPayload): Promise<{
        employeeId: string;
        departmentId: string | undefined;
        baseSalary: number | null;
        department: {
            id: string;
            name: string;
            code: string;
            nameKm: string | null;
        } | null;
        position: {
            id: string;
            name: string;
            departmentId: string | null;
            code: string;
            nameKm: string | null;
        } | null;
        id: string;
        status: string;
        createdAt: Date;
        managerId: string | null;
        updatedAt: Date;
        email: string;
        employeeCode: string;
        firstName: string;
        lastName: string;
        phone: string | null;
        positionId: string | null;
        startDate: Date | null;
    }[]>;
    findOne(id: string, payload: JwtPayload): Promise<{
        employeeId: string;
        baseSalary: number | null;
        department: {
            id: string;
            name: string;
            code: string;
            nameKm: string | null;
        } | null;
        position: {
            id: string;
            name: string;
            departmentId: string | null;
            code: string;
            nameKm: string | null;
        } | null;
        id: string;
        status: string;
        createdAt: Date;
        departmentId: string | null;
        managerId: string | null;
        updatedAt: Date;
        email: string;
        employeeCode: string;
        firstName: string;
        lastName: string;
        phone: string | null;
        positionId: string | null;
        startDate: Date | null;
    }>;
}
