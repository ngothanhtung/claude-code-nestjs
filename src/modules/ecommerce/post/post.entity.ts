import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  OneToMany,
  ManyToMany,
} from 'typeorm';
import { ApiProperty, ApiHideProperty } from '@nestjs/swagger';
import { Comment } from '../comment/comment.entity';
import { Group } from '../group/group.entity';

export enum PostStatus {
  DRAFT = 'draft',
  PUBLISHED = 'published',
}

@Entity('posts')
export class Post {
  @ApiProperty({
    example: 'd290f1ee-6c54-4b01-90e6-d701748f0851',
    description: 'UUID identifier',
  })
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ApiProperty({
    example: 'My First Post',
    description: 'Post title',
    maxLength: 200,
  })
  @Column({ length: 200 })
  title!: string;

  @ApiProperty({
    example: 'John Doe',
    description: 'Post author',
    maxLength: 100,
  })
  @Column({ length: 100 })
  author!: string;

  @ApiProperty({
    enum: PostStatus,
    example: PostStatus.DRAFT,
    description: 'Post status',
  })
  @Column({
    type: 'enum',
    enum: PostStatus,
    default: PostStatus.DRAFT,
  })
  status!: PostStatus;

  @ApiProperty({
    example: 'admin',
    description: 'Creator username',
    maxLength: 100,
  })
  @Column({ name: 'created_by', length: 100 })
  createdBy!: string;

  @ApiProperty({ type: () => [Comment], description: 'Comments on this post' })
  @OneToMany(() => Comment, (comment) => comment.post)
  comments!: Comment[];

  @ApiProperty({
    type: () => [Group],
    description: 'Groups this post belongs to',
  })
  @ManyToMany(() => Group, (group) => group.posts)
  groups!: Group[];

  @ApiProperty({
    example: '2026-06-18T10:00:00.000Z',
    description: 'Creation timestamp',
  })
  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @ApiHideProperty()
  @Column({ name: 'deleted_at', type: 'timestamp', nullable: true })
  deletedAt!: Date | null;
}
