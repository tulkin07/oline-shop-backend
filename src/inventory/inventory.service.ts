import { BadRequestException, Injectable } from '@nestjs/common';
import { Prisma, StockMovementType } from '@prisma/client';
import { PaginationQueryDto } from '../common/dto/pagination-query.dto';
import { getPagination, paginated } from '../common/utils/pagination';
import { NotificationsService } from '../notifications/notifications.service';
import { PrismaService } from '../prisma/prisma.service';

export type DbClient = Prisma.TransactionClient | PrismaService;

@Injectable()
export class InventoryService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
  ) {}

  available(stock: number, reservedStock: number): number {
    return Math.max(0, stock - reservedStock);
  }

  async reserve(
    tx: DbClient,
    productId: string,
    variantId: string | null,
    quantity: number,
    createdBy?: string,
  ) {
    if (variantId) {
      const variant = await tx.productVariant.findUniqueOrThrow({
        where: { id: variantId },
      });
      const available = this.available(variant.stock, variant.reservedStock);
      if (available < quantity) {
        throw new BadRequestException({
          message: `Insufficient stock for variant ${variant.sku}`,
          error: 'BAD_REQUEST',
        });
      }
      const updated = await tx.productVariant.update({
        where: { id: variantId },
        data: { reservedStock: { increment: quantity } },
      });
      await tx.stockMovement.create({
        data: {
          productId,
          variantId,
          type: StockMovementType.SALE,
          quantity: -quantity,
          previousStock: available,
          newStock: this.available(updated.stock, updated.reservedStock),
          reason: 'Reserved for order',
          createdBy,
        },
      });
      return;
    }
    const product = await tx.product.findUniqueOrThrow({
      where: { id: productId },
    });
    const available = this.available(product.stock, product.reservedStock);
    if (available < quantity) {
      throw new BadRequestException({
        message: `Insufficient stock for product ${product.sku}`,
        error: 'BAD_REQUEST',
      });
    }
    const updated = await tx.product.update({
      where: { id: productId },
      data: { reservedStock: { increment: quantity } },
    });
    await tx.stockMovement.create({
      data: {
        productId,
        type: StockMovementType.SALE,
        quantity: -quantity,
        previousStock: available,
        newStock: this.available(updated.stock, updated.reservedStock),
        reason: 'Reserved for order',
        createdBy,
      },
    });
    await this.maybeNotify(tx, productId, variantId);
  }

  async release(
    tx: DbClient,
    productId: string,
    variantId: string | null,
    quantity: number,
    createdBy?: string,
  ) {
    if (variantId) {
      const variant = await tx.productVariant.findUniqueOrThrow({
        where: { id: variantId },
      });
      const previous = this.available(variant.stock, variant.reservedStock);
      const updated = await tx.productVariant.update({
        where: { id: variantId },
        data: { reservedStock: { decrement: quantity } },
      });
      await tx.stockMovement.create({
        data: {
          productId,
          variantId,
          type: StockMovementType.RETURN,
          quantity,
          previousStock: previous,
          newStock: this.available(updated.stock, updated.reservedStock),
          reason: 'Order cancelled — reservation released',
          createdBy,
        },
      });
      return;
    }
    const product = await tx.product.findUniqueOrThrow({
      where: { id: productId },
    });
    const previous = this.available(product.stock, product.reservedStock);
    const updated = await tx.product.update({
      where: { id: productId },
      data: { reservedStock: { decrement: quantity } },
    });
    await tx.stockMovement.create({
      data: {
        productId,
        type: StockMovementType.RETURN,
        quantity,
        previousStock: previous,
        newStock: this.available(updated.stock, updated.reservedStock),
        reason: 'Order cancelled — reservation released',
        createdBy,
      },
    });
  }

  async finalize(
    tx: DbClient,
    productId: string,
    variantId: string | null,
    quantity: number,
    createdBy?: string,
  ) {
    if (variantId) {
      const variant = await tx.productVariant.findUniqueOrThrow({
        where: { id: variantId },
      });
      const previous = this.available(variant.stock, variant.reservedStock);
      const updated = await tx.productVariant.update({
        where: { id: variantId },
        data: {
          stock: { decrement: quantity },
          reservedStock: { decrement: quantity },
        },
      });
      await tx.stockMovement.create({
        data: {
          productId,
          variantId,
          type: StockMovementType.SALE,
          quantity: -quantity,
          previousStock: previous,
          newStock: this.available(updated.stock, updated.reservedStock),
          reason: 'Order delivered — stock finalized',
          createdBy,
        },
      });
      return;
    }
    const product = await tx.product.findUniqueOrThrow({
      where: { id: productId },
    });
    const previous = this.available(product.stock, product.reservedStock);
    const updated = await tx.product.update({
      where: { id: productId },
      data: {
        stock: { decrement: quantity },
        reservedStock: { decrement: quantity },
      },
    });
    await tx.stockMovement.create({
      data: {
        productId,
        type: StockMovementType.SALE,
        quantity: -quantity,
        previousStock: previous,
        newStock: this.available(updated.stock, updated.reservedStock),
        reason: 'Order delivered — stock finalized',
        createdBy,
      },
    });
    await this.maybeNotify(tx, productId, null);
  }

  async restockOnReturn(
    tx: DbClient,
    productId: string,
    variantId: string | null,
    quantity: number,
    createdBy?: string,
  ) {
    if (variantId) {
      const variant = await tx.productVariant.findUniqueOrThrow({
        where: { id: variantId },
      });
      const previous = this.available(variant.stock, variant.reservedStock);
      const updated = await tx.productVariant.update({
        where: { id: variantId },
        data: { stock: { increment: quantity } },
      });
      await tx.stockMovement.create({
        data: {
          productId,
          variantId,
          type: StockMovementType.RETURN,
          quantity,
          previousStock: previous,
          newStock: this.available(updated.stock, updated.reservedStock),
          reason: 'Returned to stock',
          createdBy,
        },
      });
      return;
    }
    const product = await tx.product.findUniqueOrThrow({
      where: { id: productId },
    });
    const previous = this.available(product.stock, product.reservedStock);
    const updated = await tx.product.update({
      where: { id: productId },
      data: { stock: { increment: quantity } },
    });
    await tx.stockMovement.create({
      data: {
        productId,
        type: StockMovementType.RETURN,
        quantity,
        previousStock: previous,
        newStock: this.available(updated.stock, updated.reservedStock),
        reason: 'Returned to stock',
        createdBy,
      },
    });
  }

  async adjust(input: {
    productId: string;
    variantId?: string;
    type: StockMovementType;
    quantity: number;
    reason?: string;
    adminId: string;
  }) {
    const { productId, variantId, type, quantity, reason, adminId } = input;
    return this.prisma.$transaction(async (tx) => {
      if (variantId) {
        const variant = await tx.productVariant.findFirst({
          where: { id: variantId, productId },
        });
        if (!variant) {
          throw new BadRequestException({
            message: 'Variant not found',
            error: 'BAD_REQUEST',
          });
        }
        const previous = variant.stock;
        const delta = type === StockMovementType.DAMAGE ? -Math.abs(quantity) : quantity;
        const updated = await tx.productVariant.update({
          where: { id: variantId },
          data: { stock: { increment: delta } },
        });
        return tx.stockMovement.create({
          data: {
            productId,
            variantId,
            type,
            quantity: delta,
            previousStock: previous,
            newStock: updated.stock,
            reason,
            createdBy: adminId,
            adminId,
          },
        });
      }
      const product = await tx.product.findUniqueOrThrow({
        where: { id: productId },
      });
      const previous = product.stock;
      const delta = type === StockMovementType.DAMAGE ? -Math.abs(quantity) : quantity;
      const updated = await tx.product.update({
        where: { id: productId },
        data: { stock: { increment: delta } },
      });
      const movement = await tx.stockMovement.create({
        data: {
          productId,
          type,
          quantity: delta,
          previousStock: previous,
          newStock: updated.stock,
          reason,
          createdBy: adminId,
          adminId,
        },
      });
      await this.maybeNotify(tx, productId, null);
      return movement;
    });
  }

  async list(query: PaginationQueryDto) {
    const { skip, take, page, limit } = getPagination(query);
    const where: Prisma.ProductWhereInput = { deletedAt: null };
    if (query.search) {
      where.OR = [
        { name: { contains: query.search, mode: 'insensitive' } },
        { sku: { contains: query.search, mode: 'insensitive' } },
      ];
    }
    const [total, products] = await this.prisma.$transaction([
      this.prisma.product.count({ where }),
      this.prisma.product.findMany({
        where,
        skip,
        take,
        orderBy: { name: 'asc' },
        include: { variants: true, brand: true, category: true },
      }),
    ]);
    const data = products.map((p) => ({
      ...p,
      availableStock: this.available(p.stock, p.reservedStock),
      isLowStock: this.available(p.stock, p.reservedStock) <= p.lowStockThreshold,
      isOutOfStock: this.available(p.stock, p.reservedStock) <= 0,
    }));
    return paginated(data, total, page, limit);
  }

  async outOfStockSafe() {
    const products = await this.prisma.product.findMany({
      where: { deletedAt: null },
      include: { brand: true, category: true },
    });
    return products.filter((p) => this.available(p.stock, p.reservedStock) <= 0);
  }

  async lowStockSafe() {
    const products = await this.prisma.product.findMany({
      where: { deletedAt: null },
      include: { brand: true, category: true },
    });
    return products.filter((p) => {
      const available = this.available(p.stock, p.reservedStock);
      return available > 0 && available <= p.lowStockThreshold;
    });
  }

  async movements(query: PaginationQueryDto) {
    const { skip, take, page, limit } = getPagination(query);
    const where: Prisma.StockMovementWhereInput = {};
    if (query.search) {
      where.OR = [
        { reason: { contains: query.search, mode: 'insensitive' } },
        { productId: query.search },
      ];
    }
    const [total, data] = await this.prisma.$transaction([
      this.prisma.stockMovement.count({ where }),
      this.prisma.stockMovement.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
        include: {
          product: { select: { id: true, name: true, sku: true } },
          variant: { select: { id: true, sku: true, attributes: true } },
        },
      }),
    ]);
    return paginated(data, total, page, limit);
  }

  private async maybeNotify(
    tx: DbClient,
    productId: string,
    _variantId: string | null,
  ) {
    const product = await tx.product.findUnique({ where: { id: productId } });
    if (!product) return;
    const available = this.available(product.stock, product.reservedStock);
    if (available <= 0) {
      await this.notifications.notifyAll(
        'OUT_OF_STOCK',
        'Product out of stock',
        `${product.name} (${product.sku}) is out of stock`,
        tx,
      );
    } else if (available <= product.lowStockThreshold) {
      await this.notifications.notifyAll(
        'LOW_STOCK',
        'Low stock warning',
        `${product.name} (${product.sku}) has ${available} units left`,
        tx,
      );
    }
  }
}
