import { Module } from '@nestjs/common';
import { ApSpecialtyController } from './ap-specialty.controller';
import { ApSpecialtyService } from './ap-specialty.service';

@Module({
  controllers: [ApSpecialtyController],
  providers: [ApSpecialtyService],
})
export class ApSpecialtyModule {}
