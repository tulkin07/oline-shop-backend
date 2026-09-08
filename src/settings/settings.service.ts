import { Injectable } from '@nestjs/common';
import { toNumber } from '../common/utils/money';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateSettingsDto } from './dto/update-settings.dto';

@Injectable()
export class SettingsService {
  constructor(private readonly prisma: PrismaService) {}

  async get() {
    const setting = await this.prisma.setting.upsert({
      where: { id: 'default' },
      update: {},
      create: {
        id: 'default',
        storeName: 'ElectroShop',
        storeDescription: 'Online electronics store',
        currency: 'UZS',
        deliveryFee: 25000,
        freeDeliveryThreshold: 1500000,
      },
    });
    return {
      ...setting,
      deliveryFee: toNumber(setting.deliveryFee),
      freeDeliveryThreshold: setting.freeDeliveryThreshold
        ? toNumber(setting.freeDeliveryThreshold)
        : null,
    };
  }

  async update(dto: UpdateSettingsDto) {
    await this.get();
    const setting = await this.prisma.setting.update({
      where: { id: 'default' },
      data: {
        storeName: dto.storeName,
        storeDescription: dto.storeDescription,
        logo: dto.logo,
        favicon: dto.favicon,
        phone: dto.phone,
        email: dto.email,
        address: dto.address,
        currency: dto.currency,
        deliveryFee: dto.deliveryFee,
        freeDeliveryThreshold: dto.freeDeliveryThreshold,
      },
    });
    return {
      ...setting,
      deliveryFee: toNumber(setting.deliveryFee),
      freeDeliveryThreshold: setting.freeDeliveryThreshold
        ? toNumber(setting.freeDeliveryThreshold)
        : null,
    };
  }
}
