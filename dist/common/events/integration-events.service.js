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
var IntegrationEventsService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.IntegrationEventsService = exports.EVENT_AP_DOCUMENT_APPROVED = exports.EVENT_PAYROLL_PSC_APPROVED = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
exports.EVENT_PAYROLL_PSC_APPROVED = 'payroll.psc.approved';
exports.EVENT_AP_DOCUMENT_APPROVED = 'ap.document.approved';
let IntegrationEventsService = IntegrationEventsService_1 = class IntegrationEventsService {
    prisma;
    logger = new common_1.Logger(IntegrationEventsService_1.name);
    constructor(prisma) {
        this.prisma = prisma;
    }
    async emit(eventId, type, sourceId, payload) {
        const existing = await this.prisma.integrationEvent.findUnique({
            where: { eventId },
        });
        if (existing) {
            this.logger.log(`Idempotent skip eventId=${eventId} type=${type}`);
            return existing;
        }
        return this.prisma.integrationEvent.create({
            data: { eventId, type, sourceId, payload, status: 'pending' },
        });
    }
    async markProcessed(eventId) {
        return this.prisma.integrationEvent.update({
            where: { eventId },
            data: { status: 'processed', processedAt: new Date(), error: null },
        });
    }
    async markFailed(eventId, error) {
        return this.prisma.integrationEvent.update({
            where: { eventId },
            data: { status: 'failed', error },
        });
    }
};
exports.IntegrationEventsService = IntegrationEventsService;
exports.IntegrationEventsService = IntegrationEventsService = IntegrationEventsService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], IntegrationEventsService);
//# sourceMappingURL=integration-events.service.js.map