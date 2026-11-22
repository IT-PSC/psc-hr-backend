import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../common/prisma/prisma.service';
import { can } from '../../common/roles/can';
import type { CurrentUser, JwtPayload } from '../../common/roles/types';

export const DEFAULT_NOTIFICATION_SETTINGS = {
  contractExpiring: { id: 'contractExpiring', enabled: true, daysBefore: 30 },
  probationEnding: { id: 'probationEnding', enabled: true, daysBefore: 14 },
  documentExpiring: { id: 'documentExpiring', enabled: true, daysBefore: 30 },
  birthday: { id: 'birthday', enabled: true, daysBefore: 0 },
  anniversary: { id: 'anniversary', enabled: true, daysBefore: 0 },
  approvalStale: { id: 'approvalStale', enabled: true, daysBefore: 3 },
} as const;

export type CreateNotificationInput = {
  userId: string;
  title: string;
  titleKm?: string;
  message: string;
  messageKm?: string;
  type?: string;
  link?: string;
  approvalRequestId?: string;
  meta?: Prisma.InputJsonValue;
};

@Injectable()
export class NotificationsService {
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
    userId: string;
    title: string;
    titleKm: string;
    message: string;
    messageKm: string;
    type: string;
    read: boolean;
    link: string | null;
    approvalRequestId: string | null;
    createdAt: Date;
  }) {
    return {
      id: row.id,
      userId: row.userId,
      title: row.title,
      titleKm: row.titleKm,
      message: row.message,
      messageKm: row.messageKm,
      type: row.type,
      read: row.read,
      createdAt: row.createdAt.toISOString(),
      link: row.link ?? undefined,
      approvalRequestId: row.approvalRequestId ?? undefined,
    };
  }

  /** Resolve User.id from employee id (or return userId if already a user). */
  async resolveUserId(employeeOrUserId: string): Promise<string | null> {
    const byUser = await this.prisma.user.findUnique({
      where: { id: employeeOrUserId },
      select: { id: true },
    });
    if (byUser) return byUser.id;
    const byEmp = await this.prisma.user.findFirst({
      where: { employeeId: employeeOrUserId },
      select: { id: true },
    });
    return byEmp?.id ?? null;
  }

  async createInternal(input: CreateNotificationInput) {
    const row = await this.prisma.notification.create({
      data: {
        userId: input.userId,
        title: input.title,
        titleKm: input.titleKm ?? '',
        message: input.message,
        messageKm: input.messageKm ?? '',
        type: input.type ?? 'info',
        link: input.link,
        approvalRequestId: input.approvalRequestId,
        meta: input.meta,
      },
    });
    return this.map(row);
  }

  /** Notify employee (or user) after leave/approval decisions, etc. */
  async notifyEmployee(
    employeeId: string,
    input: Omit<CreateNotificationInput, 'userId'>,
  ) {
    const userId = await this.resolveUserId(employeeId);
    if (!userId) return null;
    return this.createInternal({ ...input, userId });
  }

  async list(payload: JwtPayload, unreadOnly?: boolean) {
    const user = this.toCurrentUser(payload);
    if (!can(user, 'notifications', 'view')) {
      return { items: [], unreadCount: 0 };
    }
    const userId = payload.sub;
    const where: Prisma.NotificationWhereInput = {
      userId,
      ...(unreadOnly ? { read: false } : {}),
    };
    const [rows, unreadCount] = await Promise.all([
      this.prisma.notification.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: 100,
      }),
      this.prisma.notification.count({ where: { userId, read: false } }),
    ]);
    return { items: rows.map((r) => this.map(r)), unreadCount };
  }

  async unreadCount(payload: JwtPayload) {
    const count = await this.prisma.notification.count({
      where: { userId: payload.sub, read: false },
    });
    return { count };
  }

  async create(payload: JwtPayload, dto: CreateNotificationInput) {
    const user = this.toCurrentUser(payload);
    if (!can(user, 'notifications', 'create')) {
      throw new ForbiddenException('Missing permission: notifications:create');
    }
    return this.createInternal(dto);
  }

  async markRead(id: string, payload: JwtPayload) {
    const row = await this.prisma.notification.findUnique({ where: { id } });
    if (!row) throw new NotFoundException('Notification not found');
    const user = this.toCurrentUser(payload);
    const isOwner = row.userId === payload.sub;
    const canEditCompany = can(user, 'notifications', 'edit');
    if (!isOwner && !canEditCompany) {
      throw new ForbiddenException('Cannot mark this notification');
    }
    if (isOwner && !can(user, 'notifications', 'edit')) {
      throw new ForbiddenException('Missing permission: notifications:edit');
    }
    const updated = await this.prisma.notification.update({
      where: { id },
      data: { read: true },
    });
    return this.map(updated);
  }

  async markAllRead(payload: JwtPayload) {
    const user = this.toCurrentUser(payload);
    if (!can(user, 'notifications', 'view') && !can(user, 'notifications', 'edit')) {
      throw new ForbiddenException('Missing permission: notifications');
    }
    const result = await this.prisma.notification.updateMany({
      where: { userId: payload.sub, read: false },
      data: { read: true },
    });
    return { updated: result.count };
  }

  async getSettings(payload: JwtPayload) {
    const pref = await this.prisma.notificationPreference.findUnique({
      where: { userId: payload.sub },
    });
    return {
      settings: (pref?.settings as object) ?? DEFAULT_NOTIFICATION_SETTINGS,
      telegramChatId: pref?.telegramChatId ?? null,
      telegramEnabled: pref?.telegramEnabled ?? false,
    };
  }

  async updateSettings(
    payload: JwtPayload,
    body: {
      settings?: Record<string, unknown>;
      telegramChatId?: string | null;
      telegramEnabled?: boolean;
    },
  ) {
    const user = this.toCurrentUser(payload);
    if (
      !can(user, 'notifications', 'edit') &&
      !can(user, 'notifications', 'manage_settings')
    ) {
      throw new ForbiddenException('Missing permission: notifications:edit');
    }
    const existing = await this.prisma.notificationPreference.findUnique({
      where: { userId: payload.sub },
    });
    const settings =
      body.settings ??
      (existing?.settings as object) ??
      DEFAULT_NOTIFICATION_SETTINGS;
    const pref = await this.prisma.notificationPreference.upsert({
      where: { userId: payload.sub },
      create: {
        userId: payload.sub,
        settings: settings as Prisma.InputJsonValue,
        telegramChatId: body.telegramChatId ?? null,
        telegramEnabled: body.telegramEnabled ?? false,
      },
      update: {
        ...(body.settings !== undefined
          ? { settings: body.settings as Prisma.InputJsonValue }
          : {}),
        ...(body.telegramChatId !== undefined
          ? { telegramChatId: body.telegramChatId }
          : {}),
        ...(body.telegramEnabled !== undefined
          ? { telegramEnabled: body.telegramEnabled }
          : {}),
      },
    });
    return {
      settings: pref.settings as object,
      telegramChatId: pref.telegramChatId,
      telegramEnabled: pref.telegramEnabled,
    };
  }

  async getTelegramTarget(userId: string) {
    const pref = await this.prisma.notificationPreference.findUnique({
      where: { userId },
    });
    if (!pref?.telegramEnabled || !pref.telegramChatId) return null;
    return pref.telegramChatId;
  }
}
