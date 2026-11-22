import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { RequirePermission } from '../../common/decorators/roles.decorator';
import type { JwtPayload } from '../../common/roles/types';
import {
  CreateAnnouncementDto,
  UpdateAnnouncementDto,
} from './dto/announcement.dto';
import { AnnouncementsService } from './announcements.service';

@ApiTags('Workplace')
@ApiBearerAuth()
@Controller('announcements')
export class AnnouncementsController {
  constructor(private readonly announcements: AnnouncementsService) {}

  @Get()
  @RequirePermission('announcements', 'view')
  @ApiOperation({ summary: 'List announcements' })
  list(@CurrentUser() user: JwtPayload) {
    return this.announcements.list(user);
  }

  @Post()
  @RequirePermission('announcements', 'create')
  @ApiOperation({ summary: 'Create announcement' })
  create(
    @Body() dto: CreateAnnouncementDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.announcements.create(dto, user);
  }

  @Patch(':id')
  @RequirePermission('announcements', 'edit')
  @ApiOperation({ summary: 'Update announcement' })
  update(
    @Param('id') id: string,
    @Body() dto: UpdateAnnouncementDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.announcements.update(id, dto, user);
  }
}
