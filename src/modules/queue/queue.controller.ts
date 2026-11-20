import { Body, Controller, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { RequirePermission } from '../../common/decorators/roles.decorator';
import type { JwtPayload } from '../../common/roles/types';
import { QueueService } from './queue.service';

@ApiTags('Workers')
@ApiBearerAuth()
@Controller('workers')
export class QueueController {
  constructor(private readonly queues: QueueService) {}

  @Post('punch-reminder')
  @RequirePermission('attendance', 'manage_settings')
  @ApiOperation({ summary: 'Enqueue punch reminder (BullMQ stub)' })
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
  telegram(@Body() body: { message: string; chatId?: string; messageKm?: string }) {
    return this.queues.enqueueTelegram(body.message, body.chatId, body.messageKm);
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
