import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { RequirePermission } from '../../common/decorators/roles.decorator';
import {
  CreateContractAdvantageTemplateDto,
  CreateContributionRegisterDto,
  CreateIncentiveAwardDto,
  CreateSalaryIncreaseRequestDto,
  CreateSalaryRuleDto,
  CreateSalaryStructureDto,
  PatchPayrollConfigSettingsDto,
  UpdateContractAdvantageTemplateDto,
  UpdateContributionRegisterDto,
  UpdateIncentiveAwardDto,
  UpdateSalaryIncreaseRequestDto,
  UpdateSalaryRuleDto,
  UpdateSalaryStructureDto,
} from './dto/payroll-config.dto';
import { PayrollConfigService } from './payroll-config.service';

@ApiTags('Payroll')
@ApiBearerAuth()
@Controller('payroll-config')
export class PayrollConfigController {
  constructor(private readonly payrollConfig: PayrollConfigService) {}

  @Get('rules')
  @RequirePermission('payroll', 'view')
  @ApiOperation({ summary: 'List salary rules' })
  listRules() {
    return this.payrollConfig.listRules();
  }

  @Post('rules')
  @RequirePermission('payroll', 'create')
  @ApiOperation({ summary: 'Create salary rule' })
  createRule(@Body() dto: CreateSalaryRuleDto) {
    return this.payrollConfig.createRule(dto);
  }

  @Get('rules/:id')
  @RequirePermission('payroll', 'view')
  @ApiOperation({ summary: 'Get salary rule' })
  getRule(@Param('id') id: string) {
    return this.payrollConfig.getRule(id);
  }

  @Patch('rules/:id')
  @RequirePermission('payroll', 'edit')
  @ApiOperation({ summary: 'Update salary rule' })
  updateRule(@Param('id') id: string, @Body() dto: UpdateSalaryRuleDto) {
    return this.payrollConfig.updateRule(id, dto);
  }

  @Delete('rules/:id')
  @RequirePermission('payroll', 'edit')
  @ApiOperation({ summary: 'Delete salary rule' })
  deleteRule(@Param('id') id: string) {
    return this.payrollConfig.deleteRule(id);
  }

  @Get('structures')
  @RequirePermission('payroll', 'view')
  @ApiOperation({ summary: 'List salary structures' })
  listStructures() {
    return this.payrollConfig.listStructures();
  }

  @Post('structures')
  @RequirePermission('payroll', 'create')
  @ApiOperation({ summary: 'Create salary structure' })
  createStructure(@Body() dto: CreateSalaryStructureDto) {
    return this.payrollConfig.createStructure(dto);
  }

  @Get('structures/:id')
  @RequirePermission('payroll', 'view')
  @ApiOperation({ summary: 'Get salary structure' })
  getStructure(@Param('id') id: string) {
    return this.payrollConfig.getStructure(id);
  }

  @Patch('structures/:id')
  @RequirePermission('payroll', 'edit')
  @ApiOperation({ summary: 'Update salary structure' })
  updateStructure(
    @Param('id') id: string,
    @Body() dto: UpdateSalaryStructureDto,
  ) {
    return this.payrollConfig.updateStructure(id, dto);
  }

  @Delete('structures/:id')
  @RequirePermission('payroll', 'edit')
  @ApiOperation({ summary: 'Delete salary structure' })
  deleteStructure(@Param('id') id: string) {
    return this.payrollConfig.deleteStructure(id);
  }

  @Get('settings')
  @RequirePermission('payroll', 'view')
  @ApiOperation({ summary: 'Get payroll calculation settings' })
  getSettings() {
    return this.payrollConfig.getSettings();
  }

  @Patch('settings')
  @RequirePermission('payroll', 'edit')
  @ApiOperation({ summary: 'Patch payroll calculation settings' })
  patchSettings(@Body() dto: PatchPayrollConfigSettingsDto) {
    return this.payrollConfig.patchSettings(dto);
  }

  @Get('contribution-registers')
  @RequirePermission('payroll', 'view')
  @ApiOperation({ summary: 'List contribution registers' })
  listContributionRegisters() {
    return this.payrollConfig.listContributionRegisters();
  }

  @Post('contribution-registers')
  @RequirePermission('payroll', 'create')
  @ApiOperation({ summary: 'Create contribution register' })
  createContributionRegister(@Body() dto: CreateContributionRegisterDto) {
    return this.payrollConfig.createContributionRegister(dto);
  }

  @Get('contribution-registers/:id')
  @RequirePermission('payroll', 'view')
  @ApiOperation({ summary: 'Get contribution register' })
  getContributionRegister(@Param('id') id: string) {
    return this.payrollConfig.getContributionRegister(id);
  }

  @Patch('contribution-registers/:id')
  @RequirePermission('payroll', 'edit')
  @ApiOperation({ summary: 'Update contribution register' })
  updateContributionRegister(
    @Param('id') id: string,
    @Body() dto: UpdateContributionRegisterDto,
  ) {
    return this.payrollConfig.updateContributionRegister(id, dto);
  }

