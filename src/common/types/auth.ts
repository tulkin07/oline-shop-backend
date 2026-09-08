import { AdminRole } from '@prisma/client';

export type ActorType = 'customer' | 'admin';

export interface JwtPayload {
  sub: string;
  email: string;
  type: ActorType;
  role?: AdminRole;
}

export interface AuthUser {
  id: string;
  email: string;
  type: 'customer';
}

export interface AuthAdmin {
  id: string;
  email: string;
  type: 'admin';
  role: AdminRole;
}
