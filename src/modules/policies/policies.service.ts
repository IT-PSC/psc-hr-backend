import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { can } from '../../common/roles/can';
import type { CurrentUser, JwtPayload } from '../../common/roles/types';
import { CreatePolicyDto, UpdatePolicyDto } from './dto/policy.dto';

@Injectable()
export class PoliciesService {
  constructor(private readonly prisma: PrismaService) {}

  private toCurrentUser(payload: JwtPayload): CurrentUser {
    return {
      employeeId: payload.employeeId ?? '',
      roles: payload.roles ?? [],
      departmentId: payload.departmentId,
      teamIds: payload.teamIds,
    };
  }

  private map(
    row: {
      id: string;
      title: string;
      titleKm: string;
      version: string;
      fileName: string | null;
      target: string;
      published: boolean;
      uploadedBy: string;
      uploadedAt: Date;
    },
    ackCount?: number,
    acknowledged?: boolean,
  ) {
    return {
      id: row.id,
      title: row.title,
      titleKm: row.titleKm,
      version: row.version,
      fileName: row.fileName ?? undefined,
      target: row.target,
      published: row.published,
      uploadedBy: row.uploadedBy,
      uploadedAt: row.uploadedAt.toISOString(),
      acknowledgementCount: ackCount,
      acknowledged,
    };
  }

  async list(payload: JwtPayload) {
    const user = this.toCurrentUser(payload);
    if (!can(user, 'policies', 'view')) return { items: [] };
    const canManage = can(user, 'policies', 'edit') || can(user, 'policies', 'create');
    const rows = await this.prisma.policyDocument.findMany({
      where: canManage ? undefined : { published: true },
      include: {
        _count: { select: { acks: true } },
        acks: payload.employeeId
          ? { where: { employeeId: payload.employeeId }, take: 1 }
          : false,
      },
      orderBy: { uploadedAt: 'desc' },
      take: 100,
    });
    return {
      items: rows.map((r) =>
        this.map(
          r,
          r._count.acks,
          Array.isArray(r.acks) ? r.acks.length > 0 : undefined,
        ),
      ),
    };
  }

  async create(dto: CreatePolicyDto, payload: JwtPayload) {
    const user = this.toCurrentUser(payload);
    if (!can(user, 'policies', 'create')) {
      throw new ForbiddenException('Missing permission: policies:create');
    }
    const row = await this.prisma.policyDocument.create({
      data: {
        title: dto.title,
        titleKm: dto.titleKm ?? '',
        version: dto.version ?? '1.0',
        fileName: dto.fileName,
        target: dto.target ?? 'all',
        published: dto.published ?? false,
        uploadedBy: payload.sub,
      },
    });
    return this.map(row, 0, false);
  }

  async update(id: string, dto: UpdatePolicyDto, payload: JwtPayload) {
    const user = this.toCurrentUser(payload);
    if (!can(user, 'policies', 'edit')) {
      throw new ForbiddenException('Missing permission: policies:edit');
    }
    const existing = await this.prisma.policyDocument.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Policy not found');
    const row = await this.prisma.policyDocument.update({
      where: { id },
      data: {
        title: dto.title,
        titleKm: dto.titleKm,
        version: dto.version,
        fileName: dto.fileName,
        target: dto.target,
        published: dto.published,
      },
    });
    return this.map(row);
  }

  async acknowledge(id: string, payload: JwtPayload) {
    if (!payload.employeeId) {
      throw new BadRequestException('User is not linked to an employee');
    }
    const user = this.toCurrentUser(payload);
    if (!can(user, 'policies', 'view')) {
      throw new ForbiddenException('Missing permission: policies:view');
    }
    const policy = await this.prisma.policyDocument.findUnique({ where: { id } });
    if (!policy || !policy.published) {
      throw new NotFoundException('Published policy not found');
    }
    const ack = await this.prisma.policyAcknowledgement.upsert({
      where: {
        policyId_employeeId: {
          policyId: id,
          employeeId: payload.employeeId,
        },
      },
      create: {
        policyId: id,
        employeeId: payload.employeeId,
      },
      update: { acknowledgedAt: new Date() },
    });
    return {
      id: ack.id,
      policyId: ack.policyId,
      employeeId: ack.employeeId,
      acknowledgedAt: ack.acknowledgedAt.toISOString(),
    };
  }
}
