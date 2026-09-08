import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { AuthAdmin } from '../types/auth';

export const CurrentAdmin = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): AuthAdmin => {
    const request = ctx.switchToHttp().getRequest<{ user: AuthAdmin }>();
    return request.user;
  },
);
