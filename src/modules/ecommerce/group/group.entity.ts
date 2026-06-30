import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToMany,
  JoinTable,
} from 'typeorm';
import { ApiProperty, ApiHideProperty } from '@nestjs/swagger';
import { Post } from '../post/post.entity';

@Entity('groups')
export class Group {
  @ApiProperty({ example: 'd290f1ee-6c54-4b01-90e6-d701748f0851', description: 'UUID identifier' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({ example: 'Technology', description: 'Group name', maxLength: 200 })
  @Column({ length: 200 })
  name: string;

  @ApiProperty({ type: () => [Post], description: 'Posts in this group' })
  @ManyToMany(() => Post, (post) => post.groups)
  @JoinTable({
    name: 'group_posts',
    joinColumn: { name: 'group_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'post_id', referencedColumnName: 'id' },
  })
  posts: Post[];

  @ApiProperty({ example: '2026-06-18T10:00:00.000Z', description: 'Creation timestamp' })
  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @ApiHideProperty()
  @Column({ name: 'deleted_at', type: 'timestamp', nullable: true })
  deletedAt: Date | null;
}
