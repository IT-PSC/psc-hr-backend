import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
  forwardRef,
} from '@nestjs/common';
import { AppRole, Prisma } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../../common/prisma/prisma.service';
import { can, filterByScope, getScope } from '../../common/roles/can';
import type { CurrentUser, JwtPayload } from '../../common/roles/types';
import { ApprovalsService } from '../approvals/approvals.service';
import {
  ConvertCandidateDto,
  CreateCandidateDto,
  CreateInterviewDto,
  CreateJobDto,
  UpdateCandidateDto,
  UpdateInterviewDto,
  UpdateJobDto,
} from './dto/recruitment.dto';
import {
  CreateStaffingRequestDto,
  UpdateStaffingRequestDto,
} from './dto/staffing.dto';

const DEFAULT_PASSWORD = 'Password123!';

const DEFAULT_ONBOARDING_TASKS = [
  { title: 'Complete personal info form', category: 'preboarding', priority: 'high', required: true, weight: 1 },
  { title: 'IT account setup', category: 'it', priority: 'high', required: true, weight: 2 },
  { title: 'Manager welcome meeting', category: 'manager', priority: 'medium', required: true, weight: 1 },
  { title: 'HR orientation', category: 'hr', priority: 'medium', required: true, weight: 1 },
];

function toIsoDate(input?: string | null): string {
  if (!input) return new Date().toISOString().slice(0, 10);
  if (/^\d{4}-\d{2}-\d{2}/.test(input)) return input.slice(0, 10);
  const parsed = new Date(input);
  if (Number.isNaN(parsed.getTime())) return new Date().toISOString().slice(0, 10);
  return parsed.toISOString().slice(0, 10);
}

function addMonths(iso: string, months: number): string {
  const [year, month, day] = iso.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1 + months, day));
  return date.toISOString().slice(0, 10);
}

@Injectable()
export class RecruitmentService {
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

  private mapJob(row: {
    id: string;
    title: string;
    titleKm: string | null;
    departmentId: string | null;
    positionId: string | null;
    location: string | null;
    employmentType: string | null;
    status: string;
    published: boolean;
    openings: number;
    filledCount: number;
    description: string | null;
    requirements: string | null;
    postedAt: Date | null;
    closingDate: string | null;
    createdAt: Date;
    _count?: { candidates: number };
  }) {
    return {
      id: row.id,
      title: row.title,
      titleKm: row.titleKm ?? undefined,
      departmentId: row.departmentId ?? undefined,
      positionId: row.positionId ?? undefined,
      location: row.location ?? undefined,
      employmentType: row.employmentType ?? undefined,
      status: row.status,
      published: row.published,
      openings: row.openings,
      filledCount: row.filledCount,
      description: row.description ?? undefined,
      requirements: row.requirements ?? undefined,
      postedAt: row.postedAt?.toISOString(),
      closingDate: row.closingDate ?? undefined,
      candidateCount: row._count?.candidates,
      createdAt: row.createdAt.toISOString(),
    };
  }

  private mapCandidate(row: {
    id: string;
    jobId: string;
    firstName: string;
    lastName: string;
    email: string;
    phone: string | null;
    stage: string;
    rating: number | null;
    appliedAt: Date;
    source: string | null;
    notes: string | null;
    offerStatus: string;
    offerSalary: Prisma.Decimal | null;
    offerStartDate: string | null;
    rejectReason: string | null;
    convertedEmployeeId: string | null;
  }) {
    return {
      id: row.id,
      jobId: row.jobId,
      firstName: row.firstName,
      lastName: row.lastName,
      email: row.email,
      phone: row.phone ?? undefined,
      stage: row.stage,
      rating: row.rating ?? undefined,
      appliedAt: row.appliedAt.toISOString(),
      source: row.source ?? undefined,
      notes: row.notes ?? undefined,
      offerStatus: row.offerStatus,
      offerSalary: row.offerSalary != null ? Number(row.offerSalary) : undefined,
      offerStartDate: row.offerStartDate ?? undefined,
      rejectReason: row.rejectReason ?? undefined,
      convertedEmployeeId: row.convertedEmployeeId ?? undefined,
    };
  }

  async listJobs(payload: JwtPayload) {
    const user = this.toCurrentUser(payload);
    if (!can(user, 'recruitment', 'view')) return { items: [] };
    const rows = await this.prisma.jobPosting.findMany({
      orderBy: { createdAt: 'desc' },
      include: { _count: { select: { candidates: true } } },
      take: 100,
    });
    return { items: rows.map((r) => this.mapJob(r)) };
  }

