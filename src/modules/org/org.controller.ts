import { Controller, Get } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { RequirePermission } from '../../common/decorators/roles.decorator';
import { OrgService } from './org.service';

@ApiTags('Org')
@ApiBearerAuth()
@Controller('org')
export class OrgController {
  constructor(private readonly org: OrgService) {}

  @Get('departments')
  @RequirePermission('organization', 'view')
  @ApiOperation({ summary: 'List departments' })
  departments() {
    return this.org.departments();
  }

  @Get('positions')
  @RequirePermission('organization', 'view')
  @ApiOperation({ summary: 'List positions' })
  positions() {
    return this.org.positions();
  }
}
