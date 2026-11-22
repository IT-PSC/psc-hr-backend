import { Injectable, NotFoundException } from '@nestjs/common';
import { dateKeyInPhnomPenh, daysBetween, todayInPhnomPenh } from '../../common/dates';
import { PrismaService } from '../../common/prisma/prisma.service';
import {
  CreateComplianceItemDto,
  UpdateComplianceItemDto,
} from './dto/compliance.dto';

const ACTIVE = ['active', 'probation', 'on_leave'];

type Gap = {
  id: string;
  title: string;
  titleKm: string;
  category: string;
  status: 'overdue' | 'due' | 'upcoming';
  link: string;
  detail: string;
};

@Injectable()
export class ComplianceService {
  constructor(private readonly prisma: PrismaService) {}

  async list(status?: string, category?: string) {
    const rows = await this.prisma.complianceItem.findMany({
      where: {
        status: status || undefined,
        category: category || undefined,
      },
      orderBy: [{ status: 'asc' }, { dueDate: 'asc' }],
    });
    return { items: rows.map((row) => this.map(row)) };
  }

  async create(dto: CreateComplianceItemDto) {
    const row = await this.prisma.complianceItem.create({
      data: {
        title: dto.title.trim(),
        titleKm: dto.titleKm,
        category: dto.category,
        dueDate: dto.dueDate,
        status: dto.status ?? 'upcoming',
      },
    });
    return this.map(row);
  }

  async update(id: string, dto: UpdateComplianceItemDto) {
    const existing = await this.prisma.complianceItem.findUnique({
      where: { id },
    });
    if (!existing) throw new NotFoundException('Compliance item not found');
    const row = await this.prisma.complianceItem.update({
      where: { id },
      data: {
        title: dto.title?.trim(),
        titleKm: dto.titleKm,
        category: dto.category,
        dueDate: dto.dueDate,
        status: dto.status,
      },
    });
    return this.map(row);
  }

  async remove(id: string) {
    const existing = await this.prisma.complianceItem.findUnique({
      where: { id },
    });
    if (!existing) throw new NotFoundException('Compliance item not found');
    await this.prisma.complianceItem.delete({ where: { id } });
    return { id, deleted: true };
  }

  async liveGaps() {
    const today = todayInPhnomPenh();
    const [employees, contracts, files, probation, policies, acks] =
      await Promise.all([
        this.prisma.employee.findMany({
          where: { status: { in: ACTIVE } },
          select: {
            id: true,
            employeeCode: true,
            firstName: true,
            lastName: true,
            nssfNumber: true,
          },
        }),
        this.prisma.employmentContract.findMany({
          where: { status: { in: ['active', 'pending_signature'] } },
          select: { employeeId: true, endDate: true, status: true },
        }),
        this.prisma.storedFile.findMany({
          where: { deletedAt: null, expiryDate: { not: null } },
          select: {
            id: true,
            employeeId: true,
            originalName: true,
            expiryDate: true,
          },
        }),
        this.prisma.probationCase.findMany({
          where: { status: { in: ['pending_eval', 'active', 'extended'] } },
          select: { id: true, employeeId: true, endDate: true, status: true },
        }),
        this.prisma.policyDocument.findMany({
          where: { published: true },
          select: { id: true, title: true, titleKm: true },
        }),
        this.prisma.policyAcknowledgement.findMany({
          select: { policyId: true, employeeId: true },
        }),
      ]);

    const nameOf = new Map(
      employees.map((employee) => [
        employee.id,
        `${employee.firstName} ${employee.lastName}`.trim(),
      ]),
    );
    const activeIds = new Set(employees.map((employee) => employee.id));
    const gaps: Gap[] = [];

    for (const file of files) {
      if (!file.expiryDate || !file.employeeId || !activeIds.has(file.employeeId)) {
        continue;
      }
      const expiry = dateKeyInPhnomPenh(file.expiryDate);
      const days = daysBetween(today, expiry);
      if (days > 30) continue;
      const name = nameOf.get(file.employeeId) ?? file.employeeId;
      gaps.push({
        id: `doc-${file.id}`,
        title:
          days < 0
            ? `Expired document: ${file.originalName}`
            : `Document expiring: ${file.originalName}`,
        titleKm:
          days < 0
            ? `ឯកសារផុតកំណត់: ${file.originalName}`
            : `ឯកសារជិតផុតកំណត់: ${file.originalName}`,
        category: 'document',
        status: days < 0 ? 'overdue' : days <= 7 ? 'due' : 'upcoming',
        link: `/employees/${file.employeeId}`,
        detail: `${name} · ${expiry}`,
      });
    }

    const covered = new Set(
      contracts
        .filter(
          (contract) =>
            !contract.endDate || contract.endDate >= today,
        )
        .map((contract) => contract.employeeId),
    );
    for (const employee of employees) {
      if (covered.has(employee.id)) continue;
      const name = nameOf.get(employee.id) ?? employee.id;
      gaps.push({
        id: `contract-${employee.id}`,
        title: `Missing contract: ${name}`,
        titleKm: `ខ្វះកិច្ចសន្យា: ${name}`,
        category: 'contract',
        status: 'due',
        link: `/employees/${employee.id}`,
        detail: employee.employeeCode,
      });
    }

    for (const item of probation) {
      if (!activeIds.has(item.employeeId) || item.endDate >= today) continue;
      const name = nameOf.get(item.employeeId) ?? item.employeeId;
      gaps.push({
        id: `probation-${item.id}`,
        title: `Probation overdue: ${name}`,
        titleKm: `សាកល្បងហួសកំណត់: ${name}`,
        category: 'probation',
        status: 'overdue',
        link: '/probation',
        detail: item.endDate,
      });
    }

    for (const employee of employees) {
      if (employee.nssfNumber?.trim()) continue;
      const name = nameOf.get(employee.id) ?? employee.id;
      gaps.push({
        id: `nssf-${employee.id}`,
        title: `Missing NSSF number: ${name}`,
        titleKm: `ខ្វះលេខ NSSF: ${name}`,
        category: 'nssf',
        status: 'upcoming',
        link: `/employees/${employee.id}`,
        detail: employee.employeeCode,
      });
    }

    const ackKey = new Set(
      acks.map((ack) => `${ack.policyId}:${ack.employeeId}`),
    );
    for (const policy of policies) {
      for (const employee of employees) {
        if (ackKey.has(`${policy.id}:${employee.id}`)) continue;
        gaps.push({
          id: `policy-${policy.id}-${employee.id}`,
          title: `Unsigned policy: ${policy.title}`,
          titleKm: `មិនទាន់ទទួលស្គាល់: ${policy.titleKm || policy.title}`,
          category: 'policy',
          status: 'due',
          link: '/policies',
          detail: nameOf.get(employee.id) ?? employee.employeeCode,
        });
      }
    }

    const rank = { overdue: 0, due: 1, upcoming: 2 };
    gaps.sort((a, b) => rank[a.status] - rank[b.status]);
    const items = gaps.slice(0, 80);
    return {
      generatedAt: new Date().toISOString(),
      today,
      total: gaps.length,
      returned: items.length,
      items,
    };
  }

  private map(row: {
    id: string;
    title: string;
    titleKm: string | null;
    category: string;
    dueDate: string | null;
    status: string;
    createdAt: Date;
    updatedAt: Date;
  }) {
    return {
      id: row.id,
      title: row.title,
      titleKm: row.titleKm,
      category: row.category,
      dueDate: row.dueDate,
      status: row.status,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    };
  }
}