  async createJob(dto: CreateJobDto, payload: JwtPayload) {
    const user = this.toCurrentUser(payload);
    if (!can(user, 'recruitment', 'create')) {
      throw new ForbiddenException('Missing permission: recruitment:create');
    }
    const status = dto.status ?? (dto.published ? 'open' : 'draft');
    const row = await this.prisma.jobPosting.create({
      data: {
        title: dto.title,
        titleKm: dto.titleKm,
        departmentId: dto.departmentId,
        positionId: dto.positionId,
        location: dto.location,
        employmentType: dto.employmentType,
        openings: dto.openings ?? 1,
        description: dto.description,
        requirements: dto.requirements,
        published: dto.published ?? status === 'open',
        status,
        postedAt: status === 'open' ? new Date() : undefined,
      },
    });
    return this.mapJob(row);
  }

  async updateJob(id: string, dto: UpdateJobDto, payload: JwtPayload) {
    const user = this.toCurrentUser(payload);
    if (!can(user, 'recruitment', 'edit')) {
      throw new ForbiddenException('Missing permission: recruitment:edit');
    }
    const existing = await this.prisma.jobPosting.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Job not found');
    const row = await this.prisma.jobPosting.update({
      where: { id },
      data: {
        title: dto.title,
        titleKm: dto.titleKm,
        departmentId: dto.departmentId,
        positionId: dto.positionId,
        location: dto.location,
        employmentType: dto.employmentType,
        openings: dto.openings,
        description: dto.description,
        requirements: dto.requirements,
        published: dto.published,
        status: dto.status,
        postedAt:
          dto.status === 'open' && !existing.postedAt
            ? new Date()
            : undefined,
      },
    });
    return this.mapJob(row);
  }

  async listCandidates(payload: JwtPayload, jobId?: string) {
    const user = this.toCurrentUser(payload);
    if (!can(user, 'recruitment', 'view')) return { items: [] };
    const rows = await this.prisma.candidate.findMany({
      where: jobId ? { jobId } : undefined,
      orderBy: { appliedAt: 'desc' },
      take: 300,
    });
    return { items: rows.map((r) => this.mapCandidate(r)) };
  }

  async createCandidate(dto: CreateCandidateDto, payload: JwtPayload) {
    const user = this.toCurrentUser(payload);
    if (!can(user, 'recruitment', 'create') && !can(user, 'recruitment', 'edit')) {
      throw new ForbiddenException('Missing permission: recruitment:create');
    }
    const job = await this.prisma.jobPosting.findUnique({
      where: { id: dto.jobId },
    });
    if (!job) throw new NotFoundException('Job not found');
    const row = await this.prisma.candidate.create({
      data: {
        jobId: dto.jobId,
        firstName: dto.firstName,
        lastName: dto.lastName,
        email: dto.email,
        phone: dto.phone,
        source: dto.source,
        notes: dto.notes,
        stage: 'applied',
      },
    });
    return this.mapCandidate(row);
  }

  async updateCandidate(
    id: string,
    dto: UpdateCandidateDto,
    payload: JwtPayload,
  ) {
    const user = this.toCurrentUser(payload);
    if (!can(user, 'recruitment', 'edit')) {
      throw new ForbiddenException('Missing permission: recruitment:edit');
    }
    const existing = await this.prisma.candidate.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Candidate not found');
    const row = await this.prisma.candidate.update({
      where: { id },
      data: {
        stage: dto.stage,
        rating: dto.rating,
        notes: dto.notes,
        offerStatus: dto.offerStatus,
        offerSalary: dto.offerSalary,
        offerStartDate: dto.offerStartDate,
        rejectReason: dto.rejectReason,
      },
    });
    if (dto.stage === 'hired' && existing.stage !== 'hired') {
      await this.prisma.jobPosting.update({
        where: { id: existing.jobId },
        data: { filledCount: { increment: 1 } },
      });
    }
    return this.mapCandidate(row);
  }

