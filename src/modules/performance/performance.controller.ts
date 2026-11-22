import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { RequirePermission } from '../../common/decorators/roles.decorator';
import type { JwtPayload } from '../../common/roles/types';
import {
  CreateCycleDto,
  CreateGoalDto,
  CreateReviewDto,
  UpdateCycleDto,
  UpdateGoalDto,
  UpdateReviewDto,
} from './dto/performance.dto';
import { PerformanceService } from './performance.service';

@ApiTags('Performance')
@ApiBearerAuth()
@Controller('performance')
export class PerformanceController {
  constructor(private readonly performance: PerformanceService) {}

  @Get('cycles')
  @RequirePermission('performance', 'view')
  @ApiOperation({ summary: 'List performance cycles' })
  listCycles(@CurrentUser() user: JwtPayload) {
    return this.performance.listCycles(user);
  }

  @Post('cycles')
  @RequirePermission('performance', 'create')
  @ApiOperation({ summary: 'Create performance cycle' })
  createCycle(@Body() dto: CreateCycleDto, @CurrentUser() user: JwtPayload) {
    return this.performance.createCycle(dto, user);
  }

  @Patch('cycles/:id')
  @RequirePermission('performance', 'edit')
  @ApiOperation({ summary: 'Open/close or update cycle' })
  updateCycle(
    @Param('id') id: string,
    @Body() dto: UpdateCycleDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.performance.updateCycle(id, dto, user);
  }

  @Get('goals')
  @RequirePermission('performance', 'view')
  @ApiOperation({ summary: 'List performance goals' })
  listGoals(@CurrentUser() user: JwtPayload) {
    return this.performance.listGoals(user);
  }

  @Post('goals')
  @RequirePermission('performance', 'edit')
  @ApiOperation({ summary: 'Create performance goal' })
  createGoal(@Body() dto: CreateGoalDto, @CurrentUser() user: JwtPayload) {
    return this.performance.createGoal(dto, user);
  }

  @Patch('goals/:id')
  @RequirePermission('performance', 'edit')
  @ApiOperation({ summary: 'Update goal progress/status' })
  updateGoal(
    @Param('id') id: string,
    @Body() dto: UpdateGoalDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.performance.updateGoal(id, dto, user);
  }

  @Get('reviews')
  @RequirePermission('performance', 'view')
  @ApiOperation({ summary: 'List performance reviews' })
  listReviews(@CurrentUser() user: JwtPayload) {
    return this.performance.listReviews(user);
  }

  @Post('reviews')
  @RequirePermission('performance', 'edit')
  @ApiOperation({ summary: 'Create performance review' })
  createReview(@Body() dto: CreateReviewDto, @CurrentUser() user: JwtPayload) {
    return this.performance.createReview(dto, user);
  }

  @Patch('reviews/:id')
  @RequirePermission('performance', 'edit')
  @ApiOperation({ summary: 'Update review ratings/comments' })
  updateReview(
    @Param('id') id: string,
    @Body() dto: UpdateReviewDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.performance.updateReview(id, dto, user);
  }
}
