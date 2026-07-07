import { NextFunction, Request, Response } from 'express';

import { v4 as uuidv4 } from 'uuid';

import { Injectable, Logger, NestMiddleware } from '@nestjs/common';

@Injectable()
export class HttpLoggerMiddleware implements NestMiddleware {
  constructor() {}

  private logger = new Logger('🚀 HTTP');

  private extractTokenFromHeader(request: Request): string | undefined {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }

  use(request: Request, response: Response, next: NextFunction) {
    try {
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
      };

      // RESPONSE
      const originalSend = response.send;
      const responseData: any[] = [];
      let statusCode = response.statusCode; // Capture initial status code

      // Override the response.send function
      response.send = function (body: any) {
        statusCode = response.statusCode; // Capture status code here
        responseData.push(
          typeof body === 'object' ? JSON.stringify(body) : body,
        );
        return originalSend.call(response, body);
      };

      //* INFORMATION
      response.on('finish', () => {
        const logResponse = {
          body: responseData.join(''),
        };

        const log = {
          status_code: statusCode,
          request_identity: identity,
          request: logRequest,
          response: logResponse,
          timestamp: new Date().toISOString(),
        };

        // SEND LOGS TO CONSOLE
        if (statusCode < 400) {
          if (process.env.LOG_HTTP_ENABLED === 'true') {
            this.logger.log(log);
          }
        }
      });

      //* ERROR
      response.on('error', () => {
        const logResponse = {
          body: responseData.join(''),
        };

        const log = {
          status_code: statusCode,
          request_identity: requestId,
          request:
            process.env.LOG_HTTP_REQUESTS === 'true'
              ? logRequest
              : 'Request logging is disabled',
          response:
            process.env.LOG_HTTP_RESPONSES === 'true'
              ? logResponse
              : 'Response logging is disabled',
        };

        // SEND LOGS TO CONSOLE
        this.logger.error(log);
      });
    } catch (error) {
      this.logger.error(error);
    } finally {
      next();
    }
  }
}
