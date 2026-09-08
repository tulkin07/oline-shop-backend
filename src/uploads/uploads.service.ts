import { Injectable } from '@nestjs/common';
import { StorageProvider } from './storage.provider';

@Injectable()
export class UploadsService {
  constructor(private readonly storage: StorageProvider) {}

  upload(file: Express.Multer.File, folder: string) {
    return this.storage.save(file, folder);
  }

  remove(key: string) {
    return this.storage.delete(key);
  }
}
