import { IsString, IsNotEmpty, IsUUID, MaxLength } from 'class-validator';
import { Transform } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class CreateCommentDto {
  @ApiProperty({ example: 'Great post!', description: 'Comment content' })
  @IsString()
  @IsNotEmpty()
  @Transform(({ value }) => value?.trim())
  content!: string;

  @ApiProperty({ example: 'admin', description: 'Creator username', maxLength: 100 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  @Transform(({ value }) => value?.trim())
  createdBy!: string;

  @ApiProperty({ example: 'd290f1ee-6c54-4b01-90e6-d701748f0851', description: 'UUID of the parent post' })
  @IsUUID('4')
  postId!: string;
}
