import {
  BadRequestException,
  Controller,
  Post,
  Query,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiBody, ApiConsumes, ApiOperation, ApiTags } from '@nestjs/swagger';
import { memoryStorage } from 'multer';
import { JwtAdminGuard } from '../common/guards/jwt-admin.guard';
import { UploadsService } from './uploads.service';

const ALLOWED = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'image/svg+xml',
];

@ApiTags('Uploads')
@ApiBearerAuth()
@UseGuards(JwtAdminGuard)
@Controller('admin/uploads')
export class UploadsController {
  constructor(private readonly uploads: UploadsService) {}

  @Post()
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: { fileSize: 8 * 1024 * 1024 },
    }),
  )
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: { type: 'string', format: 'binary' },
      },
    },
  })
  @ApiOperation({ summary: 'Upload an image (local storage by default)' })
  upload(
    @UploadedFile() file: Express.Multer.File,
    @Query('folder') folder = 'misc',
  ) {
    if (!file) {
      throw new BadRequestException({
        message: 'File is required',
        error: 'BAD_REQUEST',
      });
    }
    if (!ALLOWED.includes(file.mimetype)) {
      throw new BadRequestException({
        message: 'Only image files are allowed',
        error: 'BAD_REQUEST',
      });
    }
    return this.uploads.upload(file, folder);
  }
}
