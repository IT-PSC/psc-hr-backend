import { Controller, Get, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { RequirePermission } from '../../common/decorators/roles.decorator';
import type { JwtPayload } from '../../common/roles/types';
import { TimeService } from './time.service';

@ApiTags('Time')
@ApiBearerAuth()
@Controller('time')
export class TimeController {
  constructor(private readonly time: TimeService) {}

  private employeeId(user: JwtPayload): string {
    return user.employeeId ?? user.sub;
  }

  @Get('attendance/today')
  @RequirePermission('attendance', 'view')
  @ApiOperation({
    summary: "Today's attendance (in-memory stub, Asia/Phnom_Penh)",
  })
  today(@CurrentUser() user: JwtPayload) {
    return this.time.today(this.employeeId(user));
  }

  @Post('attendance/check-in')
  @RequirePermission('attendance', 'create')
  @ApiOperation({ summary: 'Check in (in-memory stub)' })
  checkIn(@CurrentUser() user: JwtPayload) {
    return this.time.checkIn(this.employeeId(user));
  }

  @Post('attendance/check-out')
  @RequirePermission('attendance', 'create')
  @ApiOperation({ summary: 'Check out (in-memory stub)' })
  checkOut(@CurrentUser() user: JwtPayload) {
    return this.time.checkOut(this.employeeId(user));
  }
}
