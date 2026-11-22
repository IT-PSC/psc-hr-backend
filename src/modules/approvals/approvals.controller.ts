import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { IsOptional, IsString, MinLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { RequirePermission } from '../../common/decorators/roles.decorator';
import type { JwtPayload } from '../../common/roles/types';
import { DecisionDto } from './dto/approval.dto';
import { ApprovalsService } from './approvals.service';

class SubmitApprovalDto {
  @ApiProperty({ example: 'generic' })
  @IsString()
  @MinLength(1)
  type!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  summary?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  relatedId?: string;
}

@ApiTags('Approvals')
@ApiBearerAuth()
@Controller('approvals')
export class ApprovalsController {
  constructor(private readonly approvals: ApprovalsService) {}

  @Get()
  @RequirePermission('approvals', 'view')
  @ApiOperation({ summary: 'List approval requests (persisted, scoped)' })
  list(@CurrentUser() user: JwtPayload) {
    return this.approvals.list(user);
  }

  @Post()
  @RequirePermission('approvals', 'create')
  @ApiOperation({ summary: 'Submit approval request' })
  submit(@CurrentUser() user: JwtPayload, @Body() body: SubmitApprovalDto) {
    return this.approvals.submit(user, body);
  }

  @Post(':id/approve')
  @RequirePermission('approvals', 'approve')
  @ApiOperation({ summary: 'Approve request (applies leave side-effects)' })
  approve(
    @Param('id') id: string,
    @CurrentUser() user: JwtPayload,
    @Body() dto: DecisionDto,
  ) {
    return this.approvals.approve(id, user, dto.note);
  }

  @Post(':id/reject')
  @RequirePermission('approvals', 'approve')
  @ApiOperation({ summary: 'Reject request' })
  reject(
    @Param('id') id: string,
    @CurrentUser() user: JwtPayload,
    @Body() dto: DecisionDto,
  ) {
    return this.approvals.reject(id, user, dto.note);
  }

  @Post(':id/return')
  @RequirePermission('approvals', 'approve')
  @ApiOperation({ summary: 'Return request for edits' })
  returnForEdit(
    @Param('id') id: string,
    @CurrentUser() user: JwtPayload,
    @Body() dto: DecisionDto,
  ) {
    return this.approvals.returnForEdit(id, user, dto.note);
  }
}
