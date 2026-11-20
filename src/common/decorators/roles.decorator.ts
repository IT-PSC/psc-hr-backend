import { SetMetadata } from '@nestjs/common';
import type { Action, Module } from '../roles/types';

export const REQUIRE_PERMISSION_KEY = 'requirePermission';

export interface RequirePermissionMeta {
  module: Module;
  action: Action;
}

export const RequirePermission = (module: Module, action: Action) =>
  SetMetadata(REQUIRE_PERMISSION_KEY, { module, action } satisfies RequirePermissionMeta);
