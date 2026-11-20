import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class DepartmentDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  code!: string;

  @ApiProperty()
  name!: string;

  @ApiPropertyOptional({ nullable: true })
  nameKm?: string | null;
}

export class PositionDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  code!: string;

  @ApiProperty()
  name!: string;

  @ApiPropertyOptional({ nullable: true })
  nameKm?: string | null;

  @ApiPropertyOptional({ nullable: true })
  departmentId?: string | null;
}
