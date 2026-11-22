import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../common/prisma/prisma.service';
import { can, filterByScope } from '../../common/roles/can';
import type { CurrentUser, JwtPayload } from '../../common/roles/types';
import {
  ContractListQueryDto,
  CreateContractDto,
  UpdateContractDto,
} from './dto/contract.dto';

@Injectable()
export class ContractsService {
  constructor(private readonly prisma: PrismaService) {}

  private toCurrentUser(payload: JwtPayload): CurrentUser {
    return {
      employeeId: payload.employeeId ?? '',
      roles: payload.roles ?? [],
      departmentId: payload.departmentId,
      teamIds: payload.teamIds,
    };
  }

  private map(row: {
    id: string;
    employeeId: string;
    title: string;
    contractType: string | null;
    startDate: string;
    endDate: string | null;
    status: string;
    signedAt: Date | null;
    salary: Prisma.Decimal | null;
    probationEndDate: string | null;
    templateId: string | null;
    previousContractId: string | null;
    notes: string | null;
    archivedAt: Date | null;
    createdAt: Date;
  }) {
    return {
      id: row.id,
      employeeId: row.employeeId,
      title: row.title,
      contractType: row.contractType ?? undefined,
      startDate: row.startDate,
      endDate: row.endDate ?? undefined,
      status: row.status,
      signedAt: row.signedAt?.toISOString(),
      salary: row.salary != null ? Number(row.salary) : undefined,
      probationEndDate: row.probationEndDate ?? undefined,
      templateId: row.templateId ?? undefined,
      previousContractId: row.previousContractId ?? undefined,
      notes: row.notes ?? undefined,
      archivedAt: row.archivedAt?.toISOString(),
      createdAt: row.createdAt.toISOString(),
    };
  }

  async listTemplates() {
    const rows = await this.prisma.contractTemplate.findMany({
      orderBy: { name: 'asc' },
    });
    return { items: rows };
  }

  async list(payload: JwtPayload, query: ContractListQueryDto) {
    const user = this.toCurrentUser(payload);
    if (!can(user, 'contracts', 'view')) return { items: [] };
    const where: Prisma.EmploymentContractWhereInput = {};
    if (query.employeeId) where.employeeId = query.employeeId;
    if (query.status) where.status = query.status;
    const rows = await this.prisma.employmentContract.findMany({
      where,
      orderBy: { startDate: 'desc' },
      take: 200,
    });
    return {
      items: filterByScope(
        user,
        'contracts',
        'view',
        rows.map((r) => this.map(r)),
      ),
    };
  }

  async getOne(id: string, payload: JwtPayload) {
    const row = await this.prisma.employmentContract.findUnique({ where: { id } });
    if (!row) throw new NotFoundException('Contract not found');
    const user = this.toCurrentUser(payload);
    if (!can(user, 'contracts', 'view', { employeeId: row.employeeId })) {
      throw new ForbiddenException('Cannot view this contract');
    }
    return this.map(row);
  }

  async create(dto: CreateContractDto, payload: JwtPayload) {
    const user = this.toCurrentUser(payload);
    if (!can(user, 'contracts', 'create')) {
      throw new ForbiddenException('Missing permission: contracts:create');
    }
    const row = await this.prisma.employmentContract.create({
      data: {
        employeeId: dto.employeeId,
        title: dto.title,
        contractType: dto.contractType,
        startDate: dto.startDate,
        endDate: dto.endDate,
        salary: dto.salary,
        probationEndDate: dto.probationEndDate,
        templateId: dto.templateId,
        notes: dto.notes,
        status: 'draft',
      },
    });
    return this.map(row);
  }

  async update(id: string, dto: UpdateContractDto, payload: JwtPayload) {
    const user = this.toCurrentUser(payload);
    if (!can(user, 'contracts', 'edit')) {
      throw new ForbiddenException('Missing permission: contracts:edit');
    }
    const existing = await this.prisma.employmentContract.findUnique({
      where: { id },
    });
    if (!existing) throw new NotFoundException('Contract not found');
    const data: Prisma.EmploymentContractUpdateInput = {
      title: dto.title,
      contractType: dto.contractType,
      startDate: dto.startDate,
      endDate: dto.endDate === undefined ? undefined : dto.endDate,
      salary: dto.salary,
      probationEndDate:
        dto.probationEndDate === undefined ? undefined : dto.probationEndDate,
      notes: dto.notes === undefined ? undefined : dto.notes,
    };
    if (dto.status) {
      data.status = dto.status;
      if (dto.status === 'active' && !existing.signedAt) {
        data.signedAt = new Date();
      }
      if (dto.status === 'archived') {
        data.archivedAt = new Date();
      }
    }
    const row = await this.prisma.employmentContract.update({
      where: { id },
      data,
    });
    return this.map(row);
  }

  async renew(id: string, payload: JwtPayload, endDate?: string) {
    const user = this.toCurrentUser(payload);
    if (!can(user, 'contracts', 'create') && !can(user, 'contracts', 'edit')) {
      throw new ForbiddenException('Missing permission to renew contract');
    }
    const old = await this.prisma.employmentContract.findUnique({ where: { id } });
    if (!old) throw new NotFoundException('Contract not found');
    const startDate = old.endDate ?? old.startDate;
    const row = await this.prisma.$transaction(async (tx) => {
      await tx.employmentContract.update({
        where: { id },
        data: { status: 'archived', archivedAt: new Date() },
      });
      return tx.employmentContract.create({
        data: {
          employeeId: old.employeeId,
          title: `${old.title} (renewed)`,
          contractType: old.contractType,
          startDate,
          endDate: endDate ?? null,
          salary: old.salary,
          probationEndDate: null,
          templateId: old.templateId,
          previousContractId: old.id,
          status: 'draft',
        },
      });
    });
    return this.map(row);
  }

  async archive(id: string, payload: JwtPayload) {
    return this.update(id, { status: 'archived' }, payload);
  }
}
