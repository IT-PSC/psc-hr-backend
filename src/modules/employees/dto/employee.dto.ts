import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class EmployeeDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  employeeCode!: string;

  @ApiProperty()
  firstName!: string;

  @ApiProperty()
  lastName!: string;

  @ApiProperty()
  email!: string;

  @ApiPropertyOptional({ nullable: true })
  departmentId?: string | null;

  @ApiPropertyOptional({ nullable: true })
  positionId?: string | null;

  @ApiPropertyOptional({ nullable: true })
  managerId?: string | null;

  @ApiProperty()
  status!: string;
}
