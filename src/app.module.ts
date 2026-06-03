import { join } from 'path';

import { BullModule } from '@nestjs/bull';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { RouterModule } from '@nestjs/core';
import { ScheduleModule } from '@nestjs/schedule';
import { TypeOrmModule } from '@nestjs/typeorm';

import { AppController } from './app.controller';
import { AppService } from './app.service';
import configuration from './config/configuration';
import { CmsModule } from './modules/cms/cms.module';
import { EcommerceModule } from './modules/ecommerce/ecommerce.module';

import type { AppConfig } from './config/configuration';
import { ServeStaticModule } from '@nestjs/serve-static';
import { LmsModule } from './modules/lms/lms.module';
@Module({
  imports: [
    ConfigModule.forRoot({ load: [configuration] }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService<AppConfig, true>) => {
        const db = config.get('database', { infer: true });
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
    ScheduleModule.forRoot(),
    CmsModule,
    EcommerceModule,
    LmsModule,
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
    ]),

    // Static files
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', 'public'),
      exclude: ['/api*'],
      serveRoot: '/',
      useGlobalPrefix: true,
    }),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
