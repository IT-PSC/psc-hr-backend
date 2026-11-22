import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { RequirePermission } from '../../common/decorators/roles.decorator';
import type { JwtPayload } from '../../common/roles/types';
import {
  AddMessageDto,
  CreateTicketDto,
  UpdateTicketDto,
} from './dto/helpdesk.dto';
import { HelpdeskService } from './helpdesk.service';

@ApiTags('Helpdesk')
@ApiBearerAuth()
@Controller('helpdesk')
export class HelpdeskController {
  constructor(private readonly helpdesk: HelpdeskService) {}

  @Get('tickets')
  @RequirePermission('helpdesk', 'view')
  @ApiOperation({ summary: 'List helpdesk tickets' })
  list(@CurrentUser() user: JwtPayload) {
    return this.helpdesk.list(user);
  }

  @Post('tickets')
  @RequirePermission('helpdesk', 'create')
  @ApiOperation({ summary: 'Create helpdesk ticket' })
  create(@Body() dto: CreateTicketDto, @CurrentUser() user: JwtPayload) {
    return this.helpdesk.create(dto, user);
  }

  @Get('tickets/:id')
  @RequirePermission('helpdesk', 'view')
  @ApiOperation({ summary: 'Get ticket + messages' })
  getOne(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.helpdesk.getOne(id, user);
  }

  @Patch('tickets/:id')
  @RequirePermission('helpdesk', 'edit')
  @ApiOperation({ summary: 'Update ticket status/assignee' })
  update(
    @Param('id') id: string,
    @Body() dto: UpdateTicketDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.helpdesk.update(id, dto, user);
  }

  @Post('tickets/:id/messages')
  @RequirePermission('helpdesk', 'view')
  @ApiOperation({ summary: 'Add message to ticket' })
  addMessage(
    @Param('id') id: string,
    @Body() dto: AddMessageDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.helpdesk.addMessage(id, dto, user);
  }
}
