import { applyDecorators, SetMetadata } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiExtension,
  ApiForbiddenResponse,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import type { Action, Module } from '../roles/types';

/** Metadata key read by PermissionsGuard. Do not rename. */
export const REQUIRE_PERMISSION_KEY = 'requirePermission';

export interface RequirePermissionMeta {
  module: Module;
  action: Action;
}

/**
 * Declares the permission PermissionsGuard enforces and documents it on the operation.
 * SetMetadata is unchanged so getAllAndOverride(REQUIRE_PERMISSION_KEY) still works.
 */
export const RequirePermission = (module: Module, action: Action) =>
  applyDecorators(
    SetMetadata(REQUIRE_PERMISSION_KEY, {
      module,
      action,
    } satisfies RequirePermissionMeta),
    ApiBearerAuth(),
    ApiExtension('x-required-permission', { module, action }),
    ApiUnauthorizedResponse({ description: 'Missing or invalid JWT' }),
    ApiForbiddenResponse({
      description: `Requires permission ${module}:${action}`,
    }),
  );
