import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { can, filterByScope } from '../../common/roles/can';
import type { CurrentUser, JwtPayload } from '../../common/roles/types';
import {
  AssignAssetDto,
  CreateAssetDto,
  CreateBenefitPlanDto,
  EnrollBenefitDto,
  ReturnAssetDto,
} from './dto/benefits-assets.dto';

@Injectable()
export class BenefitsAssetsService {
  constructor(private readonly prisma: PrismaService) {}

  private toCurrentUser(payload: JwtPayload): CurrentUser {
    return {
      employeeId: payload.employeeId ?? '',
      roles: payload.roles ?? [],
      departmentId: payload.departmentId,
      teamIds: payload.teamIds,
    };
  }

  // ── Benefits ──────────────────────────────────────────────────

  async listPlans(payload: JwtPayload) {
    const user = this.toCurrentUser(payload);
    if (!can(user, 'benefits', 'view')) return { items: [] };
    const rows = await this.prisma.benefitPlan.findMany({
      orderBy: { name: 'asc' },
    });
    return {
      items: rows.map((r) => ({
        id: r.id,
        name: r.name,
        nameKm: r.nameKm ?? undefined,
        type: r.type,
        provider: r.provider ?? undefined,
        createdAt: r.createdAt.toISOString(),
      })),
    };
  }

  async createPlan(dto: CreateBenefitPlanDto, payload: JwtPayload) {
    const user = this.toCurrentUser(payload);
    if (!can(user, 'benefits', 'edit')) {
      throw new ForbiddenException('Missing permission: benefits:edit');
    }
    const row = await this.prisma.benefitPlan.create({
      data: {
        name: dto.name,
        nameKm: dto.nameKm,
        type: dto.type ?? 'other',
        provider: dto.provider,
      },
    });
    return {
      id: row.id,
      name: row.name,
      nameKm: row.nameKm ?? undefined,
      type: row.type,
      provider: row.provider ?? undefined,
    };
  }

  async listEnrollments(payload: JwtPayload) {
    const user = this.toCurrentUser(payload);
    if (!can(user, 'benefits', 'view')) return { items: [] };
    const rows = await this.prisma.benefitEnrollment.findMany({
      orderBy: { enrolledAt: 'desc' },
      take: 200,
      include: { plan: { select: { name: true, type: true } } },
    });
    return {
      items: filterByScope(
        user,
        'benefits',
        'view',
        rows.map((r) => ({
          id: r.id,
          planId: r.planId,
          planName: r.plan.name,
          planType: r.plan.type,
          employeeId: r.employeeId,
          status: r.status,
          enrolledAt: r.enrolledAt.toISOString(),
        })),
      ),
    };
  }

  async enroll(dto: EnrollBenefitDto, payload: JwtPayload) {
    const user = this.toCurrentUser(payload);
    const isSelf = dto.employeeId === payload.employeeId;
    if (!isSelf && !can(user, 'benefits', 'edit')) {
      throw new ForbiddenException('Missing permission: benefits:edit');
    }
    if (isSelf && !can(user, 'benefits', 'view')) {
      throw new ForbiddenException('Missing permission: benefits:view');
    }
    const plan = await this.prisma.benefitPlan.findUnique({
      where: { id: dto.planId },
    });
    if (!plan) throw new NotFoundException('Benefit plan not found');
    const row = await this.prisma.benefitEnrollment.create({
      data: {
        planId: dto.planId,
        employeeId: dto.employeeId,
        status: 'enrolled',
      },
    });
    return {
      id: row.id,
      planId: row.planId,
      employeeId: row.employeeId,
      status: row.status,
      enrolledAt: row.enrolledAt.toISOString(),
    };
  }

