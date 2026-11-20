"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.EmployeesService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../common/prisma/prisma.service");
const can_1 = require("../../common/roles/can");
let EmployeesService = class EmployeesService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    toCurrentUser(payload) {
        return {
            employeeId: payload.employeeId ?? '',
            roles: payload.roles ?? [],
            departmentId: payload.departmentId,
            teamIds: payload.teamIds,
        };
    }
    async findAll(payload) {
        const user = this.toCurrentUser(payload);
        if (!(0, can_1.can)(user, 'employees', 'view')) {
            return [];
        }
        const rows = await this.prisma.employee.findMany({
            include: {
                department: true,
                position: true,
            },
            orderBy: { employeeCode: 'asc' },
        });
        const mapped = rows.map((e) => ({
            ...e,
            employeeId: e.id,
            departmentId: e.departmentId ?? undefined,
            baseSalary: e.baseSalary != null ? Number(e.baseSalary) : null,
        }));
        return (0, can_1.filterByScope)(user, 'employees', 'view', mapped);
    }
    async findOne(id, payload) {
        const user = this.toCurrentUser(payload);
        const emp = await this.prisma.employee.findUnique({
            where: { id },
            include: { department: true, position: true },
        });
        if (!emp)
            throw new common_1.NotFoundException('Employee not found');
        if (!(0, can_1.can)(user, 'employees', 'view', {
            employeeId: emp.id,
            departmentId: emp.departmentId ?? undefined,
            managerId: emp.managerId,
        })) {
            throw new common_1.NotFoundException('Employee not found');
        }
        return {
            ...emp,
            employeeId: emp.id,
            baseSalary: emp.baseSalary != null ? Number(emp.baseSalary) : null,
        };
    }
};
exports.EmployeesService = EmployeesService;
exports.EmployeesService = EmployeesService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], EmployeesService);
//# sourceMappingURL=employees.service.js.map