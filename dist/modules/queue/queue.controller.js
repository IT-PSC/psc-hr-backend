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
exports.QueueController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const current_user_decorator_1 = require("../../common/decorators/current-user.decorator");
const roles_decorator_1 = require("../../common/decorators/roles.decorator");
const queue_service_1 = require("./queue.service");
let QueueController = class QueueController {
    queues;
    constructor(queues) {
        this.queues = queues;
    }
    punch(body) {
        return this.queues.enqueuePunchReminder(body.employeeId, body.kind);
    }
    telegram(body) {
        return this.queues.enqueueTelegram(body.message, body.chatId, body.messageKm);
    }
    export(user, body) {
        return this.queues.enqueueExport(body.type, user.sub, body.filters);
    }
};
exports.QueueController = QueueController;
__decorate([
    (0, common_1.Post)('punch-reminder'),
    (0, roles_decorator_1.RequirePermission)('attendance', 'manage_settings'),
    (0, swagger_1.ApiOperation)({ summary: 'Enqueue punch reminder (BullMQ stub)' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], QueueController.prototype, "punch", null);
__decorate([
    (0, common_1.Post)('telegram'),
    (0, roles_decorator_1.RequirePermission)('notifications', 'create'),
    (0, swagger_1.ApiOperation)({
        summary: 'Enqueue Telegram message (token server-side only)',
    }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], QueueController.prototype, "telegram", null);
__decorate([
    (0, common_1.Post)('export'),
    (0, roles_decorator_1.RequirePermission)('reports', 'export'),
    (0, swagger_1.ApiOperation)({ summary: 'Enqueue report export job' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], QueueController.prototype, "export", null);
exports.QueueController = QueueController = __decorate([
    (0, swagger_1.ApiTags)('Workers'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.Controller)('workers'),
    __metadata("design:paramtypes", [queue_service_1.QueueService])
], QueueController);
//# sourceMappingURL=queue.controller.js.map