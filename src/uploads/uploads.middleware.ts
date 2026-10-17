import type { NextFunction, Request, Response } from 'express';
import { UPLOADS_RESOURCE_POLICY } from '../common/http/security';
import type { PrismaService } from '../prisma/prisma.service';

const MAX_KEY_LENGTH = 300;

/**
 * Serves files stored in the database (DatabaseStorageProvider) under
 * `/uploads/<folder>/<file>` — the same URL format the disk provider used.
 * Unknown keys fall through to the static disk handler (local dev files).
 *
 * Sets the same Cross-Origin-Resource-Policy as the static handler so
 * `<img crossorigin>` from another frontend origin is never blocked
 * (ERR_BLOCKED_BY_RESPONSE.NotSameOrigin), regardless of where the file lives.
 */
export function createUploadsMiddleware(prisma: PrismaService) {
  return async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    if (req.method !== 'GET' && req.method !== 'HEAD') {
      next();
      return;
    }
    const key = decodeURIComponent(req.path).replace(/^\/+/, '');
    if (!key || key.includes('..') || key.length > MAX_KEY_LENGTH) {
      next();
      return;
    }
    try {
      const file = await prisma.uploadFile.findUnique({ where: { key } });
      if (!file) {
        next();
        return;
      }
      res.setHeader('Content-Type', file.mimeType);
      res.setHeader('Content-Length', file.size);
      res.setHeader('Cross-Origin-Resource-Policy', UPLOADS_RESOURCE_POLICY);
      res.setHeader('X-Content-Type-Options', 'nosniff');
      res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
      res.end(file.data);
    } catch (error) {
      next(error);
    }
  };
}
