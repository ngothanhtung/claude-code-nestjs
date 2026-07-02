import { applyDecorators, SetMetadata } from '@nestjs/common';
import { ApiBearerAuth } from '@nestjs/swagger';

export const IS_PUBLIC_KEY = 'isPublic';

/**
 * Decorator that marks a route as public (no authentication required)
 *
 * This decorator:
 * - Sets metadata to mark the route as public
 * - Removes ApiBearerAuth if present
 *
 * @returns Decorator functions
 */
export const Public = () => {
  return applyDecorators(SetMetadata(IS_PUBLIC_KEY, true), (target: any, key: string, descriptor: PropertyDescriptor) => {
    // Check if ApiBearerAuth is present and remove it
    if (descriptor && descriptor.value) {
      descriptor.value.decorators = (descriptor.value.decorators || []).filter((decorator: any) => decorator !== ApiBearerAuth);
    }
  });
};
