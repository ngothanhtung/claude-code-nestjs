import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';

@Injectable()
export class HttpBasicGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    const authHeader = request.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Basic ')) {
      return false;
    }

    // Extract credentials from Basic Auth header
    const base64Credentials = authHeader.split(' ')[1];
    const credentials = Buffer.from(base64Credentials, 'base64').toString('utf-8');
    const [username, password] = credentials.split(':');

    // Replace these values with your actual authentication logic
    const isValidUser = username === process.env.HTTP_BASIC_USERNAME;
    const isValidPassword = password === process.env.HTTP_BASIC_PASSWORD;

    if (!isValidUser || !isValidPassword) {
      throw new UnauthorizedException({
        statusCode: 401,
        error: 'Unauthorized',
        message: ['Invalid username or password'],
      });
    }

    return true;
  }
}
