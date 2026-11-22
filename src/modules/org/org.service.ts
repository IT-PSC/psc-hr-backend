import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../common/prisma/prisma.service';
import {
  CreateBranchDto,
  CreateCompanyDto,
  CreateDepartmentDto,
  CreatePositionDto,
  UpdateBranchDto,
  UpdateCompanyDto,
  UpdateDepartmentDto,
  UpdatePositionDto,
} from './dto/org.dto';

@Injectable()
export class OrgService {
  constructor(private readonly prisma: PrismaService) {}

  companies() {
    return this.prisma.orgCompany.findMany({ orderBy: { name: 'asc' } });
  }

  async company(id: string) {
    const row = await this.prisma.orgCompany.findUnique({ where: { id } });
    if (!row) throw new NotFoundException('Company not found');
    return row;
  }

  branches(companyId?: string) {
    return this.prisma.orgBranch.findMany({
      where: companyId ? { companyId } : undefined,
      orderBy: { name: 'asc' },
    });
  }

  async branch(id: string) {
    const row = await this.prisma.orgBranch.findUnique({ where: { id } });
    if (!row) throw new NotFoundException('Branch not found');
    return row;
  }

  departments() {
    return this.prisma.department.findMany({ orderBy: { name: 'asc' } });
  }

  positions() {
    return this.prisma.position.findMany({
      include: { department: true },
      orderBy: { name: 'asc' },
    });
  }

  async chart() {
    const [companies, branches, departments, positions, employees] =
      await Promise.all([
        this.prisma.orgCompany.findMany({ orderBy: { name: 'asc' } }),
        this.prisma.orgBranch.findMany({ orderBy: { name: 'asc' } }),
        this.prisma.department.findMany({ orderBy: { name: 'asc' } }),
        this.prisma.position.findMany({ orderBy: { name: 'asc' } }),
        this.prisma.employee.findMany({
          orderBy: { employeeCode: 'asc' },
          include: {
            department: { select: { companyId: true, branchId: true } },
          },
        }),
      ]);
    return {
      companies,
      branches,
      departments,
      positions,
      employees: employees.map((e) => ({
        id: e.id,
        name: `${e.firstName} ${e.lastName}`.trim(),
        departmentId: e.departmentId,
        positionId: e.positionId,
        managerId: e.managerId,
        companyId: e.department?.companyId ?? null,
        branchId: e.department?.branchId ?? null,
      })),
    };
  }

  async createCompany(dto: CreateCompanyDto) {
    try {
      return await this.prisma.orgCompany.create({
        data: {
          ...(dto.id ? { id: dto.id } : {}),
          code: dto.code,
          name: dto.name,
          registrationNo: dto.registrationNo,
          phone: dto.phone,
          email: dto.email,
          address: dto.address,
          status: dto.status ?? 'active',
        },
      });
    } catch (e) {
      this.rethrowPrisma(e);
      throw e;
    }
  }

  async updateCompany(id: string, dto: UpdateCompanyDto) {
    await this.ensureCompany(id);
    try {
      return await this.prisma.orgCompany.update({
        where: { id },
        data: {
          ...(dto.code !== undefined ? { code: dto.code } : {}),
          ...(dto.name !== undefined ? { name: dto.name } : {}),
          ...(dto.registrationNo !== undefined
            ? { registrationNo: dto.registrationNo }
            : {}),
          ...(dto.phone !== undefined ? { phone: dto.phone } : {}),
          ...(dto.email !== undefined ? { email: dto.email } : {}),
          ...(dto.address !== undefined ? { address: dto.address } : {}),
          ...(dto.status !== undefined ? { status: dto.status } : {}),
        },
      });
    } catch (e) {
      this.rethrowPrisma(e);
      throw e;
    }
  }

  async deleteCompany(id: string) {
    await this.ensureCompany(id);
    const [branches, departments, positions] = await Promise.all([
      this.prisma.orgBranch.count({ where: { companyId: id } }),
      this.prisma.department.count({ where: { companyId: id } }),
      this.prisma.position.count({ where: { companyId: id } }),
    ]);
    if (branches || departments || positions) {
      throw new ConflictException(
        'Cannot delete company with branches, departments, or positions',
      );
    }
    return this.prisma.orgCompany.delete({ where: { id } });
  }

  async createBranch(dto: CreateBranchDto) {
    await this.ensureCompany(dto.companyId);
    try {
      return await this.prisma.orgBranch.create({
        data: {
          ...(dto.id ? { id: dto.id } : {}),
          companyId: dto.companyId,
          code: dto.code,
          name: dto.name,
          address: dto.address,
          city: dto.city,
          managerEmployeeId: dto.managerEmployeeId,
          status: dto.status ?? 'active',
        },
      });
    } catch (e) {
      this.rethrowPrisma(e);
      throw e;
    }
  }

  async updateBranch(id: string, dto: UpdateBranchDto) {
    await this.ensureBranch(id);
    if (dto.companyId) await this.ensureCompany(dto.companyId);
    try {
      return await this.prisma.orgBranch.update({
        where: { id },
        data: {
          ...(dto.companyId !== undefined ? { companyId: dto.companyId } : {}),
          ...(dto.code !== undefined ? { code: dto.code } : {}),
          ...(dto.name !== undefined ? { name: dto.name } : {}),
          ...(dto.address !== undefined ? { address: dto.address } : {}),
          ...(dto.city !== undefined ? { city: dto.city } : {}),
          ...(dto.managerEmployeeId !== undefined
            ? { managerEmployeeId: dto.managerEmployeeId }
            : {}),
          ...(dto.status !== undefined ? { status: dto.status } : {}),
        },
      });
    } catch (e) {
      this.rethrowPrisma(e);
      throw e;
    }
  }

