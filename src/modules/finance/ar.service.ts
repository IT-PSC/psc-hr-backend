import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../common/prisma/prisma.service';
import {
  ConfirmReceiptDto,
  CreateCustomerDto,
  CreateInvoiceDto,
  CreateReceiptDto,
  UpdateCustomerDto,
} from './dto/ar.dto';
import { iso, money, rethrowUnique } from './money';

const OPEN_INVOICE = ['posted', 'partial'] as const;

@Injectable()
export class ArService {
  constructor(private readonly prisma: PrismaService) {}

  async listCustomers() {
    const rows = await this.prisma.finCustomer.findMany({
      orderBy: { name: 'asc' },
    });
    return { items: rows.map((row) => this.mapCustomer(row)) };
  }

  async createCustomer(dto: CreateCustomerDto) {
    const row = await this.prisma.finCustomer.create({
      data: {
        name: dto.name.trim(),
        creditLimit: dto.creditLimit,
        creditTermsDays: dto.creditTermsDays ?? 30,
        active: dto.active ?? true,
      },
    });
    return this.mapCustomer(row);
  }

  async updateCustomer(id: string, dto: UpdateCustomerDto) {
    await this.requireCustomer(id);
    const row = await this.prisma.finCustomer.update({
      where: { id },
      data: {
        name: dto.name?.trim(),
        creditLimit: dto.creditLimit,
        creditTermsDays: dto.creditTermsDays,
        active: dto.active,
      },
    });
    return this.mapCustomer(row);
  }

  async listInvoices(status?: string, customerId?: string) {
    const rows = await this.prisma.finInvoice.findMany({
      where: {
        status: status || undefined,
        customerId: customerId || undefined,
      },
      orderBy: { businessDate: 'desc' },
      take: 200,
      include: {
        customer: { select: { id: true, name: true } },
        receipts: true,
      },
    });
    return { items: rows.map((row) => this.mapInvoice(row)) };
  }

  async getInvoice(id: string) {
    const row = await this.prisma.finInvoice.findUnique({
      where: { id },
      include: {
        customer: { select: { id: true, name: true } },
        receipts: true,
      },
    });
    if (!row) throw new NotFoundException('Invoice not found');
    return this.mapInvoice(row);
  }

  async createInvoice(dto: CreateInvoiceDto) {
    const customer = await this.requireCustomer(dto.customerId);
    if (!customer.active) {
      throw new BadRequestException('Customer is inactive');
    }
    const expected = money(dto.net + dto.outputVat);
    const gross = dto.gross === undefined ? expected : money(dto.gross);
    if (Math.abs(gross - expected) > 0.02) {
      throw new BadRequestException('gross must equal net + outputVat');
    }
    try {
      const row = await this.prisma.finInvoice.create({
        data: {
          invoiceNo: dto.invoiceNo.trim(),
          customerId: dto.customerId,
          branchId: dto.branchId,
          businessDate: dto.businessDate,
          status: 'draft',
          net: money(dto.net),
          outputVat: money(dto.outputVat),
          gross,
        },
        include: {
          customer: { select: { id: true, name: true } },
          receipts: true,
        },
      });
      return this.mapInvoice(row);
    } catch (error) {
      rethrowUnique(error, 'Invoice number already exists');
    }
  }

  async postInvoice(id: string) {
    const row = await this.prisma.finInvoice.findUnique({ where: { id } });
    if (!row) throw new NotFoundException('Invoice not found');
    if (row.status !== 'draft') {
      throw new BadRequestException(`Cannot post from status ${row.status}`);
    }
    const updated = await this.prisma.finInvoice.update({
      where: { id },
      data: { status: 'posted' },
      include: {
        customer: { select: { id: true, name: true } },
        receipts: true,
      },
    });
    return this.mapInvoice(updated);
  }

  async voidInvoice(id: string) {
    const row = await this.prisma.finInvoice.findUnique({ where: { id } });
    if (!row) throw new NotFoundException('Invoice not found');
    if (row.status === 'paid' || row.status === 'void') {
      throw new BadRequestException(`Cannot void from status ${row.status}`);
    }
    const updated = await this.prisma.finInvoice.update({
      where: { id },
      data: { status: 'void' },
      include: {
        customer: { select: { id: true, name: true } },
        receipts: true,
      },
    });
    return this.mapInvoice(updated);
  }

  async listReceipts(invoiceId?: string, confirmationStatus?: string) {
    const rows = await this.prisma.finReceipt.findMany({
      where: {
        invoiceId: invoiceId || undefined,
        confirmationStatus: confirmationStatus || undefined,
      },
      orderBy: { createdAt: 'desc' },
      take: 200,
    });
    return { items: rows.map((row) => this.mapReceipt(row)) };
  }

  async createReceipt(dto: CreateReceiptDto) {
    const invoice = await this.prisma.finInvoice.findUnique({
      where: { id: dto.invoiceId },
    });
    if (!invoice) throw new NotFoundException('Invoice not found');
    if (!OPEN_INVOICE.includes(invoice.status as (typeof OPEN_INVOICE)[number])) {
      throw new BadRequestException(
        `Receipts require a posted or partial invoice (status ${invoice.status})`,
      );
    }
    const row = await this.prisma.finReceipt.create({
      data: {
        invoiceId: dto.invoiceId,
        method: dto.method ?? 'cash',
        amount: money(dto.amount),
        confirmationStatus: 'pending',
        batchId: dto.batchId,
        shiftId: dto.shiftId,
      },
    });
    return this.mapReceipt(row);
  }

