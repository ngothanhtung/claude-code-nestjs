/* eslint-disable @typescript-eslint/no-unsafe-argument */
import {
  BadRequestException,
  HttpStatus,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { User } from '../entities/user.entity';

import { instanceToPlain } from 'class-transformer';

@Injectable()
export class UsersService {
  constructor(
    @InjectDataSource() private dataSource: DataSource,
    @InjectRepository(User)
    private repository: Repository<User>,
  ) {}

  create(user: any): Promise<User> {
    return this.repository.save(user);
  }

  async findAll(): Promise<any[]> {
    const users = await this.repository.find();
    return users.map((user: User) => instanceToPlain(user));
  }

  async findOne(id: number): Promise<any> {
    const user = await this.repository.findOne({
      where: { id },
      relations: ['roles'],
    });
    return user ? instanceToPlain(user) : null;
  }

  async delete(id: number): Promise<void> {
    const user = await this.repository.findOneBy({ id });
    if (!user) {
      throw new BadRequestException({
        statusCode: HttpStatus.BAD_REQUEST,
        message: ['User not found'],
        error: 'Bad Request',
      });
    }
    await this.repository.delete(id);
  }

  async update(id: number, data: any): Promise<User> {
    const user = await this.repository.findOneBy({ id });
    if (!user) {
      throw new BadRequestException({
        statusCode: HttpStatus.BAD_REQUEST,
        message: ['User not found'],
        error: 'Bad Request',
      });
    }

    await this.repository.update(id, data);
    return this.repository.findOneBy({ id });
  }

  // ------------------------------------------------------------------------------------------------
  async findByUserName(username: string): Promise<any> {
    const user = await this.repository.findOne({
      where: { username },
      relations: ['roles'],
    });
    return user ? instanceToPlain(user) : null;
  }

  // ------------------------------------------------------------------------------------------------
  async findByUserNameForLogin(username: string): Promise<User> {
    return await this.repository.findOne({
      where: { username },
      relations: ['roles'],
    });
  }

  // ------------------------------------------------------------------------------------------------
  async findByRole(roleId: number): Promise<any[]> {
    const users = await this.repository.find({
      where: { roles: { id: roleId } },
      relations: ['roles'],
    });
    return users.map((user) => instanceToPlain(user));
  }

  // ------------------------------------------------------------------------------------------------
  //* ADD ROLES TO USER
  // ------------------------------------------------------------------------------------------------
  async addRolesToUser({
    user_id,
    role_ids,
  }: {
    user_id: number;
    role_ids: number[];
  }): Promise<any> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    try {
      await queryRunner.manager.query(
        `DELETE FROM users_roles WHERE userId = ${user_id} AND roleId IN (${role_ids.join(',')})`,
      );
      await queryRunner.manager.query(
        `INSERT INTO users_roles (roleId, userId) VALUES ${role_ids.map((id) => `(${id}, ${user_id})`).join(',')}`,
      );
      await queryRunner.commitTransaction();
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw new InternalServerErrorException({
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: [error.message],
        error: 'Internal Server Error',
      });
    } finally {
      await queryRunner.release();
    }
  }

  // ------------------------------------------------------------------------------------------------
  //* REMOVE ROLES FROM USER
  // ------------------------------------------------------------------------------------------------
  async removeRolesFromUser({
    user_id,
    role_ids,
  }: {
    user_id: number;
    role_ids: number[];
  }): Promise<any> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    try {
      await queryRunner.manager.query(
        `DELETE FROM users_roles WHERE userId = ${user_id} AND roleId IN (${role_ids.join(',')})`,
      );
      await queryRunner.commitTransaction();
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw new InternalServerErrorException({
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: [error.message],
        error: 'Internal Server Error',
      });
    } finally {
      await queryRunner.release();
    }
  }
}
