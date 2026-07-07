import {
  Controller,
  DefaultValuePipe,
  HttpCode,
  HttpStatus,
  ParseIntPipe,
  Post,
  Query,
} from '@nestjs/common';
import {
  ApiCreatedResponse,
  ApiOperation,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';

import { CreateMockPostsResult, MockService } from './mock.service';

@ApiTags('Social Network - Mock')
@Controller('mock')
export class MockController {
  constructor(private readonly mockService: MockService) {}

  @Post('posts')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create mock social-network posts' })
  @ApiQuery({ name: 'total', required: false, example: 100000 })
  @ApiQuery({ name: 'batchSize', required: false, example: 1000 })
  @ApiQuery({ name: 'authorCount', required: false, example: 1000 })
  @ApiCreatedResponse({ description: 'Mock posts created successfully' })
  createPosts(
    @Query('total', new DefaultValuePipe(100000), ParseIntPipe)
    total: number,
    @Query('batchSize', new DefaultValuePipe(1000), ParseIntPipe)
    batchSize: number,
    @Query('authorCount', new DefaultValuePipe(1000), ParseIntPipe)
    authorCount: number,
  ): Promise<CreateMockPostsResult> {
    return this.mockService.createPosts({
      total,
      batchSize,
      authorCount,
    });
  }
}
