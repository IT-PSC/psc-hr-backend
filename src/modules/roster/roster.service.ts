import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { can } from '../../common/roles/can';
import type { CurrentUser, JwtPayload } from '../../common/roles/types';
import {
  CreateRosterPeriodDto,
  UpsertRosterCellsDto,
  UpsertShiftCodeDto,
} from './dto/roster.dto';

@Injectable()
export class RosterService {
  constructor(private readonly prisma: PrismaService) {}

  private toCurrentUser(payload: JwtPayload): CurrentUser {
    return {
      employeeId: payload.employeeId ?? '',
      roles: payload.roles ?? [],
      departmentId: payload.departmentId,
      teamIds: payload.teamIds,
    };
  }

  async listPeriods(payload: JwtPayload) {
    const user = this.toCurrentUser(payload);
    if (!can(user, 'roster', 'view')) return { items: [] };
    const rows = await this.prisma.rosterPeriod.findMany({
      orderBy: { startDate: 'desc' },
      take: 50,
      include: { _count: { select: { entries: true } } },
    });
    return {
      items: rows.map((r) => ({
        id: r.id,
        title: r.title,
        titleKm: r.titleKm,
        startDate: r.startDate,
        endDate: r.endDate,
        departmentId: r.departmentId,
        status: r.status,
        entryCount: r._count.entries,
      })),
    };
  }

  async getPeriod(id: string, payload: JwtPayload) {
    const user = this.toCurrentUser(payload);
    if (!can(user, 'roster', 'view')) {
      throw new ForbiddenException('Missing permission: roster:view');
    }
    const row = await this.prisma.rosterPeriod.findUnique({
      where: { id },
      include: { entries: true },
    });
    if (!row) throw new NotFoundException('Roster period not found');
    return {
      id: row.id,
      title: row.title,
      titleKm: row.titleKm,
      startDate: row.startDate,
      endDate: row.endDate,
      departmentId: row.departmentId,
      status: row.status,
      entries: row.entries.map((e) => ({
        id: e.id,
        periodId: e.periodId,
        employeeId: e.employeeId,
        date: e.date,
        shiftCode: e.shiftCode,
      })),
    };
  }

  async createPeriod(dto: CreateRosterPeriodDto, payload: JwtPayload) {
    const user = this.toCurrentUser(payload);
    if (!can(user, 'roster', 'create') && !can(user, 'roster', 'edit')) {
      throw new ForbiddenException('Missing permission: roster:create');
    }
    const row = await this.prisma.rosterPeriod.create({
      data: {
        title: dto.title,
        titleKm: dto.titleKm,
        startDate: dto.startDate,
        endDate: dto.endDate,
        departmentId: dto.departmentId,
        status: 'draft',
      },
    });
    return {
      id: row.id,
      title: row.title,
      startDate: row.startDate,
      endDate: row.endDate,
      departmentId: row.departmentId,
      status: row.status,
    };
  }

  async publish(id: string, payload: JwtPayload) {
    const user = this.toCurrentUser(payload);
    if (!can(user, 'roster', 'edit')) {
      throw new ForbiddenException('Missing permission: roster:edit');
    }
    const row = await this.prisma.rosterPeriod.findUnique({ where: { id } });
    if (!row) throw new NotFoundException('Roster period not found');
    const updated = await this.prisma.rosterPeriod.update({
      where: { id },
      data: { status: 'published' },
    });
    return { id: updated.id, status: updated.status };
  }

  async upsertCells(
    periodId: string,
    dto: UpsertRosterCellsDto,
    payload: JwtPayload,
  ) {
    const user = this.toCurrentUser(payload);
    if (!can(user, 'roster', 'edit')) {
      throw new ForbiddenException('Missing permission: roster:edit');
    }
    const period = await this.prisma.rosterPeriod.findUnique({
      where: { id: periodId },
    });
    if (!period) throw new NotFoundException('Roster period not found');
    if (period.status === 'published') {
      throw new BadRequestException('Cannot edit published roster');
    }
    if (!dto.cells?.length) return { upserted: 0 };

    let upserted = 0;
    for (const cell of dto.cells) {
      await this.prisma.rosterEntry.upsert({
        where: {
          periodId_employeeId_date: {
            periodId,
            employeeId: cell.employeeId,
            date: cell.date,
          },
        },
        create: {
          periodId,
          employeeId: cell.employeeId,
          date: cell.date,
          shiftCode: cell.shiftCode,
        },
        update: { shiftCode: cell.shiftCode },
      });
      upserted += 1;
    }
    return { upserted };
  }

  async listShiftCodes() {
    const rows = await this.prisma.shiftCode.findMany({ orderBy: { id: 'asc' } });
    return {
      items: rows.map((r) => ({
        code: r.id,
        id: r.id,
        label: r.label,
        labelKm: r.labelKm,
        timeRange: r.timeRange,
        color: r.color,
        dayValue: Number(r.dayValue),
        isOff: r.isOff,
      })),
    };
  }

  async upsertShiftCode(dto: UpsertShiftCodeDto, payload: JwtPayload) {
    const user = this.toCurrentUser(payload);
    if (!can(user, 'roster', 'edit') && !can(user, 'roster', 'create')) {
      throw new ForbiddenException('Missing permission: roster:edit');
    }
    const row = await this.prisma.shiftCode.upsert({
      where: { id: dto.id },
      create: {
        id: dto.id,
        label: dto.label,
        labelKm: dto.labelKm,
        timeRange: dto.timeRange,
        color: dto.color,
        dayValue: dto.dayValue ?? 1,
        isOff: dto.isOff ?? false,
      },
      update: {
        label: dto.label,
        labelKm: dto.labelKm,
        timeRange: dto.timeRange,
        color: dto.color,
        dayValue: dto.dayValue,
        isOff: dto.isOff,
      },
    });
    return {
      id: row.id,
      code: row.id,
      label: row.label,
      isOff: row.isOff,
      dayValue: Number(row.dayValue),
    };
  }
}
