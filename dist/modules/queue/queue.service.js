"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.QueueService = void 0;
const bullmq_1 = require("@nestjs/bullmq");
const common_1 = require("@nestjs/common");
const bullmq_2 = require("bullmq");
const queue_constants_1 = require("./queue.constants");
let QueueService = class QueueService {
    punchQ;
    telegramQ;
    exportsQ;
    constructor(punchQ, telegramQ, exportsQ) {
        this.punchQ = punchQ;
        this.telegramQ = telegramQ;
        this.exportsQ = exportsQ;
    }
    enqueuePunchReminder(employeeId, kind) {
        return this.punchQ.add('remind', { employeeId, kind }, { removeOnComplete: 100 });
    }
    enqueueTelegram(message, chatId, messageKm) {
        return this.telegramQ.add('send', { message, chatId, messageKm }, { removeOnComplete: 100 });
    }
    enqueueExport(type, requestedBy, filters) {
        return this.exportsQ.add('export', { type, requestedBy, filters }, { removeOnComplete: 50 });
    }
};
exports.QueueService = QueueService;
exports.QueueService = QueueService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, bullmq_1.InjectQueue)(queue_constants_1.QUEUE_PUNCH_REMINDERS)),
    __param(1, (0, bullmq_1.InjectQueue)(queue_constants_1.QUEUE_TELEGRAM)),
    __param(2, (0, bullmq_1.InjectQueue)(queue_constants_1.QUEUE_EXPORTS)),
    __metadata("design:paramtypes", [bullmq_2.Queue,
        bullmq_2.Queue,
        bullmq_2.Queue])
], QueueService);
//# sourceMappingURL=queue.service.js.map