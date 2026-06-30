import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { ApiProperty, ApiHideProperty } from '@nestjs/swagger';
import { Post } from '../post/post.entity';

@Entity('comments')
export class Comment {
  @ApiProperty({ example: 'd290f1ee-6c54-4b01-90e6-d701748f0851', description: 'UUID identifier' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({ example: 'Great post!', description: 'Comment content' })
  @Column({ type: 'text' })
  content: string;

  @ApiProperty({ example: 'admin', description: 'Creator username', maxLength: 100 })
  @Column({ name: 'created_by', length: 100 })
  createdBy: string;

  @ApiProperty({ example: 'd290f1ee-6c54-4b01-90e6-d701748f0851', description: 'UUID of the parent post' })
  @Column({ name: 'post_id', type: 'uuid' })
  postId: string;

  @ApiProperty({ type: () => Post, description: 'The parent post' })
  @ManyToOne(() => Post, (post) => post.comments)
  @JoinColumn({ name: 'post_id' })
  post: Post;

  @ApiProperty({ example: '2026-06-18T10:00:00.000Z', description: 'Creation timestamp' })
  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @ApiHideProperty()
  @Column({ name: 'deleted_at', type: 'timestamp', nullable: true })
  deletedAt: Date | null;
}