  async createInterview(dto: CreateInterviewDto, payload: JwtPayload) {
    const user = this.toCurrentUser(payload);
    if (!can(user, 'recruitment', 'edit') && !can(user, 'recruitment', 'create')) {
      throw new ForbiddenException('Missing permission: recruitment:edit');
    }
    const candidate = await this.prisma.candidate.findUnique({
      where: { id: dto.candidateId },
    });
    if (!candidate) throw new NotFoundException('Candidate not found');
    const row = await this.prisma.interview.create({
      data: {
        candidateId: dto.candidateId,
        scheduledAt: new Date(dto.scheduledAt),
        mode: dto.mode ?? 'onsite',
        interviewerId: dto.interviewerId ?? payload.employeeId ?? payload.sub,
        status: 'scheduled',
      },
    });
    if (candidate.stage === 'applied' || candidate.stage === 'screening') {
      await this.prisma.candidate.update({
        where: { id: candidate.id },
        data: { stage: 'interview' },
      });
    }
    return {
      id: row.id,
      candidateId: row.candidateId,
      interviewerId: row.interviewerId,
      scheduledAt: row.scheduledAt.toISOString(),
      mode: row.mode,
      status: row.status,
    };
  }

  async updateInterview(
    id: string,
    dto: UpdateInterviewDto,
    payload: JwtPayload,
  ) {
    const user = this.toCurrentUser(payload);
    if (!can(user, 'recruitment', 'edit')) {
      throw new ForbiddenException('Missing permission: recruitment:edit');
    }
    const existing = await this.prisma.interview.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Interview not found');
    const row = await this.prisma.interview.update({
      where: { id },
      data: {
        scheduledAt: dto.scheduledAt ? new Date(dto.scheduledAt) : undefined,
        mode: dto.mode,
        status: dto.status,
        feedback: dto.feedback,
        score: dto.score,
      },
    });
    return {
      id: row.id,
      candidateId: row.candidateId,
      status: row.status,
      score: row.score,
      feedback: row.feedback,
      scheduledAt: row.scheduledAt.toISOString(),
    };
  }

  async convertCandidate(
    id: string,
    dto: ConvertCandidateDto = {},
    payload: JwtPayload,
  ) {
    const user = this.toCurrentUser(payload);
    if (!can(user, 'recruitment', 'edit') && !can(user, 'recruitment', 'create')) {
      throw new ForbiddenException('Missing permission: recruitment:edit');
    }

    const cand = await this.prisma.candidate.findUnique({
      where: { id },
      include: { job: true },
    });
    if (!cand) throw new NotFoundException('Candidate not found');
    if (cand.convertedEmployeeId) {
      throw new ConflictException('Candidate is already converted');
    }

    const eligible =
      cand.offerStatus === 'accepted' ||
      cand.stage === 'offer' ||
      cand.stage === 'hired';
    if (!eligible) {
      throw new BadRequestException(
        'Candidate offer must be accepted or stage must be offer/hired',
      );
    }

    const departmentId = dto.departmentId ?? cand.job.departmentId ?? undefined;
    const positionId = dto.positionId ?? cand.job.positionId ?? undefined;
    const startIso = toIsoDate(dto.startDate ?? cand.offerStartDate);
    const probationEnd = addMonths(startIso, 3);
    const employeeCode =
      dto.employeeCode?.trim() || (await this.nextEmployeeCode());

    try {
      const result = await this.prisma.$transaction(async (tx) => {
        const employee = await tx.employee.create({
          data: {
            employeeCode,
            firstName: cand.firstName,
            lastName: cand.lastName,
            email: cand.email.toLowerCase(),
            phone: cand.phone,
            departmentId,
            positionId,
            managerId: dto.managerId,
            status: 'probation',
            startDate: new Date(`${startIso}T00:00:00.000Z`),
            baseSalary: cand.offerSalary ?? undefined,
          },
        });

        let userId: string | undefined;
        if (dto.createUser) {
          const passwordHash = await bcrypt.hash(
            dto.password?.trim() || DEFAULT_PASSWORD,
            10,
          );
          const roles = (
            dto.roles?.length ? dto.roles : ['employee']
          ) as AppRole[];
          const createdUser = await tx.user.create({
            data: {
              email: cand.email.toLowerCase(),
              passwordHash,
              employeeId: employee.id,
              active: true,
              roles: { create: roles.map((role) => ({ role })) },
            },
          });
          userId = createdUser.id;
        }

        const contract = await tx.employmentContract.create({
          data: {
            employeeId: employee.id,
            title: `Employment Contract — ${cand.firstName} ${cand.lastName}`,
            contractType: 'probation',
            startDate: startIso,
            endDate: probationEnd,
            status: 'draft',
            salary: cand.offerSalary ?? undefined,
            probationEndDate: probationEnd,
          },
        });

        const onboarding = await tx.onboardingCase.create({
          data: {
            employeeId: employee.id,
            joiningDate: startIso,
            managerId: dto.managerId ?? null,
            departmentId: departmentId ?? null,
            status: 'in_progress',
            stage: 'preboarding',
            tasks: {
              create: DEFAULT_ONBOARDING_TASKS.map((task) => ({
                title: task.title,
                category: task.category,
                priority: task.priority,
                required: task.required,
                weight: task.weight,
                status: 'pending',
              })),
            },
          },
        });

        const probation = await tx.probationCase.create({
          data: {
            employeeId: employee.id,
            startDate: startIso,
            endDate: probationEnd,
            durationMonths: 3,
            stage: 'month1',
            status: 'pending_eval',
          },
        });

        const candidate = await tx.candidate.update({
          where: { id: cand.id },
          data: {
            convertedEmployeeId: employee.id,
            stage: 'hired',
            offerStatus: 'accepted',
          },
        });

        if (cand.stage !== 'hired') {
          await tx.jobPosting.update({
            where: { id: cand.jobId },
            data: { filledCount: { increment: 1 } },
          });
        }

        return {
          employee,
          candidate,
          userId,
          contractId: contract.id,
          onboardingCaseId: onboarding.id,
          probationCaseId: probation.id,
        };
      });

      await this.prisma.auditLog.create({
        data: {
          module: 'recruitment',
          action: 'convert',
          actorId: payload.employeeId ?? payload.sub,
          targetId: result.employee.id,
          detail: `Converted candidate ${cand.firstName} ${cand.lastName} to ${result.employee.employeeCode}`,
        },
      });

      return {
        employee: {
          id: result.employee.id,
          employeeCode: result.employee.employeeCode,
          firstName: result.employee.firstName,
          lastName: result.employee.lastName,
          email: result.employee.email,
          phone: result.employee.phone,
          departmentId: result.employee.departmentId,
          positionId: result.employee.positionId,
          managerId: result.employee.managerId,
          status: result.employee.status,
          startDate: startIso,
          baseSalary:
            result.employee.baseSalary != null
              ? Number(result.employee.baseSalary)
              : null,
        },
        candidate: this.mapCandidate(result.candidate),
        userId: result.userId,
        contractId: result.contractId,
        onboardingCaseId: result.onboardingCaseId,
        probationCaseId: result.probationCaseId,
      };
    } catch (e) {
      if (e instanceof Prisma.PrismaClientKnownRequestError) {
        if (e.code === 'P2002') {
          throw new ConflictException(
            'Employee code, email, or user already exists',
          );
        }
        if (e.code === 'P2003') {
          throw new BadRequestException(
            'Department, position, or manager was not found',
          );
        }
      }
      throw e;
    }
  }

