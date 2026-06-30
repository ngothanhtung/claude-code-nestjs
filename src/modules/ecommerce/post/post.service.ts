import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull, In } from 'typeorm';
import { Post } from './post.entity';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { Group } from '../group/group.entity';

@Injectable()
export class PostService {
  constructor(
    @InjectRepository(Post) private readonly repo: Repository<Post>,
    @InjectRepository(Group) private readonly groupRepo: Repository<Group>,
  ) {}

  async create(dto: CreatePostDto): Promise<Post> {
    const { group_ids, ...data } = dto;
    const post = this.repo.create(data);

    if (group_ids?.length) {
      post.groups = await this.groupRepo.findBy({ id: In(group_ids) });
    }

    return this.repo.save(post);
  }

  async findAll(): Promise<Post[]> {
    return this.repo.find({
      where: { deletedAt: IsNull() },
      order: { createdAt: 'DESC' },
      relations: ['comments', 'groups'],
    });
  }

  async findById(id: string): Promise<Post> {
    const post = await this.repo.findOne({
      where: { id, deletedAt: IsNull() },
      relations: ['comments', 'groups'],
    });
    if (!post) {
      throw new NotFoundException(`Post with ID "${id}" not found`);
    }
    return post;
  }

  async update(id: string, dto: UpdatePostDto): Promise<Post> {
    const post = await this.findById(id);
    const { group_ids, ...data } = dto;

    Object.assign(post, data);

    if (group_ids) {
      post.groups = group_ids.length
        ? await this.groupRepo.findBy({ id: In(group_ids) })
        : [];
    }

    return this.repo.save(post);
  }

  async updateGroups(id: string, group_ids: string[]): Promise<Post> {
    const post = await this.findById(id);
    post.groups = group_ids.length
      ? await this.groupRepo.findBy({ id: In(group_ids) })
      : [];
    return this.repo.save(post);
  }

  async remove(id: string): Promise<void> {
    const result = await this.repo.update(id, { deletedAt: new Date() });
    if (result.affected === 0) {
      throw new NotFoundException(`Post with ID "${id}" not found`);
    }
  }

  async restore(id: string): Promise<Post> {
    const result = await this.repo.update(id, { deletedAt: null });
    if (result.affected === 0) {
      throw new NotFoundException(`Post with ID "${id}" not found`);
    }
    return this.findById(id);
  }
}
