import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsIn, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

export class DashboardWeekQueryDto {
  @ApiPropertyOptional({ enum: ['this', 'last'], default: 'this' })
  @IsOptional()
  @IsIn(['this', 'last'])
  week?: 'this' | 'last';
}

export class DashboardProductQueryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ enum: ['stock', 'low', 'out'] })
  @IsOptional()
  @IsIn(['stock', 'low', 'out'])
  status?: 'stock' | 'low' | 'out';

  @ApiPropertyOptional({ minimum: 1, maximum: 50 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(50)
  limit?: number;
}

export class DashboardQuickAddQueryDto {
  @ApiPropertyOptional({ description: 'Category id or slug (accordion expand)' })
  @IsOptional()
  @IsString()
  categoryId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ minimum: 1, maximum: 50 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(50)
  limit?: number;
}
