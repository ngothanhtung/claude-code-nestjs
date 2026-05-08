import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
import type { AppConfig } from './config/configuration';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);

  const cors = configService.get<AppConfig['cors']>('cors');
  const port = configService.get<number>('port', 3333);

  if (cors) {
    app.enableCors(cors);
  }

  await app.listen(port);
  const url = await app.getUrl();
  const { Logger } = await import('@nestjs/common');
  new Logger().log(`Application is running on: ${url}`, '🚀 Bootstrap');
}

void bootstrap();
