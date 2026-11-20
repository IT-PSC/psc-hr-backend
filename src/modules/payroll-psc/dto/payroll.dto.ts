import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsString, Matches, Min } from 'class-validator';

export class CreatePayrollRunDto {
  @ApiProperty({ example: '2026-10' })
  @IsString()
  @Matches(/^\d{4}-\d{2}$/)
  periodYm!: string;

  @ApiProperty({ example: 89000 })
  @IsNumber()
  @Min(0)
  totalAmount!: number;
}
