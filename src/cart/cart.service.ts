import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { toNumber } from '../common/utils/money';
import { PrismaService } from '../prisma/prisma.service';
import { AddCartItemDto, UpdateCartItemDto } from './dto/cart-item.dto';

@Injectable()
export class CartService {
  constructor(private readonly prisma: PrismaService) {}

  async getOrCreate(userId: string) {
    return this.prisma.cart.upsert({
      where: { userId },
      update: {},
      create: { userId },
    });
  }

  async get(userId: string) {
    const cart = await this.getOrCreate(userId);
    return this.serialize(cart.id);
  }

  async addItem(userId: string, dto: AddCartItemDto) {
    const cart = await this.getOrCreate(userId);
    const product = await this.prisma.product.findFirst({
      where: { id: dto.productId, deletedAt: null },
      include: { variants: true, images: { where: { isMain: true }, take: 1 } },
    });
    if (!product || !product.isActive) {
      throw new BadRequestException({
        message: 'Product is not available',
        error: 'BAD_REQUEST',
      });
    }
    const activeVariants = product.variants.filter((v) => v.isActive);
    if (activeVariants.length > 0 && !dto.variantId) {
      throw new BadRequestException({
        message: 'A product variant is required',
        error: 'BAD_REQUEST',
      });
    }
    let price = toNumber(product.price);
    let available = product.stock - product.reservedStock;
    if (dto.variantId) {
      const variant = product.variants.find((v) => v.id === dto.variantId);
      if (!variant || !variant.isActive) {
        throw new BadRequestException({
          message: 'Variant is not available',
          error: 'BAD_REQUEST',
        });
      }
      price = toNumber(variant.price);
      available = variant.stock - variant.reservedStock;
    }
    const existing = await this.prisma.cartItem.findFirst({
      where: {
        cartId: cart.id,
        productId: dto.productId,
        variantId: dto.variantId ?? null,
      },
    });
    const nextQty = (existing?.quantity ?? 0) + dto.quantity;
    if (nextQty > available) {
      throw new BadRequestException({
        message: 'Requested quantity exceeds available stock',
        error: 'BAD_REQUEST',
      });
    }
    if (existing) {
      await this.prisma.cartItem.update({
        where: { id: existing.id },
        data: { quantity: nextQty, price },
      });
    } else {
      await this.prisma.cartItem.create({
        data: {
          cartId: cart.id,
          productId: dto.productId,
          variantId: dto.variantId,
          quantity: dto.quantity,
          price,
        },
      });
    }
    return this.serialize(cart.id);
  }

  async updateItem(userId: string, itemId: string, dto: UpdateCartItemDto) {
    const cart = await this.getOrCreate(userId);
    const item = await this.prisma.cartItem.findFirst({
      where: { id: itemId, cartId: cart.id },
      include: { product: true, variant: true },
    });
    if (!item) {
      throw new NotFoundException({
        message: 'Cart item not found',
        error: 'NOT_FOUND',
      });
    }
    const available = item.variant
      ? item.variant.stock - item.variant.reservedStock
      : item.product.stock - item.product.reservedStock;
    if (dto.quantity > available) {
      throw new BadRequestException({
        message: 'Requested quantity exceeds available stock',
        error: 'BAD_REQUEST',
      });
    }
    await this.prisma.cartItem.update({
      where: { id: itemId },
      data: { quantity: dto.quantity },
    });
    return this.serialize(cart.id);
  }

  async removeItem(userId: string, itemId: string) {
    const cart = await this.getOrCreate(userId);
    const item = await this.prisma.cartItem.findFirst({
      where: { id: itemId, cartId: cart.id },
    });
    if (!item) {
      throw new NotFoundException({
        message: 'Cart item not found',
        error: 'NOT_FOUND',
      });
    }
    await this.prisma.cartItem.delete({ where: { id: itemId } });
    return this.serialize(cart.id);
  }

  async clear(userId: string) {
    const cart = await this.getOrCreate(userId);
    await this.prisma.cartItem.deleteMany({ where: { cartId: cart.id } });
    return this.serialize(cart.id);
  }

  private async serialize(cartId: string) {
    const cart = await this.prisma.cart.findUniqueOrThrow({
      where: { id: cartId },
      include: {
        items: {
          include: {
            product: {
              include: {
                images: { where: { isMain: true }, take: 1 },
                brand: true,
              },
            },
            variant: true,
          },
          orderBy: { createdAt: 'asc' },
        },
      },
    });
    const items = cart.items.map((item) => {
      const price = toNumber(item.price);
      const lineTotal = price * item.quantity;
      return {
        id: item.id,
        productId: item.productId,
        variantId: item.variantId,
        quantity: item.quantity,
        price,
        lineTotal,
        product: {
          id: item.product.id,
          name: item.product.name,
          slug: item.product.slug,
          sku: item.product.sku,
          isActive: item.product.isActive,
          image: item.product.images[0]?.url ?? null,
          brand: item.product.brand.name,
        },
        variant: item.variant
          ? {
              id: item.variant.id,
              sku: item.variant.sku,
              attributes: item.variant.attributes,
              isActive: item.variant.isActive,
            }
          : null,
      };
    });
    const subtotal = items.reduce((sum, item) => sum + item.lineTotal, 0);
    return {
      id: cart.id,
      items,
      itemsCount: items.reduce((sum, item) => sum + item.quantity, 0),
      subtotal,
    };
  }
}
