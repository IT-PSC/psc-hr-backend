import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../common/prisma/prisma.service';
import {
  CreateLetterTemplateDto,
  CreateOfficeLocationDto,
  PatchPlatformSettingsDto,
  PatchWelcomeTemplateDto,
  UpdateLetterTemplateDto,
  UpdateOfficeLocationDto,
  UpsertApprovalChainDto,
} from './dto/settings.dto';

const PLATFORM_ID = 'default';

@Injectable()
export class SettingsService {
  constructor(private readonly prisma: PrismaService) {}

  private async ensurePlatform() {
    return this.prisma.platformSettings.upsert({
      where: { id: PLATFORM_ID },
      create: {
        id: PLATFORM_ID,
        companyName: 'PSC',
      },
      update: {},
    });
  }

  private mapPlatform(
    row: Awaited<ReturnType<SettingsService['ensurePlatform']>>,
  ) {
    return {
      id: row.id,
      companyName: row.companyName,
      companyNameKm: row.companyNameKm,
      workStart: row.workStart,
      workEnd: row.workEnd,
      timezone: row.timezone,
      checkInAllowButton: row.checkInAllowButton,
      checkInAllowQr: row.checkInAllowQr,
      checkInAllowLocation: row.checkInAllowLocation,
      outsidePolicy: row.outsidePolicy,
      locationRequired: row.locationRequired,
      idleTimeoutMinutesDefault: row.idleTimeoutMinutesDefault,
      idleTimeoutMinutesPrivileged: row.idleTimeoutMinutesPrivileged,
      twoStepRoles: row.twoStepRoles,
      maskPhoneByDefault: row.maskPhoneByDefault,
      payroll: row.payroll,
      welcomeTemplate: row.welcomeTemplate,
      updatedAt: row.updatedAt.toISOString(),
    };
  }

  async getPlatform() {
    return this.mapPlatform(await this.ensurePlatform());
  }

  async patchPlatform(dto: PatchPlatformSettingsDto) {
    await this.ensurePlatform();
    const data: Prisma.PlatformSettingsUpdateInput = {};
    if (dto.companyName !== undefined) data.companyName = dto.companyName;
    if (dto.companyNameKm !== undefined) data.companyNameKm = dto.companyNameKm;
    if (dto.workStart !== undefined) data.workStart = dto.workStart;
    if (dto.workEnd !== undefined) data.workEnd = dto.workEnd;
    if (dto.timezone !== undefined) data.timezone = dto.timezone;
    if (dto.checkInAllowButton !== undefined) {
      data.checkInAllowButton = dto.checkInAllowButton;
    }
    if (dto.checkInAllowQr !== undefined) data.checkInAllowQr = dto.checkInAllowQr;
    if (dto.checkInAllowLocation !== undefined) {
      data.checkInAllowLocation = dto.checkInAllowLocation;
    }
    if (dto.outsidePolicy !== undefined) data.outsidePolicy = dto.outsidePolicy;
    if (dto.locationRequired !== undefined) {
      data.locationRequired = dto.locationRequired;
    }
    if (dto.idleTimeoutMinutesDefault !== undefined) {
      data.idleTimeoutMinutesDefault = dto.idleTimeoutMinutesDefault;
    }
    if (dto.idleTimeoutMinutesPrivileged !== undefined) {
      data.idleTimeoutMinutesPrivileged = dto.idleTimeoutMinutesPrivileged;
    }
    if (dto.twoStepRoles !== undefined) data.twoStepRoles = dto.twoStepRoles;
    if (dto.maskPhoneByDefault !== undefined) {
      data.maskPhoneByDefault = dto.maskPhoneByDefault;
    }
    if (dto.payroll !== undefined) {
      data.payroll = dto.payroll as Prisma.InputJsonValue;
    }
    if (dto.welcomeTemplate !== undefined) {
      data.welcomeTemplate = dto.welcomeTemplate as Prisma.InputJsonValue;
    }
    const row = await this.prisma.platformSettings.update({
      where: { id: PLATFORM_ID },
      data,
    });
    return this.mapPlatform(row);
  }

  private mapOffice(row: {
    id: string;
    name: string;
    nameKm: string | null;
    latitude: Prisma.Decimal;
    longitude: Prisma.Decimal;
    radiusMetres: number;
    createdAt: Date;
    updatedAt: Date;
  }) {
    return {
      id: row.id,
      name: row.name,
      nameKm: row.nameKm,
      latitude: Number(row.latitude),
      longitude: Number(row.longitude),
      radiusMetres: row.radiusMetres,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    };
  }

