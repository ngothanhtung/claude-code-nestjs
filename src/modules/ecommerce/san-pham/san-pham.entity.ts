import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  VersionColumn,
  DeleteDateColumn,
} from 'typeorm';

@Entity('san_pham')
export class SanPham {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'ten_san_pham', length: 100 })
  tenSanPham!: string;

  @Column({
    name: 'don_gia',
    type: 'decimal',
    precision: 10,
    scale: 2,
    transformer: { to: (v: number) => v, from: (v: string) => parseFloat(v) },
  })
  donGia!: number;

  @Column({
    name: 'ty_le_giam_gia',
    type: 'decimal',
    precision: 5,
    scale: 2,
    default: 0,
    transformer: { to: (v: number) => v, from: (v: string) => parseFloat(v) },
  })
  tyLeGiamGia!: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', nullable: true })
  updatedAt?: Date;

  @DeleteDateColumn({ name: 'deleted_at', nullable: true })
  deletedAt?: Date;

  @VersionColumn()
  version!: number;
}
