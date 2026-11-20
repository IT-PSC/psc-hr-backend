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
exports.TimeController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const current_user_decorator_1 = require("../../common/decorators/current-user.decorator");
const roles_decorator_1 = require("../../common/decorators/roles.decorator");
const time_service_1 = require("./time.service");
let TimeController = class TimeController {
    time;
    constructor(time) {
        this.time = time;
    }
    employeeId(user) {
        return user.employeeId ?? user.sub;
    }
    today(user) {
        return this.time.today(this.employeeId(user));
    }
    checkIn(user) {
        return this.time.checkIn(this.employeeId(user));
    }
    checkOut(user) {
        return this.time.checkOut(this.employeeId(user));
    }
};
exports.TimeController = TimeController;
__decorate([
    (0, common_1.Get)('attendance/today'),
    (0, roles_decorator_1.RequirePermission)('attendance', 'view'),
    (0, swagger_1.ApiOperation)({
        summary: "Today's attendance (in-memory stub, Asia/Phnom_Penh)",
    }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], TimeController.prototype, "today", null);
__decorate([
    (0, common_1.Post)('attendance/check-in'),
    (0, roles_decorator_1.RequirePermission)('attendance', 'create'),
    (0, swagger_1.ApiOperation)({ summary: 'Check in (in-memory stub)' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], TimeController.prototype, "checkIn", null);
__decorate([
    (0, common_1.Post)('attendance/check-out'),
    (0, roles_decorator_1.RequirePermission)('attendance', 'create'),
    (0, swagger_1.ApiOperation)({ summary: 'Check out (in-memory stub)' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], TimeController.prototype, "checkOut", null);
exports.TimeController = TimeController = __decorate([
    (0, swagger_1.ApiTags)('Time'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.Controller)('time'),
    __metadata("design:paramtypes", [time_service_1.TimeService])
], TimeController);
//# sourceMappingURL=time.controller.js.map