  async listOffices() {
    const rows = await this.prisma.officeLocation.findMany({
      orderBy: { name: 'asc' },
    });
    return rows.map((row) => this.mapOffice(row));
  }

  async getOffice(id: string) {
    const row = await this.prisma.officeLocation.findUnique({ where: { id } });
    if (!row) throw new NotFoundException('Office location not found');
    return this.mapOffice(row);
  }

  async createOffice(dto: CreateOfficeLocationDto) {
    const row = await this.prisma.officeLocation.create({
      data: {
        name: dto.name,
        nameKm: dto.nameKm,
        latitude: dto.latitude,
        longitude: dto.longitude,
        radiusMetres: dto.radiusMetres ?? 200,
      },
    });
    return this.mapOffice(row);
  }

  async updateOffice(id: string, dto: UpdateOfficeLocationDto) {
    await this.getOffice(id);
    const row = await this.prisma.officeLocation.update({
      where: { id },
      data: {
        name: dto.name,
        nameKm: dto.nameKm,
        latitude: dto.latitude,
        longitude: dto.longitude,
        radiusMetres: dto.radiusMetres,
      },
    });
    return this.mapOffice(row);
  }

  async deleteOffice(id: string) {
    await this.getOffice(id);
    await this.prisma.officeLocation.delete({ where: { id } });
    return { id, deleted: true };
  }

  private mapChain(row: {
    id: string;
    requestType: string;
    steps: Prisma.JsonValue;
    createdAt: Date;
    updatedAt: Date;
  }) {
    return {
      id: row.id,
      requestType: row.requestType,
      steps: row.steps,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    };
  }

  async listChains() {
    const rows = await this.prisma.approvalChainConfig.findMany({
      orderBy: { requestType: 'asc' },
    });
    return rows.map((row) => this.mapChain(row));
  }

  async upsertChain(dto: UpsertApprovalChainDto) {
    const steps = dto.steps as unknown as Prisma.InputJsonValue;
    const row = await this.prisma.approvalChainConfig.upsert({
      where: { requestType: dto.requestType },
      create: { requestType: dto.requestType, steps },
      update: { steps },
    });
    return this.mapChain(row);
  }

  private mapLetter(row: {
    id: string;
    kind: string;
    name: string;
    bodyEn: string;
    bodyKm: string | null;
    defaultLang: string;
    useKhmerNumerals: boolean;
    createdAt: Date;
    updatedAt: Date;
  }) {
    return {
      ...row,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    };
  }

  async listLetters() {
    const rows = await this.prisma.letterTemplate.findMany({
      orderBy: { name: 'asc' },
    });
    return rows.map((row) => this.mapLetter(row));
  }

  async getLetter(id: string) {
    const row = await this.prisma.letterTemplate.findUnique({ where: { id } });
    if (!row) throw new NotFoundException('Letter template not found');
    return this.mapLetter(row);
  }

  async createLetter(dto: CreateLetterTemplateDto) {
    const row = await this.prisma.letterTemplate.create({
      data: {
        kind: dto.kind,
        name: dto.name,
        bodyEn: dto.bodyEn,
        bodyKm: dto.bodyKm,
        defaultLang: dto.defaultLang ?? 'both',
        useKhmerNumerals: dto.useKhmerNumerals ?? false,
      },
    });
    return this.mapLetter(row);
  }

  async updateLetter(id: string, dto: UpdateLetterTemplateDto) {
    await this.getLetter(id);
    const row = await this.prisma.letterTemplate.update({
      where: { id },
      data: dto,
    });
    return this.mapLetter(row);
  }

  async deleteLetter(id: string) {
    await this.getLetter(id);
    await this.prisma.letterTemplate.delete({ where: { id } });
    return { id, deleted: true };
  }

  async getWelcome() {
    const row = await this.ensurePlatform();
    return { welcomeTemplate: row.welcomeTemplate };
  }

  async patchWelcome(dto: PatchWelcomeTemplateDto) {
    await this.ensurePlatform();
    const row = await this.prisma.platformSettings.update({
      where: { id: PLATFORM_ID },
      data: {
        welcomeTemplate: dto.welcomeTemplate as Prisma.InputJsonValue,
      },
    });
    return { welcomeTemplate: row.welcomeTemplate };
  }
}
