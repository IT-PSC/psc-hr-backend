import { Body, Controller, Get, Param, Post, Put, Query } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { RequirePermission } from '../../common/decorators/roles.decorator';
import type { JwtPayload } from '../../common/roles/types';
import {
  CreatePayrollRunDto,
  DecisionNoteDto,
  ReplacePayrollLinesDto,
} from './dto/payroll.dto';
import { PayrollPscService } from './payroll-psc.service';

@ApiTags('Payroll')
@ApiBearerAuth()
@Controller('payroll-psc')
export class PayrollPscController {
  constructor(private readonly payroll: PayrollPscService) {}

  @Get('runs')
  @RequirePermission('payroll', 'view')
  @ApiOperation({ summary: 'List PSC payroll runs (optional ?status=)' })
  runs(@Query('status') status?: string) {
    return this.payroll.runs(status);
  }

  @Get('runs/:id')
  @RequirePermission('payroll', 'view')
  @ApiOperation({ summary: 'Get payroll run with lines' })
  getOne(@Param('id') id: string) {
    return this.payroll.getRun(id);
  }

  @Post('runs')
  @RequirePermission('payroll', 'create')
  @ApiOperation({ summary: 'Create draft payroll run (optional lines)' })
  @ApiResponse({ status: 201 })
  create(@Body() dto: CreatePayrollRunDto) {
    return this.payroll.createDraft(dto);
  }

  @Put('runs/:id/lines')
  @RequirePermission('payroll', 'edit')
  @ApiOperation({ summary: 'Replace payroll lines (draft/returned only)' })
  replaceLines(@Param('id') id: string, @Body() dto: ReplacePayrollLinesDto) {
    return this.payroll.replaceLines(id, dto.lines);
  }

  @Post('runs/:id/submit')
  @RequirePermission('payroll', 'edit')
  @ApiOperation({ summary: 'Submit draft → awaiting_md_approval' })
  submit(@Param('id') id: string) {
    return this.payroll.submit(id);
  }

  @Post('runs/:id/return')
  @RequirePermission('payroll', 'approve')
  @ApiOperation({ summary: 'Return awaiting run for edits' })
  returnRun(@Param('id') id: string, @Body() dto: DecisionNoteDto) {
    return this.payroll.returnRun(id, dto.note);
  }

  @Post('runs/:id/approve-md')
  @RequirePermission('payroll', 'approve')
  @ApiOperation({
    summary:
      'MD-approve → emit payroll.psc.approved → Finance draft posting',
  })
  approveMd(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.payroll.approveMd(id, user.employeeId ?? user.sub);
  }

  @Post('runs/:id/mark-paid')
  @RequirePermission('payroll', 'edit')
  @ApiOperation({ summary: 'Mark md_approved run as paid' })
  markPaid(@Param('id') id: string) {
    return this.payroll.markPaid(id);
  }
}
