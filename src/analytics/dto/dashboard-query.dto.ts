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

  @ApiPropertyOptional({ enum: ['stock', 'out'] })
  @IsOptional()
  @IsIn(['stock', 'out'])
  status?: 'stock' | 'out';

  @ApiPropertyOptional({ minimum: 1, maximum: 50 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(50)
  limit?: number;
}
