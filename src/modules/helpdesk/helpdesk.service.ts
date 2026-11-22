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
  AddMessageDto,
  CreateTicketDto,
  UpdateTicketDto,
} from './dto/helpdesk.dto';

@Injectable()
export class HelpdeskService {
  constructor(private readonly prisma: PrismaService) {}

  private toCurrentUser(payload: JwtPayload): CurrentUser {
    return {
      employeeId: payload.employeeId ?? '',
      roles: payload.roles ?? [],
      departmentId: payload.departmentId,
      teamIds: payload.teamIds,
    };
  }

  private mapTicket(
    row: {
      id: string;
      employeeId: string;
      subject: string;
      message: string;
      category: string;
      priority: string;
      status: string;
      assigneeId: string | null;
      slaDueDate: Date | null;
      resolvedAt: Date | null;
      createdAt: Date;
      updatedAt: Date;
    },
    messages?: unknown[],
  ) {
    return {
      id: row.id,
      employeeId: row.employeeId,
      subject: row.subject,
      message: row.message,
      category: row.category,
      priority: row.priority,
      status: row.status,
      assigneeId: row.assigneeId ?? undefined,
      slaDueDate: row.slaDueDate?.toISOString(),
      resolvedAt: row.resolvedAt?.toISOString(),
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
      messages,
    };
  }

  async list(payload: JwtPayload) {
    const user = this.toCurrentUser(payload);
    if (!can(user, 'helpdesk', 'view')) return { items: [] };
    const rows = await this.prisma.helpdeskTicket.findMany({
      orderBy: { createdAt: 'desc' },
      take: 200,
    });
    return {
      items: filterByScope(
        user,
        'helpdesk',
        'view',
        rows.map((r) => this.mapTicket(r)),
      ),
    };
  }

  async getOne(id: string, payload: JwtPayload) {
    const row = await this.prisma.helpdeskTicket.findUnique({
      where: { id },
      include: { messages: { orderBy: { createdAt: 'asc' } } },
    });
    if (!row) throw new NotFoundException('Ticket not found');
    const user = this.toCurrentUser(payload);
    if (!can(user, 'helpdesk', 'view', { employeeId: row.employeeId })) {
      throw new ForbiddenException('Cannot view this ticket');
    }
    return this.mapTicket(
      row,
      row.messages.map((m) => ({
        id: m.id,
        ticketId: m.ticketId,
        authorId: m.authorId,
        message: m.message,
        createdAt: m.createdAt.toISOString(),
      })),
    );
  }

  async create(dto: CreateTicketDto, payload: JwtPayload) {
    const user = this.toCurrentUser(payload);
    if (!can(user, 'helpdesk', 'create')) {
      throw new ForbiddenException('Missing permission: helpdesk:create');
    }
    const employeeId = dto.employeeId ?? payload.employeeId;
    if (!employeeId) throw new BadRequestException('employeeId required');
    const row = await this.prisma.helpdeskTicket.create({
      data: {
        employeeId,
        subject: dto.subject,
        message: dto.message,
        category: dto.category ?? 'other',
        priority: dto.priority ?? 'medium',
        status: 'open',
        messages: {
          create: {
            authorId: payload.employeeId ?? payload.sub,
            message: dto.message,
          },
        },
      },
    });
    return this.mapTicket(row);
  }

  async update(id: string, dto: UpdateTicketDto, payload: JwtPayload) {
    const user = this.toCurrentUser(payload);
    if (!can(user, 'helpdesk', 'edit')) {
      throw new ForbiddenException('Missing permission: helpdesk:edit');
    }
    const existing = await this.prisma.helpdeskTicket.findUnique({
      where: { id },
    });
    if (!existing) throw new NotFoundException('Ticket not found');
    const resolved =
      dto.status === 'resolved' || dto.status === 'closed'
        ? new Date()
        : undefined;
    const row = await this.prisma.helpdeskTicket.update({
      where: { id },
      data: {
        status: dto.status,
        assigneeId: dto.assigneeId === undefined ? undefined : dto.assigneeId,
        priority: dto.priority,
        category: dto.category,
        resolvedAt: resolved,
      },
    });
    return this.mapTicket(row);
  }

  async addMessage(id: string, dto: AddMessageDto, payload: JwtPayload) {
    const ticket = await this.prisma.helpdeskTicket.findUnique({
      where: { id },
    });
    if (!ticket) throw new NotFoundException('Ticket not found');
    const user = this.toCurrentUser(payload);
    const isOwner = ticket.employeeId === payload.employeeId;
    if (
      !isOwner &&
      !can(user, 'helpdesk', 'edit') &&
      !can(user, 'helpdesk', 'view', { employeeId: ticket.employeeId })
    ) {
      throw new ForbiddenException('Cannot message this ticket');
    }
    const msg = await this.prisma.helpdeskMessage.create({
      data: {
        ticketId: id,
        authorId: payload.employeeId ?? payload.sub,
        message: dto.message,
      },
    });
    if (ticket.status === 'open') {
      await this.prisma.helpdeskTicket.update({
        where: { id },
        data: { status: 'in_progress' },
      });
    }
    return {
      id: msg.id,
      ticketId: msg.ticketId,
      authorId: msg.authorId,
      message: msg.message,
      createdAt: msg.createdAt.toISOString(),
    };
  }
}
