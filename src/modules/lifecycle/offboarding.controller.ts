import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { RequirePermission } from '../../common/decorators/roles.decorator';
import type { JwtPayload } from '../../common/roles/types';
import {
  ExitInterviewDto,
  StartOffboardingDto,
  UpdateOffboardingTaskDto,
} from './dto/lifecycle.dto';
import { LifecycleService } from './lifecycle.service';

@ApiTags('Lifecycle')
@ApiBearerAuth()
@Controller('offboarding')
export class OffboardingController {
  constructor(private readonly lifecycle: LifecycleService) {}

  @Get('cases')
  @RequirePermission('offboarding', 'view')
  @ApiOperation({ summary: 'List offboarding cases' })
  list(@CurrentUser() user: JwtPayload) {
    return this.lifecycle.listOffboardingCases(user);
  }

  @Get('cases/:id')
  @RequirePermission('offboarding', 'view')
  @ApiOperation({ summary: 'Get offboarding case + tasks' })
  getOne(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.lifecycle.getOffboardingCase(id, user);
  }

  @Post('cases')
  @RequirePermission('offboarding', 'edit')
  @ApiOperation({ summary: 'Manually start offboarding case' })
  start(@Body() dto: StartOffboardingDto, @CurrentUser() user: JwtPayload) {
    return this.lifecycle.startOffboarding(dto, user);
  }

  @Patch('tasks/:id')
  @RequirePermission('offboarding', 'view')
  @ApiOperation({ summary: 'Mark offboarding task done/undone' })
  updateTask(
    @Param('id') id: string,
    @Body() dto: UpdateOffboardingTaskDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.lifecycle.updateOffboardingTask(id, dto, user);
  }

  @Post('cases/:id/exit-interview')
  @RequirePermission('offboarding', 'view')
  @ApiOperation({ summary: 'Submit exit interview' })
  exitInterview(
    @Param('id') id: string,
    @Body() dto: ExitInterviewDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.lifecycle.submitExitInterview(id, dto, user);
  }
}
