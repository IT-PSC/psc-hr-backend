import {
  Body,
  Controller,
  Delete,
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
  CreateErCaseDto,
  CreateErInvestigationDto,
  ErListQueryDto,
  InvestigationListQueryDto,
  PatchErSettingsDto,
  UpdateErCaseDto,
  UpdateErInvestigationDto,
} from './dto/er.dto';
import { EmployeeRelationsService } from './employee-relations.service';

@ApiTags('Employee Relations')
@ApiBearerAuth()
@Controller('er')
export class EmployeeRelationsController {
  constructor(private readonly er: EmployeeRelationsService) {}

  @Get('settings')
  @RequirePermission('employee_relations', 'view')
  @ApiOperation({ summary: 'Get ER catalogues and notification flags' })
  getSettings() {
    return this.er.getSettings();
  }

  @Patch('settings')
  @RequirePermission('employee_relations', 'edit')
  @ApiOperation({ summary: 'Patch ER settings' })
  patchSettings(@Body() dto: PatchErSettingsDto) {
    return this.er.patchSettings(dto);
  }

  @Get('investigations')
  @RequirePermission('employee_relations', 'view')
  @ApiOperation({ summary: 'List ER investigations' })
  listInvestigations(
    @CurrentUser() user: JwtPayload,
    @Query() query: InvestigationListQueryDto,
  ) {
    return this.er.listInvestigations(user, query);
  }

  @Post('investigations')
  @RequirePermission('employee_relations', 'create')
  @ApiOperation({ summary: 'Open an investigation (refNo INV-YYYY-####)' })
  createInvestigation(
    @Body() dto: CreateErInvestigationDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.er.createInvestigation(dto, user);
  }

  @Get('investigations/:id')
  @RequirePermission('employee_relations', 'view')
  @ApiOperation({ summary: 'Get ER investigation' })
  getInvestigation(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.er.getInvestigation(id, user);
  }

  @Patch('investigations/:id')
  @RequirePermission('employee_relations', 'edit')
  @ApiOperation({ summary: 'Update ER investigation' })
  updateInvestigation(
    @Param('id') id: string,
    @Body() dto: UpdateErInvestigationDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.er.updateInvestigation(id, dto, user);
  }

  @Delete('investigations/:id')
  @RequirePermission('employee_relations', 'delete')
  @ApiOperation({ summary: 'Delete ER investigation' })
  deleteInvestigation(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.er.deleteInvestigation(id, user);
  }

  @Get()
  @RequirePermission('employee_relations', 'view')
  @ApiOperation({ summary: 'List ER cases' })
  list(@CurrentUser() user: JwtPayload, @Query() query: ErListQueryDto) {
    return this.er.list(user, query);
  }

  @Post()
  @RequirePermission('employee_relations', 'create')
  @ApiOperation({ summary: 'Create ER case' })
  create(@Body() dto: CreateErCaseDto, @CurrentUser() user: JwtPayload) {
    return this.er.create(dto, user);
  }

  @Get(':id')
  @RequirePermission('employee_relations', 'view')
  @ApiOperation({ summary: 'Get ER case' })
  getOne(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.er.getOne(id, user);
  }

  @Patch(':id')
  @RequirePermission('employee_relations', 'edit')
  @ApiOperation({ summary: 'Update ER case status/assignee/resolution' })
  update(
    @Param('id') id: string,
    @Body() dto: UpdateErCaseDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.er.update(id, dto, user);
  }
}
