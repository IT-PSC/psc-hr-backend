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
var FinanceBridgeService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.FinanceBridgeService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../common/prisma/prisma.service");
const integration_events_service_1 = require("../../common/events/integration-events.service");
let FinanceBridgeService = FinanceBridgeService_1 = class FinanceBridgeService {
    prisma;
    events;
    logger = new common_1.Logger(FinanceBridgeService_1.name);
    constructor(prisma, events) {
        this.prisma = prisma;
        this.events = events;
    }
    async handlePayrollApproved(eventId, data) {
        try {
            await this.prisma.finPayrollPosting.upsert({
                where: { eventId },
                create: {
                    eventId,
                    payrollRunId: data.payrollRunId,
                    amount: data.amount,
                    currency: data.currency,
                    status: 'draft',
                },
                update: {},
            });
            await this.events.markProcessed(eventId);
            this.logger.log(`FinPayrollPosting draft for ${data.payrollRunId}`);
        }
        catch (e) {
            const msg = e instanceof Error ? e.message : String(e);
            await this.events.markFailed(eventId, msg);
            throw e;
        }
    }
    async handleApApproved(eventId, data) {
        try {
            await this.prisma.finApPaymentProposal.upsert({
                where: { eventId },
                create: {
                    eventId,
                    apDocumentId: data.apDocumentId,
                    amount: data.amount,
                    currency: data.currency,
                    status: 'draft',
                },
                update: {},
            });
            await this.events.markProcessed(eventId);
            this.logger.log(`FinApPaymentProposal draft for ${data.apDocumentId}`);
        }
        catch (e) {
            const msg = e instanceof Error ? e.message : String(e);
            await this.events.markFailed(eventId, msg);
            throw e;
        }
    }
};
exports.FinanceBridgeService = FinanceBridgeService;
exports.FinanceBridgeService = FinanceBridgeService = FinanceBridgeService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        integration_events_service_1.IntegrationEventsService])
], FinanceBridgeService);
//# sourceMappingURL=finance-bridge.service.js.map