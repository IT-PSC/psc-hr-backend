import { Body, Controller, Get, Param, Post, Put, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { RequirePermission } from '../../common/decorators/roles.decorator';
import type { JwtPayload } from '../../common/roles/types';
import { PayslipListQueryDto, UpsertPayslipDto } from './dto/payslip.dto';
import { PayslipsService } from './payslips.service';

@ApiTags('Payroll')
@ApiBearerAuth()
@Controller('payslips')
export class PayslipsController {
  constructor(private readonly payslips: PayslipsService) {}

  @Get()
  @RequirePermission('payslip', 'view')
  @ApiOperation({ summary: 'List payslips' })
  list(
    @CurrentUser() user: JwtPayload,
    @Query() query: PayslipListQueryDto,
  ) {
    return this.payslips.list(user, query);
  }

  @Get(':id')
  @RequirePermission('payslip', 'view')
  @ApiOperation({ summary: 'Get payslip' })
  getOne(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.payslips.getOne(id, user);
  }

  @Put()
  @RequirePermission('payroll', 'edit')
  @ApiOperation({ summary: 'Upsert payslip line' })
  upsert(@Body() dto: UpsertPayslipDto, @CurrentUser() user: JwtPayload) {
    return this.payslips.upsert(dto, user);
  }

  @Post('publish/:month')
  @RequirePermission('payroll', 'edit')
  @ApiOperation({ summary: 'Publish all payslips for month' })
  publish(@Param('month') month: string, @CurrentUser() user: JwtPayload) {
    return this.payslips.publishMonth(month, user);
  }
}
