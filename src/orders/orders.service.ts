import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  ActivityType,
  OrderStatus,
  PaymentMethod,
  PaymentStatus,
  Prisma,
} from '@prisma/client';
import { ActivityService } from '../common/services/activity.service';
import {
  canTransition,
  CUSTOMER_CANCELLABLE,
  CUSTOMER_RETURNABLE,
} from '../common/constants/order-transitions';
import { PaginationQueryDto } from '../common/dto/pagination-query.dto';
import { generateOrderNumber } from '../common/utils/order-number';
import { getPagination, paginated, parseSortOrder } from '../common/utils/pagination';
import { roundMoney, toNumber } from '../common/utils/money';
import { InventoryService } from '../inventory/inventory.service';
import { NotificationsService } from '../notifications/notifications.service';
import { PrismaService } from '../prisma/prisma.service';
import { SettingsService } from '../settings/settings.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { orderInclude, serializeOrder } from './order.serializer';

@Injectable()
export class OrdersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly inventory: InventoryService,
    private readonly settings: SettingsService,
    private readonly activity: ActivityService,
    private readonly notifications: NotificationsService,
  ) {}

  async create(userId: string, dto: CreateOrderDto) {
    const [user, address, cart, settings] = await Promise.all([
      this.prisma.user.findUniqueOrThrow({ where: { id: userId } }),
      this.prisma.address.findFirst({
        where: { id: dto.addressId, userId },
      }),
      this.prisma.cart.findUnique({
        where: { userId },
        include: {
          items: {
            include: {
              product: { include: { images: true, variants: true } },
              variant: true,
            },
          },
        },
      }),
      this.settings.get(),
    ]);
    if (!address) {
      throw new BadRequestException({
        message: 'Delivery address not found',
        error: 'BAD_REQUEST',
      });
    }
    if (!cart || cart.items.length === 0) {
      throw new BadRequestException({
        message: 'Cart is empty',
        error: 'BAD_REQUEST',
      });
    }

    const order = await this.prisma.$transaction(async (tx) => {
      let subtotal = 0;
      const prepared: Array<{
        productId: string;
        variantId: string | null;
        productName: string;
        productSku: string;
        productImage: string | null;
        attributes: Prisma.InputJsonValue | typeof Prisma.JsonNull;
        price: number;
        quantity: number;
        total: number;
      }> = [];

      for (const item of cart.items) {
        const product = await tx.product.findFirst({
          where: { id: item.productId, deletedAt: null },
          include: { images: true, variants: true },
        });
        if (!product || !product.isActive) {
          throw new BadRequestException({
            message: `Product ${item.product.name} is unavailable`,
            error: 'BAD_REQUEST',
          });
        }
        let unitPrice = toNumber(product.price);
        let sku = product.sku;
        let attributes: Prisma.InputJsonValue | typeof Prisma.JsonNull =
          Prisma.JsonNull;
        if (item.variantId) {
          const variant = product.variants.find((v) => v.id === item.variantId);
          if (!variant || !variant.isActive) {
            throw new BadRequestException({
              message: `Variant for ${product.name} is unavailable`,
              error: 'BAD_REQUEST',
            });
          }
          unitPrice = toNumber(variant.price);
          sku = variant.sku;
          attributes = variant.attributes as Prisma.InputJsonValue;
        }
        const lineTotal = roundMoney(unitPrice * item.quantity);
        subtotal += lineTotal;
        prepared.push({
          productId: product.id,
          variantId: item.variantId,
          productName: product.name,
          productSku: sku,
          productImage:
            product.images.find((i) => i.isMain)?.url ??
            product.images[0]?.url ??
            null,
          attributes,
          price: unitPrice,
          quantity: item.quantity,
          total: lineTotal,
        });
      }

      subtotal = roundMoney(subtotal);
      const discount = 0;
      let deliveryFee = settings.deliveryFee;
      if (
        settings.freeDeliveryThreshold &&
        subtotal >= settings.freeDeliveryThreshold
      ) {
        deliveryFee = 0;
      }
      const total = roundMoney(subtotal - discount + deliveryFee);

      const created = await tx.order.create({
        data: {
          orderNumber: generateOrderNumber(),
          userId,
          status: OrderStatus.PENDING,
          paymentMethod: PaymentMethod.CASH_ON_DELIVERY,
          paymentStatus: PaymentStatus.UNPAID,
          subtotal,
          discount,
          deliveryFee,
          total,
          notes: dto.notes,
          addressSnapshot: {
            title: address.title,
            firstName: address.firstName,
            lastName: address.lastName,
            phone: address.phone,
            region: address.region,
            city: address.city,
            district: address.district,
            street: address.street,
            house: address.house,
            apartment: address.apartment,
            postalCode: address.postalCode,
            comment: address.comment,
          },
          customerSnapshot: {
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.email,
            phone: user.phone,
          },
          items: {
            create: prepared.map((item) => ({
              productId: item.productId,
              variantId: item.variantId,
              productName: item.productName,
              productSku: item.productSku,
              productImage: item.productImage,
              attributes: item.attributes,
              price: item.price,
              quantity: item.quantity,
              total: item.total,
            })),
          },
          statusHistory: {
            create: {
              status: OrderStatus.PENDING,
              comment: 'Order created',
              changedBy: 'CUSTOMER',
            },
          },
        },
        include: orderInclude,
      });

      for (const item of prepared) {
        await this.inventory.reserve(
          tx,
          item.productId,
          item.variantId,
          item.quantity,
          userId,
        );
      }

      await tx.cartItem.deleteMany({ where: { cartId: cart.id } });
      await this.activity.log(userId, ActivityType.ORDER_CREATED, {
        orderId: created.id,
        orderNumber: created.orderNumber,
      }, tx);
      await this.notifications.notifyAll(
        'NEW_ORDER',
        'New order received',
        `Order ${created.orderNumber} was placed. Total: ${total} ${settings.currency}`,
        tx,
      );
      return created;
    });

    return serializeOrder(order);
  }

  async findMine(userId: string, query: PaginationQueryDto) {
    const { skip, take, page, limit } = getPagination(query);
    const where: Prisma.OrderWhereInput = { userId };
    if (query.status) where.status = query.status as OrderStatus;
    const [total, rows] = await this.prisma.$transaction([
      this.prisma.order.count({ where }),
      this.prisma.order.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
        include: orderInclude,
      }),
    ]);
    return paginated(rows.map(serializeOrder), total, page, limit);
  }

  async findMineOne(userId: string, id: string) {
    const order = await this.prisma.order.findFirst({
      where: { id, userId },
      include: orderInclude,
    });
    if (!order) {
      throw new NotFoundException({
        message: 'Order not found',
        error: 'NOT_FOUND',
      });
    }
    return serializeOrder(order);
  }

  async cancelByCustomer(userId: string, id: string) {
    const order = await this.prisma.order.findFirst({
      where: { id, userId },
      include: { items: true },
    });
    if (!order) {
      throw new NotFoundException({
        message: 'Order not found',
        error: 'NOT_FOUND',
      });
    }
    if (!CUSTOMER_CANCELLABLE.includes(order.status)) {
      throw new ForbiddenException({
        message: 'Order cannot be cancelled at this stage',
        error: 'FORBIDDEN',
      });
    }
    return this.changeStatus(order.id, OrderStatus.CANCELLED, 'Cancelled by customer', 'CUSTOMER');
  }

  async requestReturn(userId: string, id: string) {
    const order = await this.prisma.order.findFirst({
      where: { id, userId },
    });
    if (!order) {
      throw new NotFoundException({
        message: 'Order not found',
        error: 'NOT_FOUND',
      });
    }
    if (!CUSTOMER_RETURNABLE.includes(order.status)) {
      throw new ForbiddenException({
        message: 'Return can only be requested after shipping or delivery',
        error: 'FORBIDDEN',
      });
    }
    return this.changeStatus(
      order.id,
      OrderStatus.RETURN_REQUESTED,
      'Return requested by customer',
      'CUSTOMER',
    );
  }

  async findAdmin(query: PaginationQueryDto) {
    const { skip, take, page, limit } = getPagination(query);
    const where: Prisma.OrderWhereInput = {};
    if (query.status) where.status = query.status as OrderStatus;
    if (query.search) {
      where.OR = [
        { orderNumber: { contains: query.search, mode: 'insensitive' } },
        { user: { email: { contains: query.search, mode: 'insensitive' } } },
        { user: { phone: { contains: query.search, mode: 'insensitive' } } },
        { user: { firstName: { contains: query.search, mode: 'insensitive' } } },
        { user: { lastName: { contains: query.search, mode: 'insensitive' } } },
      ];
    }
    if (query.dateFrom || query.dateTo) {
      where.createdAt = {
        gte: query.dateFrom ? new Date(query.dateFrom) : undefined,
        lte: query.dateTo ? new Date(query.dateTo) : undefined,
      };
    }
    const sortField = query.sortBy === 'total' ? 'total' : 'createdAt';
    const [total, rows] = await this.prisma.$transaction([
      this.prisma.order.count({ where }),
      this.prisma.order.findMany({
        where,
        skip,
        take,
        orderBy: { [sortField]: parseSortOrder(query.order) },
        include: orderInclude,
      }),
    ]);
    return paginated(rows.map(serializeOrder), total, page, limit);
  }

  async findAdminOne(id: string) {
    const order = await this.prisma.order.findUnique({
      where: { id },
      include: orderInclude,
    });
    if (!order) {
      throw new NotFoundException({
        message: 'Order not found',
        error: 'NOT_FOUND',
      });
    }
    return serializeOrder(order);
  }

  async updateAdmin(id: string, dto: UpdateOrderDto) {
    await this.findAdminOne(id);
    const order = await this.prisma.order.update({
      where: { id },
      data: { notes: dto.notes },
      include: orderInclude,
    });
    return serializeOrder(order);
  }

  async changeStatus(
    orderId: string,
    next: OrderStatus,
    comment: string,
    changedBy: string,
    adminId?: string,
  ) {
    const result = await this.prisma.$transaction(async (tx) => {
      const order = await tx.order.findUnique({
        where: { id: orderId },
        include: { items: true },
      });
      if (!order) {
        throw new NotFoundException({
          message: 'Order not found',
          error: 'NOT_FOUND',
        });
      }
      if (order.status === next) {
        throw new BadRequestException({
          message: 'Order already has this status',
          error: 'BAD_REQUEST',
        });
      }
      if (!canTransition(order.status, next) && changedBy !== 'CUSTOMER') {
        throw new BadRequestException({
          message: `Cannot change status from ${order.status} to ${next}`,
          error: 'BAD_REQUEST',
        });
      }
      if (changedBy === 'CUSTOMER') {
        const allowed =
          (next === OrderStatus.CANCELLED &&
            CUSTOMER_CANCELLABLE.includes(order.status)) ||
          (next === OrderStatus.RETURN_REQUESTED &&
            CUSTOMER_RETURNABLE.includes(order.status));
        if (!allowed) {
          throw new ForbiddenException({
            message: 'This status change is not allowed',
            error: 'FORBIDDEN',
          });
        }
      }

      await tx.order.update({
        where: { id: orderId },
        data: {
          status: next,
          paymentStatus:
            next === OrderStatus.DELIVERED
              ? PaymentStatus.PAID
              : order.paymentStatus,
        },
        include: orderInclude,
      });

      await tx.orderStatusHistory.create({
        data: {
          orderId,
          status: next,
          comment,
          changedBy,
          adminId,
        },
      });

      if (next === OrderStatus.CANCELLED) {
        for (const item of order.items) {
          await this.inventory.release(
            tx,
            item.productId,
            item.variantId,
            item.quantity,
            changedBy,
          );
        }
        await this.activity.log(
          order.userId,
          ActivityType.ORDER_CANCELLED,
          { orderId: order.id, orderNumber: order.orderNumber },
          tx,
        );
      }

      if (next === OrderStatus.DELIVERED && order.status !== OrderStatus.RETURN_REQUESTED) {
        for (const item of order.items) {
          await this.inventory.finalize(
            tx,
            item.productId,
            item.variantId,
            item.quantity,
            changedBy,
          );
        }
      }

      if (next === OrderStatus.RETURNED) {
        for (const item of order.items) {
          await this.inventory.restockOnReturn(
            tx,
            item.productId,
            item.variantId,
            item.quantity,
            changedBy,
          );
        }
      }

      if (next === OrderStatus.RETURN_REQUESTED) {
        await this.notifications.notifyAll(
          'RETURN_REQUEST',
          'Return requested',
          `Return requested for order ${order.orderNumber}`,
          tx,
        );
      }

      return tx.order.findUniqueOrThrow({
        where: { id: orderId },
        include: orderInclude,
      });
    });
    return serializeOrder(result);
  }
}
