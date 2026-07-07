import { Model, Types } from 'mongoose';

import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';

import { Post, PostDocument, PostVisibility } from './post/post.schema';

export interface CreateMockPostsOptions {
  total?: number;
  batchSize?: number;
  authorCount?: number;
}

export interface CreateMockPostsResult {
  inserted: number;
  total: number;
  batchSize: number;
  authorCount: number;
}

@Injectable()
export class MockService {
  private readonly contentTemplates = [
    'Just shipped a small feature and it feels great.',
    'Learning NestJS with MongoDB today.',
    'A quick note from my daily coding session.',
    'Building a social network feed prototype.',
    'Refactoring service logic into cleaner modules.',
    'Testing pagination performance with a larger dataset.',
    'Sharing a small backend development update.',
    'Designing APIs that are easy to consume.',
  ];

  private readonly mediaSamples = [
    'https://picsum.photos/seed/social-1/1200/800',
    'https://picsum.photos/seed/social-2/1200/800',
    'https://picsum.photos/seed/social-3/1200/800',
    'https://picsum.photos/seed/social-4/1200/800',
  ];

  constructor(
    @InjectModel(Post.name, 'social-network')
    private readonly postModel: Model<PostDocument>,
  ) {}

  async createPosts(
    options: CreateMockPostsOptions = {},
  ): Promise<CreateMockPostsResult> {
    const total = options.total ?? 100000;
    const batchSize = options.batchSize ?? 1000;
    const authorCount = options.authorCount ?? 1000;

    if (total <= 0 || batchSize <= 0 || authorCount <= 0) {
      throw new BadRequestException(
        'total, batchSize, and authorCount must be greater than 0',
      );
    }

    const authorIds = this.createAuthorIds(authorCount);

    let inserted = 0;

    while (inserted < total) {
      const currentBatchSize = Math.min(batchSize, total - inserted);
      const posts = Array.from({ length: currentBatchSize }, (_, index) =>
        this.createPost(inserted + index, authorIds),
      );

      await this.postModel.insertMany(posts, { ordered: false });
      inserted += currentBatchSize;
    }

    return {
      inserted,
      total,
      batchSize,
      authorCount,
    };
  }

  private createAuthorIds(authorCount: number): string[] {
    return Array.from({ length: authorCount }, () =>
      new Types.ObjectId().toHexString(),
    );
  }

  private createPost(index: number, authorIds: string[]) {
    const createdAt = this.randomDateWithinLastDays(180);
    const hasMedia = index % 4 === 0;

    return {
      authorId: authorIds[index % authorIds.length],
      content: `${this.contentTemplates[index % this.contentTemplates.length]} #${index + 1}`,
      mediaUrls: hasMedia
        ? [this.mediaSamples[index % this.mediaSamples.length]]
        : [],
      likeCount: this.randomInt(0, 5000),
      commentCount: this.randomInt(0, 500),
      shareCount: this.randomInt(0, 200),
      visibility: this.pickVisibility(index),
      isDeleted: false,
      createdAt,
      updatedAt: createdAt,
    };
  }

  private pickVisibility(index: number): PostVisibility {
    if (index % 20 === 0) {
      return PostVisibility.Private;
    }

    if (index % 5 === 0) {
      return PostVisibility.Friends;
    }

    return PostVisibility.Public;
  }

  private randomDateWithinLastDays(days: number): Date {
    const now = Date.now();
    const offset = this.randomInt(0, days * 24 * 60 * 60 * 1000);

    return new Date(now - offset);
  }

  private randomInt(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }
}
