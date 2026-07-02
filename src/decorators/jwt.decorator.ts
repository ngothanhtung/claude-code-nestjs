import { applyDecorators, SetMetadata } from '@nestjs/common';
import { ApiBearerAuth, ApiUnauthorizedResponse } from '@nestjs/swagger';

/**
 * Key used to identify JWT Authentication in metadata
 */
export const JWT_KEY = 'JWT_KEY';

/**
 * Decorator that adds JWT Authentication to a route
 *
 * This decorator:
 * - Sets metadata for JWT auth
 * - Adds Swagger documentation for Bearer Auth
 * - Documents the 401 Unauthorized response
 *
 * Note: JwtAuthGuard is already applied globally in AuthModule,
 * so we don't need UseGuards here to avoid duplicate execution
 *
 * @returns Decorator functions
 */
export const Jwt = () => {
  return applyDecorators(
    SetMetadata(JWT_KEY, true),
    ApiBearerAuth(),
    ApiUnauthorizedResponse({
      description: 'Unauthorized - Invalid or missing JWT token',
    }),
  );
};