  async deleteBranch(id: string) {
    await this.ensureBranch(id);
    const inUse = await this.prisma.department.count({
      where: { branchId: id },
    });
    if (inUse > 0) {
      throw new ConflictException(
        'Cannot delete branch with assigned departments',
      );
    }
    return this.prisma.orgBranch.delete({ where: { id } });
  }

  async createDepartment(dto: CreateDepartmentDto) {
    if (dto.companyId) await this.ensureCompany(dto.companyId);
    if (dto.branchId) await this.ensureBranch(dto.branchId);
    if (dto.parentId) await this.ensureDepartment(dto.parentId);
    try {
      return await this.prisma.department.create({
        data: {
          ...(dto.id ? { id: dto.id } : {}),
          code: dto.code,
          name: dto.name,
          nameKm: dto.nameKm,
          companyId: dto.companyId ?? undefined,
          branchId: dto.branchId ?? undefined,
          parentId: dto.parentId ?? undefined,
          managerEmployeeId: dto.managerEmployeeId ?? undefined,
          status: dto.status ?? 'active',
        },
      });
    } catch (e) {
      this.rethrowPrisma(e);
      throw e;
    }
  }

  async updateDepartment(id: string, dto: UpdateDepartmentDto) {
    await this.ensureDepartment(id);
    if (dto.parentId && dto.parentId === id) {
      throw new BadRequestException('Department cannot be its own parent');
    }
    if (dto.companyId) await this.ensureCompany(dto.companyId);
    if (dto.branchId) await this.ensureBranch(dto.branchId);
    if (dto.parentId) await this.ensureDepartment(dto.parentId);
    try {
      return await this.prisma.department.update({
        where: { id },
        data: {
          ...(dto.code !== undefined ? { code: dto.code } : {}),
          ...(dto.name !== undefined ? { name: dto.name } : {}),
          ...(dto.nameKm !== undefined ? { nameKm: dto.nameKm } : {}),
          ...(dto.companyId !== undefined ? { companyId: dto.companyId } : {}),
          ...(dto.branchId !== undefined ? { branchId: dto.branchId } : {}),
          ...(dto.parentId !== undefined ? { parentId: dto.parentId } : {}),
          ...(dto.managerEmployeeId !== undefined
            ? { managerEmployeeId: dto.managerEmployeeId }
            : {}),
          ...(dto.status !== undefined ? { status: dto.status } : {}),
        },
      });
    } catch (e) {
      this.rethrowPrisma(e);
      throw e;
    }
  }

  async deleteDepartment(id: string) {
    await this.ensureDepartment(id);
    const inUse = await this.prisma.employee.count({
      where: { departmentId: id },
    });
    if (inUse > 0) {
      throw new ConflictException(
        'Cannot delete department with assigned employees',
      );
    }
    await this.prisma.department.updateMany({
      where: { parentId: id },
      data: { parentId: null },
    });
    return this.prisma.department.delete({ where: { id } });
  }

  async createPosition(dto: CreatePositionDto) {
    if (dto.companyId) await this.ensureCompany(dto.companyId);
    try {
      return await this.prisma.position.create({
        data: {
          ...(dto.id ? { id: dto.id } : {}),
          code: dto.code,
          name: dto.name,
          nameKm: dto.nameKm,
          companyId: dto.companyId ?? undefined,
          departmentId: dto.departmentId ?? undefined,
          status: dto.status ?? 'active',
        },
        include: { department: true },
      });
    } catch (e) {
      this.rethrowPrisma(e);
      throw e;
    }
  }

  async updatePosition(id: string, dto: UpdatePositionDto) {
    await this.ensurePosition(id);
    if (dto.companyId) await this.ensureCompany(dto.companyId);
    try {
      return await this.prisma.position.update({
        where: { id },
        data: {
          ...(dto.code !== undefined ? { code: dto.code } : {}),
          ...(dto.name !== undefined ? { name: dto.name } : {}),
          ...(dto.nameKm !== undefined ? { nameKm: dto.nameKm } : {}),
          ...(dto.companyId !== undefined ? { companyId: dto.companyId } : {}),
          ...(dto.departmentId !== undefined
            ? { departmentId: dto.departmentId }
            : {}),
          ...(dto.status !== undefined ? { status: dto.status } : {}),
        },
        include: { department: true },
      });
    } catch (e) {
      this.rethrowPrisma(e);
      throw e;
    }
  }

  async deletePosition(id: string) {
    await this.ensurePosition(id);
    const inUse = await this.prisma.employee.count({
      where: { positionId: id },
    });
    if (inUse > 0) {
      throw new ConflictException(
        'Cannot delete position with assigned employees',
      );
    }
    return this.prisma.position.delete({ where: { id } });
  }

  private async ensureCompany(id: string) {
    const row = await this.prisma.orgCompany.findUnique({ where: { id } });
    if (!row) throw new NotFoundException('Company not found');
    return row;
  }

  private async ensureBranch(id: string) {
    const row = await this.prisma.orgBranch.findUnique({ where: { id } });
    if (!row) throw new NotFoundException('Branch not found');
    return row;
  }

  private async ensureDepartment(id: string) {
    const row = await this.prisma.department.findUnique({ where: { id } });
    if (!row) throw new NotFoundException('Department not found');
  }

  private async ensurePosition(id: string) {
    const row = await this.prisma.position.findUnique({ where: { id } });
    if (!row) throw new NotFoundException('Position not found');
  }

  private rethrowPrisma(e: unknown): void {
    if (e instanceof Prisma.PrismaClientKnownRequestError) {
      if (e.code === 'P2002') {
        throw new ConflictException('Code already exists');
      }
      if (e.code === 'P2003') {
        throw new BadRequestException('Related record not found');
      }
    }
  }
}
