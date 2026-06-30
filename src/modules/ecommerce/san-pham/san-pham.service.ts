import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';
import { SanPham } from './san-pham.entity';
import { CreateSanPhamDto } from './dto/create-san-pham.dto';
import { UpdateSanPhamDto } from './dto/update-san-pham.dto';

@Injectable()
export class SanPhamService {
  constructor(
    @InjectRepository(SanPham) private readonly repo: Repository<SanPham>,
  ) {}

  async create(dto: CreateSanPhamDto): Promise<SanPham> {
    const sanPham = this.repo.create(dto);
    return this.repo.save(sanPham);
  }

  async findAll(
    limit: number = 20,
    offset: number = 0,
  ): Promise<[SanPham[], number]> {
    const [data, total] = await this.repo.findAndCount({
      where: { deletedAt: IsNull() },
      order: { createdAt: 'DESC' },
      take: limit,
      skip: offset,
    });
    return [data, total];
  }

  async findById(id: string): Promise<SanPham> {
    const sanPham = await this.repo.findOne({
      where: { id, deletedAt: IsNull() },
    });
    if (!sanPham) {
      throw new NotFoundException(`SanPham with ID "${id}" not found`);
    }
    return sanPham;
  }

  async update(id: string, dto: UpdateSanPhamDto): Promise<SanPham> {
    const sanPham = await this.findById(id);
    Object.assign(sanPham, dto);
    return this.repo.save(sanPham);
  }

  async remove(id: string): Promise<void> {
    const result = await this.repo.update(id, { deletedAt: new Date() });
    if (result.affected === 0) {
      throw new NotFoundException(`SanPham with ID "${id}" not found`);
    }
  }

  async restore(id: string): Promise<SanPham> {
    const result = await this.repo.update(id, { deletedAt: undefined });
    if (result.affected === 0) {
      throw new NotFoundException(`SanPham with ID "${id}" not found`);
    }
    return this.findById(id);
  }
}
