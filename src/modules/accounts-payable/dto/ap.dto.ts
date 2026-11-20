import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class CreateApDocumentDto {
  @ApiProperty({ example: 'AP-2026-001' })
  @IsString()
  docNumber!: string;

  @ApiProperty({ example: 'ABC Supplies' })
  @IsString()
  supplier!: string;

  @ApiProperty({ example: 1500 })
  @IsNumber()
  @Min(0)
  amount!: number;

  @ApiPropertyOptional({ example: 'USD' })
  @IsOptional()
  @IsString()
  currency?: string;
}
