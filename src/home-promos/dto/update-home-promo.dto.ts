import { PartialType } from '@nestjs/swagger';
import { CreateHomePromoDto } from './create-home-promo.dto';

export class UpdateHomePromoDto extends PartialType(CreateHomePromoDto) {}
