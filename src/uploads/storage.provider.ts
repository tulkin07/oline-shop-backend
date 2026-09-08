export interface UploadedFileResult {
  url: string;
  key: string;
  originalName: string;
  mimeType: string;
  size: number;
}

export abstract class StorageProvider {
  abstract save(
    file: Express.Multer.File,
    folder: string,
  ): Promise<UploadedFileResult>;

  abstract delete(key: string): Promise<void>;
}
