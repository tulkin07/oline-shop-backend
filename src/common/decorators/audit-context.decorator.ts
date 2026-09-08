import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Request } from 'express';

export interface AuditContext {
  ipAddress?: string;
  userAgent?: string;
}

export const RequestAudit = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): AuditContext => {
    const request = ctx.switchToHttp().getRequest<Request>();
    return {
      ipAddress: request.ip,
      userAgent: request.headers['user-agent'],
    };
  },
);
