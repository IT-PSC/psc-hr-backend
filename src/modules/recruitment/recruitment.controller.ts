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
  ConvertCandidateDto,
  CreateCandidateDto,
  CreateInterviewDto,
  CreateJobDto,
  UpdateCandidateDto,
  UpdateInterviewDto,
  UpdateJobDto,
} from './dto/recruitment.dto';
import {
  CreateStaffingRequestDto,
  UpdateStaffingRequestDto,
} from './dto/staffing.dto';
import { RecruitmentService } from './recruitment.service';

@ApiTags('Recruitment')
@ApiBearerAuth()
@Controller('recruitment')
export class RecruitmentController {
  constructor(private readonly recruitment: RecruitmentService) {}

  @Get('jobs')
  @RequirePermission('recruitment', 'view')
  @ApiOperation({ summary: 'List job postings' })
  jobs(@CurrentUser() user: JwtPayload) {
    return this.recruitment.listJobs(user);
  }

  @Post('jobs')
  @RequirePermission('recruitment', 'create')
  @ApiOperation({ summary: 'Create job posting' })
  createJob(@Body() dto: CreateJobDto, @CurrentUser() user: JwtPayload) {
    return this.recruitment.createJob(dto, user);
  }

  @Patch('jobs/:id')
  @RequirePermission('recruitment', 'edit')
  @ApiOperation({ summary: 'Update job posting' })
  updateJob(
    @Param('id') id: string,
    @Body() dto: UpdateJobDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.recruitment.updateJob(id, dto, user);
  }

  @Get('candidates')
  @RequirePermission('recruitment', 'view')
  @ApiOperation({ summary: 'List candidates' })
  candidates(
    @CurrentUser() user: JwtPayload,
    @Query('jobId') jobId?: string,
  ) {
    return this.recruitment.listCandidates(user, jobId);
  }

  @Post('candidates')
  @RequirePermission('recruitment', 'create')
  @ApiOperation({ summary: 'Add candidate' })
  createCandidate(
    @Body() dto: CreateCandidateDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.recruitment.createCandidate(dto, user);
  }

  @Post('candidates/:id/convert')
  @RequirePermission('recruitment', 'edit')
  @ApiOperation({
    summary:
      'Convert an accepted (or offer/hired) candidate into an employee, optional user, draft contract, onboarding, and probation',
  })
  convertCandidate(
    @Param('id') id: string,
    @Body() dto: ConvertCandidateDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.recruitment.convertCandidate(id, dto, user);
  }

  @Patch('candidates/:id')
  @RequirePermission('recruitment', 'edit')
  @ApiOperation({ summary: 'Update candidate / stage / offer' })
  updateCandidate(
    @Param('id') id: string,
    @Body() dto: UpdateCandidateDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.recruitment.updateCandidate(id, dto, user);
  }

  @Get('interviews')
  @RequirePermission('recruitment', 'view')
  @ApiOperation({ summary: 'List interviews for candidate' })
  interviews(
    @CurrentUser() user: JwtPayload,
    @Query('candidateId') candidateId?: string,
  ) {
    return this.recruitment.listInterviews(user, candidateId);
  }

  @Post('interviews')
  @RequirePermission('recruitment', 'edit')
  @ApiOperation({ summary: 'Schedule interview' })
  createInterview(
    @Body() dto: CreateInterviewDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.recruitment.createInterview(dto, user);
  }

  @Patch('interviews/:id')
  @RequirePermission('recruitment', 'edit')
  @ApiOperation({ summary: 'Update interview' })
  updateInterview(
    @Param('id') id: string,
    @Body() dto: UpdateInterviewDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.recruitment.updateInterview(id, dto, user);
  }

  @Get('staffing-requests')
  @RequirePermission('recruitment', 'view')
  @ApiOperation({ summary: 'List staffing requests (scoped to requester)' })
  staffing(
    @CurrentUser() user: JwtPayload,
    @Query('status') status?: string,
  ) {
    return this.recruitment.listStaffing(user, status);
  }

  @Post('staffing-requests')
  @RequirePermission('recruitment', 'create')
  @ApiOperation({ summary: 'Submit a staffing request and open an approval' })
  createStaffing(
    @Body() dto: CreateStaffingRequestDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.recruitment.createStaffing(dto, user);
  }

  @Patch('staffing-requests/:id')
  @RequirePermission('recruitment', 'edit')
  @ApiOperation({ summary: 'Update a pending staffing request' })
  updateStaffing(
    @Param('id') id: string,
    @Body() dto: UpdateStaffingRequestDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.recruitment.updateStaffing(id, dto, user);
  }

  @Post('staffing-requests/:id/cancel')
  @RequirePermission('recruitment', 'create')
  @ApiOperation({ summary: 'Cancel a pending staffing request' })
  cancelStaffing(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.recruitment.cancelStaffing(id, user);
  }

  @Post('staffing-requests/:id/create-job')
  @RequirePermission('recruitment', 'edit')
  @ApiOperation({
    summary: 'Create a draft job posting from an approved staffing request',
  })
  createJobFromStaffing(
    @Param('id') id: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.recruitment.createJobFromStaffing(id, user);
  }

  /** Back-compat stub path */
  @Get()
  @RequirePermission('recruitment', 'view')
  @ApiOperation({ summary: 'Alias of jobs list' })
  list(@CurrentUser() user: JwtPayload) {
    return this.recruitment.listJobs(user);
  }
}
