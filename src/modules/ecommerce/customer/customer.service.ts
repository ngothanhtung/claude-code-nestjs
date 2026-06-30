import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull, Not } from 'typeorm';
import { Customer } from './customer.entity';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';

@Injectable()
export class CustomerService {
  constructor(
    @InjectRepository(Customer) private readonly repo: Repository<Customer>,
  ) {}

  async create(dto: CreateCustomerDto): Promise<Customer> {
    await this.checkDuplicateFields(dto);

    const customer = this.repo.create(dto);
    return this.repo.save(customer);
  }

  findAll(): Promise<Customer[]> {
    return this.repo.find({
      where: { deletedAt: IsNull() },
      order: { name: 'ASC' },
    });
  }

  async findById(id: string): Promise<Customer> {
    const customer = await this.repo.findOne({
      where: { id, deletedAt: IsNull() },
    });
    if (!customer) {
      throw new NotFoundException(`Customer with ID "${id}" not found`);
    }
    return customer;
  }

  async update(id: string, dto: UpdateCustomerDto): Promise<Customer> {
    const customer = await this.findById(id);

    if (dto.email !== undefined || dto.phone !== undefined) {
      await this.checkDuplicateFields(dto, id);
    }

    Object.assign(customer, dto);
    return this.repo.save(customer);
  }

  async remove(id: string): Promise<void> {
    const result = await this.repo.update(id, { deletedAt: new Date() });
    if (result.affected === 0) {
      throw new NotFoundException(`Customer with ID "${id}" not found`);
    }
  }

  async restore(id: string): Promise<Customer> {
    const result = await this.repo.update(id, { deletedAt: null });
    if (result.affected === 0) {
      throw new NotFoundException(`Customer with ID "${id}" not found`);
    }
    return this.findById(id);
  }

  private async checkDuplicateFields(
    dto: Partial<CreateCustomerDto>,
    excludeId?: string,
  ): Promise<void> {
    if (dto.email) {
      const where: any = { email: dto.email };
      if (excludeId) where.id = Not(excludeId);
      const existing = await this.repo.findOne({ where });
      if (existing) {
        throw new ConflictException('Email already exists');
      }
    }

    if (dto.phone) {
      const where: any = { phone: dto.phone };
      if (excludeId) where.id = Not(excludeId);
      const existing = await this.repo.findOne({ where });
      if (existing) {
        throw new ConflictException('Phone number already exists');
      }
    }
  }
}
