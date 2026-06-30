import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import type { AppConfig } from '../../config/configuration';
import { AW_CONNECTION } from './aw.constants';
import { ProductionController } from './production/production.controller';
import { ProductionService } from './production/production.services';

@Module({
  imports: [
    ConfigModule,
    TypeOrmModule.forRootAsync({
      name: AW_CONNECTION,
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
          options: { encrypt: true, trustServerCertificate: true },
        };
      },
    }),
  ],
  controllers: [ProductionController],
  providers: [ProductionService],
})
export class AwModule {}
