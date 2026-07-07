import { Transform } from 'class-transformer';
import {
  IsArray,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

import { PostVisibility } from '../post.schema';

export class CreatePostDto {
  @ApiProperty({ example: '507f1f77bcf86cd799439011' })
  @IsString()
  @IsNotEmpty()
  @Transform(({ value }) => value?.trim())
  authorId: string;

  @ApiProperty({
    example: 'Today I learned something new about NestJS.',
    maxLength: 5000,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(5000)
  @Transform(({ value }) => value?.trim())
  content: string;

  @ApiPropertyOptional({
    type: [String],
    example: ['https://example.com/photo.jpg'],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  mediaUrls?: string[];

  @ApiPropertyOptional({
    enum: PostVisibility,
    example: PostVisibility.Public,
  })
  @IsOptional()
  @IsEnum(PostVisibility)
  visibility?: PostVisibility;
}
