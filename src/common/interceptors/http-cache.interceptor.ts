import { CacheInterceptor } from '@nestjs/cache-manager';
import { ExecutionContext, Injectable } from '@nestjs/common';

@Injectable()
export class HttpCacheInterceptor extends CacheInterceptor {
  trackBy(context: ExecutionContext): string | undefined {
    const request = context.switchToHttp().getRequest();
    const { httpAdapter } = (
      this as unknown as {
        httpAdapterHost: {
          httpAdapter: {
            getRequestMethod: (r: unknown) => string;
            getRequestUrl: (r: unknown) => string;
          };
        };
      }
    ).httpAdapterHost;

    const isGetRequest = httpAdapter.getRequestMethod(request) === 'GET';
    if (!isGetRequest) return undefined;

    // Only cache if cached=true query param is provided
    const cachedParam = request.query['cached'];
    if (cachedParam !== 'true') return undefined;

    return httpAdapter.getRequestUrl(request).split('?')[0];
  }
}
