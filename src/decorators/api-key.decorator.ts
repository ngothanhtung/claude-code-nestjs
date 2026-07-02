import { applyDecorators, SetMetadata, UseGuards } from '@nestjs/common';
import { ApiHeader, ApiUnauthorizedResponse } from '@nestjs/swagger';
import { ApiKeyGuard } from '../guards/api-key.guard';

/**
 * Header name for API key authentication
 */
export const X_API_KEY = 'X-API-KEY';

/**
 * Decorator that adds API Key Authentication to a route
 *
 * This decorator:
 * - Sets metadata for API key auth
 * - Applies the ApiKeyGuard
 * - Adds Swagger documentation for the API key header
 * - Documents the 401 Unauthorized response
 *
 * @returns Decorator functions
 */
export const ApiKey = () => {
  return applyDecorators(
    SetMetadata(X_API_KEY, true),
    UseGuards(ApiKeyGuard),
    ApiHeader({
      name: X_API_KEY,
      description: 'API Key for authentication',
      required: true,
      schema: { type: 'string' },
    }),
    ApiUnauthorizedResponse({
      description: 'Unauthorized - Invalid or missing X-API-KEY header',
    }),
  );
};
