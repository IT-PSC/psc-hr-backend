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
exports.AccountsPayableService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../common/prisma/prisma.service");
const integration_events_service_1 = require("../../common/events/integration-events.service");
const finance_bridge_service_1 = require("../finance/finance-bridge.service");
let AccountsPayableService = class AccountsPayableService {
    prisma;
    events;
    financeBridge;
    constructor(prisma, events, financeBridge) {
        this.prisma = prisma;
        this.events = events;
        this.financeBridge = financeBridge;
    }
    requests() {
        return this.prisma.apDocument.findMany({
            orderBy: { createdAt: 'desc' },
            take: 50,
        });
    }
    async createDraft(input) {
        return this.prisma.apDocument.create({
            data: {
                docNumber: input.docNumber,
                supplier: input.supplier,
                amount: input.amount,
                openBalance: input.amount,
                currency: input.currency ?? 'USD',
                status: 'draft',
            },
        });
    }
    async approve(docId, actorId) {
        const doc = await this.prisma.apDocument.findUnique({ where: { id: docId } });
        if (!doc)
            throw new common_1.NotFoundException('A/P document not found');
        if (doc.status === 'approved' || doc.status === 'paid') {
            throw new common_1.BadRequestException(`Document already ${doc.status}`);
        }
        const updated = await this.prisma.apDocument.update({
            where: { id: docId },
            data: { status: 'approved', approvedAt: new Date() },
        });
        if (doc.currency === 'USD' && Number(doc.openBalance) > 0) {
            const eventId = `ap.document.approved:${docId}`;
            const event = await this.events.emit(eventId, integration_events_service_1.EVENT_AP_DOCUMENT_APPROVED, docId, {
                apDocumentId: docId,
                amount: Number(doc.openBalance),
                currency: doc.currency,
                actorId: actorId ?? null,
            });
            await this.financeBridge.handleApApproved(event.eventId, {
                apDocumentId: docId,
                amount: Number(doc.openBalance),
                currency: doc.currency,
            });
            return { document: updated, eventId };
        }
        return { document: updated, eventId: null };
    }
};
exports.AccountsPayableService = AccountsPayableService;
exports.AccountsPayableService = AccountsPayableService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        integration_events_service_1.IntegrationEventsService,
        finance_bridge_service_1.FinanceBridgeService])
], AccountsPayableService);
//# sourceMappingURL=accounts-payable.service.js.map