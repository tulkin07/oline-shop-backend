import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ActivityType } from '@prisma/client';
import { ActivityService } from '../common/services/activity.service';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class WishlistService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly activity: ActivityService,
  ) {}

  async getOrCreate(userId: string) {
    return this.prisma.wishlist.upsert({
      where: { userId },
      update: {},
      create: { userId },
    });
  }

  async list(userId: string) {
    const wishlist = await this.getOrCreate(userId);
    const full = await this.prisma.wishlist.findUniqueOrThrow({
      where: { id: wishlist.id },
      include: {
        items: {
          orderBy: { createdAt: 'desc' },
          include: {
            product: {
              include: {
                images: { where: { isMain: true }, take: 1 },
                brand: true,
              },
            },
          },
        },
      },
    });
    return {
      id: full.id,
      items: full.items.map((item) => ({
        id: item.id,
        productId: item.productId,
        createdAt: item.createdAt,
        product: {
          id: item.product.id,
          name: item.product.name,
          slug: item.product.slug,
          price: Number(item.product.price),
          image: item.product.images[0]?.url ?? null,
          brand: item.product.brand.name,
          isActive: item.product.isActive,
        },
      })),
    };
  }

  async add(userId: string, productId: string) {
    const product = await this.prisma.product.findFirst({
      where: { id: productId, deletedAt: null, isActive: true },
    });
    if (!product) {
      throw new NotFoundException({
        message: 'Product not found',
        error: 'NOT_FOUND',
      });
    }
    const wishlist = await this.getOrCreate(userId);
    const existing = await this.prisma.wishlistItem.findUnique({
      where: {
        wishlistId_productId: { wishlistId: wishlist.id, productId },
      },
    });
    if (existing) {
      throw new BadRequestException({
        message: 'Product is already in wishlist',
        error: 'CONFLICT',
      });
    }
    await this.prisma.wishlistItem.create({
      data: { wishlistId: wishlist.id, productId },
    });
    await this.activity.log(userId, ActivityType.WISHLIST_ADDED, { productId });
    return this.list(userId);
  }

  async remove(userId: string, productId: string) {
    const wishlist = await this.getOrCreate(userId);
    await this.prisma.wishlistItem.deleteMany({
      where: { wishlistId: wishlist.id, productId },
    });
    return this.list(userId);
  }
}
