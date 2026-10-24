import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import { IsIn, IsNumber, IsOptional, IsString } from 'class-validator';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';

// NOTE: flag filters are strings ('true'/'false'). Boolean-typed query DTO
// fields are converted by class-transformer with Boolean(value), which turns
// the string "false" into `true` and silently inverts the filter.
export class ProductQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  category?: string;

  @ApiPropertyOptional({
    description:
      'Brand id yoki slug. Bir nechta brend: brand=apple-5&brand=huawei yoki brand=apple-5,huawei',
  })
  @IsOptional()
  @Transform(({ value }) => {
    if (value === undefined || value === null) return undefined;
    const values = Array.isArray(value) ? value : [value];
    return values
      .flatMap((item) => String(item).split(','))
      .map((item) => item.trim())
      .filter((item) => item.length > 0);
  })
  @IsString({ each: true })
  brand?: string[];

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  minPrice?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  maxPrice?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  stock?: string;

  @ApiPropertyOptional({ enum: ['true', 'false'] })
  @IsOptional()
  @IsIn(['true', 'false'])
  featured?: string;

  @ApiPropertyOptional({ enum: ['true', 'false'] })
  @IsOptional()
  @IsIn(['true', 'false'])
  isNew?: string;

  @ApiPropertyOptional({ enum: ['true', 'false'] })
  @IsOptional()
  @IsIn(['true', 'false'])
  popular?: string;

  @ApiPropertyOptional({ enum: ['true', 'false'] })
  @IsOptional()
  @IsIn(['true', 'false'])
  isActive?: string;
}
