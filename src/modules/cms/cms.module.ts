import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';

import type { AppConfig } from '../../config/configuration';
import { MongooseLogger } from '@common/database-loggers/mongoose.logger';

@Module({
  imports: [
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService<AppConfig, true>) => ({
        uri: configService.get('mongodb.uri', { infer: true }),
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
      }),
    }),
  ],
})
export class CmsModule {}
