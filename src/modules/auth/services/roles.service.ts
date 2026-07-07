import { Repository } from 'typeorm';

import { BadRequestException, HttpException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import { CreateRoleDto } from '../dtos/role.dto';
import { Role } from '../entities/role.entity';

@Injectable()
export class RolesService {
  constructor(
    @InjectRepository(Role)
    private rolesRepository: Repository<Role>,
  ) {}

  async create(role: CreateRoleDto): Promise<Role> {
    console.log(role);

    const found = await this.rolesRepository.findOne({
      where: { code: role.code },
    });

    if (found) {
      throw new BadRequestException({
        statusCode: 400,
        message: ['Role with this code already exists'],
        error: 'Bad Request',
      });
    }
    return this.rolesRepository.save(role);
  }

  async findAll(): Promise<Role[]> {
    return this.rolesRepository.find();
  }

  async findOne(id: number): Promise<Role> {
    return this.rolesRepository.findOneBy({ id });
  }

  async delete(id: number): Promise<void> {
    // Check foreign key constraints
    const role = await this.rolesRepository.findOne({ where: { id }, relations: ['users'] });
    if (role && role.users.length > 0) {
      throw new BadRequestException({
        statusCode: 400,
        message: ['Role is assigned to users and cannot be deleted'],
        error: 'Bad Request',
      });
    }
    await this.rolesRepository.delete(id);
  }

  async update(id: number, data: any): Promise<Role> {
    await this.rolesRepository.update(id, data);
    return this.rolesRepository.findOneBy({ id });
  }
}
