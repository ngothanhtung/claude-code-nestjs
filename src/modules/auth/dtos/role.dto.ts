import { IsArray, IsNotEmpty, IsOptional, IsString } from 'class-validator';

import { ApiProperty, OmitType, PartialType } from '@nestjs/swagger';
import { ApiSchema } from '@common/open-api';

@ApiSchema({ name: 'RoleDto', description: 'Data Transfer Object for Role' })
export class RoleDto {
  @ApiProperty({
    description: 'ID of the role to update',
    example: 1,
  })
  @IsNotEmpty()
  id: number;

  @ApiProperty({
    description: 'Code of the role',
    example: 'editor',
  })
  @IsString()
  @IsNotEmpty()
  code: string;

  @ApiProperty({
    description: 'Name of the role',
    example: 'Editor',
  })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    description: 'Description of the role',
    example: 'Can edit and publish content',
  })
  @IsString()
  @IsOptional()
  description?: string;
}

export class CreateRoleDto extends OmitType(RoleDto, ['id'] as const) {}

export class UpdateRoleDto extends PartialType(CreateRoleDto) {}
