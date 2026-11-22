import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { RequirePermission } from '../../common/decorators/roles.decorator';
import type { JwtPayload } from '../../common/roles/types';
import { BenefitsAssetsService } from './benefits-assets.service';
import {
  AssignAssetDto,
  CreateAssetDto,
  ReturnAssetDto,
} from './dto/benefits-assets.dto';

@ApiTags('Assets')
@ApiBearerAuth()
@Controller('assets')
export class AssetsController {
  constructor(private readonly service: BenefitsAssetsService) {}

  @Get()
  @RequirePermission('assets', 'view')
  @ApiOperation({ summary: 'List company assets' })
  list(@CurrentUser() user: JwtPayload) {
    return this.service.listAssets(user);
  }

  @Post()
  @RequirePermission('assets', 'edit')
  @ApiOperation({ summary: 'Create company asset' })
  create(@Body() dto: CreateAssetDto, @CurrentUser() user: JwtPayload) {
    return this.service.createAsset(dto, user);
  }

  @Post(':id/assign')
  @RequirePermission('assets', 'edit')
  @ApiOperation({ summary: 'Assign asset to employee' })
  assign(
    @Param('id') id: string,
    @Body() dto: AssignAssetDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.service.assignAsset(id, dto, user);
  }

  @Post(':id/return')
  @RequirePermission('assets', 'edit')
  @ApiOperation({ summary: 'Return assigned asset' })
  returnAsset(
    @Param('id') id: string,
    @Body() dto: ReturnAssetDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.service.returnAsset(id, dto, user);
  }
}