  @Delete('contribution-registers/:id')
  @RequirePermission('payroll', 'edit')
  @ApiOperation({ summary: 'Delete contribution register' })
  deleteContributionRegister(@Param('id') id: string) {
    return this.payrollConfig.deleteContributionRegister(id);
  }

  @Get('contract-advantage-templates')
  @RequirePermission('payroll', 'view')
  @ApiOperation({ summary: 'List contract advantage templates' })
  listAdvantageTemplates() {
    return this.payrollConfig.listAdvantageTemplates();
  }

  @Post('contract-advantage-templates')
  @RequirePermission('payroll', 'create')
  @ApiOperation({ summary: 'Create contract advantage template' })
  createAdvantageTemplate(@Body() dto: CreateContractAdvantageTemplateDto) {
    return this.payrollConfig.createAdvantageTemplate(dto);
  }

  @Get('contract-advantage-templates/:id')
  @RequirePermission('payroll', 'view')
  @ApiOperation({ summary: 'Get contract advantage template' })
  getAdvantageTemplate(@Param('id') id: string) {
    return this.payrollConfig.getAdvantageTemplate(id);
  }

  @Patch('contract-advantage-templates/:id')
  @RequirePermission('payroll', 'edit')
  @ApiOperation({ summary: 'Update contract advantage template' })
  updateAdvantageTemplate(
    @Param('id') id: string,
    @Body() dto: UpdateContractAdvantageTemplateDto,
  ) {
    return this.payrollConfig.updateAdvantageTemplate(id, dto);
  }

  @Delete('contract-advantage-templates/:id')
  @RequirePermission('payroll', 'edit')
  @ApiOperation({ summary: 'Delete contract advantage template' })
  deleteAdvantageTemplate(@Param('id') id: string) {
    return this.payrollConfig.deleteAdvantageTemplate(id);
  }

  @Get('incentives')
  @RequirePermission('payroll', 'view')
  @ApiOperation({ summary: 'List incentive awards' })
  listIncentives() {
    return this.payrollConfig.listIncentives();
  }

  @Post('incentives')
  @RequirePermission('payroll', 'create')
  @ApiOperation({ summary: 'Create incentive award' })
  createIncentive(@Body() dto: CreateIncentiveAwardDto) {
    return this.payrollConfig.createIncentive(dto);
  }

  @Get('incentives/:id')
  @RequirePermission('payroll', 'view')
  @ApiOperation({ summary: 'Get incentive award' })
  getIncentive(@Param('id') id: string) {
    return this.payrollConfig.getIncentive(id);
  }

  @Patch('incentives/:id')
  @RequirePermission('payroll', 'edit')
  @ApiOperation({ summary: 'Update incentive award' })
  updateIncentive(@Param('id') id: string, @Body() dto: UpdateIncentiveAwardDto) {
    return this.payrollConfig.updateIncentive(id, dto);
  }

  @Delete('incentives/:id')
  @RequirePermission('payroll', 'edit')
  @ApiOperation({ summary: 'Delete incentive award' })
  deleteIncentive(@Param('id') id: string) {
    return this.payrollConfig.deleteIncentive(id);
  }

  @Get('salary-increases')
  @RequirePermission('payroll', 'view')
  @ApiOperation({ summary: 'List salary increase requests' })
  listSalaryIncreases() {
    return this.payrollConfig.listSalaryIncreases();
  }

  @Post('salary-increases')
  @RequirePermission('payroll', 'create')
  @ApiOperation({ summary: 'Create salary increase request' })
  createSalaryIncrease(@Body() dto: CreateSalaryIncreaseRequestDto) {
    return this.payrollConfig.createSalaryIncrease(dto);
  }

  @Post('salary-increases/:id/apply')
  @RequirePermission('payroll', 'edit')
  @ApiOperation({
    summary: 'Apply an approved salary increase to Employee.baseSalary',
  })
  applySalaryIncrease(@Param('id') id: string) {
    return this.payrollConfig.applySalaryIncrease(id);
  }

  @Get('salary-increases/:id')
  @RequirePermission('payroll', 'view')
  @ApiOperation({ summary: 'Get salary increase request' })
  getSalaryIncrease(@Param('id') id: string) {
    return this.payrollConfig.getSalaryIncrease(id);
  }

  @Patch('salary-increases/:id')
  @RequirePermission('payroll', 'edit')
  @ApiOperation({ summary: 'Update salary increase request' })
  updateSalaryIncrease(
    @Param('id') id: string,
    @Body() dto: UpdateSalaryIncreaseRequestDto,
  ) {
    return this.payrollConfig.updateSalaryIncrease(id, dto);
  }

  @Delete('salary-increases/:id')
  @RequirePermission('payroll', 'edit')
  @ApiOperation({ summary: 'Delete salary increase request' })
  deleteSalaryIncrease(@Param('id') id: string) {
    return this.payrollConfig.deleteSalaryIncrease(id);
  }
}
