import { Module } from '@nestjs/common';
import { EmployeeRelationsController } from './employee-relations.controller';
import { EmployeeRelationsService } from './employee-relations.service';

@Module({
  controllers: [EmployeeRelationsController],
  providers: [EmployeeRelationsService],
})
export class EmployeeRelationsModule {}
