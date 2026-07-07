import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToMany,
  JoinTable,
} from 'typeorm';
import { Exclude } from 'class-transformer';
import { Role } from './role.entity';

@Entity({ name: 'users' })
export class User {
  @PrimaryGeneratedColumn({ name: 'Id' })
  id: number;

  @Column({ name: 'full_name', length: 200, nullable: true, default: '' })
  fullName?: string;

  @Column({
    name: 'username',
    unique: true,
    length: 100,
    type: 'varchar',
    nullable: false,
  })
  username: string;

  @Column({ name: 'password', length: 100, type: 'varchar', nullable: false })
  @Exclude()
  password: string;

  @Column({
    name: 'status',
    default: 'active',
    length: 20,
    type: 'varchar',
    nullable: true,
  })
  status?: string;

  @Column({ name: 'refresh_token', length: 500, nullable: true, default: '' })
  // @Exclude()
  refreshToken?: string;

  // ----------------------------------------------------------------------------------------------
  // RELATIONS
  // ----------------------------------------------------------------------------------------------
  // ROLES
  @ManyToMany(() => Role, (x) => x.users)
  @JoinTable({
    name: 'users_roles',
    joinColumn: { name: 'user_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'role_id', referencedColumnName: 'id' },
  })
  roles?: Role[];
}
