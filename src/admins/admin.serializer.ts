import { Admin } from '@prisma/client';

export function sanitizeAdmin(admin: Admin) {
  const { password: _password, ...safe } = admin;
  return safe;
}
