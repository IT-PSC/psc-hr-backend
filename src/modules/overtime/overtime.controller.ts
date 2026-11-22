import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { RequirePermission } from '../../common/decorators/roles.decorator';
import type { JwtPayload } from '../../common/roles/types';
import { CreateOvertimeDto, OvertimeListQueryDto } from './dto/overtime.dto';
import { OvertimeService } from './overtime.service';

@ApiTags('Overtime')
@ApiBearerAuth()
@Controller('overtime')
export class OvertimeController {
  constructor(private readonly overtime: OvertimeService) {}

  @Get()
  @RequirePermission('overtime', 'view')
  @ApiOperation({ summary: 'List overtime requests (scoped)' })
  list(@CurrentUser() user: JwtPayload, @Query() query: OvertimeListQueryDto) {
    return this.overtime.list(user, query);
  }

  @Post()
  @RequirePermission('overtime', 'create')
  @ApiOperation({ summary: 'Create overtime request + pending approval' })
  create(@Body() dto: CreateOvertimeDto, @CurrentUser() user: JwtPayload) {
    return this.overtime.create(dto, user);
  }

  @Post(':id/cancel')
  @RequirePermission('overtime', 'view')
  @ApiOperation({ summary: 'Cancel pending overtime request' })
  cancel(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.overtime.cancel(id, user);
  }
}
