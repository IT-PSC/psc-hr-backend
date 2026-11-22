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
  CreateProbationCaseDto,
  DecideProbationDto,
  PatchProbationSettingsDto,
  UpdateProbationCaseDto,
  UpsertEvaluationDto,
  UpsertPipDto,
} from './dto/probation.dto';

const SETTINGS_ID = 'default';

const DEFAULT_PROBATION_SETTINGS = {
  defaultDurationMonths: 3,
  reviewDays: [30, 60, 90],
  categories: [
    {
      id: 'cat-job',
      name: 'Job Knowledge & Understanding',
      nameKm: 'ចំណេះដឹងការងារ',
      weight: 15,
      questions: [
        { id: 'q-job-1', text: 'Understands core job responsibilities and role expectations' },
        { id: 'q-job-2', text: 'Applies company policies and procedures correctly' },
      ],
    },
    {
      id: 'cat-quality',
      name: 'Quality of Work',
      nameKm: 'គុណភាពការងារ',
      weight: 20,
      questions: [
        { id: 'q-qual-1', text: 'Delivers accurate and complete work with minimal rework' },
        { id: 'q-qual-2', text: 'Meets quality standards set by the supervisor' },
      ],
    },
  ],
  ratingLabels: {
    '1': 'Poor',
    '2': 'Needs Improvement',
    '3': 'Good',
    '4': 'Very Good',
    '5': 'Excellent',
  },
  selfQuestions: [
    { id: 'sq-1', text: 'How confident are you in your current role?', kind: 'rating' },
    { id: 'sq-2', text: 'Have you received adequate training for your role?', kind: 'yes_no' },
    { id: 'sq-3', text: 'What support do you still need from the company?', kind: 'text' },
  ],
  reminderDaysBefore: 7,
  remindersEnabled: true,
  scoreBands: [
    { min: 4.5, max: 5, label: 'Outstanding' },
    { min: 3.5, max: 4.49, label: 'Meets Expectations' },
    { min: 2.5, max: 3.49, label: 'Needs Improvement' },
    { min: 1, max: 2.49, label: 'Unsatisfactory' },
  ],
  approvalWorkflow: 'Supervisor → HR → Management',
};

@Injectable()
export class ProbationService {
  constructor(private readonly prisma: PrismaService) {}

  private toCurrentUser(payload: JwtPayload): CurrentUser {
    return {
      employeeId: payload.employeeId ?? '',
      roles: payload.roles ?? [],
      departmentId: payload.departmentId,
      teamIds: payload.teamIds,
    };
  }

  private mapCase(
    row: {
      id: string;
      employeeId: string;
      startDate: string;
      endDate: string;
      durationMonths: number;
      stage: string;
      status: string;
      overallScore: Prisma.Decimal | null;
      progressPercent: number;
      finalDecision: string | null;
      decisionRemarks: string | null;
      extensionMonths: number | null;
      createdAt: Date;
    },
    extras?: { evaluations?: unknown[]; pips?: unknown[] },
  ) {
    return {
      id: row.id,
      employeeId: row.employeeId,
      startDate: row.startDate,
      endDate: row.endDate,
      durationMonths: row.durationMonths,
      stage: row.stage,
      status: row.status,
      overallScore:
        row.overallScore != null ? Number(row.overallScore) : undefined,
      progressPercent: row.progressPercent,
      finalDecision: row.finalDecision ?? undefined,
      decisionRemarks: row.decisionRemarks ?? undefined,
      extensionMonths: row.extensionMonths ?? undefined,
      createdAt: row.createdAt.toISOString(),
      evaluations: extras?.evaluations,
      pips: extras?.pips,
    };
  }

  async list(payload: JwtPayload) {
    const user = this.toCurrentUser(payload);
    if (!can(user, 'probation', 'view')) return { items: [] };
    const rows = await this.prisma.probationCase.findMany({
      orderBy: { createdAt: 'desc' },
      take: 200,
    });
    return {
      items: filterByScope(
        user,
        'probation',
        'view',
        rows.map((r) => this.mapCase(r)),
      ),
    };
  }

  async getOne(id: string, payload: JwtPayload) {
    const row = await this.prisma.probationCase.findUnique({
      where: { id },
      include: { evaluations: true, pips: true },
    });
    if (!row) throw new NotFoundException('Probation case not found');
    const user = this.toCurrentUser(payload);
    if (!can(user, 'probation', 'view', { employeeId: row.employeeId })) {
      throw new ForbiddenException('Cannot view this probation case');
    }
    return this.mapCase(row, {
      evaluations: row.evaluations.map((e) => ({
        id: e.id,
        caseId: e.caseId,
        employeeId: e.employeeId,
        month: e.month,
        type: e.type,
        status: e.status,
        answers: e.answers,
        weightedScore:
          e.weightedScore != null ? Number(e.weightedScore) : undefined,
        comments: e.comments,
        submittedAt: e.submittedAt?.toISOString(),
        evaluatorId: e.evaluatorId,
      })),
      pips: row.pips.map((p) => ({
        id: p.id,
        caseId: p.caseId,
        employeeId: p.employeeId,
        improvementArea: p.improvementArea,
        performanceIssue: p.performanceIssue,
        expectedImprovement: p.expectedImprovement,
        requiredActions: p.requiredActions,
        responsiblePersonId: p.responsiblePersonId,
        startDate: p.startDate,
        targetDate: p.targetDate,
        status: p.status,
      })),
    });
  }

