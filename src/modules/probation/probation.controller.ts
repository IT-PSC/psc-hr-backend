import {
  Body,
  Controller,
  Delete,
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
  CreateProbationCaseDto,
  DecideProbationDto,
  PatchProbationSettingsDto,
  UpdateProbationCaseDto,
  UpsertEvaluationDto,
  UpsertPipDto,
} from './dto/probation.dto';
import { ProbationService } from './probation.service';

@ApiTags('Probation')
@ApiBearerAuth()
@Controller('probation')
export class ProbationController {
  constructor(private readonly probation: ProbationService) {}

  @Get('settings')
  @RequirePermission('probation', 'view')
  @ApiOperation({ summary: 'Get probation management settings' })
  getSettings() {
    return this.probation.getSettings();
  }

  @Patch('settings')
  @RequirePermission('probation', 'edit')
  @ApiOperation({ summary: 'Patch probation management settings' })
  patchSettings(@Body() dto: PatchProbationSettingsDto) {
    return this.probation.patchSettings(dto);
  }

  @Get('cases')
  @RequirePermission('probation', 'view')
  @ApiOperation({ summary: 'List probation cases' })
  list(@CurrentUser() user: JwtPayload) {
    return this.probation.list(user);
  }

  @Get('cases/:id')
  @RequirePermission('probation', 'view')
  @ApiOperation({ summary: 'Get probation case with evals/PIPs' })
  getOne(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.probation.getOne(id, user);
  }

  @Post('cases')
  @RequirePermission('probation', 'edit')
  @ApiOperation({ summary: 'Create probation case' })
  create(
    @Body() dto: CreateProbationCaseDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.probation.create(dto, user);
  }

  @Patch('cases/:id')
  @RequirePermission('probation', 'edit')
  @ApiOperation({ summary: 'Update probation case' })
  update(
    @Param('id') id: string,
    @Body() dto: UpdateProbationCaseDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.probation.update(id, dto, user);
  }

  @Post('cases/:id/decide')
  @RequirePermission('probation', 'edit')
  @ApiOperation({ summary: 'Final probation decision' })
  decide(
    @Param('id') id: string,
    @Body() dto: DecideProbationDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.probation.decide(id, dto, user);
  }

  @Put('cases/:id/evaluations')
  @RequirePermission('probation', 'view')
  @ApiOperation({ summary: 'Upsert month evaluation' })
  upsertEval(
    @Param('id') id: string,
    @Body() dto: UpsertEvaluationDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.probation.upsertEvaluation(id, dto, user);
  }

  @Post('cases/:id/pips')
  @RequirePermission('probation', 'edit')
  @ApiOperation({ summary: 'Create PIP' })
  createPip(
    @Param('id') id: string,
    @Body() dto: UpsertPipDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.probation.upsertPip(id, dto, user);
  }

  @Patch('pips/:id')
  @RequirePermission('probation', 'edit')
  @ApiOperation({ summary: 'Update PIP' })
  updatePip(
    @Param('id') id: string,
    @Body() dto: UpsertPipDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.probation.updatePip(id, dto, user);
  }

  @Delete('pips/:id')
  @RequirePermission('probation', 'edit')
  @ApiOperation({ summary: 'Delete PIP' })
  deletePip(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.probation.deletePip(id, user);
  }
}
