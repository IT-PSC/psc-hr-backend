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
Object.defineProperty(exports, "__esModule", { value: true });
exports.PayrollPscService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../common/prisma/prisma.service");
const integration_events_service_1 = require("../../common/events/integration-events.service");
const finance_bridge_service_1 = require("../finance/finance-bridge.service");
let PayrollPscService = class PayrollPscService {
    prisma;
    events;
    financeBridge;
    constructor(prisma, events, financeBridge) {
        this.prisma = prisma;
        this.events = events;
        this.financeBridge = financeBridge;
    }
    runs() {
        return this.prisma.pscPayrollRun.findMany({
            orderBy: { createdAt: 'desc' },
            take: 50,
        });
    }
    async createDraft(periodYm, totalAmount) {
        return this.prisma.pscPayrollRun.create({
            data: {
                periodYm,
                totalAmount,
                status: 'draft',
                currency: 'USD',
            },
        });
    }
    async approveMd(runId, actorId) {
        const run = await this.prisma.pscPayrollRun.findUnique({
            where: { id: runId },
        });
        if (!run)
            throw new common_1.NotFoundException('Payroll run not found');
        if (run.status === 'md_approved' || run.status === 'paid') {
            throw new common_1.BadRequestException(`Run already ${run.status}`);
        }
        const updated = await this.prisma.pscPayrollRun.update({
            where: { id: runId },
            data: { status: 'md_approved', approvedAt: new Date() },
        });
        const eventId = `payroll.psc.approved:${runId}`;
        const event = await this.events.emit(eventId, integration_events_service_1.EVENT_PAYROLL_PSC_APPROVED, runId, {
            payrollRunId: runId,
            periodYm: run.periodYm,
            amount: Number(run.totalAmount),
            currency: run.currency,
            actorId: actorId ?? null,
        });
        await this.financeBridge.handlePayrollApproved(event.eventId, {
            payrollRunId: runId,
            amount: Number(run.totalAmount),
            currency: run.currency,
        });
        return { run: updated, eventId };
    }
};
exports.PayrollPscService = PayrollPscService;
exports.PayrollPscService = PayrollPscService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        integration_events_service_1.IntegrationEventsService,
        finance_bridge_service_1.FinanceBridgeService])
], PayrollPscService);
//# sourceMappingURL=payroll-psc.service.js.map