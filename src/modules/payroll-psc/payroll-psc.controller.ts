import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiTags,
  ApiResponse,
} from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { RequirePermission } from '../../common/decorators/roles.decorator';
import type { JwtPayload } from '../../common/roles/types';
import { CreatePayrollRunDto } from './dto/payroll.dto';
import { PayrollPscService } from './payroll-psc.service';

@ApiTags('PayrollPSC')
@ApiBearerAuth()
@Controller('payroll-psc')
export class PayrollPscController {
  constructor(private readonly payroll: PayrollPscService) {}

  @Get('runs')
  @RequirePermission('payroll', 'view')
  @ApiOperation({ summary: 'List PSC payroll runs' })
  runs() {
    return this.payroll.runs();
  }

  @Post('runs')
  @RequirePermission('payroll', 'create')
  @ApiOperation({ summary: 'Create draft payroll run' })
  @ApiResponse({ status: 201 })
  create(@Body() dto: CreatePayrollRunDto) {
    return this.payroll.createDraft(dto.periodYm, dto.totalAmount);
  }

  @Post('runs/:id/approve-md')
  @RequirePermission('payroll', 'approve')
  @ApiOperation({
    summary: 'MD-approve run → emit payroll.psc.approved → Finance draft posting',
  })
  approveMd(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.payroll.approveMd(id, user.sub);
  }
}
