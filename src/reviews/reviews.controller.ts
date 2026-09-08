import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Public } from '../common/decorators/public.decorator';
import { PaginationQueryDto } from '../common/dto/pagination-query.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { AuthUser } from '../common/types/auth';
import { CreateReviewDto, UpdateReviewDto } from './dto/review.dto';
import { ReviewsService } from './reviews.service';

@ApiTags('Reviews')
@Controller()
@UseGuards(JwtAuthGuard)
export class ReviewsController {
  constructor(private readonly reviews: ReviewsService) {}

  @Public()
  @Get('products/:id/reviews')
  @ApiOperation({ summary: 'Approved product reviews' })
  list(@Param('id') id: string, @Query() query: PaginationQueryDto) {
    return this.reviews.listPublic(id, query);
  }

  @Post('products/:id/reviews')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a review for a purchased product' })
  create(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() dto: CreateReviewDto,
  ) {
    return this.reviews.create(user.id, id, dto);
  }

  @Patch('reviews/:id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update own review' })
  update(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() dto: UpdateReviewDto,
  ) {
    return this.reviews.updateMine(user.id, id, dto);
  }

  @Delete('reviews/:id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete own review' })
  remove(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.reviews.deleteMine(user.id, id);
  }
}
