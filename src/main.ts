import { ClassSerializerInterceptor, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory, Reflector } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { apiReference } from '@scalar/nestjs-api-reference';
import { AppModule } from './app.module';
import type { AppConfig } from './config/configuration';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);
  // Lấy cổng từ cấu hình, mặc định là 3333 nếu không có
  const port = configService.get<number>('port', 3333);

  // Cấu hình CORS
  const cors = configService.get<AppConfig['cors']>('cors');

  if (cors) {
    app.enableCors(cors);
  }

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

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  // Dùng ClassSerializerInterceptor để tự động loại bỏ các trường không mong muốn khi trả về dữ liệu
  app.useGlobalInterceptors(new ClassSerializerInterceptor(app.get(Reflector)));

  await app.listen(port);
  const url = await app.getUrl();
  const { Logger } = await import('@nestjs/common');
  new Logger().log(`Application is running on: ${url}`, '🚀 Bootstrap');
}

void bootstrap();
