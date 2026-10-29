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
import { ApiBearerAuth, ApiBody, ApiConsumes, ApiOperation, ApiTags } from '@nestjs/swagger';
import { memoryStorage } from 'multer';
import { Request } from 'express';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { absoluteFileUrl, requestOrigin } from '../common/http/url';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { AuthUser } from '../common/types/auth';
import { PrismaService } from '../prisma/prisma.service';
import { UploadsService } from './uploads.service';

const ALLOWED = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

@ApiTags('Uploads')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('uploads')
export class CustomerUploadsController {
  constructor(
    private readonly uploads: UploadsService,
    private readonly prisma: PrismaService,
  ) {}

  @Post('avatar')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: { fileSize: 5 * 1024 * 1024 },
    }),
  )
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: { file: { type: 'string', format: 'binary' } },
    },
  })
  @ApiOperation({ summary: 'Upload customer avatar' })
  async avatar(
    @CurrentUser() user: AuthUser,
    @UploadedFile() file: Express.Multer.File,
    @Req() req: Request,
  ) {
    if (!file || !ALLOWED.includes(file.mimetype)) {
      throw new BadRequestException({
        message: 'A valid image file is required',
        error: 'BAD_REQUEST',
      });
    }
    const saved = await this.uploads.upload(file, 'avatars');
    const url = absoluteFileUrl(saved.url, requestOrigin(req));
    await this.prisma.user.update({
      where: { id: user.id },
      data: { avatar: url },
    });
    return { ...saved, url };
  }
}
