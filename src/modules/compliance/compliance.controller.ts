import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { RequirePermission } from '../../common/decorators/roles.decorator';
import { ComplianceService } from './compliance.service';
import {
  CreateComplianceItemDto,
  UpdateComplianceItemDto,
} from './dto/compliance.dto';

@ApiTags('Reports & Compliance')
@ApiBearerAuth()
@Controller('compliance')
export class ComplianceController {
  constructor(private readonly compliance: ComplianceService) {}

  @Get('items')
  @RequirePermission('compliance', 'view')
  @ApiOperation({ summary: 'List compliance register items' })
  list(@Query('status') status?: string, @Query('category') category?: string) {
    return this.compliance.list(status, category);
  }

  @Post('items')
  @RequirePermission('compliance', 'edit')
  @ApiOperation({ summary: 'Create a compliance register item' })
  create(@Body() dto: CreateComplianceItemDto) {
    return this.compliance.create(dto);
  }

  @Patch('items/:id')
  @RequirePermission('compliance', 'edit')
  @ApiOperation({ summary: 'Update a compliance register item' })
  update(@Param('id') id: string, @Body() dto: UpdateComplianceItemDto) {
    return this.compliance.update(id, dto);
  }

  @Delete('items/:id')
  @RequirePermission('compliance', 'edit')
  @ApiOperation({ summary: 'Delete a compliance register item' })
  remove(@Param('id') id: string) {
    return this.compliance.remove(id);
  }

  @Get('live-gaps')
  @RequirePermission('compliance', 'view')
  @ApiOperation({
    summary:
      'Live gaps: expiring documents, missing contracts, overdue probation, NSSF, unsigned policies',
  })
  liveGaps() {
    return this.compliance.liveGaps();
  }
}
