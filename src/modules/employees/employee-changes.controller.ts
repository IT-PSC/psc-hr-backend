import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { RequirePermission } from '../../common/decorators/roles.decorator';
import type { JwtPayload } from '../../common/roles/types';
import {
  ChangeListQueryDto,
  CreateOrgChangeDto,
  CreateProfileChangeDto,
} from './dto/employee-changes.dto';
import { EmployeeChangesService } from './employee-changes.service';

@ApiTags('Employees')
@ApiBearerAuth()
@Controller('employees')
export class EmployeeChangesController {
  constructor(private readonly changes: EmployeeChangesService) {}

  @Get('profile-changes')
  @RequirePermission('employees', 'view')
  @ApiOperation({ summary: 'List profile change requests (scoped)' })
  listProfile(
    @CurrentUser() user: JwtPayload,
    @Query() query: ChangeListQueryDto,
  ) {
    return this.changes.listProfile(user, query);
  }

  @Post('profile-changes')
  @RequirePermission('profile', 'edit')
  @ApiOperation({
    summary: 'Submit a profile change and open a profile_change approval',
  })
  createProfile(
    @Body() dto: CreateProfileChangeDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.changes.createProfile(dto, user);
  }

  @Post('profile-changes/:id/cancel')
  @RequirePermission('profile', 'edit')
  @ApiOperation({ summary: 'Cancel a pending profile change' })
  cancelProfile(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.changes.cancelProfile(id, user);
  }

  @Get('org-changes')
  @RequirePermission('employees', 'view')
  @ApiOperation({ summary: 'List promotion, transfer, and salary change requests' })
  listOrg(@CurrentUser() user: JwtPayload, @Query() query: ChangeListQueryDto) {
    return this.changes.listOrg(user, query);
  }

  @Post('org-changes')
  @RequirePermission('employees', 'edit')
  @ApiOperation({ summary: 'Submit an org change and open an org_change approval' })
  createOrg(@Body() dto: CreateOrgChangeDto, @CurrentUser() user: JwtPayload) {
    return this.changes.createOrg(dto, user);
  }

  @Post('org-changes/:id/cancel')
  @RequirePermission('employees', 'edit')
  @ApiOperation({ summary: 'Cancel a pending org change' })
  cancelOrg(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.changes.cancelOrg(id, user);
  }
}
