import {
  BadRequestException,
  Controller,
  Post,
  Req,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { memoryStorage } from 'multer';
import { Request } from 'express';
import { absoluteFileUrl, requestOrigin } from '../common/http/url';
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
@Controller('upload')
export class FileUploadController {
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
      required: ['file'],
      properties: {
        file: { type: 'string', format: 'binary' },
        folder: { type: 'string', example: 'categories' },
      },
    },
  })
  @ApiOperation({
    summary: 'Upload a file and get a public HTTPS URL',
  })
  async upload(
    @UploadedFile() file: Express.Multer.File,
    @Req() req: Request,
  ) {
    if (!file) {
      throw new BadRequestException({
        message: 'File is required (FormData field name: file)',
        error: 'BAD_REQUEST',
      });
    }
    if (!ALLOWED.includes(file.mimetype)) {
      throw new BadRequestException({
        message: 'Only image files are allowed',
        error: 'BAD_REQUEST',
      });
    }

    const folder =
      typeof req.body?.folder === 'string' && req.body.folder.trim()
        ? req.body.folder.trim()
        : 'misc';
    const saved = await this.uploads.upload(file, folder);

    return {
      url: absoluteFileUrl(saved.url, requestOrigin(req)),
    };
  }
}
