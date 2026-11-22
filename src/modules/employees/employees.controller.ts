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
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { RequirePermission } from '../../common/decorators/roles.decorator';
import type { JwtPayload } from '../../common/roles/types';
import { CreateEmployeeDto, UpdateEmployeeDto } from './dto/employee.dto';
import {
  CreateRelatedUserDto,
  LinkRelatedUserDto,
  UpdateRelatedUserDto,
} from './dto/related-user.dto';
import { EmployeesService } from './employees.service';

@ApiTags('Employees')
@ApiBearerAuth()
@Controller('employees')
export class EmployeesController {
  constructor(private readonly employees: EmployeesService) {}

  @Get()
  @RequirePermission('employees', 'view')
  @ApiOperation({ summary: 'List employees (scoped by role)' })
  findAll(@CurrentUser() user: JwtPayload) {
    return this.employees.findAll(user);
  }

  @Get(':id')
  @RequirePermission('employees', 'view')
  @ApiOperation({ summary: 'Get employee by id' })
  findOne(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.employees.findOne(id, user);
  }

  @Post()
  @RequirePermission('employees', 'create')
  @ApiOperation({
    summary: 'Create employee (optional relatedUser creates login + roles)',
  })
  create(@Body() dto: CreateEmployeeDto, @CurrentUser() user: JwtPayload) {
    return this.employees.create(dto, user);
  }

  @Post(':id/related-user')
  @RequirePermission('employees', 'edit')
  @ApiOperation({
    summary: 'Create related login user for employee (Odoo-style)',
  })
  createRelatedUser(
    @Param('id') id: string,
    @Body() dto: CreateRelatedUserDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.employees.createRelatedUser(id, dto, user);
  }

  @Patch(':id/related-user')
  @RequirePermission('employees', 'edit')
  @ApiOperation({
    summary: 'Update related user password, roles, email, or active flag',
  })
  updateRelatedUser(
    @Param('id') id: string,
    @Body() dto: UpdateRelatedUserDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.employees.updateRelatedUser(id, dto, user);
  }

  @Post(':id/related-user/link')
  @RequirePermission('employees', 'edit')
  @ApiOperation({ summary: 'Link an existing user account to this employee' })
  linkRelatedUser(
    @Param('id') id: string,
    @Body() dto: LinkRelatedUserDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.employees.linkRelatedUser(id, dto, user);
  }

  @Delete(':id/related-user')
  @RequirePermission('employees', 'edit')
  @ApiOperation({
    summary: 'Unlink related user (does not delete the login account)',
  })
  unlinkRelatedUser(
    @Param('id') id: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.employees.unlinkRelatedUser(id, user);
  }

  @Patch(':id')
  @RequirePermission('employees', 'edit')
  @ApiOperation({ summary: 'Update employee' })
  update(
    @Param('id') id: string,
    @Body() dto: UpdateEmployeeDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.employees.update(id, dto, user);
  }

  @Delete(':id')
  @RequirePermission('employees', 'delete')
  @ApiOperation({
    summary: 'Soft-deactivate employee (status=inactive)',
  })
  remove(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.employees.softDelete(id, user);
  }
}
