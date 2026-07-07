import { Model, Types } from 'mongoose';

import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';

import { CreatePostDto } from './dto/create-post.dto';
import { FindPostsQueryDto } from './dto/find-posts-query.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { Post, PostDocument } from './post.schema';

const POST_RESPONSE_PROJECTION = '-__v';

interface PostLeanDocument extends Omit<PostResponse, 'id'> {
  _id: Types.ObjectId;
}

export interface PostResponse {
  id: string;
  authorId: string;
  content: string;
  mediaUrls: string[];
  likeCount: number;
  commentCount: number;
  shareCount: number;
  visibility: string;
  isDeleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface PaginatedPosts {
  items: PostResponse[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

@Injectable()
export class PostsService {
  constructor(
    @InjectModel(Post.name, 'social-network')
    private readonly postModel: Model<PostDocument>,
  ) {}

  async create(dto: CreatePostDto): Promise<PostResponse> {
    const post = await this.postModel.create(dto);

    return this.findById(post.id);
  }

  async findAll(query: FindPostsQueryDto): Promise<PaginatedPosts> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const skip = (page - 1) * limit;
    const filter = {
      isDeleted: false,
      ...(query.authorId && { authorId: query.authorId }),
      ...(query.visibility && { visibility: query.visibility }),
    };

    const [items, total] = await Promise.all([
      this.postModel
        .find(filter)
        .select(POST_RESPONSE_PROJECTION)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean()
        .exec(),
      this.postModel.countDocuments(filter).exec(),
    ]);

    return {
      items: (items as PostLeanDocument[]).map((post) =>
        this.toPostResponse(post),
      ),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findById(id: string): Promise<PostResponse> {
    const post = await this.postModel
      .findOne({ _id: id, isDeleted: false })
      .select(POST_RESPONSE_PROJECTION)
      .lean()
      .exec();

    if (!post) {
      throw new NotFoundException(`Post with ID "${id}" not found`);
    }

    return this.toPostResponse(post);
  }

  async update(id: string, dto: UpdatePostDto): Promise<PostResponse> {
    const post = await this.postModel
      .findOneAndUpdate({ _id: id, isDeleted: false }, dto, {
        new: true,
        runValidators: true,
      })
      .select(POST_RESPONSE_PROJECTION)
      .lean()
      .exec();

    if (!post) {
      throw new NotFoundException(`Post with ID "${id}" not found`);
    }

    return this.toPostResponse(post);
  }

  async remove(id: string): Promise<void> {
    const post = await this.postModel
      .findOneAndUpdate(
        { _id: id, isDeleted: false },
        { isDeleted: true },
        { new: true },
      )
      .exec();

    if (!post) {
      throw new NotFoundException(`Post with ID "${id}" not found`);
    }
  }

  like(id: string): Promise<PostResponse> {
    return this.incrementCounter(id, 'likeCount');
  }

  comment(id: string): Promise<PostResponse> {
    return this.incrementCounter(id, 'commentCount');
  }

  share(id: string): Promise<PostResponse> {
    return this.incrementCounter(id, 'shareCount');
  }

  private async incrementCounter(
    id: string,
    field: 'likeCount' | 'commentCount' | 'shareCount',
  ): Promise<PostResponse> {
    const post = await this.postModel
      .findOneAndUpdate(
        { _id: id, isDeleted: false },
        { $inc: { [field]: 1 } },
        { new: true },
      )
      .select(POST_RESPONSE_PROJECTION)
      .lean()
      .exec();

    if (!post) {
      throw new NotFoundException(`Post with ID "${id}" not found`);
    }

    return this.toPostResponse(post);
  }

  private toPostResponse(post: PostLeanDocument): PostResponse {
    const { _id, ...data } = post;

    return {
      id: _id.toString(),
      ...data,
    };
  }
}
