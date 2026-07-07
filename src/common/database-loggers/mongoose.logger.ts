import { Logger } from '@nestjs/common';

export class MongooseLogger {
  private readonly _logger = new Logger('MongoDB');
  private _prefix = '[MONGODB]';

  // constructor
  constructor(prefix?: string) {
    if (prefix) {
      this._prefix = `[${prefix}]`;
    }
  }

  error(message: string, trace?: string) {
    this._logger.error(`${this._prefix} ${message}`, trace);
  }

  log(message: string) {
    this._logger.log(`${this._prefix} ${message}`);
  }

  warn(message: string) {
    this._logger.warn(`${this._prefix} ${message}`);
  }

  debug(message: string) {
    this._logger.debug(`${this._prefix} ${message}`);
  }
}
