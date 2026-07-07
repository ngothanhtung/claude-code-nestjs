import { BaseEntity as TypeOrmBaseEntity, Column, CreateDateColumn, DeleteDateColumn, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

export class BaseEntity extends TypeOrmBaseEntity {
  @PrimaryGeneratedColumn('increment', { name: 'id' })
  id: number;

  @CreateDateColumn()
  created_time!: Date;

  @UpdateDateColumn()
  updated_time!: Date;

  @DeleteDateColumn()
  deleted_time?: Date;

  @Column({ nullable: true })
  created_by?: number;

  @Column({ nullable: true })
  updated_by?: number;

  @Column({ nullable: true })
  deleted_by?: number;
}