  private async nextEmployeeCode(): Promise<string> {
    const rows = await this.prisma.employee.findMany({
      select: { employeeCode: true },
    });
    let max = 0;
    for (const row of rows) {
      const match = /^PSC-(\d+)$/.exec(row.employeeCode);
      if (match) max = Math.max(max, Number(match[1]));
    }
    return `PSC-${String(max + 1).padStart(3, '0')}`;
  }

  async listInterviews(payload: JwtPayload, candidateId?: string) {
    const user = this.toCurrentUser(payload);
    if (!can(user, 'recruitment', 'view')) return { items: [] };
    if (!candidateId) throw new BadRequestException('candidateId required');
    const rows = await this.prisma.interview.findMany({
      where: { candidateId },
      orderBy: { scheduledAt: 'asc' },
    });
    return {
      items: rows.map((r) => ({
        id: r.id,
        candidateId: r.candidateId,
        interviewerId: r.interviewerId,
        scheduledAt: r.scheduledAt.toISOString(),
        mode: r.mode,
        status: r.status,
        feedback: r.feedback,
        score: r.score,
      })),
    };
  }

  private mapStaffing(row: {
    id: string;
    requesterId: string;
    positionId: string | null;
    orgPositionId: string | null;
    departmentId: string;
    branchId: string | null;
    headcount: number;
    reason: string;
    proposeNewPosition: boolean;
    proposedPositionTitle: string | null;
    budgetMin: Prisma.Decimal | null;
    budgetMax: Prisma.Decimal | null;
    status: string;
    submittedAt: Date;
    jobId: string | null;
    decidedAt: Date | null;
    decidedById: string | null;
    requester?: {
      firstName: string;
      lastName: string;
      departmentId: string | null;
      managerId: string | null;
    };
  }) {
    return {
      id: row.id,
      requesterId: row.requesterId,
      employeeId: row.requesterId,
      requesterName: row.requester
        ? `${row.requester.firstName} ${row.requester.lastName}`.trim()
        : undefined,
      positionId: row.positionId,
      orgPositionId: row.orgPositionId,
      departmentId: row.departmentId,
      branchId: row.branchId,
      headcount: row.headcount,
      reason: row.reason,
      proposeNewPosition: row.proposeNewPosition,
      proposedPositionTitle: row.proposedPositionTitle,
      budgetMin: row.budgetMin != null ? Number(row.budgetMin) : null,
      budgetMax: row.budgetMax != null ? Number(row.budgetMax) : null,
      status: row.status,
      submittedAt: row.submittedAt.toISOString(),
      jobId: row.jobId,
      decidedAt: row.decidedAt?.toISOString() ?? null,
      decidedById: row.decidedById,
      managerId: row.requester?.managerId,
    };
  }

