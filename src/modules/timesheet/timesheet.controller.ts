import { Controller, Get, Param, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { RequirePermission } from '../../common/decorators/roles.decorator';
import type { JwtPayload } from '../../common/roles/types';
import { TimesheetService } from './timesheet.service';

@ApiTags('Timesheet')
@ApiBearerAuth()
@Controller('timesheets')
export class TimesheetController {
  constructor(private readonly timesheets: TimesheetService) {}

  @Get()
  @RequirePermission('timesheet', 'view')
  @ApiOperation({ summary: 'Month timesheet summary from attendance' })
  summary(
    @CurrentUser() user: JwtPayload,
    @Query('month') month: string,
  ) {
    const m =
      month ||
      new Date().toISOString().slice(0, 7);
    return this.timesheets.summary(user, m);
  }

  @Post(':month/submit')
  @RequirePermission('timesheet', 'approve')
  @ApiOperation({ summary: 'Submit month timesheet for approval' })
  submit(@Param('month') month: string, @CurrentUser() user: JwtPayload) {
    return this.timesheets.submit(user, month);
  }

  @Post(':month/lock')
  @RequirePermission('timesheet', 'edit')
  @ApiOperation({ summary: 'Lock timesheet month' })
  lock(@Param('month') month: string, @CurrentUser() user: JwtPayload) {
    return this.timesheets.lock(user, month);
  }
}
