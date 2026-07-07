import { applyDecorators, SetMetadata } from '@nestjs/common';
import { ApiBearerAuth } from '@nestjs/swagger';

export const IS_PUBLIC_KEY = 'isPublic';

/**
 * Decorator that marks a route as public (no authentication required)
 *
 * This decorator sets metadata to mark the route as public, which is checked
 * by the global JwtAuthGuard to bypass authentication.
 *
 * @returns Decorator function
 */
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
