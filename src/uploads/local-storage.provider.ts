import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { existsSync } from 'fs';
import { mkdir, unlink, writeFile } from 'fs/promises';
import { extname, join } from 'path';
import { v4 as uuid } from 'uuid';
import { StorageProvider, UploadedFileResult } from './storage.provider';

@Injectable()
export class LocalStorageProvider extends StorageProvider {
  constructor(private readonly config: ConfigService) {
    super();
  }

  async save(
    file: Express.Multer.File,
    folder: string,
  ): Promise<UploadedFileResult> {
    const safeFolder = folder.replace(/[^a-z0-9/_-]/gi, '') || 'misc';
    const uploadRoot = this.config.get<string>('uploadDir') ?? './uploads';
    const dir = join(process.cwd(), uploadRoot, safeFolder);
    if (!existsSync(dir)) {
      await mkdir(dir, { recursive: true });
    }
    const ext = extname(file.originalname).toLowerCase() || '.bin';
    const filename = `${uuid()}${ext}`;
    const key = `${safeFolder}/${filename}`;
    await writeFile(join(dir, filename), file.buffer);
    return {
      url: `/uploads/${key}`,
      key,
      originalName: file.originalname,
      mimeType: file.mimetype,
      size: file.size,
    };
  }

  async delete(key: string): Promise<void> {
    const uploadRoot = this.config.get<string>('uploadDir') ?? './uploads';
    const path = join(process.cwd(), uploadRoot, key);
    if (existsSync(path)) {
      await unlink(path);
    }
  }
}
