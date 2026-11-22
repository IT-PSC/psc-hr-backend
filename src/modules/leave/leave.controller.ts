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
  CreateLeaveRequestDto,
  CreateLeaveTypeDto,
  LeaveListQueryDto,
  UpdateLeaveTypeDto,
} from './dto/leave.dto';
import { LeaveService } from './leave.service';

@ApiTags('Leave Management')
@ApiBearerAuth()
@Controller('leave')
export class LeaveController {
  constructor(private readonly leave: LeaveService) {}

  @Get('types')
  @RequirePermission('leave', 'view')
  @ApiOperation({ summary: 'List leave types' })
  types() {
    return this.leave.types();
  }

  @Post('types')
  @RequirePermission('leave', 'create')
  @ApiOperation({ summary: 'Create a leave type (company leave:create)' })
  createType(
    @Body() dto: CreateLeaveTypeDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.leave.createType(dto, user);
  }

  @Patch('types/:id')
  @RequirePermission('leave', 'edit')
  @ApiOperation({ summary: 'Update a leave type' })
  updateType(
    @Param('id') id: string,
    @Body() dto: UpdateLeaveTypeDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.leave.updateType(id, dto, user);
  }

  @Delete('types/:id')
  @RequirePermission('leave', 'edit')
  @ApiOperation({
    summary:
      'Delete a leave type when it has no requests or balances (matrix has no leave:delete; gated by leave:edit)',
  })
  deleteType(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.leave.deleteType(id, user);
  }

  @Get('balances')
  @RequirePermission('leave', 'view')
  @ApiOperation({ summary: 'Leave balances for employee (default: self)' })
  balances(
    @CurrentUser() user: JwtPayload,
    @Query('employeeId') employeeId?: string,
  ) {
    return this.leave.balances(user, employeeId);
  }

  @Get('requests')
  @RequirePermission('leave', 'view')
  @ApiOperation({ summary: 'List leave requests (scoped)' })
  list(
    @CurrentUser() user: JwtPayload,
    @Query() query: LeaveListQueryDto,
  ) {
    return this.leave.list(user, query);
  }

  @Get('requests/:id')
  @RequirePermission('leave', 'view')
  @ApiOperation({ summary: 'Get leave request' })
  getOne(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.leave.getOne(id, user);
  }

  @Post('requests')
  @RequirePermission('leave', 'create')
  @ApiOperation({
    summary: 'Create leave request + pending approval',
  })
  create(
    @Body() dto: CreateLeaveRequestDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.leave.create(dto, user);
  }

  @Post('requests/:id/cancel')
  @RequirePermission('leave', 'create')
  @ApiOperation({ summary: 'Cancel pending leave request' })
  cancel(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.leave.cancel(id, user);
  }
}