  async listStaffing(payload: JwtPayload, status?: string) {
    const user = this.toCurrentUser(payload);
    if (!can(user, 'recruitment', 'view')) return { items: [] };
    const rows = await this.prisma.staffingRequest.findMany({
      where: status ? { status } : undefined,
      include: {
        requester: {
          select: {
            firstName: true,
            lastName: true,
            departmentId: true,
            managerId: true,
          },
        },
      },
      orderBy: { submittedAt: 'desc' },
      take: 100,
    });
    return {
      items: filterByScope(
        user,
        'recruitment',
        'view',
        rows.map((row) => this.mapStaffing(row)),
      ),
    };
  }

  private async assertStaffingRefs(input: {
    departmentId?: string;
    positionId?: string | null;
    branchId?: string | null;
    proposeNewPosition?: boolean;
    proposedPositionTitle?: string | null;
    budgetMin?: number | null;
    budgetMax?: number | null;
  }) {
    if (
      input.budgetMin != null &&
      input.budgetMax != null &&
      input.budgetMax < input.budgetMin
    ) {
      throw new BadRequestException('budgetMax must be >= budgetMin');
    }
    if (input.proposeNewPosition && !input.proposedPositionTitle) {
      throw new BadRequestException(
        'proposedPositionTitle is required when proposeNewPosition is true',
      );
    }
    if (input.departmentId) {
      const dept = await this.prisma.department.findUnique({
        where: { id: input.departmentId },
      });
      if (!dept) throw new NotFoundException('Department not found');
    }
    if (input.positionId) {
      const pos = await this.prisma.position.findUnique({
        where: { id: input.positionId },
      });
      if (!pos) throw new NotFoundException('Position not found');
    }
    if (input.branchId) {
      const branch = await this.prisma.orgBranch.findUnique({
        where: { id: input.branchId },
      });
      if (!branch) throw new NotFoundException('Branch not found');
    }
  }

  async createStaffing(dto: CreateStaffingRequestDto, payload: JwtPayload) {
    const user = this.toCurrentUser(payload);
    const requesterId = payload.employeeId;
    if (!requesterId) {
      throw new BadRequestException('User is not linked to an employee');
    }
    const scope = getScope(user, 'recruitment', 'create');
    if (!scope) {
      throw new ForbiddenException('Missing permission: recruitment:create');
    }
    if (
      scope !== 'company' &&
      user.departmentId &&
      dto.departmentId !== user.departmentId
    ) {
      throw new ForbiddenException(
        'Staffing request must be for your department',
      );
    }
    await this.assertStaffingRefs(dto);
    const dept = await this.prisma.department.findUnique({
      where: { id: dto.departmentId },
    });
    return this.prisma.$transaction(async (tx) => {
      const row = await tx.staffingRequest.create({
        data: {
          requesterId,
          positionId: dto.positionId,
          orgPositionId: dto.orgPositionId,
          departmentId: dto.departmentId,
          branchId: dto.branchId,
          headcount: dto.headcount,
          reason: dto.reason,
          proposeNewPosition: dto.proposeNewPosition ?? false,
          proposedPositionTitle: dto.proposedPositionTitle,
          budgetMin: dto.budgetMin,
          budgetMax: dto.budgetMax,
          status: 'pending',
        },
        include: {
          requester: {
            select: {
              firstName: true,
              lastName: true,
              departmentId: true,
              managerId: true,
            },
          },
        },
      });
      await this.approvals.createInTx(tx, {
        type: 'staffing',
        requesterId,
        summary: `Staffing x${dto.headcount} for ${dept?.name ?? dto.departmentId}`,
        relatedId: row.id,
        relatedType: 'staffing',
      });
      return this.mapStaffing(row);
    });
  }

