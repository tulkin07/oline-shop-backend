import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AdminRole } from '@prisma/client';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { AuthAdmin } from '../types/auth';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const roles = this.reflector.getAllAndOverride<AdminRole[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!roles || roles.length === 0) {
      return true;
    }
    const request = context.switchToHttp().getRequest<{ user?: AuthAdmin }>();
    const user = request.user;
    if (!user || user.type !== 'admin') {
      throw new ForbiddenException({
        message: 'Admin access required',
        error: 'FORBIDDEN',
      });
    }
    if (!roles.includes(user.role)) {
      throw new ForbiddenException({
        message: 'Insufficient permissions',
        error: 'FORBIDDEN',
      });
    }
    return true;
  }
}
