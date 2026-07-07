import { ApiSchema } from '@common/open-api';
import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsNotEmpty } from 'class-validator';

@ApiSchema({ name: 'AddRolesToUserDto' })
export class AddRolesToUserDto {
  @ApiProperty({ type: [Number], description: 'Array of role IDs', example: [1, 2, 3] })
  @IsNotEmpty()
  @IsArray()
  role_ids: number[];
}

@ApiSchema({ name: 'RemoveRolesFromUserDto' })
export class RemoveRolesFromUserDto {
  @ApiProperty({ type: [Number], description: 'Array of role IDs', example: [1, 2, 3] })
  @IsNotEmpty()
  @IsArray()
  role_ids: number[];
}

@ApiSchema({ name: 'AddRoleToUserDto' })
export class AddRoleToUserDto {
  @ApiProperty({ type: Number, description: 'Role ID', example: 1 })
  @IsNotEmpty()
  role_id: number;
}

@ApiSchema({ name: 'RemoveRoleFromUserDto' })
export class RemoveRoleFromUserDto {
  @ApiProperty({ type: Number, description: 'Role ID', example: 1 })
  @IsNotEmpty()
  role_id: number;
}
