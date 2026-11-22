import { BadRequestException, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../common/prisma/prisma.service';
import { AuditQueryDto } from './dto/audit.dto';

@Injectable()
export class AuditService {
  constructor(private readonly prisma: PrismaService) {}

  async list(query: AuditQueryDto = {}) {
    const where = this.where(query);
    const limit = query.limit ?? 50;
    const offset = query.offset ?? 0;
    const [items, total] = await Promise.all([
      this.prisma.auditLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
      }),
      this.prisma.auditLog.count({ where }),
    ]);
    return {
      items,
      total,
      status: 'ok' as const,
      message: items.length ? undefined : 'Audit log empty (stub-ready)',
    };
  }

  async export(query: AuditQueryDto) {
    const where = this.where(query);
    const limit = query.limit ?? 1000;
    const offset = query.offset ?? 0;
    const rows = await this.prisma.auditLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: Math.min(limit, 5000),
      skip: offset,
    });
    const header = [
      'id',
      'createdAt',
      'module',
      'action',
      'actorId',
      'targetId',
      'detail',
      'detailKm',
    ];
    const lines = [
      header.join(','),
      ...rows.map((row) =>
        [
          row.id,
          row.createdAt.toISOString(),
          row.module,
          row.action,
          row.actorId ?? '',
          row.targetId ?? '',
          row.detail ?? '',
          row.detailKm ?? '',
        ]
          .map(csvCell)
          .join(','),
      ),
    ];
    return { format: 'csv' as const, csv: lines.join('\n'), total: rows.length };
  }

  private where(query: AuditQueryDto): Prisma.AuditLogWhereInput {
    const where: Prisma.AuditLogWhereInput = {};
    if (query.module) where.module = query.module;
    if (query.actorId) where.actorId = query.actorId;
    const createdAt: Prisma.DateTimeFilter = {};
    if (query.from) createdAt.gte = this.parseDate(query.from, 'from');
    if (query.to) createdAt.lte = this.parseDate(query.to, 'to', true);
    if (query.from || query.to) where.createdAt = createdAt;
    if (query.q?.trim()) {
      const q = query.q.trim();
      where.OR = [
        { module: { contains: q, mode: 'insensitive' } },
        { action: { contains: q, mode: 'insensitive' } },
        { actorId: { contains: q, mode: 'insensitive' } },
        { targetId: { contains: q, mode: 'insensitive' } },
        { detail: { contains: q, mode: 'insensitive' } },
        { detailKm: { contains: q, mode: 'insensitive' } },
      ];
    }
    return where;
  }

  private parseDate(value: string, label: string, endOfDay = false): Date {
    const trimmed = value.trim();
    const iso = /^\d{4}-\d{2}-\d{2}$/.test(trimmed)
      ? `${trimmed}T${endOfDay ? '23:59:59.999' : '00:00:00.000'}Z`
      : trimmed;
    const date = new Date(iso);
    if (Number.isNaN(date.getTime())) {
      throw new BadRequestException(`Invalid ${label} date`);
    }
    return date;
  }
}

function csvCell(value: string): string {
  if (/[",\n\r]/.test(value)) return `"${value.replace(/"/g, '""')}"`;
  return value;
}
