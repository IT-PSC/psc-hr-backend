import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createReadStream, existsSync, mkdirSync } from 'fs';
import { copyFile, unlink, writeFile } from 'fs/promises';
import { join } from 'path';
import { randomUUID } from 'crypto';
import { PrismaService } from '../../common/prisma/prisma.service';
import { can } from '../../common/roles/can';
import type { CurrentUser, JwtPayload } from '../../common/roles/types';

export type UploadedMulterFile = {
  originalname: string;
  mimetype: string;
  size: number;
  buffer?: Buffer;
  path?: string;
};

@Injectable()
export class FilesService {
  private readonly storageRoot: string;

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {
    this.storageRoot =
      this.config.get<string>('FILE_STORAGE_DIR') ??
      join(process.cwd(), 'uploads');
    if (!existsSync(this.storageRoot)) {
      mkdirSync(this.storageRoot, { recursive: true });
    }
  }

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
    employeeId: string | null;
    originalName: string;
    mimeType: string;
    sizeBytes: number;
    docType: string;
    visibility: string;
    uploadedById: string;
    expiryDate: Date | null;
    createdAt: Date;
  }) {
    return {
      id: row.id,
      employeeId: row.employeeId ?? undefined,
      name: row.originalName,
      fileName: row.originalName,
      type: row.docType,
      mimeType: row.mimeType,
      sizeBytes: row.sizeBytes,
      visibility: row.visibility,
      uploadedBy: row.uploadedById,
      uploadedAt: row.createdAt.toISOString(),
      expiryDate: row.expiryDate?.toISOString().slice(0, 10) ?? null,
    };
  }

  private canViewRow(
    user: CurrentUser,
    payload: JwtPayload,
    row: { employeeId: string | null; visibility: string; uploadedById: string },
  ) {
    if (can(user, 'documents', 'view') && user.roles.some((r) => r === 'hr' || r === 'system_admin' || r === 'finance_manager' || r === 'manager')) {
      // company/team viewers: allow unless hr_only and employee-only scope — check scope via can on target
      if (can(user, 'documents', 'view')) {
        const companyish = ['hr', 'system_admin', 'finance_manager'].some((r) =>
          user.roles.includes(r as never),
        );
        if (companyish) return true;
      }
    }
    const isOwnerEmployee =
      row.employeeId &&
      payload.employeeId &&
      row.employeeId === payload.employeeId;
    const isUploader = row.uploadedById === payload.sub;
    if (isUploader) return true;
    if (isOwnerEmployee && row.visibility === 'employee_visible') return true;
    if (isOwnerEmployee && can(user, 'documents', 'view')) return true;
    return can(user, 'documents', 'view') && !row.employeeId;
  }

  async list(payload: JwtPayload, employeeId?: string) {
    const user = this.toCurrentUser(payload);
    if (!can(user, 'documents', 'view')) {
      return { items: [] };
    }
    const companyWide = ['hr', 'system_admin', 'finance_manager'].some((r) =>
      user.roles.includes(r as never),
    );
    const rows = await this.prisma.storedFile.findMany({
      where: {
        deletedAt: null,
        ...(employeeId
          ? { employeeId }
          : companyWide
            ? {}
            : {
                OR: [
                  { employeeId: payload.employeeId ?? '__none__' },
                  { uploadedById: payload.sub },
                  { visibility: 'employee_visible', employeeId: payload.employeeId ?? '__none__' },
                ],
              }),
      },
      orderBy: { createdAt: 'desc' },
      take: 200,
    });
    const items = rows
      .filter((r) => this.canViewRow(user, payload, r))
      .map((r) => this.map(r));
    return { items };
  }

  async getOne(id: string, payload: JwtPayload) {
    const row = await this.prisma.storedFile.findFirst({
      where: { id, deletedAt: null },
    });
    if (!row) throw new NotFoundException('File not found');
    const user = this.toCurrentUser(payload);
    if (!this.canViewRow(user, payload, row)) {
      throw new ForbiddenException('Cannot view this file');
    }
    return this.map(row);
  }

  async upload(
    payload: JwtPayload,
    file: UploadedMulterFile,
    meta: {
      employeeId?: string;
      docType?: string;
      visibility?: string;
      expiryDate?: string;
    },
  ) {
    const user = this.toCurrentUser(payload);
    if (!can(user, 'documents', 'create') && !can(user, 'documents', 'edit')) {
      // employees may upload own docs if they have view own — allow create for own
      const ownUpload =
        meta.employeeId &&
        payload.employeeId &&
        meta.employeeId === payload.employeeId;
      if (!ownUpload || !can(user, 'documents', 'view')) {
        throw new ForbiddenException('Missing permission: documents:create');
      }
    }

    const storedName = `${randomUUID()}-${file.originalname.replace(/[^\w.\-]+/g, '_')}`;
    const absPath = join(this.storageRoot, storedName);

    if (file.buffer) {
      await writeFile(absPath, file.buffer);
    } else if (file.path) {
      await copyFile(file.path, absPath);
      await unlink(file.path).catch(() => undefined);
    } else {
      throw new ForbiddenException('Empty upload');
    }

    const row = await this.prisma.storedFile.create({
      data: {
        employeeId: meta.employeeId,
        originalName: file.originalname,
        storedName,
        mimeType: file.mimetype || 'application/octet-stream',
        sizeBytes: file.size,
        storagePath: absPath,
        docType: meta.docType ?? 'other',
        visibility: meta.visibility ?? 'hr_only',
        uploadedById: payload.sub,
        expiryDate: meta.expiryDate ? new Date(meta.expiryDate) : null,
      },
    });
    return this.map(row);
  }

  /** Write a generated buffer (exports worker). */
  async storeGenerated(input: {
    originalName: string;
    mimeType: string;
    buffer: Buffer;
    uploadedById: string;
    employeeId?: string;
    docType?: string;
    visibility?: string;
  }) {
    const storedName = `${randomUUID()}-${input.originalName.replace(/[^\w.\-]+/g, '_')}`;
    const absPath = join(this.storageRoot, storedName);
    await writeFile(absPath, input.buffer);
    const row = await this.prisma.storedFile.create({
      data: {
        employeeId: input.employeeId,
        originalName: input.originalName,
        storedName,
        mimeType: input.mimeType,
        sizeBytes: input.buffer.length,
        storagePath: absPath,
        docType: input.docType ?? 'other',
        visibility: input.visibility ?? 'hr_only',
        uploadedById: input.uploadedById,
      },
    });
    return this.map(row);
  }

  async openDownload(id: string, payload: JwtPayload) {
    const row = await this.prisma.storedFile.findFirst({
      where: { id, deletedAt: null },
    });
    if (!row) throw new NotFoundException('File not found');
    const user = this.toCurrentUser(payload);
    if (!this.canViewRow(user, payload, row)) {
      throw new ForbiddenException('Cannot download this file');
    }
    if (!existsSync(row.storagePath)) {
      throw new NotFoundException('File bytes missing on disk');
    }
    return {
      stream: createReadStream(row.storagePath),
      mimeType: row.mimeType,
      fileName: row.originalName,
    };
  }

  async softDelete(id: string, payload: JwtPayload) {
    const row = await this.prisma.storedFile.findFirst({
      where: { id, deletedAt: null },
    });
    if (!row) throw new NotFoundException('File not found');
    const user = this.toCurrentUser(payload);
    const isUploader = row.uploadedById === payload.sub;
    if (!isUploader && !can(user, 'documents', 'delete') && !can(user, 'documents', 'edit')) {
      throw new ForbiddenException('Missing permission: documents:delete');
    }
    await this.prisma.storedFile.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
    return { id, deleted: true };
  }
}
