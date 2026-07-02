import { join } from 'path';

import { BullModule } from '@nestjs/bull';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_GUARD, RouterModule } from '@nestjs/core';
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
import { AdventureWorksModule } from './modules/adventure-works/adventure-works.module';
import { AwModule } from './modules/aw/aw.module';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
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

     PassportModule,
    JwtModule.registerAsync({
      global: true,
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => {
        return {
          global: true,
          secret: configService.get<string>('JWT_SECRET') || 'nestjs-secrect-key',
          signOptions: { expiresIn: configService.get<number>('JWT_EXPIRES_IN') },
        };
      },
      inject: [ConfigService],
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
    AdventureWorksModule,
    AwModule,
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
      {
        path: 'api/aw',
        module: AwModule,
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
  providers: [AppService,
     {
      provide: APP_GUARD  ,
      useClass: JwtAuthGuard,
    },
  ],
})
export class AppModule {}
