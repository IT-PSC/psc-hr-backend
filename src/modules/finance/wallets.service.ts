import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../common/prisma/prisma.service';
import { CreateWalletDto, WalletMovementDto } from './dto/ops.dto';
import { iso, money } from './money';

@Injectable()
export class WalletsService {
  constructor(private readonly prisma: PrismaService) {}

  async list(customerId?: string) {
    const rows = await this.prisma.finWallet.findMany({
      where: customerId ? { customerId } : undefined,
      orderBy: { createdAt: 'desc' },
      include: { customer: { select: { id: true, name: true } } },
    });
    return { items: rows.map((row) => this.mapWallet(row)) };
  }

  async getOne(id: string) {
    const row = await this.prisma.finWallet.findUnique({
      where: { id },
      include: {
        customer: { select: { id: true, name: true } },
        movements: { orderBy: { at: 'desc' }, take: 50 },
      },
    });
    if (!row) throw new NotFoundException('Wallet not found');
    return {
      ...this.mapWallet(row),
      movements: row.movements.map((movement) => this.mapMovement(movement)),
    };
  }

  async create(dto: CreateWalletDto) {
    const customer = await this.prisma.finCustomer.findUnique({
      where: { id: dto.customerId },
    });
    if (!customer) throw new NotFoundException('Customer not found');
    const row = await this.prisma.finWallet.create({
      data: { customerId: dto.customerId },
      include: { customer: { select: { id: true, name: true } } },
    });
    return this.mapWallet(row);
  }

  async move(id: string, dto: WalletMovementDto) {
    const amount = money(dto.amount);
    const result = await this.prisma.$transaction(async (tx) => {
      const wallet = await tx.finWallet.findUnique({ where: { id } });
      if (!wallet) throw new NotFoundException('Wallet not found');
      const purchased = money(wallet.purchasedBalance);
      const bonus = money(wallet.bonusBalance);
      const reserved = money(wallet.reserved);
      const available = money(purchased + bonus - reserved);
      const next = { purchased, bonus, reserved };

      if (dto.type === 'load') next.purchased = money(purchased + amount);
      else if (dto.type === 'bonus') next.bonus = money(bonus + amount);
      else if (dto.type === 'reserve') {
        if (amount - available > 0.001) {
          throw new BadRequestException('Insufficient available balance');
        }
        next.reserved = money(reserved + amount);
      } else if (dto.type === 'release') {
        if (amount - reserved > 0.001) {
          throw new BadRequestException('Release exceeds reserved balance');
        }
        next.reserved = money(reserved - amount);
      } else if (dto.type === 'redeem') {
        if (amount - available > 0.001) {
          throw new BadRequestException('Insufficient available balance');
        }
        const fromPurchased = Math.min(purchased, amount);
        next.purchased = money(purchased - fromPurchased);
        next.bonus = money(bonus - (amount - fromPurchased));
      } else {
        throw new BadRequestException(`Unknown movement type ${dto.type}`);
      }

      const movement = await tx.finWalletMovement.create({
        data: {
          walletId: id,
          type: dto.type,
          amount,
          branchId: dto.branchId,
        },
      });
      const updated = await tx.finWallet.update({
        where: { id },
        data: {
          purchasedBalance: next.purchased,
          bonusBalance: next.bonus,
          reserved: next.reserved,
        },
        include: { customer: { select: { id: true, name: true } } },
      });
      return { wallet: updated, movement };
    });
    return {
      wallet: this.mapWallet(result.wallet),
      movement: this.mapMovement(result.movement),
    };
  }

  private mapWallet(row: {
    id: string;
    customerId: string;
    purchasedBalance: Prisma.Decimal | number;
    bonusBalance: Prisma.Decimal | number;
    reserved: Prisma.Decimal | number;
    createdAt: Date;
    updatedAt: Date;
    customer?: { id: string; name: string };
  }) {
    const purchasedBalance = money(row.purchasedBalance);
    const bonusBalance = money(row.bonusBalance);
    const reserved = money(row.reserved);
    return {
      id: row.id,
      customerId: row.customerId,
      customerName: row.customer?.name,
      purchasedBalance,
      bonusBalance,
      reserved,
      available: money(purchasedBalance + bonusBalance - reserved),
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    };
  }

  private mapMovement(row: {
    id: string;
    walletId: string;
    type: string;
    amount: Prisma.Decimal | number;
    branchId: string | null;
    at: Date;
  }) {
    return {
      id: row.id,
      walletId: row.walletId,
      type: row.type,
      amount: money(row.amount),
      branchId: row.branchId,
      at: iso(row.at),
    };
  }
}
