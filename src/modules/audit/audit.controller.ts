import { Controller, Get, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { RequirePermission } from '../../common/decorators/roles.decorator';
import { AuditService } from './audit.service';
import { AuditQueryDto } from './dto/audit.dto';

@ApiTags('Reports & Compliance')
@ApiBearerAuth()
@Controller('audit')
export class AuditController {
  constructor(private readonly audit: AuditService) {}

  @Get('export')
  @RequirePermission('audit_log', 'view')
  @ApiOperation({ summary: 'Export audit log as CSV text' })
  export(@Query() query: AuditQueryDto) {
    return this.audit.export(query);
  }

  @Get()
  @RequirePermission('audit_log', 'view')
  @ApiOperation({ summary: 'Audit log with module, actor, date, and text filters' })
  list(@Query() query: AuditQueryDto) {
    return this.audit.list(query);
  }
}
