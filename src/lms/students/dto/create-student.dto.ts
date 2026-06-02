import { Transform } from 'class-transformer';
import {
  IsDateString,
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

export class CreateStudentDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  @Transform(({ value }) => value?.trim())
  firstName!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  @Transform(({ value }) => value?.trim())
  lastName!: string;

  @IsEmail()
  @MaxLength(150)
  @Transform(({ value }) => value?.trim().toLowerCase())
  email!: string;

  @IsOptional()
  @IsString()
  @MaxLength(30)
  @Transform(({ value }) => value?.trim())
  phone?: string;

  @IsOptional()
  @IsDateString()
  dateOfBirth?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  @Transform(({ value }) => value?.trim())
  status?: string;
}
