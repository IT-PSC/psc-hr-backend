import { Module } from '@nestjs/common';
import { ProbationController } from './probation.controller';
import { ProbationService } from './probation.service';

@Module({
  controllers: [ProbationController],
  providers: [ProbationService],
  exports: [ProbationService],
})
export class ProbationModule {}
