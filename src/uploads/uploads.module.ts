import { Module } from '@nestjs/common';
import { LocalStorageProvider } from './local-storage.provider';
import { StorageProvider } from './storage.provider';
import { CustomerUploadsController } from './customer-uploads.controller';
import { UploadsController } from './uploads.controller';
import { UploadsService } from './uploads.service';

@Module({
  controllers: [UploadsController, CustomerUploadsController],
  providers: [
    UploadsService,
    { provide: StorageProvider, useClass: LocalStorageProvider },
  ],
  exports: [UploadsService, StorageProvider],
})
export class UploadsModule {}
