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
  ContractListQueryDto,
  CreateContractDto,
  UpdateContractDto,
} from './dto/contract.dto';
import { ContractsService } from './contracts.service';

@ApiTags('Contracts')
@ApiBearerAuth()
@Controller('contracts')
export class ContractsController {
  constructor(private readonly contracts: ContractsService) {}

  @Get('templates')
  @RequirePermission('contracts', 'view')
  @ApiOperation({ summary: 'List contract templates' })
  templates() {
    return this.contracts.listTemplates();
  }

  @Get()
  @RequirePermission('contracts', 'view')
  @ApiOperation({ summary: 'List employment contracts' })
  list(
    @CurrentUser() user: JwtPayload,
    @Query() query: ContractListQueryDto,
  ) {
    return this.contracts.list(user, query);
  }

  @Get(':id')
  @RequirePermission('contracts', 'view')
  @ApiOperation({ summary: 'Get contract' })
  getOne(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.contracts.getOne(id, user);
  }

  @Post()
  @RequirePermission('contracts', 'create')
  @ApiOperation({ summary: 'Create employment contract' })
  create(@Body() dto: CreateContractDto, @CurrentUser() user: JwtPayload) {
    return this.contracts.create(dto, user);
  }

  @Patch(':id')
  @RequirePermission('contracts', 'edit')
  @ApiOperation({ summary: 'Update contract / status' })
  update(
    @Param('id') id: string,
    @Body() dto: UpdateContractDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.contracts.update(id, dto, user);
  }

  @Post(':id/renew')
  @RequirePermission('contracts', 'create')
  @ApiOperation({ summary: 'Archive current and create renewed draft' })
  renew(
    @Param('id') id: string,
    @CurrentUser() user: JwtPayload,
    @Body() body: { endDate?: string },
  ) {
    return this.contracts.renew(id, user, body?.endDate);
  }

  @Post(':id/archive')
  @RequirePermission('contracts', 'edit')
  @ApiOperation({ summary: 'Archive contract' })
  archive(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.contracts.archive(id, user);
  }
}
