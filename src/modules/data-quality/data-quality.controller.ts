import { Controller, Get } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { RequirePermission } from '../../common/decorators/roles.decorator';
import { DataQualityService } from './data-quality.service';

@ApiTags('Reports & Compliance')
@ApiBearerAuth()
@Controller('data-quality')
export class DataQualityController {
  constructor(private readonly dataQuality: DataQualityService) {}

  @Get('scan')
  @RequirePermission('data_quality', 'view')
  @ApiOperation({ summary: 'Scan active employees for profile and contract gaps' })
  scan() {
    return this.dataQuality.scan();
  }
}
