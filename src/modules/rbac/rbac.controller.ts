import {
  Body,
  Controller,
  Get,
  Param,
  ParseArrayPipe,
  Put,
} from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiTags } from '@nestjs/swagger';
import { RequirePermission } from '../../common/decorators/roles.decorator';
import { PermissionItemDto } from './dto/rbac.dto';
import { RbacService } from './rbac.service';

@ApiTags('Users & Roles')
@ApiBearerAuth()
@Controller('rbac')
export class RbacController {
  constructor(private readonly rbac: RbacService) {}

  @Get('roles')
  @RequirePermission('roles', 'view')
  @ApiOperation({ summary: 'List app roles' })
  listRoles() {
    return this.rbac.listRoles();
  }

  @Get('permissions/:role')
  @RequirePermission('roles', 'view')
  @ApiOperation({
    summary: 'Permissions for a role (DB grants when present, else code defaults)',
  })
  permissions(@Param('role') role: string) {
    return this.rbac.permissionsForRole(role);
  }

  @Put('roles/:role/permissions')
  @RequirePermission('roles', 'edit')
  @ApiOperation({ summary: 'Replace PermissionGrant rows for a role' })
  @ApiBody({ type: PermissionItemDto, isArray: true })
  replacePermissions(
    @Param('role') role: string,
    @Body(
      new ParseArrayPipe({
        items: PermissionItemDto,
        whitelist: true,
        forbidNonWhitelisted: true,
      }),
    )
    body: PermissionItemDto[],
  ) {
    return this.rbac.replacePermissions(role, body);
  }

  @Get('matrix')
  @RequirePermission('roles', 'view')
  @ApiOperation({
    summary: 'Permission matrix (DB grants per role when present, else ROLE_PERMISSIONS)',
  })
  matrix() {
    return this.rbac.matrix();
  }
}