  async updateStaffing(
    id: string,
    dto: UpdateStaffingRequestDto,
    payload: JwtPayload,
  ) {
    const user = this.toCurrentUser(payload);
    if (!can(user, 'recruitment', 'edit')) {
      throw new ForbiddenException('Missing permission: recruitment:edit');
    }
    const row = await this.prisma.staffingRequest.findUnique({ where: { id } });
    if (!row) throw new NotFoundException('Staffing request not found');
    if (row.status !== 'pending') {
      throw new BadRequestException('Only pending staffing requests can be edited');
    }
    await this.assertStaffingRefs({
      departmentId: dto.departmentId,
      positionId: dto.positionId,
      branchId: dto.branchId,
      proposeNewPosition: dto.proposeNewPosition ?? row.proposeNewPosition,
      proposedPositionTitle:
        dto.proposedPositionTitle ?? row.proposedPositionTitle,
      budgetMin: dto.budgetMin ?? (row.budgetMin != null ? Number(row.budgetMin) : null),
      budgetMax: dto.budgetMax ?? (row.budgetMax != null ? Number(row.budgetMax) : null),
    });
    const updated = await this.prisma.staffingRequest.update({
      where: { id },
      data: dto,
      include: {
        requester: {
          select: {
            firstName: true,
            lastName: true,
            departmentId: true,
            managerId: true,
          },
        },
      },
    });
    return this.mapStaffing(updated);
  }

  async cancelStaffing(id: string, payload: JwtPayload) {
    const user = this.toCurrentUser(payload);
    const row = await this.prisma.staffingRequest.findUnique({
      where: { id },
      include: {
        requester: { select: { departmentId: true, managerId: true } },
      },
    });
    if (!row) throw new NotFoundException('Staffing request not found');
    const owner = row.requesterId === payload.employeeId;
    const canEdit = can(user, 'recruitment', 'edit', {
      employeeId: row.requesterId,
      departmentId: row.requester.departmentId ?? undefined,
      managerId: row.requester.managerId,
    });
    if (!owner && !canEdit) {
      throw new ForbiddenException('Cannot cancel this staffing request');
    }
    if (row.status !== 'pending') {
      throw new BadRequestException('Only pending staffing requests can be cancelled');
    }
    const updated = await this.prisma.$transaction(async (tx) => {
      const next = await tx.staffingRequest.update({
        where: { id },
        data: { status: 'cancelled' },
        include: {
          requester: {
            select: {
              firstName: true,
              lastName: true,
              departmentId: true,
              managerId: true,
            },
          },
        },
      });
      await tx.approvalRequest.updateMany({
        where: { relatedId: id, type: 'staffing', status: 'pending' },
        data: {
          status: 'returned',
          note: 'Cancelled by requester',
          decidedAt: new Date(),
          decidedById: payload.employeeId ?? payload.sub,
        },
      });
      return next;
    });
    return this.mapStaffing(updated);
  }

  async createJobFromStaffing(id: string, payload: JwtPayload) {
    const user = this.toCurrentUser(payload);
    if (!can(user, 'recruitment', 'edit')) {
      throw new ForbiddenException('Missing permission: recruitment:edit');
    }
    const row = await this.prisma.staffingRequest.findUnique({ where: { id } });
    if (!row) throw new NotFoundException('Staffing request not found');
    if (row.status !== 'approved') {
      throw new BadRequestException('Staffing request must be approved');
    }
    if (row.jobId) {
      throw new ConflictException('A job posting is already linked');
    }
    const title =
      row.proposedPositionTitle ??
      (
        row.positionId
          ? (
              await this.prisma.position.findUnique({
                where: { id: row.positionId },
              })
            )?.name
          : null
      ) ??
      'Staffing request';
    const job = await this.prisma.jobPosting.create({
      data: {
        title,
        departmentId: row.departmentId,
        positionId: row.positionId,
        openings: row.headcount,
        status: 'draft',
        published: false,
        description: row.reason,
      },
    });
    const updated = await this.prisma.staffingRequest.update({
      where: { id },
      data: { jobId: job.id },
      include: {
        requester: {
          select: {
            firstName: true,
            lastName: true,
            departmentId: true,
            managerId: true,
          },
        },
      },
    });
    return { staffing: this.mapStaffing(updated), job: this.mapJob(job) };
  }
}
