import { Controller, Get, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { RequirePermission } from '../../common/decorators/roles.decorator';
import { HrMonthlyQueryDto, HrTrendsQueryDto } from './dto/reports.dto';
import { ReportsService } from './reports.service';

@ApiTags('Reports & Compliance')
@ApiBearerAuth()
@Controller('reports')
export class ReportsController {
  constructor(private readonly reports: ReportsService) {}

  @Get('hr-summary')
  @RequirePermission('reports', 'view')
  @ApiOperation({ summary: 'Headcount, leave, attendance, and contract summary' })
  hrSummary() {
    return this.reports.hrSummary();
  }

  @Get('hr-monthly')
  @RequirePermission('reports', 'view')
  @ApiOperation({
    summary: 'Headcount, attendance rate, leave days, hires, and exits for one month',
  })
  hrMonthly(@Query() query: HrMonthlyQueryDto) {
    return this.reports.hrMonthly(query);
  }

  @Get('hr-trends')
  @RequirePermission('reports', 'view')
  @ApiOperation({ summary: 'Monthly HR snapshots for the last N months' })
  hrTrends(@Query() query: HrTrendsQueryDto) {
    return this.reports.hrTrends(query);
  }

  @Get('finance-summary')
  @RequirePermission('finance_reports', 'view')
  @ApiOperation({ summary: 'Finance summary plus journals, AR, tax, and cash ops' })
  financeSummary() {
    return this.reports.financeSummary();
  }
}
