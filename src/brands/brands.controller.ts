import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Public } from '../common/decorators/public.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { BrandsService } from './brands.service';

@ApiTags('Brands')
@UseGuards(JwtAuthGuard)
@Controller('brands')
export class BrandsController {
  constructor(private readonly brands: BrandsService) {}

  @Public()
  @Get()
  @ApiOperation({ summary: 'List public brands' })
  list() {
    return this.brands.findPublic();
  }

  @Public()
  @Get(':id')
  @ApiOperation({ summary: 'Get brand by id or slug' })
  one(@Param('id') id: string) {
    return this.brands.findPublicOne(id);
  }
}
