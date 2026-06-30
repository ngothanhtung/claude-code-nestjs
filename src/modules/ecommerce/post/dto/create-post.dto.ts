import { Transform } from 'class-transformer';
import {
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PostStatus } from '../post.entity';

export class CreatePostDto {
  @ApiProperty({ example: 'My First Post', description: 'Post title', maxLength: 200 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  @Transform(({ value }) => value?.trim())
  title!: string;

  @ApiProperty({ example: 'John Doe', description: 'Post author', maxLength: 100 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  @Transform(({ value }) => value?.trim())
  author!: string;

  @ApiPropertyOptional({ enum: PostStatus, example: PostStatus.DRAFT, description: 'Post status' })
  @IsOptional()
  @IsEnum(PostStatus)
  status?: PostStatus;

  @ApiProperty({ example: 'admin', description: 'Creator username', maxLength: 100 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  @Transform(({ value }) => value?.trim())
  createdBy!: string;

  @ApiPropertyOptional({ type: [String], example: ['d290f1ee-6c54-4b01-90e6-d701748f0851'], description: 'Array of group UUIDs to assign' })
  @IsOptional()
  @IsUUID('4', { each: true })
  group_ids?: string[];
}
