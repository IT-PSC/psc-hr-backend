import { ApiProperty } from '@nestjs/swagger';
import { IsIn, IsString, MinLength } from 'class-validator';

export class PermissionItemDto {
  @ApiProperty({ example: 'employees' })
  @IsString()
  @MinLength(1)
  module!: string;

  @ApiProperty({
    enum: ['view', 'create', 'edit', 'delete', 'approve', 'export', 'manage_settings'],
  })
  @IsIn(['view', 'create', 'edit', 'delete', 'approve', 'export', 'manage_settings'])
  action!: 'view' | 'create' | 'edit' | 'delete' | 'approve' | 'export' | 'manage_settings';

  @ApiProperty({ enum: ['own', 'team', 'department', 'company'] })
  @IsIn(['own', 'team', 'department', 'company'])
  scope!: 'own' | 'team' | 'department' | 'company';
}
