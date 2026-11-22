import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
  forwardRef,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../common/prisma/prisma.service';
import { can, filterByScope } from '../../common/roles/can';
import type { CurrentUser, JwtPayload } from '../../common/roles/types';
import { ApprovalsService } from '../approvals/approvals.service';
import {
  CreateKudosDto,
  CreateLetterDto,
  CreateSuggestionDto,
  CreateSurveyDto,
  SurveyResponseDto,
  UpdateLetterDto,
  UpdateSuggestionDto,
  UpdateSurveyDto,
} from './dto/workplace.dto';

@Injectable()
export class WorkplaceService {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(forwardRef(() => ApprovalsService))
    private readonly approvals: ApprovalsService,
  ) {}

  private toCurrentUser(payload: JwtPayload): CurrentUser {
    return {
      employeeId: payload.employeeId ?? '',
      roles: payload.roles ?? [],
      departmentId: payload.departmentId,
      teamIds: payload.teamIds,
    };
  }

  // ── Letters ───────────────────────────────────────────────────

  private mapLetter(row: {
    id: string;
    employeeId: string;
    kind: string;
    purpose: string | null;
    language: string;
    copies: number;
    status: string;
    approvalId: string | null;
    submittedAt: Date;
    approvedAt: Date | null;
    createdAt: Date;
  }) {
    return {
      id: row.id,
      employeeId: row.employeeId,
      kind: row.kind,
      purpose: row.purpose ?? undefined,
      language: row.language,
      copies: row.copies,
      status: row.status,
      approvalId: row.approvalId ?? undefined,
      submittedAt: row.submittedAt.toISOString(),
      approvedAt: row.approvedAt?.toISOString(),
      createdAt: row.createdAt.toISOString(),
    };
  }

  async listLetters(payload: JwtPayload) {
    const user = this.toCurrentUser(payload);
    if (!can(user, 'letters', 'view')) return { items: [] };
    const rows = await this.prisma.letterRequest.findMany({
      orderBy: { submittedAt: 'desc' },
      take: 200,
    });
    return {
      items: filterByScope(
        user,
        'letters',
        'view',
        rows.map((r) => this.mapLetter(r)),
      ),
    };
  }

  async createLetter(dto: CreateLetterDto, payload: JwtPayload) {
    const user = this.toCurrentUser(payload);
    if (!can(user, 'letters', 'create')) {
      throw new ForbiddenException('Missing permission: letters:create');
    }
    const employeeId = dto.employeeId ?? payload.employeeId;
    if (!employeeId) throw new BadRequestException('employeeId required');

    return this.prisma.$transaction(async (tx) => {
      const row = await tx.letterRequest.create({
        data: {
          employeeId,
          kind: dto.kind,
          purpose: dto.purpose,
          language: dto.language ?? 'en',
          copies: dto.copies ?? 1,
          status: 'pending',
        },
      });
      const approval = await this.approvals.createInTx(tx, {
        type: 'letter_request',
        requesterId: employeeId,
        summary: `Letter: ${dto.kind}`,
        relatedId: row.id,
        relatedType: 'letter_request',
      });
      const updated = await tx.letterRequest.update({
        where: { id: row.id },
        data: { approvalId: approval.id },
      });
      return this.mapLetter(updated);
    });
  }

  async updateLetter(id: string, dto: UpdateLetterDto, payload: JwtPayload) {
    const user = this.toCurrentUser(payload);
    if (!can(user, 'letters', 'edit') && !can(user, 'letters', 'approve')) {
      throw new ForbiddenException('Missing permission: letters:edit');
    }
    const existing = await this.prisma.letterRequest.findUnique({
      where: { id },
    });
    if (!existing) throw new NotFoundException('Letter request not found');
    const row = await this.prisma.letterRequest.update({
      where: { id },
      data: {
        status: dto.status,
        purpose: dto.purpose === undefined ? undefined : dto.purpose,
        approvedAt:
          dto.status === 'approved' || dto.status === 'ready'
            ? new Date()
            : undefined,
      },
    });
    return this.mapLetter(row);
  }

  async applyLetterApprovalDecision(
    id: string,
    status: 'approved' | 'rejected',
    _actorId: string,
  ) {
    const row = await this.prisma.letterRequest.findUnique({ where: { id } });
    if (!row || row.status !== 'pending') return;
    await this.prisma.letterRequest.update({
      where: { id },
      data: {
        status: status === 'approved' ? 'approved' : 'rejected',
        approvedAt: status === 'approved' ? new Date() : undefined,
      },
    });
  }

  // ── Recognition / Kudos ───────────────────────────────────────

  async listKudos(payload: JwtPayload) {
    const user = this.toCurrentUser(payload);
    if (!can(user, 'recognition', 'view')) return { items: [] };
    const rows = await this.prisma.kudosItem.findMany({
      where: { hidden: false },
      orderBy: { createdAt: 'desc' },
      take: 200,
    });
    return {
      items: rows.map((r) => ({
        id: r.id,
        fromEmployeeId: r.fromEmployeeId,
        toEmployeeId: r.toEmployeeId,
        message: r.message,
        category: r.category,
        hidden: r.hidden,
        createdAt: r.createdAt.toISOString(),
      })),
    };
  }

  async createKudos(dto: CreateKudosDto, payload: JwtPayload) {
    const user = this.toCurrentUser(payload);
    if (!can(user, 'recognition', 'create')) {
      throw new ForbiddenException('Missing permission: recognition:create');
    }
    const fromEmployeeId = payload.employeeId;
    if (!fromEmployeeId) throw new BadRequestException('employeeId required');
    const row = await this.prisma.kudosItem.create({
      data: {
        fromEmployeeId,
        toEmployeeId: dto.toEmployeeId,
        message: dto.message,
        category: dto.category ?? 'great_work',
      },
    });
    return {
      id: row.id,
      fromEmployeeId: row.fromEmployeeId,
      toEmployeeId: row.toEmployeeId,
      message: row.message,
      category: row.category,
      createdAt: row.createdAt.toISOString(),
    };
  }

  async hideKudos(id: string, payload: JwtPayload) {
    const user = this.toCurrentUser(payload);
    if (!can(user, 'recognition', 'edit')) {
      throw new ForbiddenException('Missing permission: recognition:edit');
    }
    const existing = await this.prisma.kudosItem.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Kudos not found');
    const row = await this.prisma.kudosItem.update({
      where: { id },
      data: { hidden: true },
    });
    return { id: row.id, hidden: row.hidden };
  }

  // ── Surveys ───────────────────────────────────────────────────

  async listSurveys(payload: JwtPayload) {
    const user = this.toCurrentUser(payload);
    if (!can(user, 'surveys', 'view')) return { items: [] };
    const rows = await this.prisma.pulseSurvey.findMany({
      orderBy: { createdAt: 'desc' },
      take: 100,
      include: { _count: { select: { responses: true } } },
    });
    return {
      items: rows.map((r) => ({
        id: r.id,
        title: r.title,
        questions: r.questions,
        target: r.target,
        openDate: r.openDate ?? undefined,
        closeDate: r.closeDate ?? undefined,
        active: r.active,
        createdBy: r.createdBy,
        responseCount: r._count.responses,
        createdAt: r.createdAt.toISOString(),
      })),
    };
  }

  async createSurvey(dto: CreateSurveyDto, payload: JwtPayload) {
    const user = this.toCurrentUser(payload);
    if (!can(user, 'surveys', 'create')) {
      throw new ForbiddenException('Missing permission: surveys:create');
    }
    const row = await this.prisma.pulseSurvey.create({
      data: {
        title: dto.title,
        questions: dto.questions as Prisma.InputJsonValue,
        target: dto.target ?? 'all',
        openDate: dto.openDate,
        closeDate: dto.closeDate,
        createdBy: payload.employeeId ?? payload.sub,
        active: true,
      },
    });
    return {
      id: row.id,
      title: row.title,
      questions: row.questions,
      target: row.target,
      active: row.active,
      createdBy: row.createdBy,
    };
  }

  async updateSurvey(id: string, dto: UpdateSurveyDto, payload: JwtPayload) {
    const user = this.toCurrentUser(payload);
    if (!can(user, 'surveys', 'edit')) {
      throw new ForbiddenException('Missing permission: surveys:edit');
    }
    const existing = await this.prisma.pulseSurvey.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Survey not found');
    const row = await this.prisma.pulseSurvey.update({
      where: { id },
      data: {
        title: dto.title,
        active: dto.active,
        openDate: dto.openDate === undefined ? undefined : dto.openDate,
        closeDate: dto.closeDate === undefined ? undefined : dto.closeDate,
        questions:
          dto.questions === undefined
            ? undefined
            : (dto.questions as Prisma.InputJsonValue),
      },
    });
    return {
      id: row.id,
      title: row.title,
      active: row.active,
      questions: row.questions,
    };
  }

  async submitSurveyResponse(
    surveyId: string,
    dto: SurveyResponseDto,
    payload: JwtPayload,
  ) {
    const user = this.toCurrentUser(payload);
    if (!can(user, 'surveys', 'view')) {
      throw new ForbiddenException('Missing permission: surveys:view');
    }
    const survey = await this.prisma.pulseSurvey.findUnique({
      where: { id: surveyId },
    });
    if (!survey) throw new NotFoundException('Survey not found');
    if (!survey.active) throw new BadRequestException('Survey is closed');
    const row = await this.prisma.pulseSurveyResponse.create({
      data: {
        surveyId,
        departmentId: dto.departmentId ?? payload.departmentId,
        answers: dto.answers as Prisma.InputJsonValue,
      },
    });
    return {
      id: row.id,
      surveyId: row.surveyId,
      submittedAt: row.submittedAt.toISOString(),
    };
  }

  // ── Suggestions ───────────────────────────────────────────────

  async listSuggestions(payload: JwtPayload) {
    const user = this.toCurrentUser(payload);
    if (!can(user, 'suggestions', 'view')) return { items: [] };
    const rows = await this.prisma.suggestionItem.findMany({
      orderBy: { createdAt: 'desc' },
      take: 200,
    });
    const canEdit = can(user, 'suggestions', 'edit');
    return {
      items: rows.map((r) => ({
        id: r.id,
        employeeId: canEdit || !r.anonymous ? (r.employeeId ?? undefined) : undefined,
        anonymous: r.anonymous,
        body: r.body,
        status: r.status,
        publicReply: r.publicReply ?? undefined,
        showOnBoard: r.showOnBoard,
        createdAt: r.createdAt.toISOString(),
      })),
    };
  }

  async createSuggestion(dto: CreateSuggestionDto, payload: JwtPayload) {
    const user = this.toCurrentUser(payload);
    if (!can(user, 'suggestions', 'create')) {
      throw new ForbiddenException('Missing permission: suggestions:create');
    }
    const row = await this.prisma.suggestionItem.create({
      data: {
        body: dto.body,
        anonymous: dto.anonymous ?? false,
        employeeId: dto.anonymous ? null : payload.employeeId,
        status: 'new',
      },
    });
    return {
      id: row.id,
      body: row.body,
      anonymous: row.anonymous,
      status: row.status,
      createdAt: row.createdAt.toISOString(),
    };
  }

  async updateSuggestion(
    id: string,
    dto: UpdateSuggestionDto,
    payload: JwtPayload,
  ) {
    const user = this.toCurrentUser(payload);
    if (!can(user, 'suggestions', 'edit')) {
      throw new ForbiddenException('Missing permission: suggestions:edit');
    }
    const existing = await this.prisma.suggestionItem.findUnique({
      where: { id },
    });
    if (!existing) throw new NotFoundException('Suggestion not found');
    const row = await this.prisma.suggestionItem.update({
      where: { id },
      data: {
        status: dto.status,
        publicReply: dto.publicReply === undefined ? undefined : dto.publicReply,
        showOnBoard: dto.showOnBoard,
      },
    });
    return {
      id: row.id,
      status: row.status,
      publicReply: row.publicReply ?? undefined,
      showOnBoard: row.showOnBoard,
    };
  }
}
