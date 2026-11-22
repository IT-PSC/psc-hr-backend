import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { RequirePermission } from '../../common/decorators/roles.decorator';
import type { JwtPayload } from '../../common/roles/types';
import { QueueService } from './queue.service';

@ApiTags('Integrations')
@ApiBearerAuth()
@Controller('workers')
export class QueueController {
  constructor(private readonly queues: QueueService) {}

  @Get('jobs')
  @RequirePermission('settings', 'manage_settings')
  @ApiOperation({ summary: 'List recent worker job runs' })
  jobs(@Query('queue') queue?: string) {
    return this.queues.listJobs(queue);
  }

  @Post('punch-reminder')
  @RequirePermission('attendance', 'manage_settings')
  @ApiOperation({ summary: 'Enqueue punch reminder' })
  punch(
    @Body() body: { employeeId: string; kind: 'check_in' | 'check_out' },
  ) {
    return this.queues.enqueuePunchReminder(body.employeeId, body.kind);
  }

  @Post('telegram')
  @RequirePermission('notifications', 'create')
  @ApiOperation({
    summary: 'Enqueue Telegram message (token server-side only)',
  })
  telegram(
    @CurrentUser() user: JwtPayload,
    @Body() body: { message: string; chatId?: string; messageKm?: string },
  ) {
    return this.queues.enqueueTelegram(
      body.message,
      body.chatId,
      body.messageKm,
      user.sub,
    );
  }

  @Post('export')
  @RequirePermission('reports', 'export')
  @ApiOperation({ summary: 'Enqueue report export job' })
  export(
    @CurrentUser() user: JwtPayload,
    @Body() body: { type: string; filters?: Record<string, unknown> },
  ) {
    return this.queues.enqueueExport(body.type, user.sub, body.filters);
  }
}
