import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { RequirePermission } from '../../common/decorators/roles.decorator';
import type { JwtPayload } from '../../common/roles/types';
import { CreateKudosDto } from './dto/workplace.dto';
import { WorkplaceService } from './workplace.service';

@ApiTags('Workplace')
@ApiBearerAuth()
@Controller('recognition')
export class RecognitionController {
  constructor(private readonly workplace: WorkplaceService) {}

  @Get()
  @RequirePermission('recognition', 'view')
  @ApiOperation({ summary: 'List kudos' })
  list(@CurrentUser() user: JwtPayload) {
    return this.workplace.listKudos(user);
  }

  @Post()
  @RequirePermission('recognition', 'create')
  @ApiOperation({ summary: 'Give kudos' })
  create(@Body() dto: CreateKudosDto, @CurrentUser() user: JwtPayload) {
    return this.workplace.createKudos(dto, user);
  }

  @Patch(':id/hide')
  @RequirePermission('recognition', 'edit')
  @ApiOperation({ summary: 'Hide kudos item' })
  hide(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.workplace.hideKudos(id, user);
  }
}
