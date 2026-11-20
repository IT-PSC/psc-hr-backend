"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RequirePermission = exports.REQUIRE_PERMISSION_KEY = void 0;
const common_1 = require("@nestjs/common");
exports.REQUIRE_PERMISSION_KEY = 'requirePermission';
const RequirePermission = (module, action) => (0, common_1.SetMetadata)(exports.REQUIRE_PERMISSION_KEY, { module, action });
exports.RequirePermission = RequirePermission;
//# sourceMappingURL=roles.decorator.js.map