"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var TelegramProcessor_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.TelegramProcessor = void 0;
const bullmq_1 = require("@nestjs/bullmq");
const common_1 = require("@nestjs/common");
const queue_constants_1 = require("../../modules/queue/queue.constants");
let TelegramProcessor = TelegramProcessor_1 = class TelegramProcessor extends bullmq_1.WorkerHost {
    logger = new common_1.Logger(TelegramProcessor_1.name);
    async process(job) {
        this.logger.log(`[stub] telegram job=${job.id} chat=${job.data.chatId ?? 'n/a'} msg=${job.data.message.slice(0, 80)}`);
    }
};
exports.TelegramProcessor = TelegramProcessor;
exports.TelegramProcessor = TelegramProcessor = TelegramProcessor_1 = __decorate([
    (0, bullmq_1.Processor)(queue_constants_1.QUEUE_TELEGRAM)
], TelegramProcessor);
//# sourceMappingURL=telegram.processor.js.map