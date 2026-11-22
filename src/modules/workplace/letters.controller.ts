import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { RequirePermission } from '../../common/decorators/roles.decorator';
import type { JwtPayload } from '../../common/roles/types';
import { CreateLetterDto, UpdateLetterDto } from './dto/workplace.dto';
import { WorkplaceService } from './workplace.service';

@ApiTags('Workplace')
@ApiBearerAuth()
@Controller('letters')
export class LettersController {
  constructor(private readonly workplace: WorkplaceService) {}

  @Get()
  @RequirePermission('letters', 'view')
  @ApiOperation({ summary: 'List letter requests' })
  list(@CurrentUser() user: JwtPayload) {
    return this.workplace.listLetters(user);
  }

  @Post()
  @RequirePermission('letters', 'create')
  @ApiOperation({ summary: 'Request HR letter + pending approval' })
  create(@Body() dto: CreateLetterDto, @CurrentUser() user: JwtPayload) {
    return this.workplace.createLetter(dto, user);
  }

  @Patch(':id')
  @RequirePermission('letters', 'edit')
  @ApiOperation({ summary: 'Update letter status' })
  update(
    @Param('id') id: string,
    @Body() dto: UpdateLetterDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.workplace.updateLetter(id, dto, user);
  }
}
