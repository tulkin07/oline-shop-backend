import type { Request } from 'express';

/** Public origin of this backend, e.g. https://api.shop.uz (no trailing slash). */
export function envAppUrl(): string | null {
  const url = process.env.APP_URL?.replace(/\/+$/, '');
  return url || null;
}

/**
 * Origin for building absolute file URLs. Prefers APP_URL; otherwise uses the
 * forwarded proxy headers (Render/NGINX) so the result is https on production.
 */
export function requestOrigin(req: Request): string {
  const fromEnv = envAppUrl();
  if (fromEnv) return fromEnv;
  const proto = (req.get('x-forwarded-proto') ?? req.protocol ?? 'https')
    .split(',')[0]
    .trim();
  const host = (req.get('x-forwarded-host') ?? req.get('host') ?? 'localhost:3000')
    .split(',')[0]
    .trim();
  return `${proto}://${host}`;
}

/**
 * Turns a stored file path (`/uploads/...`) into an absolute URL.
 * Already-absolute URLs are returned unchanged; without any known origin the
 * path is returned as-is (local dev fallback).
 */
export function absoluteFileUrl(
  path: string | null | undefined,
  origin?: string,
): string | null {
  if (!path) return null;
  if (/^https?:\/\//i.test(path)) return path;
  const base = origin ?? envAppUrl();
  if (!base) return path;
  return `${base}${path.startsWith('/') ? path : `/${path}`}`;
}
