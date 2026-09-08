import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Public } from '../common/decorators/public.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { ProductQueryDto } from './dto/product-query.dto';
import { ProductsService } from './products.service';

@ApiTags('Products')
@UseGuards(JwtAuthGuard)
@Controller('products')
export class ProductsController {
  constructor(private readonly products: ProductsService) {}

  @Public()
  @Get()
  @ApiOperation({ summary: 'Browse products with filters and pagination' })
  list(@Query() query: ProductQueryDto) {
    return this.products.findPublic(query);
  }

  @Public()
  @Get(':id')
  @ApiOperation({ summary: 'Get product details by id or slug' })
  one(@Param('id') id: string) {
    return this.products.findPublicOne(id);
  }
}
