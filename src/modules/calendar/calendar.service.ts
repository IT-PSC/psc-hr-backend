import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { can } from '../../common/roles/can';
import type { CurrentUser, JwtPayload } from '../../common/roles/types';
import { CreateBlackoutDto, CreateHolidayDto } from './dto/calendar.dto';

@Injectable()
export class CalendarService {
  constructor(private readonly prisma: PrismaService) {}

  private toCurrentUser(payload: JwtPayload): CurrentUser {
    return {
      employeeId: payload.employeeId ?? '',
      roles: payload.roles ?? [],
      departmentId: payload.departmentId,
      teamIds: payload.teamIds,
    };
  }

  async events(payload: JwtPayload, from?: string, to?: string) {
    const user = this.toCurrentUser(payload);
    if (!can(user, 'team_calendar', 'view') && !can(user, 'leave', 'view')) {
      return { items: [] };
    }
    const fromDate = from ?? new Date().toISOString().slice(0, 10);
    const toDate =
      to ??
      new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10);

    const [holidays, leaves, roster, blackouts] = await Promise.all([
      this.prisma.publicHoliday.findMany({
        where: { date: { gte: fromDate, lte: toDate } },
      }),
      this.prisma.leaveRequest.findMany({
        where: {
          status: { in: ['pending', 'approved'] },
          startDate: { lte: new Date(toDate) },
          endDate: { gte: new Date(fromDate) },
        },
        take: 500,
      }),
      this.prisma.rosterEntry.findMany({
        where: { date: { gte: fromDate, lte: toDate } },
        take: 2000,
      }),
      this.prisma.leaveBlackout.findMany({
        where: {
          startDate: { lte: toDate },
          endDate: { gte: fromDate },
        },
      }),
    ]);

    const items: Array<{
      id: string;
      date: string;
      type: string;
      label: string;
      employeeId?: string;
      departmentId?: string;
    }> = [];

    for (const h of holidays) {
      items.push({
        id: `hol-${h.id}`,
        date: h.date,
        type: 'holiday',
        label: h.name,
      });
    }
    for (const b of blackouts) {
      items.push({
        id: `bo-${b.id}`,
        date: b.startDate,
        type: 'blackout',
        label: b.name,
      });
    }
    for (const l of leaves) {
      items.push({
        id: `lv-${l.id}`,
        date: l.startDate.toISOString().slice(0, 10),
        type: l.status === 'pending' ? 'leave_pending' : 'leave',
        label: `Leave (${l.status})`,
        employeeId: l.employeeId,
      });
    }
    for (const r of roster) {
      items.push({
        id: `sh-${r.id}`,
        date: r.date,
        type: 'shift',
        label: r.shiftCode,
        employeeId: r.employeeId,
      });
    }

    items.sort((a, b) => a.date.localeCompare(b.date));
    return { from: fromDate, to: toDate, items };
  }

  async listHolidays() {
    const rows = await this.prisma.publicHoliday.findMany({
      orderBy: { date: 'asc' },
    });
    return {
      items: rows.map((h) => ({
        id: h.id,
        name: h.name,
        nameKm: h.nameKm,
        date: h.date,
        rate: h.rate != null ? Number(h.rate) : undefined,
      })),
    };
  }

  async createHoliday(dto: CreateHolidayDto, payload: JwtPayload) {
    const user = this.toCurrentUser(payload);
    if (
      !can(user, 'leave', 'edit') &&
      !can(user, 'leave', 'manage_settings') &&
      !can(user, 'settings', 'manage_settings')
    ) {
      throw new ForbiddenException('Missing permission to manage holidays');
    }
    const row = await this.prisma.publicHoliday.create({
      data: {
        name: dto.name,
        nameKm: dto.nameKm,
        date: dto.date,
        rate: dto.rate,
      },
    });
    return {
      id: row.id,
      name: row.name,
      date: row.date,
      rate: row.rate != null ? Number(row.rate) : undefined,
    };
  }

  async deleteHoliday(id: string, payload: JwtPayload) {
    const user = this.toCurrentUser(payload);
    if (
      !can(user, 'leave', 'edit') &&
      !can(user, 'leave', 'manage_settings') &&
      !can(user, 'settings', 'manage_settings')
    ) {
      throw new ForbiddenException('Missing permission to manage holidays');
    }
    await this.prisma.publicHoliday.delete({ where: { id } }).catch(() => {
      throw new NotFoundException('Holiday not found');
    });
    return { id, deleted: true };
  }

  async listBlackouts() {
    const rows = await this.prisma.leaveBlackout.findMany({
      orderBy: { startDate: 'asc' },
    });
    return {
      items: rows.map((b) => ({
        id: b.id,
        name: b.name,
        nameKm: b.nameKm,
        startDate: b.startDate,
        endDate: b.endDate,
        departmentIds: b.departmentIds,
        mode: b.mode,
      })),
    };
  }

  async createBlackout(dto: CreateBlackoutDto, payload: JwtPayload) {
    const user = this.toCurrentUser(payload);
    if (
      !can(user, 'leave', 'edit') &&
      !can(user, 'leave', 'manage_settings') &&
      !can(user, 'settings', 'manage_settings')
    ) {
      throw new ForbiddenException('Missing permission to manage blackouts');
    }
    const row = await this.prisma.leaveBlackout.create({
      data: {
        name: dto.name,
        nameKm: dto.nameKm,
        startDate: dto.startDate,
        endDate: dto.endDate,
        departmentIds: dto.departmentIds ?? [],
        mode: dto.mode ?? 'block',
      },
    });
    return {
      id: row.id,
      name: row.name,
      startDate: row.startDate,
      endDate: row.endDate,
      mode: row.mode,
      departmentIds: row.departmentIds,
    };
  }

  async deleteBlackout(id: string, payload: JwtPayload) {
    const user = this.toCurrentUser(payload);
    if (
      !can(user, 'leave', 'edit') &&
      !can(user, 'leave', 'manage_settings') &&
      !can(user, 'settings', 'manage_settings')
    ) {
      throw new ForbiddenException('Missing permission to manage blackouts');
    }
    await this.prisma.leaveBlackout.delete({ where: { id } }).catch(() => {
      throw new NotFoundException('Blackout not found');
    });
    return { id, deleted: true };
  }
}
