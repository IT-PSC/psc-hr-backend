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
import { RequirePermission } from '../../common/decorators/roles.decorator';
import {
  CreateBranchDto,
  CreateCompanyDto,
  CreateDepartmentDto,
  CreatePositionDto,
  UpdateBranchDto,
  UpdateCompanyDto,
  UpdateDepartmentDto,
  UpdatePositionDto,
} from './dto/org.dto';
import { OrgService } from './org.service';

@ApiTags('Organization')
@ApiBearerAuth()
@Controller('org')
export class OrgController {
  constructor(private readonly org: OrgService) {}

  @Get('chart')
  @RequirePermission('organization', 'view')
  @ApiOperation({ summary: 'Org chart: companies, branches, departments, positions, employees' })
  chart() {
    return this.org.chart();
  }

  @Get('companies')
  @RequirePermission('organization', 'view')
  @ApiOperation({ summary: 'List companies' })
  companies() {
    return this.org.companies();
  }

  @Get('companies/:id')
  @RequirePermission('organization', 'view')
  @ApiOperation({ summary: 'Get company' })
  company(@Param('id') id: string) {
    return this.org.company(id);
  }

  @Post('companies')
  @RequirePermission('organization', 'create')
  @ApiOperation({ summary: 'Create company' })
  createCompany(@Body() dto: CreateCompanyDto) {
    return this.org.createCompany(dto);
  }

  @Patch('companies/:id')
  @RequirePermission('organization', 'edit')
  @ApiOperation({ summary: 'Update company' })
  updateCompany(@Param('id') id: string, @Body() dto: UpdateCompanyDto) {
    return this.org.updateCompany(id, dto);
  }

  @Delete('companies/:id')
  @RequirePermission('organization', 'delete')
  @ApiOperation({ summary: 'Delete company (blocked if branches or units exist)' })
  deleteCompany(@Param('id') id: string) {
    return this.org.deleteCompany(id);
  }

  @Get('branches')
  @RequirePermission('organization', 'view')
  @ApiOperation({ summary: 'List branches, optional companyId filter' })
  branches(@Query('companyId') companyId?: string) {
    return this.org.branches(companyId);
  }

  @Get('branches/:id')
  @RequirePermission('organization', 'view')
  @ApiOperation({ summary: 'Get branch' })
  branch(@Param('id') id: string) {
    return this.org.branch(id);
  }

  @Post('branches')
  @RequirePermission('organization', 'create')
  @ApiOperation({ summary: 'Create branch' })
  createBranch(@Body() dto: CreateBranchDto) {
    return this.org.createBranch(dto);
  }

  @Patch('branches/:id')
  @RequirePermission('organization', 'edit')
  @ApiOperation({ summary: 'Update branch' })
  updateBranch(@Param('id') id: string, @Body() dto: UpdateBranchDto) {
    return this.org.updateBranch(id, dto);
  }

  @Delete('branches/:id')
  @RequirePermission('organization', 'delete')
  @ApiOperation({ summary: 'Delete branch (blocked if departments assigned)' })
  deleteBranch(@Param('id') id: string) {
    return this.org.deleteBranch(id);
  }

  @Get('departments')
  @RequirePermission('organization', 'view')
  @ApiOperation({ summary: 'List departments' })
  departments() {
    return this.org.departments();
  }

  @Post('departments')
  @RequirePermission('organization', 'create')
  @ApiOperation({ summary: 'Create department' })
  createDepartment(@Body() dto: CreateDepartmentDto) {
    return this.org.createDepartment(dto);
  }

  @Patch('departments/:id')
  @RequirePermission('organization', 'edit')
  @ApiOperation({ summary: 'Update department' })
  updateDepartment(
    @Param('id') id: string,
    @Body() dto: UpdateDepartmentDto,
  ) {
    return this.org.updateDepartment(id, dto);
  }

  @Delete('departments/:id')
  @RequirePermission('organization', 'delete')
  @ApiOperation({ summary: 'Delete department (blocked if employees assigned)' })
  deleteDepartment(@Param('id') id: string) {
    return this.org.deleteDepartment(id);
  }

  @Get('positions')
  @RequirePermission('organization', 'view')
  @ApiOperation({ summary: 'List positions' })
  positions() {
    return this.org.positions();
  }

  @Post('positions')
  @RequirePermission('organization', 'create')
  @ApiOperation({ summary: 'Create position' })
  createPosition(@Body() dto: CreatePositionDto) {
    return this.org.createPosition(dto);
  }

  @Patch('positions/:id')
  @RequirePermission('organization', 'edit')
  @ApiOperation({ summary: 'Update position' })
  updatePosition(@Param('id') id: string, @Body() dto: UpdatePositionDto) {
    return this.org.updatePosition(id, dto);
  }

  @Delete('positions/:id')
  @RequirePermission('organization', 'delete')
  @ApiOperation({ summary: 'Delete position (blocked if employees assigned)' })
  deletePosition(@Param('id') id: string) {
    return this.org.deletePosition(id);
  }
}
