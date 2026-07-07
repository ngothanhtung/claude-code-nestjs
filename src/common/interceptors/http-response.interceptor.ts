import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

@Injectable()
export class HttpTransformInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const startTime = Date.now(); // Measure execution time

    // Handle the request and transform the response
    return next.handle().pipe(
      map((data) => {
        const executionTime = Date.now() - startTime;
        return {
          data, // Original response data
          meta: {
            executionTime: `${executionTime}ms`, // Add metadata
          },
        };
      }),
    );
  }
}
