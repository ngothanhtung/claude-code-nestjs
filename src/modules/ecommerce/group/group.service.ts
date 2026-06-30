import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';
import { Group } from './group.entity';
import { CreateGroupDto } from './dto/create-group.dto';
import { UpdateGroupDto } from './dto/update-group.dto';

@Injectable()
export class GroupService {
  constructor(
    @InjectRepository(Group) private readonly repo: Repository<Group>,
  ) {}

  async create(dto: CreateGroupDto): Promise<Group> {
    const existing = await this.repo.findOne({ where: { name: dto.name } });
    if (existing) {
      throw new ConflictException('Group with this name already exists');
    }
    const group = this.repo.create(dto);
    return this.repo.save(group);
  }

  async findAll(): Promise<Group[]> {
    return this.repo.find({
      where: { deletedAt: IsNull() },
      order: { name: 'ASC' },
      relations: ['posts'],
    });
  }

  async findById(id: string): Promise<Group> {
    const group = await this.repo.findOne({
      where: { id, deletedAt: IsNull() },
      relations: ['posts'],
    });
    if (!group) {
      throw new NotFoundException(`Group with ID "${id}" not found`);
    }
    return group;
  }

  async update(id: string, dto: UpdateGroupDto): Promise<Group> {
    const group = await this.findById(id);
    Object.assign(group, dto);
    return this.repo.save(group);
  }

  async remove(id: string): Promise<void> {
    const result = await this.repo.update(id, { deletedAt: new Date() });
    if (result.affected === 0) {
      throw new NotFoundException(`Group with ID "${id}" not found`);
    }
  }

  async restore(id: string): Promise<Group> {
    const result = await this.repo.update(id, { deletedAt: null });
    if (result.affected === 0) {
      throw new NotFoundException(`Group with ID "${id}" not found`);
    }
    return this.findById(id);
  }
}
