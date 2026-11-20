import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { RequirePermission } from '../../common/decorators/roles.decorator';
import type { JwtPayload } from '../../common/roles/types';
import { DecisionDto } from './dto/approval.dto';
import { ApprovalsService } from './approvals.service';

@ApiTags('Approvals')
@ApiBearerAuth()
@Controller('approvals')
export class ApprovalsController {
  constructor(private readonly approvals: ApprovalsService) {}

  @Get()
  @RequirePermission('approvals', 'view')
  @ApiOperation({ summary: 'List approval requests' })
  list() {
    return this.approvals.list();
  }

  @Post()
  @RequirePermission('approvals', 'create')
  @ApiOperation({ summary: 'Submit approval request' })
  submit(
    @CurrentUser() user: JwtPayload,
    @Body() body: { type: string; summary?: string },
  ) {
    return this.approvals.submit({
      type: body.type,
      summary: body.summary,
      requesterId: user.employeeId ?? user.sub,
    });
  }

  @Post(':id/approve')
  @RequirePermission('approvals', 'approve')
  @ApiOperation({ summary: 'Approve request' })
  approve(@Param('id') id: string, @Body() dto: DecisionDto) {
    return this.approvals.approve(id, dto.note);
  }

  @Post(':id/reject')
  @RequirePermission('approvals', 'approve')
  @ApiOperation({ summary: 'Reject request' })
  reject(@Param('id') id: string, @Body() dto: DecisionDto) {
    return this.approvals.reject(id, dto.note);
  }

  @Post(':id/return')
  @RequirePermission('approvals', 'approve')
  @ApiOperation({ summary: 'Return request for edits' })
  returnForEdit(@Param('id') id: string, @Body() dto: DecisionDto) {
    return this.approvals.returnForEdit(id, dto.note);
  }
}
