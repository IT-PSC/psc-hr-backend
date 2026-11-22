import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Prisma } from '@prisma/client';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { RequirePermission } from '../../common/decorators/roles.decorator';
import type { JwtPayload } from '../../common/roles/types';
import { AttendanceQueryDto, PunchMetaDto } from './dto/attendance.dto';
import {
  CreateAttendanceCorrectionDto,
  CreateShiftSwapDto,
} from './dto/attendance-ops.dto';
import { TimeService } from './time.service';

@ApiTags('Attendance')
@ApiBearerAuth()
@Controller('time')
export class TimeController {
  constructor(private readonly time: TimeService) {}

  @Get('attendance')
  @RequirePermission('attendance', 'view')
  @ApiOperation({ summary: 'List attendance days (scoped)' })
  list(
    @CurrentUser() user: JwtPayload,
    @Query() query: AttendanceQueryDto,
  ) {
    return this.time.list(user, query);
  }

  @Get('attendance/today')
  @RequirePermission('attendance', 'view')
  @ApiOperation({
    summary: "Today's attendance (persisted, Asia/Phnom_Penh)",
  })
  today(@CurrentUser() user: JwtPayload) {
    return this.time.today(user);
  }

  @Get('attendance/:id')
  @RequirePermission('attendance', 'view')
  @ApiOperation({ summary: 'Get attendance day by id' })
  getOne(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.time.getOne(id, user);
  }

  @Post('attendance/check-in')
  @RequirePermission('attendance', 'create')
  @ApiOperation({ summary: 'Check in (persisted)' })
  checkIn(@CurrentUser() user: JwtPayload, @Body() body: PunchMetaDto) {
    return this.time.checkIn(
      user,
      body.meta as Prisma.InputJsonValue | undefined,
    );
  }

  @Post('attendance/check-out')
  @RequirePermission('attendance', 'create')
  @ApiOperation({ summary: 'Check out (persisted)' })
  checkOut(@CurrentUser() user: JwtPayload, @Body() body: PunchMetaDto) {
    return this.time.checkOut(
      user,
      body.meta as Prisma.InputJsonValue | undefined,
    );
  }

  @Get('reconcile')
  @RequirePermission('attendance', 'view')
  @ApiOperation({
    summary: 'Attendance days with employee name and late flags',
  })
  reconcile(
    @CurrentUser() user: JwtPayload,
    @Query() query: AttendanceQueryDto,
  ) {
    return this.time.reconcile(user, query);
  }

  @Get('corrections')
  @RequirePermission('attendance', 'view')
  @ApiOperation({ summary: 'List attendance corrections (scoped)' })
  corrections(
    @CurrentUser() user: JwtPayload,
    @Query('status') status?: string,
  ) {
    return this.time.listCorrections(user, status);
  }

  @Post('corrections')
  @RequirePermission('attendance', 'create')
  @ApiOperation({
    summary: 'Submit an attendance correction and open an approval',
  })
  createCorrection(
    @Body() dto: CreateAttendanceCorrectionDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.time.createCorrection(dto, user);
  }

  @Post('corrections/:id/cancel')
  @RequirePermission('attendance', 'create')
  @ApiOperation({ summary: 'Cancel a pending attendance correction' })
  cancelCorrection(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.time.cancelCorrection(id, user);
  }

  @Get('shift-swaps')
  @RequirePermission('attendance', 'view')
  @ApiOperation({ summary: 'List shift swap requests (scoped)' })
  shiftSwaps(
    @CurrentUser() user: JwtPayload,
    @Query('status') status?: string,
  ) {
    return this.time.listShiftSwaps(user, status);
  }

  @Post('shift-swaps')
  @RequirePermission('attendance', 'create')
  @ApiOperation({ summary: 'Submit a shift swap and open an approval' })
  createShiftSwap(
    @Body() dto: CreateShiftSwapDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.time.createShiftSwap(dto, user);
  }

  @Post('shift-swaps/:id/cancel')
  @RequirePermission('attendance', 'create')
  @ApiOperation({ summary: 'Cancel a pending shift swap' })
  cancelShiftSwap(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.time.cancelShiftSwap(id, user);
  }
}
