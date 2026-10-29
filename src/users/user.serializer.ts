import { User } from '@prisma/client';
import { absoluteFileUrl } from '../common/http/url';

export function sanitizeUser(user: User) {
  const { password: _password, ...safe } = user;
  // Avatar must be a full https URL so the frontend can render it directly.
  // New uploads are already stored absolute; this fixes legacy relative paths.
  return { ...safe, avatar: absoluteFileUrl(safe.avatar) };
}
