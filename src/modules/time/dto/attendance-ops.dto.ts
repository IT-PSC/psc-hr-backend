import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsOptional, IsString, MinLength } from 'class-validator';

export class CreateAttendanceCorrectionDto {
  @ApiPropertyOptional({ description: 'Defaults to the signed-in employee' })
  @IsOptional()
  @IsString()
  employeeId?: string;

  @ApiProperty({ example: '2026-11-18' })
  @IsDateString()
  date!: string;

  @ApiProperty({ example: '08:05', description: 'HH:mm or ISO datetime' })
  @IsString()
  @MinLength(1)
  correctCheckIn!: string;

  @ApiProperty({ example: '17:10', description: 'HH:mm or ISO datetime' })
  @IsString()
  @MinLength(1)
  correctCheckOut!: string;

  @ApiProperty()
  @IsString()
  @MinLength(1)
  reason!: string;
}

export class CreateShiftSwapDto {
  @ApiProperty()
  @IsString()
  periodId!: string;

  @ApiProperty()
  @IsString()
  counterpartId!: string;

  @ApiProperty({ example: '2026-11-19' })
  @IsDateString()
  requesterDate!: string;

  @ApiProperty({ example: '2026-11-20' })
  @IsDateString()
  counterpartDate!: string;

  @ApiProperty()
  @IsString()
  @MinLength(1)
  reason!: string;
}
