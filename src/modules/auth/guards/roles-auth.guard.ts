import { CanActivate, ExecutionContext, ForbiddenException, HttpStatus, Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

import { IS_PUBLIC_KEY } from '../decorators/public.decorator';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { RoleName } from './role.enum';
import { JWT_KEY } from '../decorators/jwt.decorator';
import { AuthUser, AuthUserRole } from '../interfaces/auth-user.interface';
import { AuthErrorResponse } from '../interfaces/error-response.interface';

@Injectable()
export class RolesGuard implements CanActivate {
  private readonly logger = new Logger('🔑 Auth (Roles)');
  private readonly isDevelopment = process.env.NODE_ENV !== 'production';

  constructor(private reflector: Reflector) { }

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();

    const isPublic_Handler = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [context.getHandler()]);
    const isPublic_Class = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [context.getClass()]);

    const isJwtRequired_Handler = this.reflector.get<boolean>(JWT_KEY, context.getHandler());
    const isJwtRequired = this.reflector.getAllAndOverride<boolean>(JWT_KEY, [context.getHandler(), context.getClass()]);

    // Get roles from handler and class separately
    const rolesRequired_Handler = this.reflector.get<RoleName[]>(ROLES_KEY, context.getHandler());
    const rolesRequired_Class = this.reflector.get<RoleName[]>(ROLES_KEY, context.getClass());

    // If handler has @Jwt() but NO @Roles(), skip role checking
    // This allows methods to override class-level @Roles() by using only @Jwt()
    if (isJwtRequired_Handler && !rolesRequired_Handler) {
      return true;
    }

    // Merge roles from both handler and class for normal role checking
    const isRolesRequired = this.reflector.getAllAndMerge<RoleName[]>(ROLES_KEY, [context.getHandler(), context.getClass()]);

    if (this.isDevelopment) {
      this.logger.debug(`isPublic_Handler: ${isPublic_Handler}`);
      this.logger.debug(`isPublic_Class: ${isPublic_Class}`);
      this.logger.debug(`isJwtRequired: ${isJwtRequired}`);
      this.logger.debug(`isJwtRequired_Handler: ${isJwtRequired_Handler}`);
      this.logger.debug(`rolesRequired_Handler: ${JSON.stringify(rolesRequired_Handler)}`);
      this.logger.debug(`rolesRequired_Class: ${JSON.stringify(rolesRequired_Class)}`);
      this.logger.debug(`isRolesRequired (merged): ${JSON.stringify(isRolesRequired)}`);
    }

    if (isPublic_Handler) {
      return true;
    }

    if (!isRolesRequired || isRolesRequired.length === 0) {
      return true;
    }

    const user = request.user as AuthUser | undefined;

    if (!user) {
      throw new UnauthorizedException(this.createUnauthorizedError());
    }

    const hasRoles = isRolesRequired.some((role) => {
      return user.roles?.some((userRole: AuthUserRole) => {
        return userRole.name === role;
      });
    });

    if (!hasRoles) {
      throw new ForbiddenException(this.createForbiddenError());
    }

    return true;
  }

  private createUnauthorizedError(): AuthErrorResponse {
    return {
      statusCode: HttpStatus.UNAUTHORIZED,
      error: 'Unauthorized',
      messages: ['Invalid or missing authentication token'],
    };
  }

  private createForbiddenError(): AuthErrorResponse {
    return {
      statusCode: HttpStatus.FORBIDDEN,
      error: 'Forbidden',
      messages: ['Forbidden resource - insufficient permissions'],
    };
  }
}
