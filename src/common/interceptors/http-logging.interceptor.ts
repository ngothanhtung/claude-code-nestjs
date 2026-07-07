/* eslint-disable @typescript-eslint/no-unsafe-argument */
import { Request } from 'express';
import { Observable, tap } from 'rxjs';
import { v4 as uuidv4 } from 'uuid';

import {
  CallHandler,
  ExecutionContext,
  Injectable,
  Logger,
  NestInterceptor,
} from '@nestjs/common';

@Injectable()
export class HttpLoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger(HttpLoggingInterceptor.name);

  constructor() {}

  private extractTokenFromHeader(request: Request): string | undefined {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const response = context.switchToHttp().getResponse();
    const now = Date.now();

    const { method, url } = request;

    const requestId = uuidv4();

    let identity = requestId;

    try {
      // Decode jwt token
      const token = this.extractTokenFromHeader(request);
      if (token) {
        const base64Payload = token.split('.')[1];
        const payloadBuffer = Buffer.from(base64Payload, 'base64');
        const decodedPayload = JSON.parse(payloadBuffer.toString('utf-8'));

        identity = decodedPayload.sub;
      } else {
        this.logger.warn('No JWT token found in the request headers');
      }
    } catch (error) {
      this.logger.error('Error decoding JWT token', error);
    }

    const logRequest = {
      headers: request.headers,
      body: request.body,
      params: request.params,
      query: request.query,
    };

    return next.handle().pipe(
      tap((data: any) => {
        const statusCode = response.statusCode;
        const executionTime = Date.now() - now;

        const logResponse = {
          body: data, // Capture the response body here
        };

        const log = {
          ip: request.ip,
          originalUrl: request.originalUrl,
          protocol: request.protocol,
          hostname: request.hostname,
          method,
          url,
          execution_time: `${executionTime}ms`,
          status_code: statusCode,
          request_id: identity,
          request: logRequest,
          response: logResponse,
          timestamp: new Date().toISOString(),
        };

        if (process.env.LOG_HTTP_ENABLED === 'true') {
          Logger.log(
            `HTTP: ${statusCode} - ${method} ${url}`,
            HttpLoggingInterceptor.name,
            log,
          );
        }
      }),
    );
  }
}
