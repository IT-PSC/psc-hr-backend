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
exports.RecruitmentController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const roles_decorator_1 = require("../../common/decorators/roles.decorator");
const recruitment_service_1 = require("./recruitment.service");
let RecruitmentController = class RecruitmentController {
    recruitment;
    constructor(recruitment) {
        this.recruitment = recruitment;
    }
    list() {
        return this.recruitment.list();
    }
};
exports.RecruitmentController = RecruitmentController;
__decorate([
    (0, common_1.Get)(),
    (0, roles_decorator_1.RequirePermission)('recruitment', 'view'),
    (0, swagger_1.ApiOperation)({ summary: 'Recruitment health/list stub' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], RecruitmentController.prototype, "list", null);
exports.RecruitmentController = RecruitmentController = __decorate([
    (0, swagger_1.ApiTags)('recruitment'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.Controller)('recruitment'),
    __metadata("design:paramtypes", [recruitment_service_1.RecruitmentService])
], RecruitmentController);
//# sourceMappingURL=recruitment.controller.js.map