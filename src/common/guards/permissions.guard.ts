import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import {
  REQUIRE_PERMISSION_KEY,
  type RequirePermissionMeta,
} from '../decorators/roles.decorator';
import { can } from '../roles/can';
import type { CurrentUser, JwtPayload } from '../roles/types';

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const meta = this.reflector.getAllAndOverride<RequirePermissionMeta | undefined>(
      REQUIRE_PERMISSION_KEY,
      [context.getHandler(), context.getClass()],
    );
    // Routes without @RequirePermission are allowed (JWT still required unless @Public)
    if (!meta) return true;

    const request = context.switchToHttp().getRequest<{ user?: JwtPayload }>();
    const payload = request.user;
    if (!payload) {
      throw new ForbiddenException('Missing authenticated user');
    }

    const user: CurrentUser = {
      employeeId: payload.employeeId ?? '',
      roles: payload.roles ?? [],
      departmentId: payload.departmentId,
      teamIds: payload.teamIds,
    };

    if (!can(user, meta.module, meta.action)) {
      throw new ForbiddenException(
        `Missing permission: ${meta.module}:${meta.action}`,
      );
    }
    return true;
  }
}
