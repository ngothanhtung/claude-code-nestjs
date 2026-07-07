import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { MockController } from './mock.controller';
import { MockService } from './mock.service';
import { Post, PostSchema } from './post/post.schema';
import { PostsController } from './post/posts.controller';
import { PostsService } from './post/posts.service';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AppConfig } from '@config/configuration';
import { MongooseLogger } from '@common/database-loggers/mongoose.logger';

@Module({
  imports: [
    MongooseModule.forRootAsync({
      connectionName: 'social-network',
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService<AppConfig, true>) => {
        return {
          uri: config.get('mongodb.uri', { infer: true }),

          connectionFactory: (connection, name) => {
            const logger = new MongooseLogger(name);
            // Log all MongoDB operations
            connection.set(
              'debug',
              (collectionName: any, method: any, query: any, doc: any) => {
                logger.log(
                  `${collectionName}.${method} ${JSON.stringify(query)} ${JSON.stringify(doc)}`,
                );
              },
            );

            // Log connection events
            connection.on('connected', () => {
              logger.log('Database connected');
            });

            connection.on('disconnected', () => {
              logger.warn('Database disconnected');
            });

            connection.on('error', (error: any) => {
              logger.error('Database error', error.stack);
            });

            return connection;
          },
        };
      },
    }),
    MongooseModule.forFeature(
      [{ name: Post.name, schema: PostSchema }],
      'social-network',
    ),
  ],
  controllers: [PostsController, MockController],
  providers: [PostsService, MockService],
  exports: [MockService],
})
export class SocialNetworkModule {}
