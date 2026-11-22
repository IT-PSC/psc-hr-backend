import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsOptional, IsString } from 'class-validator';

export class FileListQueryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  employeeId?: string;
}

export class UploadFileMetaDto {
  @ApiPropertyOptional({ description: 'Attach to employee profile' })
  @IsOptional()
  @IsString()
  employeeId?: string;

  @ApiPropertyOptional({
    enum: ['contract', 'id_card', 'cv', 'certificate', 'other'],
    default: 'other',
  })
  @IsOptional()
  @IsString()
  docType?: string;

  @ApiPropertyOptional({
    enum: ['hr_only', 'employee_visible'],
    default: 'hr_only',
  })
  @IsOptional()
  @IsString()
  visibility?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  expiryDate?: string;
}
