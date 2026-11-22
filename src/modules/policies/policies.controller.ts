import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { RequirePermission } from '../../common/decorators/roles.decorator';
import type { JwtPayload } from '../../common/roles/types';
import { CreatePolicyDto, UpdatePolicyDto } from './dto/policy.dto';
import { PoliciesService } from './policies.service';

@ApiTags('Workplace')
@ApiBearerAuth()
@Controller('policies')
export class PoliciesController {
  constructor(private readonly policies: PoliciesService) {}

  @Get()
  @RequirePermission('policies', 'view')
  @ApiOperation({ summary: 'List policies' })
  list(@CurrentUser() user: JwtPayload) {
    return this.policies.list(user);
  }

  @Post()
  @RequirePermission('policies', 'create')
  @ApiOperation({ summary: 'Create policy document' })
  create(@Body() dto: CreatePolicyDto, @CurrentUser() user: JwtPayload) {
    return this.policies.create(dto, user);
  }

  @Patch(':id')
  @RequirePermission('policies', 'edit')
  @ApiOperation({ summary: 'Update policy document' })
  update(
    @Param('id') id: string,
    @Body() dto: UpdatePolicyDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.policies.update(id, dto, user);
  }

  @Post(':id/acknowledge')
  @RequirePermission('policies', 'view')
  @ApiOperation({ summary: 'Acknowledge a published policy' })
  acknowledge(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.policies.acknowledge(id, user);
  }
}
