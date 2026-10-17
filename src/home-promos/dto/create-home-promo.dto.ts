import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { HomePromoType } from '@prisma/client';
import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsDateString,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  Min,
} from 'class-validator';

export class CreateHomePromoDto {
  @ApiProperty({
    enum: HomePromoType,
    description:
      'PROMO = large image card, CATEGORY = 2x2 product grid of a category, BANNER = small image banner, DEAL = single discounted product card',
  })
  @IsEnum(HomePromoType)
  type: HomePromoType;

  @ApiProperty({ example: 'Gaming accessories' })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  subtitle?: string;

  @ApiPropertyOptional({ description: 'Required for PROMO and BANNER' })
  @IsOptional()
  @IsString()
  image?: string;

  @ApiPropertyOptional({ example: 'Shop Now' })
  @IsOptional()
  @IsString()
  buttonText?: string;

  @ApiPropertyOptional({ example: '/products?category=headphones' })
  @IsOptional()
  @IsString()
  link?: string;

  @ApiPropertyOptional({ example: '-1 500 000 UZS', description: 'DEAL badge; auto-calculated from oldPrice when empty' })
  @IsOptional()
  @IsString()
  badgeText?: string;

  @ApiPropertyOptional({ description: 'Required for CATEGORY' })
  @IsOptional()
  @IsUUID()
  categoryId?: string;

  @ApiPropertyOptional({ description: 'Required for DEAL' })
  @IsOptional()
  @IsUUID()
  productId?: string;

  @ApiPropertyOptional({ default: 4, minimum: 1, maximum: 12 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(12)
  productsLimit?: number;

  @ApiPropertyOptional({ default: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  sortOrder?: number;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  endDate?: string;
}
