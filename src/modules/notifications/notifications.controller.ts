import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { RequirePermission } from '../../common/decorators/roles.decorator';
import type { JwtPayload } from '../../common/roles/types';
import {
  CreateNotificationDto,
  NotificationListQueryDto,
  UpdateNotificationSettingsDto,
} from './dto/notification.dto';
import { NotificationsService } from './notifications.service';

@ApiTags('Notifications')
@ApiBearerAuth()
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notifications: NotificationsService) {}

  @Get()
  @RequirePermission('notifications', 'view')
  @ApiOperation({ summary: 'List my notifications' })
  list(
    @CurrentUser() user: JwtPayload,
    @Query() query: NotificationListQueryDto,
  ) {
    const unreadOnly =
      query.unreadOnly === '1' || query.unreadOnly === 'true';
    return this.notifications.list(user, unreadOnly);
  }

  @Get('unread-count')
  @RequirePermission('notifications', 'view')
  @ApiOperation({ summary: 'Unread notification count' })
  unreadCount(@CurrentUser() user: JwtPayload) {
    return this.notifications.unreadCount(user);
  }

  @Get('settings')
  @RequirePermission('notifications', 'view')
  @ApiOperation({ summary: 'Get my notification preferences' })
  getSettings(@CurrentUser() user: JwtPayload) {
    return this.notifications.getSettings(user);
  }

  @Put('settings')
  @RequirePermission('notifications', 'edit')
  @ApiOperation({ summary: 'Update my notification preferences' })
  updateSettings(
    @CurrentUser() user: JwtPayload,
    @Body() body: UpdateNotificationSettingsDto,
  ) {
    return this.notifications.updateSettings(user, body);
  }

  @Post('mark-all-read')
  @RequirePermission('notifications', 'edit')
  @ApiOperation({ summary: 'Mark all my notifications as read' })
  markAllRead(@CurrentUser() user: JwtPayload) {
    return this.notifications.markAllRead(user);
  }

  @Post()
  @RequirePermission('notifications', 'create')
  @ApiOperation({ summary: 'Create notification for a user (HR)' })
  create(
    @CurrentUser() user: JwtPayload,
    @Body() dto: CreateNotificationDto,
  ) {
    return this.notifications.create(user, dto);
  }

  @Patch(':id/read')
  @RequirePermission('notifications', 'edit')
  @ApiOperation({ summary: 'Mark notification as read' })
  markRead(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.notifications.markRead(id, user);
  }
}
