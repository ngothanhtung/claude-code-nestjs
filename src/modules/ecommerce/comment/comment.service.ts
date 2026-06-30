import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';
import { Comment } from './comment.entity';
import { CreateCommentDto } from './dto/create-comment.dto';
import { UpdateCommentDto } from './dto/update-comment.dto';

@Injectable()
export class CommentService {
  constructor(
    @InjectRepository(Comment) private readonly repo: Repository<Comment>,
  ) {}

  async create(dto: CreateCommentDto): Promise<Comment> {
    const comment = this.repo.create(dto);
    return this.repo.save(comment);
  }

  async findAll(): Promise<Comment[]> {
    return this.repo.find({
      where: { deletedAt: IsNull() },
      order: { createdAt: 'DESC' },
      relations: ['post'],
    });
  }

  async findById(id: string): Promise<Comment> {
    const comment = await this.repo.findOne({
      where: { id, deletedAt: IsNull() },
      relations: ['post'],
    });
    if (!comment) {
      throw new NotFoundException(`Comment with ID "${id}" not found`);
    }
    return comment;
  }

  async findByPostId(postId: string): Promise<Comment[]> {
    return this.repo.find({
      where: { postId, deletedAt: IsNull() },
      order: { createdAt: 'DESC' },
    });
  }

  async update(id: string, dto: UpdateCommentDto): Promise<Comment> {
    const comment = await this.findById(id);
    Object.assign(comment, dto);
    return this.repo.save(comment);
  }

  async remove(id: string): Promise<void> {
    const result = await this.repo.update(id, { deletedAt: new Date() });
    if (result.affected === 0) {
      throw new NotFoundException(`Comment with ID "${id}" not found`);
    }
  }

  async restore(id: string): Promise<Comment> {
    const result = await this.repo.update(id, { deletedAt: null });
    if (result.affected === 0) {
      throw new NotFoundException(`Comment with ID "${id}" not found`);
    }
    return this.findById(id);
  }
}
