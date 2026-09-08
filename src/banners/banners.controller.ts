import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Public } from '../common/decorators/public.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { BannersService } from './banners.service';

@ApiTags('Banners')
@UseGuards(JwtAuthGuard)
@Controller('banners')
export class BannersController {
  constructor(private readonly banners: BannersService) {}

  @Public()
  @Get()
  @ApiOperation({ summary: 'Active and currently scheduled banners' })
  list() {
    return this.banners.findPublic();
  }
}
