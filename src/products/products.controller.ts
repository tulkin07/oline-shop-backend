import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Public } from '../common/decorators/public.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { AuthUser } from '../common/types/auth';
import { ProductQueryDto } from './dto/product-query.dto';
import { ProductsService } from './products.service';

@ApiTags('Products')
@UseGuards(JwtAuthGuard)
@Controller('products')
export class ProductsController {
  constructor(private readonly products: ProductsService) {}

  @Public()
  @Get()
  @ApiOperation({
    summary:
      'Browse products with filters and pagination (send JWT to get inWishlist)',
  })
  list(@Query() query: ProductQueryDto, @CurrentUser() user?: AuthUser) {
    return this.products.findPublic(query, user?.id);
  }

  @Public()
  @Get('top')
  @ApiOperation({ summary: 'Top products (popular flag, ordered by views)' })
  top(@Query() query: ProductQueryDto, @CurrentUser() user?: AuthUser) {
    return this.products.findPublicTop(query, user?.id);
  }

  @Public()
  @Get('best-selling')
  @ApiOperation({
    summary: 'Best-selling products (most sold, excluding top/popular ones)',
  })
  bestSelling(@Query() query: ProductQueryDto, @CurrentUser() user?: AuthUser) {
    return this.products.findPublicBestSelling(query, user?.id);
  }

  @Public()
  @Get(':id')
  @ApiOperation({ summary: 'Get product details by id or slug' })
  one(@Param('id') id: string, @CurrentUser() user?: AuthUser) {
    return this.products.findPublicOne(id, user?.id);
  }
}
