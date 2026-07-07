import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

import { ApiProperty, ApiSchema, OmitType, PartialType } from '@nestjs/swagger';

@ApiSchema({ name: 'UserDto', description: 'Data Transfer Object for User' })
export class UserDto {
  @ApiProperty({
    description: 'ID of the user',
    example: 1,
  })
  id: number;

  @ApiProperty({
    description: 'Full name of the user',
    example: 'John Doe',
  })
  @IsOptional()
  @IsString()
  fullName?: string;

  @ApiProperty({
    description: 'Username of the user',
    example: 'johndoe',
  })
  @IsNotEmpty()
  @IsString()
  username: string;
}

export class CreateUserDto extends OmitType(UserDto, ['id'] as const) {}
export class UpdateUserDto extends PartialType(CreateUserDto) {}
