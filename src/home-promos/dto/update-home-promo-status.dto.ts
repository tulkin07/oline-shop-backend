import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean } from 'class-validator';

export class UpdateHomePromoStatusDto {
  @ApiProperty()
  @IsBoolean()
  isActive: boolean;
}