  async confirmReceipt(id: string, dto: ConfirmReceiptDto = {}) {
    const row = await this.prisma.finReceipt.findUnique({ where: { id } });
    if (!row) throw new NotFoundException('Receipt not found');
    if (row.confirmationStatus !== 'pending') {
      throw new BadRequestException(
        `Cannot confirm from status ${row.confirmationStatus}`,
      );
    }
    const confirmedAmount = money(dto.confirmedAmount ?? row.amount);
    if (confirmedAmount <= 0) {
      throw new BadRequestException('Confirmed amount must be positive');
    }
    if (confirmedAmount - money(row.amount) > 0.001) {
      throw new BadRequestException(
        'Confirmed amount cannot exceed receipt amount',
      );
    }
    const updated = await this.prisma.$transaction(async (tx) => {
      const receipt = await tx.finReceipt.update({
        where: { id },
        data: { confirmationStatus: 'confirmed', confirmedAmount },
      });
      await this.refreshInvoiceStatus(tx, row.invoiceId);
      return receipt;
    });
    return this.mapReceipt(updated);
  }

  async rejectReceipt(id: string) {
    const row = await this.prisma.finReceipt.findUnique({ where: { id } });
    if (!row) throw new NotFoundException('Receipt not found');
    if (row.confirmationStatus !== 'pending') {
      throw new BadRequestException(
        `Cannot reject from status ${row.confirmationStatus}`,
      );
    }
    const updated = await this.prisma.finReceipt.update({
      where: { id },
      data: { confirmationStatus: 'rejected' },
    });
    return this.mapReceipt(updated);
  }

  private async refreshInvoiceStatus(
    tx: Prisma.TransactionClient,
    invoiceId: string,
  ) {
    const invoice = await tx.finInvoice.findUnique({
      where: { id: invoiceId },
      include: { receipts: true },
    });
    if (!invoice || invoice.status === 'void' || invoice.status === 'draft') {
      return;
    }
    const paid = invoice.receipts
      .filter((receipt) => receipt.confirmationStatus === 'confirmed')
      .reduce(
        (sum, receipt) => sum + money(receipt.confirmedAmount ?? receipt.amount),
        0,
      );
    let status = 'posted';
    if (paid > 0 && money(paid) + 0.001 >= money(invoice.gross)) status = 'paid';
    else if (paid > 0) status = 'partial';
    await tx.finInvoice.update({ where: { id: invoiceId }, data: { status } });
  }

  private async requireCustomer(id: string) {
    const row = await this.prisma.finCustomer.findUnique({ where: { id } });
    if (!row) throw new NotFoundException('Customer not found');
    return row;
  }

  private mapCustomer(row: {
    id: string;
    name: string;
    creditLimit: { toString(): string } | number | null;
    creditTermsDays: number;
    active: boolean;
    createdAt: Date;
    updatedAt: Date;
  }) {
    return {
      id: row.id,
      name: row.name,
      creditLimit: row.creditLimit == null ? null : money(row.creditLimit),
      creditTermsDays: row.creditTermsDays,
      active: row.active,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    };
  }

  private mapReceipt(row: {
    id: string;
    invoiceId: string;
    method: string;
    amount: { toString(): string } | number;
    confirmationStatus: string;
    confirmedAmount: { toString(): string } | number | null;
    batchId: string | null;
    shiftId: string | null;
    createdAt: Date;
    updatedAt: Date;
  }) {
    return {
      id: row.id,
      invoiceId: row.invoiceId,
      method: row.method,
      amount: money(row.amount),
      confirmationStatus: row.confirmationStatus,
      confirmedAmount:
        row.confirmedAmount == null ? null : money(row.confirmedAmount),
      batchId: row.batchId,
      shiftId: row.shiftId,
      createdAt: iso(row.createdAt),
      updatedAt: iso(row.updatedAt),
    };
  }

  private mapInvoice(row: {
    id: string;
    invoiceNo: string;
    customerId: string;
    branchId: string | null;
    businessDate: string;
    status: string;
    net: { toString(): string } | number;
    outputVat: { toString(): string } | number;
    gross: { toString(): string } | number;
    createdAt: Date;
    updatedAt: Date;
    customer?: { id: string; name: string };
    receipts: {
      id: string;
      invoiceId: string;
      method: string;
      amount: { toString(): string } | number;
      confirmationStatus: string;
      confirmedAmount: { toString(): string } | number | null;
      batchId: string | null;
      shiftId: string | null;
      createdAt: Date;
      updatedAt: Date;
    }[];
  }) {
    const receipts = row.receipts.map((receipt) => this.mapReceipt(receipt));
    const confirmed = money(
      receipts
        .filter((receipt) => receipt.confirmationStatus === 'confirmed')
        .reduce(
          (sum, receipt) => sum + (receipt.confirmedAmount ?? receipt.amount),
          0,
        ),
    );
    const gross = money(row.gross);
    return {
      id: row.id,
      invoiceNo: row.invoiceNo,
      customerId: row.customerId,
      customerName: row.customer?.name,
      branchId: row.branchId,
      businessDate: row.businessDate,
      status: row.status,
      net: money(row.net),
      outputVat: money(row.outputVat),
      gross,
      confirmed,
      outstanding: money(Math.max(0, gross - confirmed)),
      receipts,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    };
  }
}
