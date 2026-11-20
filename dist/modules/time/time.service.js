"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TimeService = void 0;
const common_1 = require("@nestjs/common");
let TimeService = class TimeService {
    store = new Map();
    todayKey(employeeId) {
        const date = new Intl.DateTimeFormat('en-CA', {
            timeZone: 'Asia/Phnom_Penh',
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
        }).format(new Date());
        return { key: `${employeeId}:${date}`, date };
    }
    nowIsoPhnomPenh() {
        return new Date().toISOString();
    }
    today(employeeId) {
        const { key, date } = this.todayKey(employeeId);
        const existing = this.store.get(key);
        if (existing)
            return existing;
        return {
            employeeId,
            date,
            checkIn: null,
            checkOut: null,
            timezone: 'Asia/Phnom_Penh',
        };
    }
    checkIn(employeeId) {
        const { key, date } = this.todayKey(employeeId);
        const existing = this.store.get(key);
        if (existing?.checkIn) {
            throw new common_1.BadRequestException('Already checked in today');
        }
        const record = {
            employeeId,
            date,
            checkIn: this.nowIsoPhnomPenh(),
            checkOut: null,
            timezone: 'Asia/Phnom_Penh',
        };
        this.store.set(key, record);
        return record;
    }
    checkOut(employeeId) {
        const { key, date } = this.todayKey(employeeId);
        const existing = this.store.get(key);
        if (!existing?.checkIn) {
            throw new common_1.BadRequestException('Must check in before check out');
        }
        if (existing.checkOut) {
            throw new common_1.BadRequestException('Already checked out today');
        }
        const record = {
            ...existing,
            date,
            checkOut: this.nowIsoPhnomPenh(),
        };
        this.store.set(key, record);
        return record;
    }
};
exports.TimeService = TimeService;
exports.TimeService = TimeService = __decorate([
    (0, common_1.Injectable)()
], TimeService);
//# sourceMappingURL=time.service.js.map