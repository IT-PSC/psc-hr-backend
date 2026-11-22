import { Body, Controller, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { RequirePermission } from '../../common/decorators/roles.decorator';
import {
  ConfirmReceiptDto,
  CreateCustomerDto,
  CreateInvoiceDto,
  CreateReceiptDto,
  UpdateCustomerDto,
} from './dto/ar.dto';
import { ArService } from './ar.service';

@ApiTags('Finance')
@ApiBearerAuth()
@Controller('finance/customers')
export class ArCustomersController {
  constructor(private readonly ar: ArService) {}

  @Get()
  @RequirePermission('finance_ar', 'view')
  @ApiOperation({ summary: 'List AR customers' })
  list() {
    return this.ar.listCustomers();
  }

  @Post()
  @RequirePermission('finance_ar', 'create')
  @ApiOperation({ summary: 'Create AR customer' })
  create(@Body() dto: CreateCustomerDto) {
    return this.ar.createCustomer(dto);
  }

  @Patch(':id')
  @RequirePermission('finance_ar', 'edit')
  @ApiOperation({ summary: 'Update AR customer' })
  update(@Param('id') id: string, @Body() dto: UpdateCustomerDto) {
    return this.ar.updateCustomer(id, dto);
  }
}

@ApiTags('Finance')
@ApiBearerAuth()
@Controller('finance/invoices')
export class ArInvoicesController {
  constructor(private readonly ar: ArService) {}

  @Get()
  @RequirePermission('finance_ar', 'view')
  @ApiOperation({ summary: 'List invoices' })
  list(
    @Query('status') status?: string,
    @Query('customerId') customerId?: string,
  ) {
    return this.ar.listInvoices(status, customerId);
  }

  @Get(':id')
  @RequirePermission('finance_ar', 'view')
  @ApiOperation({ summary: 'Get invoice with receipts' })
  getOne(@Param('id') id: string) {
    return this.ar.getInvoice(id);
  }

  @Post()
  @RequirePermission('finance_ar', 'create')
  @ApiOperation({ summary: 'Create draft invoice' })
  create(@Body() dto: CreateInvoiceDto) {
    return this.ar.createInvoice(dto);
  }

  @Post(':id/post')
  @RequirePermission('finance_ar', 'approve')
  @ApiOperation({ summary: 'Post draft invoice' })
  post(@Param('id') id: string) {
    return this.ar.postInvoice(id);
  }

  @Post(':id/void')
  @RequirePermission('finance_ar', 'edit')
  @ApiOperation({ summary: 'Void draft, posted, or partial invoice' })
  voidInvoice(@Param('id') id: string) {
    return this.ar.voidInvoice(id);
  }
}

@ApiTags('Finance')
@ApiBearerAuth()
@Controller('finance/receipts')
export class ArReceiptsController {
  constructor(private readonly ar: ArService) {}

  @Get()
  @RequirePermission('finance_ar', 'view')
  @ApiOperation({ summary: 'List receipts' })
  list(
    @Query('invoiceId') invoiceId?: string,
    @Query('confirmationStatus') confirmationStatus?: string,
  ) {
    return this.ar.listReceipts(invoiceId, confirmationStatus);
  }

  @Post()
  @RequirePermission('finance_ar', 'create')
  @ApiOperation({ summary: 'Record a pending receipt against a posted invoice' })
  create(@Body() dto: CreateReceiptDto) {
    return this.ar.createReceipt(dto);
  }

  @Post(':id/confirm')
  @RequirePermission('finance_ar', 'approve')
  @ApiOperation({ summary: 'Confirm receipt and refresh invoice balance' })
  confirm(@Param('id') id: string, @Body() dto: ConfirmReceiptDto) {
    return this.ar.confirmReceipt(id, dto);
  }

  @Post(':id/reject')
  @RequirePermission('finance_ar', 'edit')
  @ApiOperation({ summary: 'Reject a pending receipt' })
  reject(@Param('id') id: string) {
    return this.ar.rejectReceipt(id);
  }
}
