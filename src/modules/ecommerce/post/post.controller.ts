import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  ParseUUIDPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { PostService } from './post.service';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { UpdatePostGroupsDto } from './dto/update-post-groups.dto';
import { Post as PostEntity } from './post.entity';

@Controller('posts')
export class PostController {
  constructor(private readonly service: PostService) {}

  @Post()
  create(@Body() dto: CreatePostDto): Promise<PostEntity> {
    return this.service.create(dto);
  }

  @Get()
  findAll(): Promise<PostEntity[]> {
    return this.service.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string): Promise<PostEntity> {
    return this.service.findById(id);
  }

  @Patch(':id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdatePostDto,
  ): Promise<PostEntity> {
    return this.service.update(id, dto);
  }

  @Patch(':id/groups')
  updateGroups(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdatePostGroupsDto,
  ): Promise<PostEntity> {
    return this.service.updateGroups(id, dto.group_ids ?? []);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    return this.service.remove(id);
  }

  @Patch(':id/restore')
  restore(@Param('id', ParseUUIDPipe) id: string): Promise<PostEntity> {
    return this.service.restore(id);
  }
}
