import { Body, Controller, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { RequirePermission } from '../../common/decorators/roles.decorator';
import type { JwtPayload } from '../../common/roles/types';
import { ApSpecialtyService } from './ap-specialty.service';
import {
  CreateCatalogueDto,
  CreateDailyIngredientDto,
  CreatePettyCashDto,
  UpdateApSetupDto,
  UpdateCatalogueDto,
  UpdateDailyIngredientDto,
} from './dto/ap-specialty.dto';

@ApiTags('Accounts Payable')
@ApiBearerAuth()
@Controller('ap')
export class ApSpecialtyController {
  constructor(private readonly ap: ApSpecialtyService) {}

  @Get('catalogue')
  @RequirePermission('accounts_payable', 'view')
  @ApiOperation({ summary: 'List ingredient catalogue' })
  catalogue(@Query('active') active?: string) {
    return this.ap.listCatalogue(active);
  }

  @Post('catalogue')
  @RequirePermission('accounts_payable', 'create')
  @ApiOperation({ summary: 'Create catalogue item' })
  createCatalogue(@Body() dto: CreateCatalogueDto) {
    return this.ap.createCatalogue(dto);
  }

  @Patch('catalogue/:id')
  @RequirePermission('accounts_payable', 'edit')
  @ApiOperation({ summary: 'Update catalogue item' })
  updateCatalogue(@Param('id') id: string, @Body() dto: UpdateCatalogueDto) {
    return this.ap.updateCatalogue(id, dto);
  }

  @Get('daily-ingredients')
  @RequirePermission('ap_ingredients', 'view')
  @ApiOperation({ summary: 'List daily ingredient purchases' })
  ingredients(
    @Query('purchaseDate') purchaseDate?: string,
    @Query('branchId') branchId?: string,
  ) {
    return this.ap.listIngredients(purchaseDate, branchId);
  }

  @Get('daily-ingredients/:id')
  @RequirePermission('ap_ingredients', 'view')
  @ApiOperation({ summary: 'Get a daily ingredient purchase' })
  ingredient(@Param('id') id: string) {
    return this.ap.getIngredient(id);
  }

  @Post('daily-ingredients')
  @RequirePermission('ap_ingredients', 'create')
  @ApiOperation({ summary: 'Record a daily ingredient purchase' })
  createIngredient(@Body() dto: CreateDailyIngredientDto) {
    return this.ap.createIngredient(dto);
  }

  @Patch('daily-ingredients/:id')
  @RequirePermission('ap_ingredients', 'edit')
  @ApiOperation({ summary: 'Update a daily ingredient purchase' })
  updateIngredient(
    @Param('id') id: string,
    @Body() dto: UpdateDailyIngredientDto,
  ) {
    return this.ap.updateIngredient(id, dto);
  }

  @Get('petty-cash')
  @RequirePermission('ap_petty_cash', 'view')
  @ApiOperation({ summary: 'List petty cash records' })
  pettyCash(@Query('branchId') branchId?: string) {
    return this.ap.listPettyCash(branchId);
  }

  @Post('petty-cash')
  @RequirePermission('ap_petty_cash', 'create')
  @ApiOperation({ summary: 'Record petty cash' })
  createPettyCash(
    @Body() dto: CreatePettyCashDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.ap.createPettyCash(dto, user.employeeId ?? user.sub);
  }

  @Get('setup')
  @RequirePermission('ap_setup', 'view')
  @ApiOperation({ summary: 'Get accounts-payable setup' })
  setup() {
    return this.ap.getSetup();
  }

  @Patch('setup')
  @RequirePermission('ap_setup', 'edit')
  @ApiOperation({ summary: 'Update accounts-payable setup' })
  updateSetup(@Body() dto: UpdateApSetupDto) {
    return this.ap.updateSetup(dto);
  }
}
