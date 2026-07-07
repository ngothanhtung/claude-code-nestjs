import { Injectable, CanActivate, ExecutionContext, Logger, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';
import { AuthErrorResponse } from '../interfaces/error-response.interface';

@Injectable()
export class HttpBasicGuard implements CanActivate {
  private readonly logger = new Logger('🔑 Auth (HTTP Basic)');

  constructor(private reflector: Reflector) { }

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    const authHeader = request.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Basic ')) {
      throw new UnauthorizedException(this.createErrorResponse('Missing or invalid Authorization header'));
    }

    // Extract credentials from Basic Auth header
    const base64Credentials = authHeader.split(' ')[1];
    const credentials = Buffer.from(base64Credentials, 'base64').toString('utf-8');
    const [username, password] = credentials.split(':');

    // Validate environment variables
    const validUsername = process.env.HTTP_BASIC_USERNAME;
    const validPassword = process.env.HTTP_BASIC_PASSWORD;

    if (!validUsername || !validPassword) {
      this.logger.error('HTTP_BASIC_USERNAME or HTTP_BASIC_PASSWORD is not configured');
      throw new Error('HTTP Basic authentication is not properly configured');
    }

    // Validate credentials
    const isValidUser = username === validUsername;
    const isValidPassword = password === validPassword;

    if (!isValidUser || !isValidPassword) {
      throw new UnauthorizedException(this.createErrorResponse('Invalid username or password'));
    }

    return true;
  }

  private createErrorResponse(message: string): AuthErrorResponse {
    return {
      statusCode: 401,
      error: 'Unauthorized',
      messages: [message],
    };
  }
}