  async create(dto: CreateProbationCaseDto, payload: JwtPayload) {
    const user = this.toCurrentUser(payload);
    if (!can(user, 'probation', 'edit')) {
      throw new ForbiddenException('Missing permission: probation:edit');
    }
    const row = await this.prisma.probationCase.create({
      data: {
        employeeId: dto.employeeId,
        startDate: dto.startDate,
        endDate: dto.endDate,
        durationMonths: dto.durationMonths ?? 3,
        status: 'pending_eval',
        stage: 'month1',
      },
    });
    return this.mapCase(row);
  }

  async update(id: string, dto: UpdateProbationCaseDto, payload: JwtPayload) {
    const user = this.toCurrentUser(payload);
    if (!can(user, 'probation', 'edit')) {
      throw new ForbiddenException('Missing permission: probation:edit');
    }
    const existing = await this.prisma.probationCase.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Probation case not found');
    const row = await this.prisma.probationCase.update({
      where: { id },
      data: {
        stage: dto.stage,
        status: dto.status,
        overallScore: dto.overallScore,
        progressPercent: dto.progressPercent,
      },
    });
    return this.mapCase(row);
  }

  async decide(id: string, dto: DecideProbationDto, payload: JwtPayload) {
    const user = this.toCurrentUser(payload);
    if (!can(user, 'probation', 'edit')) {
      throw new ForbiddenException('Missing permission: probation:edit');
    }
    const existing = await this.prisma.probationCase.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Probation case not found');

    let status = existing.status;
    if (dto.finalDecision === 'confirm') status = 'confirmed';
    else if (dto.finalDecision === 'extend') status = 'extended';
    else if (dto.finalDecision === 'terminate') status = 'terminated';

    const row = await this.prisma.probationCase.update({
      where: { id },
      data: {
        finalDecision: dto.finalDecision,
        decisionRemarks: dto.decisionRemarks,
        extensionMonths: dto.extensionMonths,
        endDate: dto.endDate ?? existing.endDate,
        status,
        progressPercent: dto.finalDecision === 'confirm' ? 100 : existing.progressPercent,
      },
    });
    return this.mapCase(row);
  }

  async upsertEvaluation(
    caseId: string,
    dto: UpsertEvaluationDto,
    payload: JwtPayload,
  ) {
    const user = this.toCurrentUser(payload);
    const cse = await this.prisma.probationCase.findUnique({ where: { id: caseId } });
    if (!cse) throw new NotFoundException('Probation case not found');
    const isSelf =
      dto.type === 'self' && payload.employeeId === cse.employeeId;
    if (!isSelf && !can(user, 'probation', 'edit')) {
      throw new ForbiddenException('Missing permission: probation:edit');
    }
    const status = dto.status ?? 'draft';
    const row = await this.prisma.probationEvaluation.upsert({
      where: {
        caseId_month_type: {
          caseId,
          month: dto.month,
          type: dto.type,
        },
      },
      create: {
        caseId,
        employeeId: cse.employeeId,
        month: dto.month,
        type: dto.type,
        status,
        answers: (dto.answers as Prisma.InputJsonValue) ?? undefined,
        weightedScore: dto.weightedScore,
        comments: dto.comments,
        submittedAt: status === 'submitted' ? new Date() : undefined,
        evaluatorId: payload.employeeId ?? payload.sub,
      },
      update: {
        status,
        answers: dto.answers as Prisma.InputJsonValue | undefined,
        weightedScore: dto.weightedScore,
        comments: dto.comments,
        submittedAt: status === 'submitted' ? new Date() : undefined,
        evaluatorId: payload.employeeId ?? payload.sub,
      },
    });
    if (cse.status === 'pending_eval') {
      await this.prisma.probationCase.update({
        where: { id: caseId },
        data: { status: 'in_progress' },
      });
    }
    return {
      id: row.id,
      caseId: row.caseId,
      month: row.month,
      type: row.type,
      status: row.status,
      weightedScore:
        row.weightedScore != null ? Number(row.weightedScore) : undefined,
    };
  }

  async upsertPip(caseId: string, dto: UpsertPipDto, payload: JwtPayload) {
    const user = this.toCurrentUser(payload);
    if (!can(user, 'probation', 'edit')) {
      throw new ForbiddenException('Missing permission: probation:edit');
    }
    const cse = await this.prisma.probationCase.findUnique({ where: { id: caseId } });
    if (!cse) throw new NotFoundException('Probation case not found');
    const row = await this.prisma.probationPip.create({
      data: {
        caseId,
        employeeId: cse.employeeId,
        improvementArea: dto.improvementArea,
        performanceIssue: dto.performanceIssue,
        expectedImprovement: dto.expectedImprovement,
        requiredActions: dto.requiredActions,
        responsiblePersonId: dto.responsiblePersonId,
        startDate: dto.startDate,
        targetDate: dto.targetDate,
        status: dto.status ?? 'not_started',
      },
    });
    return {
      id: row.id,
      caseId: row.caseId,
      improvementArea: row.improvementArea,
      status: row.status,
    };
  }

