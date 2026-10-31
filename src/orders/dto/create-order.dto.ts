import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  ValidateIf,
  ValidateNested,
} from 'class-validator';
import { CreateAddressDto } from '../../customers/dto/create-address.dto';

export class CreateOrderDto {
  @ApiPropertyOptional({
    description:
      'Saqlangan manzil ID (`GET /api/customers/me/addresses`). Yoki `address` obyektini yuboring.',
  })
  @ValidateIf((o) => !o.address)
  @IsUUID()
  addressId?: string;

  @ApiPropertyOptional({
    type: CreateAddressDto,
    description:
      'Checkout formasidagi yangi manzil (`addressId` o‘rniga). `saveAddress=true` bo‘lsa profilga saqlanadi.',
  })
  @ValidateIf((o) => !o.addressId)
  @ValidateNested()
  @Type(() => CreateAddressDto)
  address?: CreateAddressDto;

  @ApiPropertyOptional({
    default: true,
    description: '`address` bilan yuborilganda manzilni profilga saqlash',
  })
  @IsOptional()
  @IsBoolean()
  saveAddress?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(500)
  notes?: string;
}
