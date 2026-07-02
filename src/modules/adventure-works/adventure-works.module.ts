import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import type { AppConfig } from '../../config/configuration';
import { ADVENTURE_WORKS_CONNECTION } from './adventure-works.constants';
import { ProductionController } from './production/production.controller';
import { ProductionService } from './production/production.services';
import { SalesController } from './sales/sales.controller';
import { SalesService } from './sales/sales.services';

@Module({
  imports: [
    ConfigModule,
    TypeOrmModule.forRootAsync({
      name: ADVENTURE_WORKS_CONNECTION,
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
  ],
  controllers: [ProductionController, SalesController],
  providers: [ProductionService, SalesService],
})
export class AdventureWorksModule {}
