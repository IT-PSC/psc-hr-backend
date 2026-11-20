"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ApprovalsService = void 0;
const common_1 = require("@nestjs/common");
const crypto_1 = require("crypto");
let ApprovalsService = class ApprovalsService {
    items = [];
    list() {
        return { items: this.items };
    }
    submit(input) {
        const item = {
            id: (0, crypto_1.randomUUID)(),
            type: input.type,
            status: 'pending',
            requesterId: input.requesterId,
            summary: input.summary,
            createdAt: new Date().toISOString(),
        };
        this.items.unshift(item);
        return item;
    }
    decide(id, status, note) {
        const item = this.items.find((i) => i.id === id);
        if (!item)
            throw new common_1.NotFoundException('Approval not found');
        item.status = status;
        item.note = note;
        return item;
    }
    approve(id, note) {
        return this.decide(id, 'approved', note);
    }
    reject(id, note) {
        return this.decide(id, 'rejected', note);
    }
    returnForEdit(id, note) {
        return this.decide(id, 'returned', note);
    }
};
exports.ApprovalsService = ApprovalsService;
exports.ApprovalsService = ApprovalsService = __decorate([
    (0, common_1.Injectable)()
], ApprovalsService);
//# sourceMappingURL=approvals.service.js.map