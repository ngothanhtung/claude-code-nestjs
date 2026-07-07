/* eslint-disable @typescript-eslint/no-unsafe-enum-comparison */
import { Request, Response } from 'express';

import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Injectable,
  Logger,
} from '@nestjs/common';

@Catch(HttpException)
@Injectable()
export class HttpExceptionFilter implements ExceptionFilter {
  constructor() {}

  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    const status = exception.getStatus();

    const exceptionDetails = {
      request: {
        method: request.method,
        url: request.url,
        headers: request.headers,
        body: request.body,
        params: request.params,
        query: request.query,
        ip: request.ip,
        originalUrl: request.originalUrl,
        protocol: request.protocol,
        hostname: request.hostname,
      },
      status_code: status,
      error: exception.getResponse(),
      timestamp: new Date().toISOString(),
    };

    // console.log('🔥 HttpExceptionFilter', exceptionDetails);

    if (process.env.LOG_HTTP_EXCEPTION_ENABLED === 'true') {
      Logger.error(
        `HTTP Exception: ${status} - ${request.method} ${request.url}`,
        HttpExceptionFilter.name,
        exceptionDetails,
      );
    }

    const exceptionResponse = exception.getResponse();

    if (status === HttpStatus.TOO_MANY_REQUESTS) {
      const message =
        typeof exceptionResponse === 'string'
          ? exceptionResponse
          : (exceptionResponse as { message?: string }).message;

      response.status(status).json({
        statusCode: status,
        message: [message || 'Too Many Requests'],
        error: 'Too Many Requests',
      });
      return;
    }

    response.status(status).json(exceptionResponse);
  }
}
