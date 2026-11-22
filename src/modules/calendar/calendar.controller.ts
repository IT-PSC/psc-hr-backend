import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { RequirePermission } from '../../common/decorators/roles.decorator';
import type { JwtPayload } from '../../common/roles/types';
import { CalendarService } from './calendar.service';
import { CreateBlackoutDto, CreateHolidayDto } from './dto/calendar.dto';

@ApiTags('Team Calendar')
@ApiBearerAuth()
@Controller()
export class CalendarController {
  constructor(private readonly calendar: CalendarService) {}

  @Get('calendar')
  @RequirePermission('team_calendar', 'view')
  @ApiOperation({ summary: 'Composed team calendar events' })
  events(
    @CurrentUser() user: JwtPayload,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    return this.calendar.events(user, from, to);
  }

  @Get('holidays')
  @RequirePermission('team_calendar', 'view')
  @ApiOperation({ summary: 'List public holidays' })
  holidays() {
    return this.calendar.listHolidays();
  }

  @Post('holidays')
  @RequirePermission('leave', 'edit')
  @ApiOperation({ summary: 'Create public holiday' })
  createHoliday(
    @Body() dto: CreateHolidayDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.calendar.createHoliday(dto, user);
  }

  @Delete('holidays/:id')
  @RequirePermission('leave', 'edit')
  @ApiOperation({ summary: 'Delete public holiday' })
  deleteHoliday(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.calendar.deleteHoliday(id, user);
  }

  @Get('leave-blackouts')
  @RequirePermission('leave', 'view')
  @ApiOperation({ summary: 'List leave blackout periods' })
  blackouts() {
    return this.calendar.listBlackouts();
  }

  @Post('leave-blackouts')
  @RequirePermission('leave', 'edit')
  @ApiOperation({ summary: 'Create leave blackout' })
  createBlackout(
    @Body() dto: CreateBlackoutDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.calendar.createBlackout(dto, user);
  }

  @Delete('leave-blackouts/:id')
  @RequirePermission('leave', 'edit')
  @ApiOperation({ summary: 'Delete leave blackout' })
  deleteBlackout(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.calendar.deleteBlackout(id, user);
  }
}
