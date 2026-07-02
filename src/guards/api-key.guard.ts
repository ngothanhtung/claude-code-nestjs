import { Request } from 'express';

import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

import { X_API_KEY } from '../decorators/api-key.decorator';

@Injectable()
export class ApiKeyGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    // Check if the route requires API key protection
    const requireApiKey = this.reflector.getAllAndOverride<boolean>(X_API_KEY, [context.getHandler(), context.getClass()]);

    // If no API key requirement, allow access
    if (!requireApiKey) {
      return true;
    }

    const request = context.switchToHttp().getRequest<Request>();
    const apiKeyHeader = request.headers['x-api-key'];

    // Validate the API key (ideally from environment variables)
    const validApiKey = process.env.X_API_KEY || 'aptech-tester-pro';

    if (!apiKeyHeader || apiKeyHeader !== validApiKey) {
      throw new UnauthorizedException({
        statusCode: 401,
        error: 'Unauthorized',
        message: ['Invalid or missing API key'],
      });
    }

    return true;
  }
}
