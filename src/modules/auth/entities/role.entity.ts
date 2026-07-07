import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToMany,
  JoinTable,
} from 'typeorm';
import { User } from './user.entity';

@Entity({ name: 'roles' })
export class Role {
  @PrimaryGeneratedColumn({ name: 'id' })
  id: number;

  @Column({ name: 'code', unique: true, length: 50, nullable: false })
  code: string;

  @Column({ name: 'name', length: 100 })
  name: string;

  @Column({ name: 'description', length: 500, nullable: true })
  description?: string;

  @ManyToMany(() => User, (x) => x.roles)
  @JoinTable({
    name: 'roles_users',
    joinColumn: { name: 'role_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'user_id', referencedColumnName: 'id' },
  })
  users?: User[];
}
