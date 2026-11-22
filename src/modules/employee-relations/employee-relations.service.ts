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
  CreateErCaseDto,
  CreateErInvestigationDto,
  ErListQueryDto,
  InvestigationListQueryDto,
  PatchErSettingsDto,
  UpdateErCaseDto,
  UpdateErInvestigationDto,
} from './dto/er.dto';

const ER_SETTINGS_ID = 'default';

const DEFAULT_ER_SETTINGS = {
  complaintCategories: [
    'Harassment',
    'Discrimination',
    'Pay & benefits',
    'Working conditions',
    'Manager conduct',
    'Other',
  ],
  grievanceTypes: [
    'Unfair treatment',
    'Policy dispute',
    'Promotion denial',
    'Workload',
    'Other',
  ],
  conflictCategories: [
    'Interpersonal',
    'Team collaboration',
    'Role clarity',
    'Resource dispute',
    'Other',
  ],
  violationCategories: [
    'Attendance',
    'Code of conduct',
    'Performance',
    'Safety',
    'Confidentiality',
    'Other',
  ],
  disciplinaryActionTypes: [
    'Verbal Warning',
    'Written Warning',
    'Final Warning',
    'Suspension',
    'Other',
  ],
  priorities: ['low', 'medium', 'high', 'urgent'],
  workflowStatuses: [
    'submitted',
    'under_review',
    'assigned',
    'in_progress',
    'management_review',
    'resolved',
    'closed',
    'rejected',
  ],
  notifyOnAssignment: true,
  notifyOnOverdue: true,
  notifyOnManagementReview: true,
};

