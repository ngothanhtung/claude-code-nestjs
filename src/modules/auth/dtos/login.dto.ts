import { IsNotEmpty, MaxLength, MinLength } from 'class-validator';

import { ApiProperty } from '@nestjs/swagger';

export class LoginDto {
  @ApiProperty({ example: 'tungnt@softech.vn', description: 'Email or username', maxLength: 30, minLength: 3 })
  @IsNotEmpty()
  @MinLength(3)
  @MaxLength(30)
  username: string;

  @ApiProperty({ example: '123456789', maxLength: 30, minLength: 3 })
  @IsNotEmpty()
  @MinLength(3)
  @MaxLength(30)
  password: string;
}

export class RegisterDto {
  @ApiProperty({ example: 'tungnt@softech.vn', description: 'Email or username', maxLength: 30, minLength: 3 })
  @IsNotEmpty()
  @MinLength(3)
  @MaxLength(30)
  username: string;

  @ApiProperty({ example: '123456789', maxLength: 30, minLength: 3 })
  @IsNotEmpty()
  @MinLength(3)
  @MaxLength(30)
  password: string;

  @ApiProperty({ example: '123456789', maxLength: 30, minLength: 3 })
  @IsNotEmpty()
  @MinLength(3)
  @MaxLength(30)
  confirmPassword: string;
}
