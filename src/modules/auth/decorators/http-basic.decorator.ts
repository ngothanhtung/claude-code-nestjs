import { applyDecorators, SetMetadata, UseGuards } from '@nestjs/common';
import { ApiBasicAuth, ApiUnauthorizedResponse } from '@nestjs/swagger';
import { HttpBasicGuard } from '../guards/http-basic.guard';

/**
 * Key used to identify HTTP Basic Authentication in metadata
 */
export const HTTP_BASIC_KEY = 'basic_auth';

/**
 * Decorator that adds HTTP Basic Authentication to a route
 *
 * This decorator:
 * - Sets metadata for basic auth
 * - Applies the HttpBasicGuard
 * - Adds Swagger documentation for Basic Auth
 * - Documents the 401 Unauthorized response
 *
 * @returns Decorator functions
 */
export const HttpBasic = () => {
  return applyDecorators(
    SetMetadata(HTTP_BASIC_KEY, true),
    UseGuards(HttpBasicGuard),
    ApiBasicAuth(),
    ApiUnauthorizedResponse({
      description: 'Unauthorized - Invalid credentials or missing Authorization header',
    }),
  );
};
