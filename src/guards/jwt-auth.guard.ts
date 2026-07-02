import { Request } from 'express';

import { CanActivate, ExecutionContext, HttpStatus, Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';

import { JWT_KEY } from '../decorators/jwt.decorator';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';
import { ROLES_KEY } from '../decorators/roles.decorator';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  private readonly logger = new Logger('🔑 Auth (Jwt)');
  constructor(
    private jwtService: JwtService,
    private reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();

    const isPublic_Handler = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [context.getHandler()]);
    const isPublic_Class = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [context.getClass()]);

    const isJwtRequired = this.reflector.getAllAndOverride<boolean>(JWT_KEY, [context.getHandler(), context.getClass()]);
    const isRolesRequired = this.reflector.getAllAndMerge<string[]>(ROLES_KEY, [context.getHandler(), context.getClass()]);

    this.logger.debug(`isPublic_Handler: ${isPublic_Handler}`);
    this.logger.debug(`isPublic_Class: ${isPublic_Class}`);
    this.logger.debug(`isJwtRequired: ${isJwtRequired}`);
    this.logger.debug(`isRolesRequired: ${JSON.stringify(isRolesRequired)}`);

    if (isPublic_Handler) {
      return true;
    }

    if (isPublic_Class && !isJwtRequired && (!isRolesRequired || isRolesRequired.length === 0)) {
      return true;
    }

    if (isJwtRequired || (isRolesRequired && isRolesRequired.length > 0)) {
      const token = this.extractTokenFromHeader(request);

      if (!token) {
        throw new UnauthorizedException({
          statusCode: HttpStatus.UNAUTHORIZED,
          messages: ['Invalid token'],
          error: 'Unauthorized',
        });
      }
      try {
        const payload = await this.jwtService.verifyAsync(token, {
          secret: process.env.JWT_SECRET || 'nestjs-secret-key',
        });

        // 💡 We're assigning the payload to the request object here
        // so that we can access it in our route handlers
        request['user'] = payload;
      } catch {
        throw new UnauthorizedException({
          statusCode: HttpStatus.UNAUTHORIZED,
          messages: ['Invalid token'],
          error: 'Unauthorized',
        });
      }
    }

    return true;
  }

  private extractTokenFromHeader(request: Request): string | undefined {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }
}
