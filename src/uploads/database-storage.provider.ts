import { Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { extname } from 'path';
import { PrismaService } from '../prisma/prisma.service';
import { StorageProvider, UploadedFileResult } from './storage.provider';

/**
 * Stores uploaded files in Postgres. Render's filesystem is ephemeral, so
 * files written to disk disappear on every redeploy and their URLs start
 * returning 404. The database keeps the bytes across deploys.
 * URLs stay `/uploads/<folder>/<file>` — same format as the disk provider.
 */
@Injectable()
export class DatabaseStorageProvider extends StorageProvider {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async save(
    file: Express.Multer.File,
    folder: string,
  ): Promise<UploadedFileResult> {
    const safeFolder =
      folder
        .replace(/[^a-z0-9/_-]/gi, '')
        .replace(/^\/+/, '') || 'misc';
    const ext = extname(file.originalname).toLowerCase() || '.bin';
    const key = `${safeFolder}/${randomUUID()}${ext}`;
    await this.prisma.uploadFile.create({
      data: {
        key,
        originalName: file.originalname,
        mimeType: file.mimetype,
        size: file.size,
        data: file.buffer,
      },
    });
    return {
      url: `/uploads/${key}`,
      key,
      originalName: file.originalname,
      mimeType: file.mimetype,
      size: file.size,
    };
  }

  async delete(key: string): Promise<void> {
    await this.prisma.uploadFile.deleteMany({ where: { key } });
  }
}
