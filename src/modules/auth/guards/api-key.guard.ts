import { Request } from 'express';

import { CanActivate, ExecutionContext, Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

import { X_API_KEY } from '../decorators/api-key.decorator';
import { AuthErrorResponse } from '../interfaces/error-response.interface';

@Injectable()
export class ApiKeyGuard implements CanActivate {
  private readonly logger = new Logger('🔑 Auth (API Key)');

  constructor(private reflector: Reflector) { }

  canActivate(context: ExecutionContext): boolean {
    // Check if the route requires API key protection
    const requireApiKey = this.reflector.getAllAndOverride<boolean>(X_API_KEY, [context.getHandler(), context.getClass()]);

    // If no API key requirement, allow access
    if (!requireApiKey) {
      return true;
    }

    const request = context.switchToHttp().getRequest<Request>();
    const apiKeyHeader = request.headers['x-api-key'];

    // Validate the API key from environment variables
    const validApiKey = process.env.X_API_KEY;

    if (!validApiKey) {
      this.logger.error('X_API_KEY is not configured in environment variables');
      throw new Error('API Key authentication is not properly configured');
    }

    if (!apiKeyHeader || apiKeyHeader !== validApiKey) {
      throw new UnauthorizedException(this.createErrorResponse());
    }

    return true;
  }

  private createErrorResponse(): AuthErrorResponse {
    return {
      statusCode: 401,
      error: 'Unauthorized',
      messages: ['Invalid or missing API key'],
    };
  }
}
