import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Put,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { RequirePermission } from '../../common/decorators/roles.decorator';
import type { JwtPayload } from '../../common/roles/types';
import {
  StartOnboardingDto,
  UpdateOnboardingCaseDto,
  UpdateOnboardingTaskDto,
  UpsertTemplateDto,
} from './dto/onboarding.dto';
import { OnboardingService } from './onboarding.service';

@ApiTags('Onboarding')
@ApiBearerAuth()
@Controller('onboarding')
export class OnboardingController {
  constructor(private readonly onboarding: OnboardingService) {}

  @Get('templates')
  @RequirePermission('onboarding', 'view')
  @ApiOperation({ summary: 'List onboarding templates' })
  templates() {
    return this.onboarding.listTemplates();
  }

  @Post('templates')
  @RequirePermission('onboarding', 'edit')
  @ApiOperation({ summary: 'Create onboarding template' })
  createTemplate(
    @Body() dto: UpsertTemplateDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.onboarding.upsertTemplate(dto, user);
  }

  @Put('templates/:id')
  @RequirePermission('onboarding', 'edit')
  @ApiOperation({ summary: 'Update onboarding template' })
  updateTemplate(
    @Param('id') id: string,
    @Body() dto: UpsertTemplateDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.onboarding.upsertTemplate(dto, user, id);
  }

  @Get('cases')
  @RequirePermission('onboarding', 'view')
  @ApiOperation({ summary: 'List onboarding cases' })
  cases(@CurrentUser() user: JwtPayload) {
    return this.onboarding.listCases(user);
  }

  @Get('cases/:id')
  @RequirePermission('onboarding', 'view')
  @ApiOperation({ summary: 'Get onboarding case + tasks' })
  getCase(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.onboarding.getCase(id, user);
  }

  @Post('cases')
  @RequirePermission('onboarding', 'create')
  @ApiOperation({ summary: 'Start onboarding for employee' })
  start(@Body() dto: StartOnboardingDto, @CurrentUser() user: JwtPayload) {
    return this.onboarding.start(dto, user);
  }

  @Patch('cases/:id')
  @RequirePermission('onboarding', 'edit')
  @ApiOperation({ summary: 'Update onboarding case stage/status' })
  updateCase(
    @Param('id') id: string,
    @Body() dto: UpdateOnboardingCaseDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.onboarding.updateCase(id, dto, user);
  }

  @Patch('tasks/:id')
  @RequirePermission('onboarding', 'view')
  @ApiOperation({ summary: 'Update onboarding task status' })
  updateTask(
    @Param('id') id: string,
    @Body() dto: UpdateOnboardingTaskDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.onboarding.updateTask(id, dto, user);
  }

  /** Back-compat */
  @Get()
  @RequirePermission('onboarding', 'view')
  @ApiOperation({ summary: 'Alias of cases list' })
  list(@CurrentUser() user: JwtPayload) {
    return this.onboarding.listCases(user);
  }
}
