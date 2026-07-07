/* eslint-disable @typescript-eslint/no-unsafe-argument */
import {
  ClassSerializerInterceptor,
  ValidationPipe,
  VersioningType,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory, Reflector } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { apiReference } from '@scalar/nestjs-api-reference';
import { AppModule } from './app.module';
import type { AppConfig } from './config/configuration';
import { HttpLoggingInterceptor } from '@common/interceptors/http-logging.interceptor';
import { HttpExceptionFilter } from '@common/filters/http-exception.filter';
import helmet from 'helmet';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);
  // Lấy cổng từ cấu hình, mặc định là 3333 nếu không có
  const port = configService.get<number>('port', 3333);

  app.use(
    helmet({
      contentSecurityPolicy: false,
      crossOriginEmbedderPolicy: false,
      crossOriginResourcePolicy: false,
      referrerPolicy: { policy: 'no-referrer' },
      hsts: {
        maxAge: 31536000,
        includeSubDomains: true,
        preload: true,
      },
    }),
  );

  // Cấu hình CORS
  app.enableCors(configService.get<AppConfig['cors']>('cors'));

  //* https://docs.nestjs.com/techniques/versioning
  app.enableVersioning({
    type: VersioningType.URI,
  });

  app.enableShutdownHooks();

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  // Apply global exception filter (DI)
  app.useGlobalFilters(app.get(HttpExceptionFilter));

  app.useGlobalInterceptors(
    app.get(HttpLoggingInterceptor),
    new ClassSerializerInterceptor(app.get(Reflector)),
  );

  // https://docs.nestjs.com/openapi/introduction

  const config = new DocumentBuilder()
    .setTitle('OPEN API - Prototype')
    .setDescription('For development purpose only')
    .setVersion('1.0')
    .addTag('Prototype')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config, {
    deepScanRoutes: true,
  });

  // BEGIN: Dùng Scalar UI, không dùng Swagger UI
  app.use('/open-api-json', (req, res) => {
    res.json(document);
  });
  app.use(
    '/scalar',
    apiReference({
      url: '/open-api-json', // trỏ tới OpenAPI JSON, nếu có dùng SwaggerModule để expose OpenAPI JSON tại endpoint /open-api-json
    }),
  );
  // END: Dùng Scalar UI, không dùng Swagger UI

  // SOCKET WITH REDIS (WHEN USING CLUSTER)
  // const redisIoAdapter = new RedisIoAdapter(app);
  // await redisIoAdapter.connectToRedis();
  // app.useWebSocketAdapter(redisIoAdapter);

  await app.listen(port);
  const url = await app.getUrl();
  const { Logger } = await import('@nestjs/common');
  new Logger().log(`Application is running on: ${url}`, '🚀 Bootstrap');
}

void bootstrap();
