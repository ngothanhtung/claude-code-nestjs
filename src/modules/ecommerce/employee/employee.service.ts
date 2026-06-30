import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull, Not } from 'typeorm';
import { Employee } from './employee.entity';
import { CreateEmployeeDto } from './dto/create-employee.dto';
import { UpdateEmployeeDto } from './dto/update-employee.dto';

@Injectable()
export class EmployeeService {
  constructor(
    @InjectRepository(Employee) private readonly repo: Repository<Employee>,
  ) {}

  async create(dto: CreateEmployeeDto): Promise<Employee> {
    await this.checkDuplicateEmail(dto.email);

    const employee = this.repo.create(dto);
    return this.repo.save(employee);
  }

  findAll(): Promise<Employee[]> {
    return this.repo.find({
      where: { deletedAt: IsNull() },
      order: { name: 'ASC' },
    });
  }

  async findById(id: string): Promise<Employee> {
    const employee = await this.repo.findOne({
      where: { id, deletedAt: IsNull() },
    });
    if (!employee) {
      throw new NotFoundException(`Employee with ID "${id}" not found`);
    }
    return employee;
  }

  async update(id: string, dto: UpdateEmployeeDto): Promise<Employee> {
    const employee = await this.findById(id);

    if (dto.email !== undefined) {
      await this.checkDuplicateEmail(dto.email, id);
    }

    Object.assign(employee, dto);
    return this.repo.save(employee);
  }

  async remove(id: string): Promise<void> {
    const result = await this.repo.update(id, { deletedAt: new Date() });
    if (result.affected === 0) {
      throw new NotFoundException(`Employee with ID "${id}" not found`);
    }
  }

  async restore(id: string): Promise<Employee> {
    const result = await this.repo.update(id, { deletedAt: null });
    if (result.affected === 0) {
      throw new NotFoundException(`Employee with ID "${id}" not found`);
    }
    return this.findById(id);
  }

  private async checkDuplicateEmail(
    email: string,
    excludeId?: string,
  ): Promise<void> {
    const where: any = { email };
    if (excludeId) where.id = Not(excludeId);
    const existing = await this.repo.findOne({ where });
    if (existing) {
      throw new ConflictException('Email already exists');
    }
  }
}
