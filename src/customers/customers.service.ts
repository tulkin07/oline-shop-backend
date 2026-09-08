import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ActivityType, OrderStatus, Prisma } from '@prisma/client';
import { ActivityService } from '../common/services/activity.service';
import { PaginationQueryDto } from '../common/dto/pagination-query.dto';
import { getPagination, paginated } from '../common/utils/pagination';
import { toNumber } from '../common/utils/money';
import { PrismaService } from '../prisma/prisma.service';
import { sanitizeUser } from '../users/user.serializer';
import { CreateAddressDto } from './dto/create-address.dto';
import { UpdateAddressDto } from './dto/update-address.dto';

@Injectable()
export class CustomersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly activity: ActivityService,
  ) {}

  listAddresses(userId: string) {
    return this.prisma.address.findMany({
      where: { userId },
      orderBy: [{ isDefault: 'desc' }, { createdAt: 'desc' }],
    });
  }

  async getAddress(userId: string, id: string) {
    const address = await this.prisma.address.findFirst({
      where: { id, userId },
    });
    if (!address) {
      throw new NotFoundException({
        message: 'Address not found',
        error: 'NOT_FOUND',
      });
    }
    return address;
  }

  async createAddress(userId: string, dto: CreateAddressDto) {
    const count = await this.prisma.address.count({ where: { userId } });
    const isDefault = dto.isDefault ?? count === 0;
    if (isDefault) {
      await this.prisma.address.updateMany({
        where: { userId },
        data: { isDefault: false },
      });
    }
    const address = await this.prisma.address.create({
      data: { ...dto, userId, isDefault },
    });
    await this.activity.log(userId, ActivityType.ADDRESS_ADDED, {
      addressId: address.id,
    });
    return address;
  }

  async updateAddress(userId: string, id: string, dto: UpdateAddressDto) {
    await this.getAddress(userId, id);
    if (dto.isDefault) {
      await this.prisma.address.updateMany({
        where: { userId },
        data: { isDefault: false },
      });
    }
    return this.prisma.address.update({
      where: { id },
      data: dto,
    });
  }

  async deleteAddress(userId: string, id: string) {
    await this.getAddress(userId, id);
    await this.prisma.address.delete({ where: { id } });
    return { deleted: true };
  }

  async me(userId: string) {
    const user = await this.prisma.user.findUniqueOrThrow({
      where: { id: userId },
      include: {
        addresses: true,
        reviews: { include: { product: { select: { id: true, name: true, slug: true } } } },
        wishlist: { include: { items: { include: { product: true } } } },
        activities: { orderBy: { createdAt: 'desc' }, take: 30 },
      },
    });
    const stats = await this.customerStats(userId);
    return { ...sanitizeUser(user), ...stats };
  }

  async purchasedProducts(userId: string) {
    const items = await this.prisma.orderItem.findMany({
      where: {
        order: { userId, status: OrderStatus.DELIVERED },
      },
      include: {
        product: {
          include: {
            images: { where: { isMain: true }, take: 1 },
            brand: true,
          },
        },
      },
      orderBy: { order: { createdAt: 'desc' } },
    });
    const map = new Map<
      string,
      {
        product: unknown;
        quantity: number;
        lastOrderId: string;
      }
    >();
    for (const item of items) {
      const current = map.get(item.productId);
      if (current) {
        current.quantity += item.quantity;
      } else {
        map.set(item.productId, {
          product: {
            id: item.product.id,
            name: item.product.name,
            slug: item.product.slug,
            sku: item.product.sku,
            image: item.product.images[0]?.url ?? item.productImage,
            brand: item.product.brand.name,
          },
          quantity: item.quantity,
          lastOrderId: item.orderId,
        });
      }
    }
    return [...map.values()];
  }

  async findAdmin(query: PaginationQueryDto) {
    const { skip, take, page, limit } = getPagination(query);
    const where: Prisma.UserWhereInput = { deletedAt: null };
    if (query.search) {
      where.OR = [
        { firstName: { contains: query.search, mode: 'insensitive' } },
        { lastName: { contains: query.search, mode: 'insensitive' } },
        { email: { contains: query.search, mode: 'insensitive' } },
        { phone: { contains: query.search, mode: 'insensitive' } },
      ];
    }
    if (query.status === 'active') where.isActive = true;
    if (query.status === 'inactive') where.isActive = false;
    const [total, users] = await this.prisma.$transaction([
      this.prisma.user.count({ where }),
      this.prisma.user.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
        include: {
          _count: { select: { orders: true, reviews: true } },
        },
      }),
    ]);
    const data = await Promise.all(
      users.map(async (user) => {
        const spent = await this.prisma.order.aggregate({
          where: { userId: user.id, status: OrderStatus.DELIVERED },
          _sum: { total: true },
        });
        return {
          ...sanitizeUser(user),
          totalOrders: user._count.orders,
          totalSpent: toNumber(spent._sum.total ?? 0),
        };
      }),
    );
    return paginated(data, total, page, limit);
  }

  async findAdminOne(id: string) {
    const user = await this.prisma.user.findFirst({
      where: { id, deletedAt: null },
      include: {
        addresses: true,
        reviews: {
          include: { product: { select: { id: true, name: true, slug: true } } },
        },
        wishlist: {
          include: {
            items: {
              include: {
                product: { select: { id: true, name: true, slug: true } },
              },
            },
          },
        },
        activities: { orderBy: { createdAt: 'desc' }, take: 50 },
        orders: {
          orderBy: { createdAt: 'desc' },
          take: 20,
          include: { items: true },
        },
      },
    });
    if (!user) {
      throw new NotFoundException({
        message: 'Customer not found',
        error: 'NOT_FOUND',
      });
    }
    const stats = await this.customerStats(id);
    const purchasedProducts = await this.purchasedProducts(id);
    const { password: _password, ...safe } = user;
    return { ...safe, ...stats, purchasedProducts };
  }

  async updateStatus(id: string, isActive: boolean) {
    const user = await this.prisma.user.findFirst({
      where: { id, deletedAt: null },
    });
    if (!user) {
      throw new NotFoundException({
        message: 'Customer not found',
        error: 'NOT_FOUND',
      });
    }
    const updated = await this.prisma.user.update({
      where: { id },
      data: {
        isActive,
        deletedAt: isActive ? null : user.deletedAt,
      },
    });
    return sanitizeUser(updated);
  }

  private async customerStats(userId: string) {
    const [agg, lastOrder, withOrders] = await Promise.all([
      this.prisma.order.aggregate({
        where: { userId, status: OrderStatus.DELIVERED },
        _sum: { total: true },
        _count: { _all: true },
        _avg: { total: true },
      }),
      this.prisma.order.findFirst({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          orderNumber: true,
          status: true,
          total: true,
          createdAt: true,
        },
      }),
      this.prisma.order.count({ where: { userId } }),
    ]);
    const totalOrders = withOrders;
    const deliveredOrders = agg._count._all;
    const totalSpent = toNumber(agg._sum.total ?? 0);
    return {
      totalOrders,
      deliveredOrders,
      totalSpent,
      averageOrderValue: toNumber(agg._avg.total ?? 0),
      lastOrder: lastOrder
        ? { ...lastOrder, total: toNumber(lastOrder.total) }
        : null,
    };
  }
}
