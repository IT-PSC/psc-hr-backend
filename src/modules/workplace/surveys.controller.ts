import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { RequirePermission } from '../../common/decorators/roles.decorator';
import type { JwtPayload } from '../../common/roles/types';
import {
  CreateSurveyDto,
  SurveyResponseDto,
  UpdateSurveyDto,
} from './dto/workplace.dto';
import { WorkplaceService } from './workplace.service';

@ApiTags('Workplace')
@ApiBearerAuth()
@Controller('surveys')
export class SurveysController {
  constructor(private readonly workplace: WorkplaceService) {}

  @Get()
  @RequirePermission('surveys', 'view')
  @ApiOperation({ summary: 'List pulse surveys' })
  list(@CurrentUser() user: JwtPayload) {
    return this.workplace.listSurveys(user);
  }

  @Post()
  @RequirePermission('surveys', 'create')
  @ApiOperation({ summary: 'Create pulse survey' })
  create(@Body() dto: CreateSurveyDto, @CurrentUser() user: JwtPayload) {
    return this.workplace.createSurvey(dto, user);
  }

  @Patch(':id')
  @RequirePermission('surveys', 'edit')
  @ApiOperation({ summary: 'Update survey' })
  update(
    @Param('id') id: string,
    @Body() dto: UpdateSurveyDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.workplace.updateSurvey(id, dto, user);
  }

  @Post(':id/responses')
  @RequirePermission('surveys', 'view')
  @ApiOperation({ summary: 'Submit survey response' })
  respond(
    @Param('id') id: string,
    @Body() dto: SurveyResponseDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.workplace.submitSurveyResponse(id, dto, user);
  }
}
