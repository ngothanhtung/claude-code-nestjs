import { HydratedDocument } from 'mongoose';

import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

export enum PostVisibility {
  Public = 'public',
  Friends = 'friends',
  Private = 'private',
}

@Schema({ collection: 'posts', timestamps: true })
export class Post {
  @Prop({ required: true, trim: true })
  authorId: string;

  @Prop({ required: true, trim: true, maxlength: 5000 })
  content: string;

  @Prop({ type: [String], default: [] })
  mediaUrls: string[];

  @Prop({ min: 0, default: 0 })
  likeCount: number;

  @Prop({ min: 0, default: 0 })
  commentCount: number;

  @Prop({ min: 0, default: 0 })
  shareCount: number;

  @Prop({
    enum: PostVisibility,
    default: PostVisibility.Public,
  })
  visibility: PostVisibility;

  @Prop({ default: false })
  isDeleted: boolean;

  createdAt: Date;

  updatedAt: Date;
}

export const PostSchema = SchemaFactory.createForClass(Post);

PostSchema.index({ authorId: 1, createdAt: -1 });
PostSchema.index({ visibility: 1, isDeleted: 1, createdAt: -1 });

export type PostDocument = HydratedDocument<Post>;
