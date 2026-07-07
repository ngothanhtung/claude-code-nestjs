import { Logger as DatabaseLogger, QueryRunner } from 'typeorm';

import { Injectable, Logger as NestLogger } from '@nestjs/common';

@Injectable()
export class TypeOrmLogger implements DatabaseLogger {
  private readonly logger = new NestLogger('SQL');

  logQuery(query: string, parameters?: any[], queryRunner?: QueryRunner) {
    try {
      // Except: query is ALTER, DROP, CREATE, START TRANSACTION, SELECT DATABASE(), SELECT `TABLE_SCHEMA`, COMMIT, ROLLBACK, SELECT VERSION()
      if (
        query.startsWith('ALTER') ||
        query.startsWith('DROP') ||
        query.startsWith('CREATE') ||
        query.startsWith('START TRANSACTION') ||
        query.startsWith('SELECT DATABASE()') ||
        query.startsWith('SELECT `TABLE_SCHEMA`') ||
        query.startsWith('COMMIT') ||
        query.startsWith('ROLLBACK') ||
        query.startsWith('SELECT VERSION()')
      ) {
        return;
      }

      // EXCEPT: query include: INFORMATION_SCHEMA
      if (query.includes('INFORMATION_SCHEMA')) {
        return;
      }

      const data = {
        level: 'info',
        trace: 'sql-log',
        type: 'sql',
        query,
        parameters,
        system: 'NESTJS-API',
      };
      this.logger.log(data);
    } catch (error) {
      this.logger.error('Error occurred while logging query', error);
    }
  }

  logQueryError(error: string, query: string, parameters?: unknown[]) {
    try {
      const data = {
        level: 'error',
        trace: 'query-log',
        type: 'sql',
        query,
        parameters,
        system: 'NESTJS-API',
        error: `${JSON.stringify(error)}`,
      };

      this.logger.error(data);
    } catch (error) {
      this.logger.error('Error occurred while logging query error', error);
    }
  }

  logQuerySlow(time: number, query: string, parameters?: unknown[]) {
    try {
      const data = {
        level: 'warn',
        trace: 'slow-query-log',
        type: 'sql',
        query,
        parameters,
        time,
        system: 'NESTJS-API',
      };

      this.logger.warn(data);
    } catch (error) {
      this.logger.error('Error occurred while logging slow query', error);
    }
  }

  logMigration(message: string) {
    this.logger.log(message);
  }

  logSchemaBuild(message: string) {
    this.logger.log(message);
  }

  log(level: 'log' | 'info' | 'warn', message: string) {
    if (level === 'log') {
      return this.logger.log(message);
    }
    if (level === 'info') {
      return this.logger.debug(message);
    }
    if (level === 'warn') {
      return this.logger.warn(message);
    }
  }

  private stringifyParameters(parameters?: unknown[]) {
    try {
      return JSON.stringify(parameters);
    } catch {
      return '';
    }
  }
}
