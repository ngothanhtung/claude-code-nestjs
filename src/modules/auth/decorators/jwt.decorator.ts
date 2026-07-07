import { applyDecorators, SetMetadata, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiUnauthorizedResponse } from '@nestjs/swagger';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';

/**
 * Key used to identify JWT Authentication in metadata
 */
export const JWT_KEY = 'JWT_KEY';

/**
 * Decorator that adds JWT Authentication to a route
 *
 * This decorator:
 * - Sets metadata for JWT auth
 * - Applies the JwtAuthGuard
 * - Adds Swagger documentation for Bearer Auth
 * - Documents the 401 Unauthorized response
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
