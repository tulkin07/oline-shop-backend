import { User } from '@prisma/client';

export function sanitizeUser(user: User) {
  const { password: _password, ...safe } = user;
  return safe;
}
