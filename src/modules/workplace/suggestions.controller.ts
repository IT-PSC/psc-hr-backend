import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { RequirePermission } from '../../common/decorators/roles.decorator';
import type { JwtPayload } from '../../common/roles/types';
import {
  CreateSuggestionDto,
  UpdateSuggestionDto,
} from './dto/workplace.dto';
import { WorkplaceService } from './workplace.service';

@ApiTags('Workplace')
@ApiBearerAuth()
@Controller('suggestions')
export class SuggestionsController {
  constructor(private readonly workplace: WorkplaceService) {}

  @Get()
  @RequirePermission('suggestions', 'view')
  @ApiOperation({ summary: 'List suggestions' })
  list(@CurrentUser() user: JwtPayload) {
    return this.workplace.listSuggestions(user);
  }

  @Post()
  @RequirePermission('suggestions', 'create')
  @ApiOperation({ summary: 'Submit suggestion' })
  create(@Body() dto: CreateSuggestionDto, @CurrentUser() user: JwtPayload) {
    return this.workplace.createSuggestion(dto, user);
  }

  @Patch(':id')
  @RequirePermission('suggestions', 'edit')
  @ApiOperation({ summary: 'Update suggestion status/reply' })
  update(
    @Param('id') id: string,
    @Body() dto: UpdateSuggestionDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.workplace.updateSuggestion(id, dto, user);
  }
}
