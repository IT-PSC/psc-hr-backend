import { Controller, Get, Param } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { RequirePermission } from '../../common/decorators/roles.decorator';
import { RbacService } from './rbac.service';

@ApiTags('rbac')
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
  @ApiOperation({ summary: 'Permissions for a role' })
  permissions(@Param('role') role: string) {
    return this.rbac.permissionsForRole(role);
  }

  @Get('matrix')
  @RequirePermission('roles', 'view')
  @ApiOperation({ summary: 'Full ROLE_PERMISSIONS matrix' })
  matrix() {
    return this.rbac.matrix();
  }
}