  async updatePip(id: string, dto: UpsertPipDto, payload: JwtPayload) {
    const user = this.toCurrentUser(payload);
    if (!can(user, 'probation', 'edit')) {
      throw new ForbiddenException('Missing permission: probation:edit');
    }
    const existing = await this.prisma.probationPip.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('PIP not found');
    const row = await this.prisma.probationPip.update({
      where: { id },
      data: {
        improvementArea: dto.improvementArea,
        performanceIssue: dto.performanceIssue,
        expectedImprovement: dto.expectedImprovement,
        requiredActions: dto.requiredActions,
        responsiblePersonId: dto.responsiblePersonId,
        startDate: dto.startDate,
        targetDate: dto.targetDate,
        status: dto.status,
      },
    });
    return { id: row.id, status: row.status, improvementArea: row.improvementArea };
  }

  async deletePip(id: string, payload: JwtPayload) {
    const user = this.toCurrentUser(payload);
    if (!can(user, 'probation', 'edit')) {
      throw new ForbiddenException('Missing permission: probation:edit');
    }
    await this.prisma.probationPip.delete({ where: { id } }).catch(() => {
      throw new NotFoundException('PIP not found');
    });
    return { id, deleted: true };
  }

  private async ensureSettings() {
    return this.prisma.probationSettings.upsert({
      where: { id: SETTINGS_ID },
      create: {
        id: SETTINGS_ID,
        defaultDurationMonths: DEFAULT_PROBATION_SETTINGS.defaultDurationMonths,
        reviewDays: DEFAULT_PROBATION_SETTINGS.reviewDays,
        categories: DEFAULT_PROBATION_SETTINGS.categories as Prisma.InputJsonValue,
        ratingLabels: DEFAULT_PROBATION_SETTINGS.ratingLabels as Prisma.InputJsonValue,
        selfQuestions: DEFAULT_PROBATION_SETTINGS.selfQuestions as Prisma.InputJsonValue,
        reminderDaysBefore: DEFAULT_PROBATION_SETTINGS.reminderDaysBefore,
        remindersEnabled: DEFAULT_PROBATION_SETTINGS.remindersEnabled,
        scoreBands: DEFAULT_PROBATION_SETTINGS.scoreBands as Prisma.InputJsonValue,
        approvalWorkflow: DEFAULT_PROBATION_SETTINGS.approvalWorkflow,
      },
      update: {},
    });
  }

  private mapSettings(row: Awaited<ReturnType<ProbationService['ensureSettings']>>) {
    return {
      id: row.id,
      defaultDurationMonths: row.defaultDurationMonths,
      reviewDays: row.reviewDays,
      categories: row.categories,
      ratingLabels: row.ratingLabels,
      selfQuestions: row.selfQuestions,
      reminderDaysBefore: row.reminderDaysBefore,
      remindersEnabled: row.remindersEnabled,
      scoreBands: row.scoreBands,
      approvalWorkflow: row.approvalWorkflow ?? undefined,
      updatedAt: row.updatedAt.toISOString(),
    };
  }

  async getSettings() {
    return this.mapSettings(await this.ensureSettings());
  }

  async patchSettings(dto: PatchProbationSettingsDto) {
    await this.ensureSettings();
    const data: Prisma.ProbationSettingsUpdateInput = {};
    if (dto.defaultDurationMonths !== undefined) {
      data.defaultDurationMonths = dto.defaultDurationMonths;
    }
    if (dto.reviewDays !== undefined) data.reviewDays = dto.reviewDays;
    if (dto.categories !== undefined) {
      data.categories = dto.categories as Prisma.InputJsonValue;
    }
    if (dto.ratingLabels !== undefined) {
      data.ratingLabels = dto.ratingLabels as Prisma.InputJsonValue;
    }
    if (dto.selfQuestions !== undefined) {
      data.selfQuestions = dto.selfQuestions as Prisma.InputJsonValue;
    }
    if (dto.reminderDaysBefore !== undefined) {
      data.reminderDaysBefore = dto.reminderDaysBefore;
    }
    if (dto.remindersEnabled !== undefined) data.remindersEnabled = dto.remindersEnabled;
    if (dto.scoreBands !== undefined) {
      data.scoreBands = dto.scoreBands as Prisma.InputJsonValue;
    }
    if (dto.approvalWorkflow !== undefined) data.approvalWorkflow = dto.approvalWorkflow;
    const row = await this.prisma.probationSettings.update({
      where: { id: SETTINGS_ID },
      data,
    });
    return this.mapSettings(row);
  }
}
