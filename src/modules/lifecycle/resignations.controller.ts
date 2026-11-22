import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { RequirePermission } from '../../common/decorators/roles.decorator';
import type { JwtPayload } from '../../common/roles/types';
import { CreateResignationDto } from './dto/lifecycle.dto';
import { LifecycleService } from './lifecycle.service';

@ApiTags('Lifecycle')
@ApiBearerAuth()
@Controller('resignations')
export class ResignationsController {
  constructor(private readonly lifecycle: LifecycleService) {}

  @Get()
  @RequirePermission('resignation', 'create')
  @ApiOperation({ summary: 'List resignation requests (scoped)' })
  list(@CurrentUser() user: JwtPayload) {
    return this.lifecycle.listResignations(user);
  }

  @Post()
  @RequirePermission('resignation', 'create')
  @ApiOperation({ summary: 'Submit resignation + pending approval' })
  create(@Body() dto: CreateResignationDto, @CurrentUser() user: JwtPayload) {
    return this.lifecycle.createResignation(dto, user);
  }

  @Post(':id/cancel')
  @RequirePermission('resignation', 'create')
  @ApiOperation({ summary: 'Cancel pending resignation' })
  cancel(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.lifecycle.cancelResignation(id, user);
  }
}
