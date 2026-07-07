import { CacheableMemory } from 'cacheable';
import { Keyv } from 'keyv';
import { join } from 'path';
import { createKeyv } from '@keyv/redis';
import { QueuesModule } from '@modules/queues/queues.module';
import { SseModule } from '@modules/sse/sse.module';
import { TasksModule } from '@modules/tasks/tasks.module';
import { BullModule } from '@nestjs/bull';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_GUARD, RouterModule } from '@nestjs/core';
import { MongooseModule } from '@nestjs/mongoose';
import { ScheduleModule } from '@nestjs/schedule';
import { ServeStaticModule } from '@nestjs/serve-static';
import { TypeOrmModule } from '@nestjs/typeorm';

import { MongooseLogger } from '@common/database-loggers/mongoose.logger';

import { AppController } from './app.controller';
import { AppService } from './app.service';
import configuration from './config/configuration';
import { AdventureWorksModule } from './modules/adventure-works/adventure-works.module';
import { CmsModule } from './modules/cms/cms.module';
import { EcommerceModule } from './modules/ecommerce/ecommerce.module';
import { LmsModule } from './modules/lms/lms.module';

import type { AppConfig } from './config/configuration';
import { HttpLoggingInterceptor } from '@common/interceptors/http-logging.interceptor';
import { HttpExceptionFilter } from '@common/filters/http-exception.filter';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { AuthModule } from '@modules/auth/auth.module';
import { MulterModule } from '@nestjs/platform-express';
import { CacheModule } from '@nestjs/cache-manager';

@Module({
  imports: [
    ConfigModule.forRoot({
      load: [configuration],
      isGlobal: true,
    }),
    // Database (PostgreSQL)
    TypeOrmModule.forRootAsync({
      // name: 'postgres',
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService<AppConfig, true>) => {
        const db = config.get('postgres', { infer: true });
        return {
          type: 'postgres',
          host: db.host,
          port: db.port,
          username: db.username,
          password: db.password,
          database: db.name,
          autoLoadEntities: true,
          synchronize: true,
        };
      },
    }),
    // Database (MSSQL)
    TypeOrmModule.forRootAsync({
      name: 'mssql',
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService<AppConfig, true>) => {
        const db = config.get('mssql', { infer: true });
        return {
          type: 'mssql',
          host: db.host,
          port: db.port,
          username: db.username,
          password: db.password,
          database: db.database,
          synchronize: false,
          migrationsRun: false,
          options: {
            encrypt: true,
            trustServerCertificate: true,
          },
        };
      },
    }),

    // MySQL Database
    TypeOrmModule.forRootAsync({
      name: 'mysql',
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService<AppConfig, true>) => {
        const db = config.get('mysql', { infer: true });
        return {
          type: 'mysql',
          host: db.host,
          port: db.port,
          username: db.username,
          password: db.password,
          database: db.database,
          autoLoadEntities: true,
          synchronize: true,
        };
      },
    }),

    // Database (MongoDB)
    MongooseModule.forRootAsync({
      connectionName: 'cms',
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

    //* https://docs.nestjs.com/techniques/queues
    BullModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService<AppConfig, true>) => {
        const redis = configService.get('redis', { infer: true });
        return {
          redis: {
            host: redis.host,
            port: redis.port,
            ...(redis.password && { password: redis.password }),
          },
        };
      },
    }),
    ScheduleModule.forRoot({
      cronJobs: true,
      intervals: true,
      timeouts: true,
    }),

    // Static files
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', 'public'),
      exclude: ['/api*'],
      serveRoot: '/',
      useGlobalPrefix: true,
    }),

    ThrottlerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => [
        {
          ttl: Number(config.get<string>('THROTTLE_TTL', '1')), // 1 second
          limit: Number(config.get<string>('THROTTLE_LIMIT', '1000')), // 1000 requests
        },
        {
          name: 'short',
          ttl: 1, // 1 second
          limit: 50,
        },
        {
          name: 'medium',
          ttl: 60, // 1 minute
          limit: 500,
        },
        {
          name: 'long',
          ttl: 3600, // 1 hour
          limit: 2000,
        },
      ],
    }),

    CacheModule.registerAsync({
      isGlobal: true,
      imports: [ConfigModule], // Import ConfigModule here
      useFactory: (configService: ConfigService) => {
        const host = configService.get<string>('REDIS_HOST');
        const port = configService.get<number>('REDIS_PORT');
        const password = configService.get<string>('REDIS_PASSWORD');

        // Time to live
        const ttl = configService.get<number>('CACHE_TTL', 1000 * 3600); // Default TTL is 1 hour
        const numberOfItems = configService.get<number>('CACHE_MAX_SIZE', 100); // Default number of items is 100

        return {
          stores: [
            createKeyv(
              `redis://${password ? `:${password}@` : ''}${host}:${port}`,
              {},
            ),
            new Keyv({
              store: new CacheableMemory({ ttl: ttl, lruSize: numberOfItems }), // TTL for CacheableMemory
            }),
          ],
          ttl: ttl,
        };
      },
      inject: [ConfigService],
    }),

    MulterModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        dest: configService.get<string>('./public/uploads'),
      }),
      inject: [ConfigService],
    }),

    AuthModule,
    CmsModule,
    EcommerceModule,
    LmsModule,
    AdventureWorksModule,

    SseModule,

    TasksModule,

    // Queues
    QueuesModule,
    // Register routes for each module
    RouterModule.register([
      {
        path: 'api/cms',
        module: CmsModule,
      },
      {
        path: 'api/lms',
        module: LmsModule,
      },
      {
        path: 'api/ecommerce',
        module: EcommerceModule,
      },
      {
        path: 'api/adventure-works',
        module: AdventureWorksModule,
      },
    ]),
  ],
  controllers: [AppController],
  providers: [
    AppService,
    HttpLoggingInterceptor,
    HttpExceptionFilter,
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
