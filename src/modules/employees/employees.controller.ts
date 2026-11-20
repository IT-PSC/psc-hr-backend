import { Controller, Get, Param } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { RequirePermission } from '../../common/decorators/roles.decorator';
import type { JwtPayload } from '../../common/roles/types';
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
}
