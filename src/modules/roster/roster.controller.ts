import { Body, Controller, Get, Param, Post, Put } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { RequirePermission } from '../../common/decorators/roles.decorator';
import type { JwtPayload } from '../../common/roles/types';
import {
  CreateRosterPeriodDto,
  UpsertRosterCellsDto,
  UpsertShiftCodeDto,
} from './dto/roster.dto';
import { RosterService } from './roster.service';

@ApiTags('Roster')
@ApiBearerAuth()
@Controller('roster')
export class RosterController {
  constructor(private readonly roster: RosterService) {}

  @Get('shift-codes')
  @RequirePermission('roster', 'view')
  @ApiOperation({ summary: 'List shift codes' })
  shiftCodes() {
    return this.roster.listShiftCodes();
  }

  @Put('shift-codes')
  @RequirePermission('roster', 'edit')
  @ApiOperation({ summary: 'Create/update shift code' })
  upsertShift(
    @Body() dto: UpsertShiftCodeDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.roster.upsertShiftCode(dto, user);
  }

  @Get('periods')
  @RequirePermission('roster', 'view')
  @ApiOperation({ summary: 'List roster periods' })
  periods(@CurrentUser() user: JwtPayload) {
    return this.roster.listPeriods(user);
  }

  @Get('periods/:id')
  @RequirePermission('roster', 'view')
  @ApiOperation({ summary: 'Get roster period with entries' })
  getPeriod(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.roster.getPeriod(id, user);
  }

  @Post('periods')
  @RequirePermission('roster', 'create')
  @ApiOperation({ summary: 'Create roster period' })
  create(
    @Body() dto: CreateRosterPeriodDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.roster.createPeriod(dto, user);
  }

  @Post('periods/:id/publish')
  @RequirePermission('roster', 'edit')
  @ApiOperation({ summary: 'Publish roster period' })
  publish(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.roster.publish(id, user);
  }

  @Put('periods/:id/cells')
  @RequirePermission('roster', 'edit')
  @ApiOperation({ summary: 'Upsert roster cells' })
  cells(
    @Param('id') id: string,
    @Body() dto: UpsertRosterCellsDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.roster.upsertCells(id, dto, user);
  }
}
