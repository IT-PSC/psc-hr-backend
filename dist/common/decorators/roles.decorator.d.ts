import type { Action, Module } from '../roles/types';
export declare const REQUIRE_PERMISSION_KEY = "requirePermission";
export interface RequirePermissionMeta {
    module: Module;
    action: Action;
}
export declare const RequirePermission: (module: Module, action: Action) => import("@nestjs/common").CustomDecorator<string>;