@Injectable()
export class EmployeeRelationsService {
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
    type: string;
    refNo: string;
    employeeId: string | null;
    subject: string;
    description: string;
    category: string | null;
    priority: string;
    status: string;
    assigneeId: string | null;
    involvedIds: string[];
    resolution: string | null;
    dueDate: string | null;
    createdBy: string;
    createdAt: Date;
    updatedAt: Date;
  }) {
    return {
      id: row.id,
      type: row.type,
      refNo: row.refNo,
      employeeId: row.employeeId ?? undefined,
      subject: row.subject,
      description: row.description,
      category: row.category ?? undefined,
      priority: row.priority,
      status: row.status,
      assigneeId: row.assigneeId ?? undefined,
      involvedIds: row.involvedIds,
      resolution: row.resolution ?? undefined,
      dueDate: row.dueDate ?? undefined,
      createdBy: row.createdBy,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    };
  }

  private async nextRefNo(): Promise<string> {
    const year = new Date().getFullYear();
    const prefix = `ER-${year}-`;
    const latest = await this.prisma.erCase.findFirst({
      where: { refNo: { startsWith: prefix } },
      orderBy: { refNo: 'desc' },
      select: { refNo: true },
    });
    let seq = 1;
    if (latest?.refNo) {
      const part = latest.refNo.slice(prefix.length);
      const n = parseInt(part, 10);
      if (!Number.isNaN(n)) seq = n + 1;
    }
    return `${prefix}${String(seq).padStart(4, '0')}`;
  }

  async list(payload: JwtPayload, query: ErListQueryDto) {
    const user = this.toCurrentUser(payload);
    if (!can(user, 'employee_relations', 'view')) return { items: [] };
    const where: Prisma.ErCaseWhereInput = {};
    if (query.type) where.type = query.type;
    const rows = await this.prisma.erCase.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 200,
    });
    return {
      items: filterByScope(
        user,
        'employee_relations',
        'view',
        rows.map((r) => ({ ...this.map(r), employeeId: r.employeeId ?? '' })),
      ),
    };
  }

  async getOne(id: string, payload: JwtPayload) {
    const row = await this.prisma.erCase.findUnique({ where: { id } });
    if (!row) throw new NotFoundException('ER case not found');
    const user = this.toCurrentUser(payload);
    if (
      !can(user, 'employee_relations', 'view', {
        employeeId: row.employeeId ?? undefined,
      })
    ) {
      throw new ForbiddenException('Cannot view this ER case');
    }
    return this.map(row);
  }

  async create(dto: CreateErCaseDto, payload: JwtPayload) {
    const user = this.toCurrentUser(payload);
    if (!can(user, 'employee_relations', 'create')) {
      throw new ForbiddenException('Missing permission: employee_relations:create');
    }
    const refNo = await this.nextRefNo();
    const row = await this.prisma.erCase.create({
      data: {
        type: dto.type,
        refNo,
        subject: dto.subject,
        description: dto.description,
        employeeId: dto.employeeId,
        category: dto.category,
        priority: dto.priority ?? 'medium',
        involvedIds: dto.involvedIds ?? [],
        dueDate: dto.dueDate,
        createdBy: payload.employeeId ?? payload.sub,
        status: 'submitted',
      },
    });
    return this.map(row);
  }

  async update(id: string, dto: UpdateErCaseDto, payload: JwtPayload) {
    const user = this.toCurrentUser(payload);
    if (!can(user, 'employee_relations', 'edit')) {
      throw new ForbiddenException('Missing permission: employee_relations:edit');
    }
    const existing = await this.prisma.erCase.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('ER case not found');
    const row = await this.prisma.erCase.update({
      where: { id },
      data: {
        status: dto.status,
        assigneeId: dto.assigneeId === undefined ? undefined : dto.assigneeId,
        resolution: dto.resolution === undefined ? undefined : dto.resolution,
        priority: dto.priority,
        dueDate: dto.dueDate === undefined ? undefined : dto.dueDate,
      },
    });
    return this.map(row);
  }

  private async nextInvestigationRef(): Promise<string> {
    const year = new Date().getFullYear();
    const prefix = `INV-${year}-`;
    const latest = await this.prisma.erInvestigation.findFirst({
      where: { refNo: { startsWith: prefix } },
      orderBy: { refNo: 'desc' },
      select: { refNo: true },
    });
    let seq = 1;
    if (latest?.refNo) {
      const n = parseInt(latest.refNo.slice(prefix.length), 10);
      if (!Number.isNaN(n)) seq = n + 1;
    }
    return `${prefix}${String(seq).padStart(4, '0')}`;
  }

  private mapInvestigation(row: {
    id: string;
    refNo: string;
    relatedType: string;
    relatedId: string;
    investigatorId: string;
    startDate: string;
    involvedIds: string[];
    evidence: Prisma.JsonValue;
    interviewNotes: string;
    findings: string;
    recommendations: string;
    managementDecision: string | null;
    outcome: string | null;
    status: string;
    priority: string;
    notes: Prisma.JsonValue;
    timeline: Prisma.JsonValue;
    dueDate: string | null;
    createdAt: Date;
    updatedAt: Date;
  }) {
    return {
      id: row.id,
      refNo: row.refNo,
      relatedType: row.relatedType,
      relatedId: row.relatedId,
      investigatorId: row.investigatorId,
      startDate: row.startDate,
      involvedIds: row.involvedIds,
      evidence: row.evidence,
      interviewNotes: row.interviewNotes,
      findings: row.findings,
      recommendations: row.recommendations,
      managementDecision: row.managementDecision ?? undefined,
      outcome: row.outcome ?? undefined,
      status: row.status,
      priority: row.priority,
      notes: row.notes,
      timeline: row.timeline,
      dueDate: row.dueDate ?? undefined,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    };
  }

  async listInvestigations(payload: JwtPayload, query: InvestigationListQueryDto) {
    const user = this.toCurrentUser(payload);
    if (!can(user, 'employee_relations', 'view')) return { items: [] };
    const where: Prisma.ErInvestigationWhereInput = {};
    if (query.status) where.status = query.status;
    if (query.relatedType) where.relatedType = query.relatedType;
    const rows = await this.prisma.erInvestigation.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 200,
    });
    return { items: rows.map((row) => this.mapInvestigation(row)) };
  }

  async getInvestigation(id: string, payload: JwtPayload) {
    const user = this.toCurrentUser(payload);
    if (!can(user, 'employee_relations', 'view')) {
      throw new ForbiddenException('Missing permission: employee_relations:view');
    }
    const row = await this.prisma.erInvestigation.findUnique({ where: { id } });
    if (!row) throw new NotFoundException('Investigation not found');
    return this.mapInvestigation(row);
  }

  async createInvestigation(dto: CreateErInvestigationDto, payload: JwtPayload) {
    const user = this.toCurrentUser(payload);
    if (!can(user, 'employee_relations', 'create')) {
      throw new ForbiddenException('Missing permission: employee_relations:create');
    }
    const investigator = await this.prisma.employee.findUnique({
      where: { id: dto.investigatorId },
      select: { id: true },
    });
    if (!investigator) throw new NotFoundException('Investigator not found');
    const actorId = payload.employeeId ?? payload.sub;
    const refNo = await this.nextInvestigationRef();
    const timeline =
      dto.timeline ??
      [
        {
          id: `tl-${Date.now()}`,
          at: new Date().toISOString(),
          label: 'Investigation opened',
          actorId,
        },
      ];
    const row = await this.prisma.erInvestigation.create({
      data: {
        refNo,
        relatedType: dto.relatedType,
        relatedId: dto.relatedId,
        investigatorId: dto.investigatorId,
        startDate: dto.startDate,
        involvedIds: dto.involvedIds ?? [],
        evidence: (dto.evidence ?? []) as Prisma.InputJsonValue,
        interviewNotes: dto.interviewNotes ?? '',
        findings: dto.findings ?? '',
        recommendations: dto.recommendations ?? '',
        managementDecision: dto.managementDecision,
        outcome: dto.outcome,
        status: dto.status ?? 'in_progress',
        priority: dto.priority ?? 'medium',
        notes: (dto.notes ?? []) as Prisma.InputJsonValue,
        timeline: timeline as Prisma.InputJsonValue,
        dueDate: dto.dueDate,
      },
    });
    return this.mapInvestigation(row);
  }

  async updateInvestigation(
    id: string,
    dto: UpdateErInvestigationDto,
    payload: JwtPayload,
  ) {
    const user = this.toCurrentUser(payload);
    if (!can(user, 'employee_relations', 'edit')) {
      throw new ForbiddenException('Missing permission: employee_relations:edit');
    }
    const existing = await this.prisma.erInvestigation.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Investigation not found');
    if (dto.investigatorId) {
      const investigator = await this.prisma.employee.findUnique({
        where: { id: dto.investigatorId },
        select: { id: true },
      });
      if (!investigator) throw new NotFoundException('Investigator not found');
    }
    const row = await this.prisma.erInvestigation.update({
      where: { id },
      data: {
        relatedType: dto.relatedType,
        relatedId: dto.relatedId,
        investigatorId: dto.investigatorId,
        startDate: dto.startDate,
        involvedIds: dto.involvedIds,
        evidence:
          dto.evidence === undefined
            ? undefined
            : (dto.evidence as Prisma.InputJsonValue),
        interviewNotes: dto.interviewNotes,
        findings: dto.findings,
        recommendations: dto.recommendations,
        managementDecision: dto.managementDecision,
        outcome: dto.outcome,
        status: dto.status,
        priority: dto.priority,
        notes:
          dto.notes === undefined ? undefined : (dto.notes as Prisma.InputJsonValue),
        timeline:
          dto.timeline === undefined
            ? undefined
            : (dto.timeline as Prisma.InputJsonValue),
        dueDate: dto.dueDate,
      },
    });
    return this.mapInvestigation(row);
  }

  async deleteInvestigation(id: string, payload: JwtPayload) {
    const user = this.toCurrentUser(payload);
    if (!can(user, 'employee_relations', 'delete')) {
      throw new ForbiddenException('Missing permission: employee_relations:delete');
    }
    const existing = await this.prisma.erInvestigation.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Investigation not found');
    await this.prisma.erInvestigation.delete({ where: { id } });
    return { id, deleted: true };
  }

  private async ensureErSettings() {
    return this.prisma.erSettings.upsert({
      where: { id: ER_SETTINGS_ID },
      create: {
        id: ER_SETTINGS_ID,
        complaintCategories: DEFAULT_ER_SETTINGS.complaintCategories,
        grievanceTypes: DEFAULT_ER_SETTINGS.grievanceTypes,
        conflictCategories: DEFAULT_ER_SETTINGS.conflictCategories,
        violationCategories: DEFAULT_ER_SETTINGS.violationCategories,
        disciplinaryActionTypes: DEFAULT_ER_SETTINGS.disciplinaryActionTypes,
        priorities: DEFAULT_ER_SETTINGS.priorities,
        workflowStatuses: DEFAULT_ER_SETTINGS.workflowStatuses,
        notifyOnAssignment: DEFAULT_ER_SETTINGS.notifyOnAssignment,
        notifyOnOverdue: DEFAULT_ER_SETTINGS.notifyOnOverdue,
        notifyOnManagementReview: DEFAULT_ER_SETTINGS.notifyOnManagementReview,
      },
      update: {},
    });
  }

  private mapErSettings(row: Awaited<ReturnType<EmployeeRelationsService['ensureErSettings']>>) {
    return {
      id: row.id,
      complaintCategories: row.complaintCategories,
      grievanceTypes: row.grievanceTypes,
      conflictCategories: row.conflictCategories,
      violationCategories: row.violationCategories,
      disciplinaryActionTypes: row.disciplinaryActionTypes,
      priorities: row.priorities,
      workflowStatuses: row.workflowStatuses,
      notifyOnAssignment: row.notifyOnAssignment,
      notifyOnOverdue: row.notifyOnOverdue,
      notifyOnManagementReview: row.notifyOnManagementReview,
      updatedAt: row.updatedAt.toISOString(),
    };
  }

  async getSettings() {
    return this.mapErSettings(await this.ensureErSettings());
  }

  async patchSettings(dto: PatchErSettingsDto) {
    await this.ensureErSettings();
    const data: Prisma.ErSettingsUpdateInput = {};
    if (dto.complaintCategories !== undefined) {
      data.complaintCategories = dto.complaintCategories as Prisma.InputJsonValue;
    }
    if (dto.grievanceTypes !== undefined) {
      data.grievanceTypes = dto.grievanceTypes as Prisma.InputJsonValue;
    }
    if (dto.conflictCategories !== undefined) {
      data.conflictCategories = dto.conflictCategories as Prisma.InputJsonValue;
    }
    if (dto.violationCategories !== undefined) {
      data.violationCategories = dto.violationCategories as Prisma.InputJsonValue;
    }
    if (dto.disciplinaryActionTypes !== undefined) {
      data.disciplinaryActionTypes = dto.disciplinaryActionTypes as Prisma.InputJsonValue;
    }
    if (dto.priorities !== undefined) {
      data.priorities = dto.priorities as Prisma.InputJsonValue;
    }
    if (dto.workflowStatuses !== undefined) {
      data.workflowStatuses = dto.workflowStatuses as Prisma.InputJsonValue;
    }
    if (dto.notifyOnAssignment !== undefined) data.notifyOnAssignment = dto.notifyOnAssignment;
    if (dto.notifyOnOverdue !== undefined) data.notifyOnOverdue = dto.notifyOnOverdue;
    if (dto.notifyOnManagementReview !== undefined) {
      data.notifyOnManagementReview = dto.notifyOnManagementReview;
    }
    const row = await this.prisma.erSettings.update({
      where: { id: ER_SETTINGS_ID },
      data,
    });
    return this.mapErSettings(row);
  }
}
