import { Body, Controller, Get, Param, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Public } from '../common/decorators/public.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CategoriesService } from './categories.service';

@ApiTags('Categories')
@UseGuards(JwtAuthGuard)
@Controller('categories')
export class CategoriesController {
  constructor(private readonly categories: CategoriesService) {}

  @Public()
  @Get()
  @ApiOperation({ summary: 'List nested public categories' })
  list() {
    return this.categories.findPublicTree();
  }

  @Public()
  @Get(':id')
  @ApiOperation({ summary: 'Get category by id or slug' })
  one(@Param('id') id: string) {
    return this.categories.findPublicOne(id);
  }
}
