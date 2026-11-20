import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';

@Injectable()
export class AuditService {
  constructor(private readonly prisma: PrismaService) {}

  async list() {
    const items = await this.prisma.auditLog.findMany({
      take: 50,
      orderBy: { createdAt: 'desc' },
    });
    return {
      items,
      status: 'ok',
      message: items.length ? undefined : 'Audit log empty (stub-ready)',
    };
  }
}
