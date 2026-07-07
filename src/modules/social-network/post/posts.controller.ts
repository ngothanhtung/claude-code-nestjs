import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import {
  ApiCreatedResponse,
  ApiNoContentResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';

import { ParseMongoIdPipe } from '@common/pipes/validation.pipe';

import { CreatePostDto } from './dto/create-post.dto';
import { FindPostsQueryDto } from './dto/find-posts-query.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { PaginatedPosts, PostResponse, PostsService } from './posts.service';

@ApiTags('Social Network - Posts')
@Controller('posts')
export class PostsController {
  constructor(private readonly postsService: PostsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a social-network post' })
  @ApiCreatedResponse({ description: 'Post created successfully' })
  create(@Body() dto: CreatePostDto): Promise<PostResponse> {
    return this.postsService.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'Get social-network posts' })
  @ApiOkResponse({ description: 'Posts returned successfully' })
  findAll(@Query() query: FindPostsQueryDto): Promise<PaginatedPosts> {
    return this.postsService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a social-network post by ID' })
  @ApiOkResponse({ description: 'Post returned successfully' })
  findOne(@Param('id', ParseMongoIdPipe) id: string): Promise<PostResponse> {
    return this.postsService.findById(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a social-network post' })
  @ApiOkResponse({ description: 'Post updated successfully' })
  update(
    @Param('id', ParseMongoIdPipe) id: string,
    @Body() dto: UpdatePostDto,
  ): Promise<PostResponse> {
    return this.postsService.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Soft-delete a social-network post' })
  @ApiNoContentResponse({ description: 'Post deleted successfully' })
  remove(@Param('id', ParseMongoIdPipe) id: string): Promise<void> {
    return this.postsService.remove(id);
  }

  @Post(':id/like')
  @ApiOperation({ summary: 'Increment post like count' })
  @ApiOkResponse({ description: 'Like count incremented successfully' })
  like(@Param('id', ParseMongoIdPipe) id: string): Promise<PostResponse> {
    return this.postsService.like(id);
  }

  @Post(':id/comment')
  @ApiOperation({ summary: 'Increment post comment count' })
  @ApiOkResponse({ description: 'Comment count incremented successfully' })
  comment(@Param('id', ParseMongoIdPipe) id: string): Promise<PostResponse> {
    return this.postsService.comment(id);
  }

  @Post(':id/share')
  @ApiOperation({ summary: 'Increment post share count' })
  @ApiOkResponse({ description: 'Share count incremented successfully' })
  share(@Param('id', ParseMongoIdPipe) id: string): Promise<PostResponse> {
    return this.postsService.share(id);
  }
}
