import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { RequirePermission } from '../../common/decorators/roles.decorator';
import type { JwtPayload } from '../../common/roles/types';
import { EnqueueTelegramDto, TelegramOutboxQueryDto } from './dto/telegram.dto';
import { IntegrationsService } from './integrations.service';

@ApiTags('Integrations')
@ApiBearerAuth()
@Controller('integrations')
export class IntegrationsController {
  constructor(private readonly integrations: IntegrationsService) {}

  @Get()
  @RequirePermission('settings', 'view')
  @ApiOperation({ summary: 'Integrations health, including Telegram outbox counts' })
  health() {
    return this.integrations.health();
  }

  @Get('telegram/connections')
  @RequirePermission('settings', 'manage_settings')
  @ApiOperation({ summary: 'Telegram connection stub list' })
  connections() {
    return this.integrations.connections();
  }

  @Get('telegram/outbox')
  @RequirePermission('settings', 'manage_settings')
  @ApiOperation({ summary: 'Recent Telegram outbox messages' })
  outbox(@Query() query: TelegramOutboxQueryDto) {
    return this.integrations.listOutbox(query);
  }

  @Post('telegram/outbox')
  @RequirePermission('settings', 'manage_settings')
  @ApiOperation({ summary: 'Enqueue a Telegram outbox message' })
  enqueue(@Body() dto: EnqueueTelegramDto, @CurrentUser() user: JwtPayload) {
    return this.integrations.enqueue(dto, user);
  }
}
