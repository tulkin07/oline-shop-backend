import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsArray, IsInt, IsUUID, Min, ValidateNested } from 'class-validator';

export class ImageOrderItemDto {
  @ApiProperty()
  @IsUUID()
  id: string;

  @ApiProperty()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  sortOrder: number;
}

export class ReorderImagesDto {
  @ApiProperty({ type: [ImageOrderItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ImageOrderItemDto)
  items: ImageOrderItemDto[];
}
