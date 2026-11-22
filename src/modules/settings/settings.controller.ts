import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Put,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { RequirePermission } from '../../common/decorators/roles.decorator';
import {
  CreateLetterTemplateDto,
  CreateOfficeLocationDto,
  PatchPlatformSettingsDto,
  PatchWelcomeTemplateDto,
  UpdateLetterTemplateDto,
  UpdateOfficeLocationDto,
  UpsertApprovalChainDto,
} from './dto/settings.dto';
import { SettingsService } from './settings.service';

/**
 * Matrix grants `settings:manage_settings` to HR and system admin
 * (`settings:view` is system admin only). Both read and write use
 * manage_settings so HR is not locked out of reads.
 */
@ApiTags('System Settings')
@ApiBearerAuth()
@Controller('settings')
@RequirePermission('settings', 'manage_settings')
export class SettingsController {
  constructor(private readonly settings: SettingsService) {}

  @Get('platform')
  @ApiOperation({ summary: 'Get singleton platform settings' })
  getPlatform() {
    return this.settings.getPlatform();
  }

  @Patch('platform')
  @ApiOperation({ summary: 'Patch singleton platform settings' })
  patchPlatform(@Body() dto: PatchPlatformSettingsDto) {
    return this.settings.patchPlatform(dto);
  }

  @Get('office-locations')
  @ApiOperation({ summary: 'List office locations' })
  listOffices() {
    return this.settings.listOffices();
  }

  @Get('office-locations/:id')
  @ApiOperation({ summary: 'Get office location' })
  getOffice(@Param('id') id: string) {
    return this.settings.getOffice(id);
  }

  @Post('office-locations')
  @ApiOperation({ summary: 'Create office location' })
  createOffice(@Body() dto: CreateOfficeLocationDto) {
    return this.settings.createOffice(dto);
  }

  @Patch('office-locations/:id')
  @ApiOperation({ summary: 'Update office location' })
  updateOffice(@Param('id') id: string, @Body() dto: UpdateOfficeLocationDto) {
    return this.settings.updateOffice(id, dto);
  }

  @Delete('office-locations/:id')
  @ApiOperation({ summary: 'Delete office location' })
  deleteOffice(@Param('id') id: string) {
    return this.settings.deleteOffice(id);
  }

  @Get('approval-chains')
  @ApiOperation({ summary: 'List approval chain configs' })
  listChains() {
    return this.settings.listChains();
  }

  @Put('approval-chains')
  @ApiOperation({ summary: 'Upsert approval chain by requestType' })
  upsertChain(@Body() dto: UpsertApprovalChainDto) {
    return this.settings.upsertChain(dto);
  }

  @Get('letter-templates')
  @ApiOperation({ summary: 'List letter templates' })
  listLetters() {
    return this.settings.listLetters();
  }

  @Get('letter-templates/:id')
  @ApiOperation({ summary: 'Get letter template' })
  getLetter(@Param('id') id: string) {
    return this.settings.getLetter(id);
  }

  @Post('letter-templates')
  @ApiOperation({ summary: 'Create letter template' })
  createLetter(@Body() dto: CreateLetterTemplateDto) {
    return this.settings.createLetter(dto);
  }

  @Patch('letter-templates/:id')
  @ApiOperation({ summary: 'Update letter template' })
  updateLetter(@Param('id') id: string, @Body() dto: UpdateLetterTemplateDto) {
    return this.settings.updateLetter(id, dto);
  }

  @Delete('letter-templates/:id')
  @ApiOperation({ summary: 'Delete letter template' })
  deleteLetter(@Param('id') id: string) {
    return this.settings.deleteLetter(id);
  }

  @Get('welcome-template')
  @ApiOperation({ summary: 'Get PlatformSettings.welcomeTemplate' })
  getWelcome() {
    return this.settings.getWelcome();
  }

  @Patch('welcome-template')
  @ApiOperation({ summary: 'Patch PlatformSettings.welcomeTemplate' })
  patchWelcome(@Body() dto: PatchWelcomeTemplateDto) {
    return this.settings.patchWelcome(dto);
  }
}
