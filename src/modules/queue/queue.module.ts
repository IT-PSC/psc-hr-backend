import { BullModule } from '@nestjs/bullmq';
import { DynamicModule, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ExportsProcessor } from '../../workers/processors/exports.processor';
import { PunchRemindersProcessor } from '../../workers/processors/punch-reminders.processor';
import { TelegramProcessor } from '../../workers/processors/telegram.processor';
import {
  QUEUE_EXPORTS,
  QUEUE_PUNCH_REMINDERS,
  QUEUE_TELEGRAM,
} from './queue.constants';
import { QueueController } from './queue.controller';
import { QueueService } from './queue.service';

@Module({})
export class QueueModule {
  static register(): DynamicModule {
    const enabled = (process.env.REDIS_ENABLED ?? 'true').toLowerCase() !== 'false';
    if (!enabled) {
      return {
        module: QueueModule,
        providers: [
          {
            provide: QueueService,
            useValue: {
              enqueuePunchReminder: async () => ({ id: 'redis-disabled' }),
              enqueueTelegram: async () => ({ id: 'redis-disabled' }),
              enqueueExport: async () => ({ id: 'redis-disabled' }),
            },
          },
        ],
        controllers: [QueueController],
        exports: [QueueService],
      };
    }

    return {
      module: QueueModule,
      imports: [
        BullModule.forRootAsync({
          imports: [ConfigModule],
          inject: [ConfigService],
          useFactory: (config: ConfigService) => ({
            connection: {
              host: config.get<string>('REDIS_HOST') ?? '127.0.0.1',
              port: Number(config.get<string>('REDIS_PORT') ?? 6379),
              password: config.get<string>('REDIS_PASSWORD') || undefined,
              maxRetriesPerRequest: null,
            },
          }),
        }),
        BullModule.registerQueue(
          { name: QUEUE_PUNCH_REMINDERS },
          { name: QUEUE_TELEGRAM },
          { name: QUEUE_EXPORTS },
        ),
      ],
      controllers: [QueueController],
      providers: [
        QueueService,
        PunchRemindersProcessor,
        TelegramProcessor,
        ExportsProcessor,
      ],
      exports: [QueueService],
    };
  }
}
