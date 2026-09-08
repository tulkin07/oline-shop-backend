import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable, map } from 'rxjs';

@Injectable()
export class TransformInterceptor implements NestInterceptor {
  intercept(_context: ExecutionContext, next: CallHandler): Observable<unknown> {
    return next.handle().pipe(
      map((payload: unknown) => {
        if (
          payload &&
          typeof payload === 'object' &&
          'data' in payload &&
          'meta' in payload
        ) {
          const wrapped = payload as { data: unknown; meta: unknown };
          return {
            success: true,
            data: wrapped.data,
            meta: wrapped.meta,
          };
        }
        return {
          success: true,
          data: payload ?? null,
        };
      }),
    );
  }
}
