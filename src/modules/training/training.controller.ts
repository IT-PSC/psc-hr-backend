import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { RequirePermission } from '../../common/decorators/roles.decorator';
import type { JwtPayload } from '../../common/roles/types';
import {
  CreateCourseDto,
  EnrollDto,
  EnrollmentListQueryDto,
  UpdateCourseDto,
  UpdateEnrollmentDto,
} from './dto/training.dto';
import { TrainingService } from './training.service';

@ApiTags('Training')
@ApiBearerAuth()
@Controller('training')
export class TrainingController {
  constructor(private readonly training: TrainingService) {}

  @Get('courses')
  @RequirePermission('training', 'view')
  @ApiOperation({ summary: 'List courses' })
  listCourses(@CurrentUser() user: JwtPayload) {
    return this.training.listCourses(user);
  }

  @Post('courses')
  @RequirePermission('training', 'create')
  @ApiOperation({ summary: 'Create course' })
  createCourse(@Body() dto: CreateCourseDto, @CurrentUser() user: JwtPayload) {
    return this.training.createCourse(dto, user);
  }

  @Patch('courses/:id')
  @RequirePermission('training', 'edit')
  @ApiOperation({ summary: 'Update course' })
  updateCourse(
    @Param('id') id: string,
    @Body() dto: UpdateCourseDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.training.updateCourse(id, dto, user);
  }

  @Get('enrollments')
  @RequirePermission('training', 'view')
  @ApiOperation({ summary: 'List enrollments' })
  listEnrollments(
    @CurrentUser() user: JwtPayload,
    @Query() query: EnrollmentListQueryDto,
  ) {
    return this.training.listEnrollments(user, query);
  }

  @Post('enrollments')
  @RequirePermission('training', 'create')
  @ApiOperation({ summary: 'Enroll employee in course' })
  enroll(@Body() dto: EnrollDto, @CurrentUser() user: JwtPayload) {
    return this.training.enroll(dto, user);
  }

  @Patch('enrollments/:id')
  @RequirePermission('training', 'view')
  @ApiOperation({ summary: 'Update enrollment progress/status' })
  updateEnrollment(
    @Param('id') id: string,
    @Body() dto: UpdateEnrollmentDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.training.updateEnrollment(id, dto, user);
  }
}
