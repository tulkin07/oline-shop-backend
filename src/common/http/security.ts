import type { ServerResponse } from 'http';

/**
 * Cross-Origin-Resource-Policy value for files served from `/uploads`.
 *
 * Helmet sets `same-origin` globally, which makes browsers refuse to render
 * `<img src>` from a different frontend origin (ERR_BLOCKED_BY_RESPONSE.NotSameOrigin).
 * Uploaded images are public assets, so they explicitly opt in to `cross-origin`.
 * API responses keep Helmet's stricter default.
 */
export const UPLOADS_RESOURCE_POLICY = 'cross-origin';

export function setUploadsHeaders(res: ServerResponse): void {
  res.setHeader('Cross-Origin-Resource-Policy', UPLOADS_RESOURCE_POLICY);
}

/**
 * Parses `CORS_ORIGIN` into a value accepted by Nest's `enableCors`.
 *
 * - empty / undefined / `*` → `'*'`
 * - `https://shop.uz` → `'https://shop.uz'`
 * - `https://shop.uz, http://localhost:5173` → `['https://shop.uz', 'http://localhost:5173']`
 */
export function parseCorsOrigin(raw?: string | null): string | string[] {
  const origins = (raw ?? '')
    .split(',')
    .map((value) => value.trim())
    .filter((value) => value.length > 0);

  if (origins.length === 0 || origins.includes('*')) {
    return '*';
  }
  return origins.length === 1 ? origins[0] : origins;
}
