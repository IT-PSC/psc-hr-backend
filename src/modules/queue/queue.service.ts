import { InjectQueue } from '@nestjs/bullmq';
import { Injectable } from '@nestjs/common';
import { Queue } from 'bullmq';
import {
  QUEUE_EXPORTS,
  QUEUE_PUNCH_REMINDERS,
  QUEUE_TELEGRAM,
} from './queue.constants';

@Injectable()
export class QueueService {
  constructor(
    @InjectQueue(QUEUE_PUNCH_REMINDERS) private readonly punchQ: Queue,
    @InjectQueue(QUEUE_TELEGRAM) private readonly telegramQ: Queue,
    @InjectQueue(QUEUE_EXPORTS) private readonly exportsQ: Queue,
  ) {}

  enqueuePunchReminder(employeeId: string, kind: 'check_in' | 'check_out') {
    return this.punchQ.add('remind', { employeeId, kind }, { removeOnComplete: 100 });
  }

  enqueueTelegram(message: string, chatId?: string, messageKm?: string) {
    return this.telegramQ.add(
      'send',
      { message, chatId, messageKm },
      { removeOnComplete: 100 },
    );
  }

  enqueueExport(
    type: string,
    requestedBy: string,
    filters?: Record<string, unknown>,
  ) {
    return this.exportsQ.add(
      'export',
      { type, requestedBy, filters },
      { removeOnComplete: 50 },
    );
  }
}
