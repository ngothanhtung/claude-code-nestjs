import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';
import { Product } from './product.entity';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { FindProductsQueryDto } from './dto/find-products-query.dto';

@Injectable()
export class ProductService {
  constructor(
    @InjectRepository(Product) private readonly repo: Repository<Product>,
  ) {}

  async create(dto: CreateProductDto): Promise<Product> {
    const product = this.repo.create(dto);
    return this.repo.save(product);
  }

  findAll(query: FindProductsQueryDto): Promise<[Product[], number]> {
    const { search, categoryId, limit = 20, offset = 0 } = query;
    const qb = this.repo
      .createQueryBuilder('product')
      .leftJoinAndSelect('product.category', 'category');

    if (search) {
      qb.andWhere(
        "to_tsvector('english', product.name || ' ' || COALESCE(product.description, '')) @@ plainto_tsquery('english', :search)",
        { search },
      );
    }

    if (categoryId) {
      qb.andWhere('product.category_id = :categoryId', { categoryId });
    }

    qb.andWhere('product.deleted_at IS NULL')
      .orderBy('product.createdAt', 'DESC')
      .skip(offset)
      .take(limit);

    return qb.getManyAndCount();
  }

  async findById(id: string): Promise<Product> {
    const product = await this.repo.findOne({
      where: { id, deletedAt: IsNull() },
      relations: ['category'],
    });
    if (!product) {
      throw new NotFoundException(`Product with ID "${id}" not found`);
    }
    return product;
  }

  async update(id: string, dto: UpdateProductDto): Promise<Product> {
    const product = await this.findById(id);
    Object.assign(product, dto);
    return this.repo.save(product);
  }

  async remove(id: string): Promise<void> {
    const result = await this.repo.update(id, { deletedAt: new Date() });
    if (result.affected === 0) {
      throw new NotFoundException(`Product with ID "${id}" not found`);
    }
  }

  async restore(id: string): Promise<Product> {
    const result = await this.repo.update(id, { deletedAt: null });
    if (result.affected === 0) {
      throw new NotFoundException(`Product with ID "${id}" not found`);
    }
    return this.findById(id);
  }
}
