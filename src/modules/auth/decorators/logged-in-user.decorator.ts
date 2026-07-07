import { createParamDecorator, ExecutionContext } from '@nestjs/common';

/**
 * Custom decorator to extract the logged-in user from the request
 *
 * @param data - Optional data to pass to the decorator
 * @param ctx - Execution context to access the request object
 * @returns The logged-in user object from the request
 */
export const LoggedInUser = createParamDecorator((data: unknown, ctx: ExecutionContext) => {
  const request = ctx.switchToHttp().getRequest();
  return request.user;
});
