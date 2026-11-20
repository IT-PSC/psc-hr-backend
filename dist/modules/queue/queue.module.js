"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var QueueModule_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.QueueModule = void 0;
const bullmq_1 = require("@nestjs/bullmq");
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const exports_processor_1 = require("../../workers/processors/exports.processor");
const punch_reminders_processor_1 = require("../../workers/processors/punch-reminders.processor");
const telegram_processor_1 = require("../../workers/processors/telegram.processor");
const queue_constants_1 = require("./queue.constants");
const queue_controller_1 = require("./queue.controller");
const queue_service_1 = require("./queue.service");
let QueueModule = QueueModule_1 = class QueueModule {
    static register() {
        const enabled = (process.env.REDIS_ENABLED ?? 'true').toLowerCase() !== 'false';
        if (!enabled) {
            return {
                module: QueueModule_1,
                providers: [
                    {
                        provide: queue_service_1.QueueService,
                        useValue: {
                            enqueuePunchReminder: async () => ({ id: 'redis-disabled' }),
                            enqueueTelegram: async () => ({ id: 'redis-disabled' }),
                            enqueueExport: async () => ({ id: 'redis-disabled' }),
                        },
                    },
                ],
                controllers: [queue_controller_1.QueueController],
                exports: [queue_service_1.QueueService],
            };
        }
        return {
            module: QueueModule_1,
            imports: [
                bullmq_1.BullModule.forRootAsync({
                    imports: [config_1.ConfigModule],
                    inject: [config_1.ConfigService],
                    useFactory: (config) => ({
                        connection: {
                            host: config.get('REDIS_HOST') ?? '127.0.0.1',
                            port: Number(config.get('REDIS_PORT') ?? 6379),
                            password: config.get('REDIS_PASSWORD') || undefined,
                            maxRetriesPerRequest: null,
                        },
                    }),
                }),
                bullmq_1.BullModule.registerQueue({ name: queue_constants_1.QUEUE_PUNCH_REMINDERS }, { name: queue_constants_1.QUEUE_TELEGRAM }, { name: queue_constants_1.QUEUE_EXPORTS }),
            ],
            controllers: [queue_controller_1.QueueController],
            providers: [
                queue_service_1.QueueService,
                punch_reminders_processor_1.PunchRemindersProcessor,
                telegram_processor_1.TelegramProcessor,
                exports_processor_1.ExportsProcessor,
            ],
            exports: [queue_service_1.QueueService],
        };
    }
};
exports.QueueModule = QueueModule;
exports.QueueModule = QueueModule = QueueModule_1 = __decorate([
    (0, common_1.Module)({})
], QueueModule);
//# sourceMappingURL=queue.module.js.map