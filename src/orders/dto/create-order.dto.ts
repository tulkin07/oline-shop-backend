import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
  ValidateNested,
} from 'class-validator';

export class CheckoutAddressDto {
  @ApiProperty({ example: 'Tulkin' })
  @IsString()
  @IsNotEmpty()
  firstName: string;

  @ApiProperty({ example: 'Akhmadov' })
  @IsString()
  @IsNotEmpty()
  lastName: string;

  @ApiProperty({ example: '+998931908097' })
  @IsString()
  @MinLength(9)
  phone: string;

  @ApiProperty({ example: 'Toshkent shahri' })
  @IsString()
  @IsNotEmpty()
  region: string;

  @ApiProperty({ example: 'Toshkent' })
  @IsString()
  @IsNotEmpty()
  city: string;

  @ApiProperty({ example: 'Yunusobod tumani' })
  @IsString()
  @IsNotEmpty()
  district: string;

  @ApiPropertyOptional({ example: 'Bogishamol' })
  @IsOptional()
  @IsString()
  mahalla?: string;

  @ApiProperty({ example: 'Amir Temur' })
  @IsString()
  @IsNotEmpty()
  street: string;

  @ApiProperty({ example: '12A' })
  @IsString()
  @IsNotEmpty()
  house: string;

  @ApiPropertyOptional({ example: '34' })
  @IsOptional()
  @IsString()
  apartment?: string;

  @ApiPropertyOptional({ example: "Qo'ng'iroq qiling, darvoza kodi 12" })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  comment?: string;
}

export class CreateOrderDto {
  @ApiProperty({ type: CheckoutAddressDto })
  @ValidateNested()
  @Type(() => CheckoutAddressDto)
  address: CheckoutAddressDto;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(500)
  notes?: string;
}
