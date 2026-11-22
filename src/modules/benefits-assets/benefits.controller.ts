import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { RequirePermission } from '../../common/decorators/roles.decorator';
import type { JwtPayload } from '../../common/roles/types';
import { BenefitsAssetsService } from './benefits-assets.service';
import {
  CreateBenefitPlanDto,
  EnrollBenefitDto,
} from './dto/benefits-assets.dto';

@ApiTags('Benefits')
@ApiBearerAuth()
@Controller('benefits')
export class BenefitsController {
  constructor(private readonly service: BenefitsAssetsService) {}

  @Get('plans')
  @RequirePermission('benefits', 'view')
  @ApiOperation({ summary: 'List benefit plans' })
  listPlans(@CurrentUser() user: JwtPayload) {
    return this.service.listPlans(user);
  }

  @Post('plans')
  @RequirePermission('benefits', 'edit')
  @ApiOperation({ summary: 'Create benefit plan' })
  createPlan(
    @Body() dto: CreateBenefitPlanDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.service.createPlan(dto, user);
  }

  @Get('enrollments')
  @RequirePermission('benefits', 'view')
  @ApiOperation({ summary: 'List benefit enrollments' })
  listEnrollments(@CurrentUser() user: JwtPayload) {
    return this.service.listEnrollments(user);
  }

  @Post('enrollments')
  @RequirePermission('benefits', 'view')
  @ApiOperation({ summary: 'Enroll in benefit plan' })
  enroll(@Body() dto: EnrollBenefitDto, @CurrentUser() user: JwtPayload) {
    return this.service.enroll(dto, user);
  }

  @Patch('enrollments/:id/cancel')
  @RequirePermission('benefits', 'view')
  @ApiOperation({ summary: 'Cancel benefit enrollment' })
  cancel(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.service.cancelEnrollment(id, user);
  }
}