  async cancelEnrollment(id: string, payload: JwtPayload) {
    const existing = await this.prisma.benefitEnrollment.findUnique({
      where: { id },
    });
    if (!existing) throw new NotFoundException('Enrollment not found');
    const user = this.toCurrentUser(payload);
    const isOwner = existing.employeeId === payload.employeeId;
    if (!isOwner && !can(user, 'benefits', 'edit')) {
      throw new ForbiddenException('Cannot cancel this enrollment');
    }
    if (existing.status === 'cancelled') {
      throw new BadRequestException('Already cancelled');
    }
    const row = await this.prisma.benefitEnrollment.update({
      where: { id },
      data: { status: 'cancelled' },
    });
    return {
      id: row.id,
      planId: row.planId,
      employeeId: row.employeeId,
      status: row.status,
    };
  }

  // ── Assets ────────────────────────────────────────────────────

  private mapAsset(row: {
    id: string;
    name: string;
    tag: string;
    category: string;
    status: string;
    assignedToId: string | null;
    purchaseDate: string | null;
    assignedAt: Date | null;
    returnedAt: Date | null;
    assignCondition: string | null;
    returnCondition: string | null;
    createdAt: Date;
  }) {
    return {
      id: row.id,
      name: row.name,
      tag: row.tag,
      category: row.category,
      status: row.status,
      assignedToId: row.assignedToId ?? undefined,
      purchaseDate: row.purchaseDate ?? undefined,
      assignedAt: row.assignedAt?.toISOString(),
      returnedAt: row.returnedAt?.toISOString(),
      assignCondition: row.assignCondition ?? undefined,
      returnCondition: row.returnCondition ?? undefined,
      createdAt: row.createdAt.toISOString(),
    };
  }

  async listAssets(payload: JwtPayload) {
    const user = this.toCurrentUser(payload);
    if (!can(user, 'assets', 'view')) return { items: [] };
    const rows = await this.prisma.companyAsset.findMany({
      orderBy: { createdAt: 'desc' },
      take: 200,
    });
    const mapped = rows.map((r) => this.mapAsset(r));
    if (can(user, 'assets', 'edit')) return { items: mapped };
    return {
      items: filterByScope(
        user,
        'assets',
        'view',
        mapped.map((m) => ({ ...m, employeeId: m.assignedToId ?? '' })),
      ),
    };
  }

  async createAsset(dto: CreateAssetDto, payload: JwtPayload) {
    const user = this.toCurrentUser(payload);
    if (!can(user, 'assets', 'edit')) {
      throw new ForbiddenException('Missing permission: assets:edit');
    }
    const row = await this.prisma.companyAsset.create({
      data: {
        name: dto.name,
        tag: dto.tag,
        category: dto.category ?? 'other',
        purchaseDate: dto.purchaseDate,
        status: 'available',
      },
    });
    return this.mapAsset(row);
  }

  async assignAsset(id: string, dto: AssignAssetDto, payload: JwtPayload) {
    const user = this.toCurrentUser(payload);
    if (!can(user, 'assets', 'edit')) {
      throw new ForbiddenException('Missing permission: assets:edit');
    }
    const existing = await this.prisma.companyAsset.findUnique({
      where: { id },
    });
    if (!existing) throw new NotFoundException('Asset not found');
    if (existing.status !== 'available') {
      throw new BadRequestException(`Asset is ${existing.status}`);
    }
    const row = await this.prisma.companyAsset.update({
      where: { id },
      data: {
        status: 'assigned',
        assignedToId: dto.employeeId,
        assignedAt: new Date(),
        assignCondition: dto.condition,
        returnedAt: null,
        returnCondition: null,
      },
    });
    return this.mapAsset(row);
  }

  async returnAsset(id: string, dto: ReturnAssetDto, payload: JwtPayload) {
    const user = this.toCurrentUser(payload);
    if (!can(user, 'assets', 'edit')) {
      throw new ForbiddenException('Missing permission: assets:edit');
    }
    const existing = await this.prisma.companyAsset.findUnique({
      where: { id },
    });
    if (!existing) throw new NotFoundException('Asset not found');
    if (existing.status !== 'assigned') {
      throw new BadRequestException(`Asset is ${existing.status}`);
    }
    const row = await this.prisma.companyAsset.update({
      where: { id },
      data: {
        status: 'available',
        assignedToId: null,
        returnedAt: new Date(),
        returnCondition: dto.condition,
      },
    });
    return this.mapAsset(row);
  }
}
