import { NestFactory, Reflector } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
import type { AppConfig } from './config/configuration';
import { ValidationPipe, ClassSerializerInterceptor } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);

  const cors = configService.get<AppConfig['cors']>('cors');
  const port = configService.get<number>('port', 3333);

  if (cors) {
    app.enableCors(cors);
  }

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
