import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Public } from '../common/decorators/public.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { HomePromosService } from './home-promos.service';

@ApiTags('Home Promos')
@UseGuards(JwtAuthGuard)
@Controller('home-promos')
export class HomePromosController {
  constructor(private readonly promos: HomePromosService) {}

  @Public()
  @Get()
  @ApiOperation({
    summary: 'Promo cards shown below the main hero banner (promo, category grid, small banners, deal)',
  })
  list() {
    return this.promos.findPublic();
  }
}
