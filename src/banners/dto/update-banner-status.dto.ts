import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean } from 'class-validator';

export class UpdateBannerStatusDto {
  @ApiProperty()
  @IsBoolean()
  isActive: boolean;
}
