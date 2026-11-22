import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { can } from '../../common/roles/can';
import type { CurrentUser, JwtPayload } from '../../common/roles/types';
import {
  CreateAnnouncementDto,
  UpdateAnnouncementDto,
} from './dto/announcement.dto';

@Injectable()
export class AnnouncementsService {
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
    title: string;
    titleKm: string;
    body: string;
    bodyKm: string;
    author: string | null;
    target: string;
    published: boolean;
    pinned: boolean;
    createdBy: string;
    createdAt: Date;
  }) {
    return {
      id: row.id,
      title: row.title,
      titleKm: row.titleKm,
      body: row.body,
      bodyKm: row.bodyKm,
      author: row.author ?? undefined,
      target: row.target,
      published: row.published,
      pinned: row.pinned,
      createdBy: row.createdBy,
      createdAt: row.createdAt.toISOString(),
    };
  }

  async list(payload: JwtPayload) {
    const user = this.toCurrentUser(payload);
    if (!can(user, 'announcements', 'view')) return { items: [] };
    const canManage = can(user, 'announcements', 'edit') || can(user, 'announcements', 'create');
    const rows = await this.prisma.announcement.findMany({
      where: canManage ? undefined : { published: true },
      orderBy: [{ pinned: 'desc' }, { createdAt: 'desc' }],
      take: 100,
    });
    return { items: rows.map((r) => this.map(r)) };
  }

  async create(dto: CreateAnnouncementDto, payload: JwtPayload) {
    const user = this.toCurrentUser(payload);
    if (!can(user, 'announcements', 'create')) {
      throw new ForbiddenException('Missing permission: announcements:create');
    }
    const row = await this.prisma.announcement.create({
      data: {
        title: dto.title,
        titleKm: dto.titleKm ?? '',
        body: dto.body,
        bodyKm: dto.bodyKm ?? '',
        target: dto.target ?? 'all',
        published: dto.published ?? false,
        pinned: dto.pinned ?? false,
        createdBy: payload.sub,
        author: [payload.firstName, payload.lastName].filter(Boolean).join(' ') || payload.email,
      },
    });
    return this.map(row);
  }

  async update(id: string, dto: UpdateAnnouncementDto, payload: JwtPayload) {
    const user = this.toCurrentUser(payload);
    if (!can(user, 'announcements', 'edit')) {
      throw new ForbiddenException('Missing permission: announcements:edit');
    }
    const existing = await this.prisma.announcement.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Announcement not found');
    const row = await this.prisma.announcement.update({
      where: { id },
      data: {
        title: dto.title,
        titleKm: dto.titleKm,
        body: dto.body,
        bodyKm: dto.bodyKm,
        target: dto.target,
        published: dto.published,
        pinned: dto.pinned,
      },
    });
    return this.map(row);
  }
}
