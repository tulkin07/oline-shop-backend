import { Injectable } from '@nestjs/common';
import { OrderStatus, ReviewStatus } from '@prisma/client';
import { toNumber } from '../common/utils/money';
import { InventoryService } from '../inventory/inventory.service';
import { PrismaService } from '../prisma/prisma.service';
import { AnalyticsQueryDto } from './dto/analytics-query.dto';
import { eachDay, endOfDay, resolveRange, startOfDay } from './date-range';

@Injectable()
export class AnalyticsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly inventory: InventoryService,
  ) {}

  async dashboard() {
    const todayFrom = startOfDay(new Date());
    const todayTo = endOfDay(new Date());
    const delivered = { status: OrderStatus.DELIVERED };

    const [
      totalRevenue,
      totalOrders,
      totalCustomers,
      totalProducts,
      todayRevenue,
      todayOrders,
      todayCustomers,
      pendingOrders,
      processingOrders,
      deliveredOrders,
      cancelledOrders,
    ] = await Promise.all([
      this.prisma.order.aggregate({
        where: delivered,
        _sum: { total: true },
      }),
      this.prisma.order.count(),
      this.prisma.user.count({ where: { deletedAt: null } }),
      this.prisma.product.count({ where: { deletedAt: null } }),
      this.prisma.order.aggregate({
        where: { ...delivered, createdAt: { gte: todayFrom, lte: todayTo } },
        _sum: { total: true },
      }),
      this.prisma.order.count({
        where: { createdAt: { gte: todayFrom, lte: todayTo } },
      }),
      this.prisma.user.count({
        where: { deletedAt: null, createdAt: { gte: todayFrom, lte: todayTo } },
      }),
      this.prisma.order.count({ where: { status: OrderStatus.PENDING } }),
      this.prisma.order.count({
        where: {
          status: {
            in: [OrderStatus.CONFIRMED, OrderStatus.PROCESSING, OrderStatus.PACKED],
          },
        },
      }),
      this.prisma.order.count({ where: { status: OrderStatus.DELIVERED } }),
      this.prisma.order.count({ where: { status: OrderStatus.CANCELLED } }),
    ]);

    const [lowStock, outOfStock, topProducts, chart] = await Promise.all([
      this.inventory.lowStockSafe(),
      this.inventory.outOfStockSafe(),
      this.topSelling(5),
      this.salesChart({ range: '7d' }),
    ]);

    return {
      totals: {
        revenue: toNumber(totalRevenue._sum.total ?? 0),
        orders: totalOrders,
        customers: totalCustomers,
        products: totalProducts,
      },
      today: {
        revenue: toNumber(todayRevenue._sum.total ?? 0),
        orders: todayOrders,
        customers: todayCustomers,
      },
      orders: {
        pending: pendingOrders,
        processing: processingOrders,
        delivered: deliveredOrders,
        cancelled: cancelledOrders,
      },
      inventory: {
        lowStockCount: lowStock.length,
        outOfStockCount: outOfStock.length,
        lowStock: lowStock.slice(0, 10),
        outOfStock: outOfStock.slice(0, 10),
      },
      topProducts,
      chart,
    };
  }

  async sales(query: AnalyticsQueryDto) {
    const { from, to } = resolveRange(query.range, query.dateFrom, query.dateTo);
    const deliveredWhere = {
      status: OrderStatus.DELIVERED,
      createdAt: { gte: from, lte: to },
    };
    const [
      revenueAgg,
      ordersCount,
      productsSold,
      newCustomers,
      cancelledOrders,
      deliveredOrders,
      customersWithOrders,
    ] = await Promise.all([
      this.prisma.order.aggregate({
        where: deliveredWhere,
        _sum: { total: true },
        _avg: { total: true },
      }),
      this.prisma.order.count({
        where: { createdAt: { gte: from, lte: to } },
      }),
      this.prisma.orderItem.aggregate({
        where: { order: deliveredWhere },
        _sum: { quantity: true },
      }),
      this.prisma.user.count({
        where: { deletedAt: null, createdAt: { gte: from, lte: to } },
      }),
      this.prisma.order.count({
        where: {
          status: OrderStatus.CANCELLED,
          createdAt: { gte: from, lte: to },
        },
      }),
      this.prisma.order.count({ where: deliveredWhere }),
      this.prisma.order.findMany({
        where: { createdAt: { gte: from, lte: to } },
        select: { userId: true },
        distinct: ['userId'],
      }),
    ]);

    const returning = await this.prisma.order.groupBy({
      by: ['userId'],
      where: { createdAt: { lt: from } },
      _count: { _all: true },
    });
    const returningSet = new Set(returning.map((r) => r.userId));
    const returningCustomers = customersWithOrders.filter((c) =>
      returningSet.has(c.userId),
    ).length;

    return {
      range: { from, to },
      revenue: toNumber(revenueAgg._sum.total ?? 0),
      orders: ordersCount,
      averageOrderValue: toNumber(revenueAgg._avg.total ?? 0),
      productsSold: productsSold._sum.quantity ?? 0,
      newCustomers,
      returningCustomers,
      cancelledOrders,
      deliveredOrders,
      chart: await this.salesChart(query),
    };
  }

  async salesChart(query: AnalyticsQueryDto) {
    const { from, to } = resolveRange(query.range, query.dateFrom, query.dateTo);
    const orders = await this.prisma.order.findMany({
      where: {
        status: OrderStatus.DELIVERED,
        createdAt: { gte: from, lte: to },
      },
      select: { createdAt: true, total: true },
    });
    const buckets = new Map<string, { orders: number; revenue: number }>();
    for (const day of eachDay(from, to)) {
      buckets.set(day, { orders: 0, revenue: 0 });
    }
    for (const order of orders) {
      const key = order.createdAt.toISOString().slice(0, 10);
      const bucket = buckets.get(key);
      if (bucket) {
        bucket.orders += 1;
        bucket.revenue += toNumber(order.total);
      }
    }
    return [...buckets.entries()].map(([date, value]) => ({
      date,
      orders: value.orders,
      revenue: value.revenue,
    }));
  }

  async ordersAnalytics(query: AnalyticsQueryDto) {
    const { from, to } = resolveRange(query.range, query.dateFrom, query.dateTo);
    const grouped = await this.prisma.order.groupBy({
      by: ['status'],
      where: { createdAt: { gte: from, lte: to } },
      _count: { _all: true },
      _sum: { total: true },
    });
    return {
      range: { from, to },
      byStatus: grouped.map((row) => ({
        status: row.status,
        count: row._count._all,
        total: toNumber(row._sum.total ?? 0),
      })),
      recent: await this.prisma.order.findMany({
        where: { createdAt: { gte: from, lte: to } },
        orderBy: { createdAt: 'desc' },
        take: 10,
        include: {
          user: {
            select: { id: true, firstName: true, lastName: true, email: true },
          },
        },
      }),
    };
  }

  async customersAnalytics(query: AnalyticsQueryDto) {
    const { from, to } = resolveRange(query.range, query.dateFrom, query.dateTo);
    const [
      total,
      newCustomers,
      withOrders,
      active,
    ] = await Promise.all([
      this.prisma.user.count({ where: { deletedAt: null } }),
      this.prisma.user.count({
        where: { deletedAt: null, createdAt: { gte: from, lte: to } },
      }),
      this.prisma.user.count({
        where: { deletedAt: null, orders: { some: {} } },
      }),
      this.prisma.user.count({
        where: { deletedAt: null, isActive: true },
      }),
    ]);
    const withoutOrders = total - withOrders;
    const topBySpending = await this.prisma.order.groupBy({
      by: ['userId'],
      where: { status: OrderStatus.DELIVERED },
      _sum: { total: true },
      _count: { _all: true },
      orderBy: { _sum: { total: 'desc' } },
      take: 10,
    });
    const users = await this.prisma.user.findMany({
      where: { id: { in: topBySpending.map((t) => t.userId) } },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
      },
    });
    const userMap = new Map(users.map((u) => [u.id, u]));
    return {
      range: { from, to },
      total,
      newCustomers,
      active,
      withOrders,
      withoutOrders,
      topBySpending: topBySpending.map((row) => ({
        customer: userMap.get(row.userId),
        totalSpent: toNumber(row._sum.total ?? 0),
        orderCount: row._count._all,
      })),
      topByOrderCount: [...topBySpending]
        .sort((a, b) => b._count._all - a._count._all)
        .slice(0, 10)
        .map((row) => ({
          customer: userMap.get(row.userId),
          orderCount: row._count._all,
          totalSpent: toNumber(row._sum.total ?? 0),
        })),
    };
  }

  async productsAnalytics() {
    const [
      topSelling,
      mostViewed,
      mostReviewed,
      highestRated,
      lowStock,
      outOfStock,
    ] = await Promise.all([
      this.topSelling(10),
      this.prisma.product.findMany({
        where: { deletedAt: null },
        orderBy: { viewsCount: 'desc' },
        take: 10,
        select: {
          id: true,
          name: true,
          slug: true,
          sku: true,
          viewsCount: true,
          price: true,
        },
      }),
      this.prisma.review.groupBy({
        by: ['productId'],
        where: { status: ReviewStatus.APPROVED },
        _count: { _all: true },
      }),
      this.prisma.review.groupBy({
        by: ['productId'],
        where: { status: ReviewStatus.APPROVED },
        _avg: { rating: true },
        _count: { _all: true },
      }),
      this.inventory.lowStockSafe(),
      this.inventory.outOfStockSafe(),
    ]);

    const mostReviewedSorted = [...mostReviewed]
      .sort((a, b) => (b._count._all ?? 0) - (a._count._all ?? 0))
      .slice(0, 10);
    const highestRatedSorted = [...highestRated]
      .sort((a, b) => (b._avg.rating ?? 0) - (a._avg.rating ?? 0))
      .slice(0, 10);

    const reviewedIds = [
      ...mostReviewedSorted.map((r) => r.productId),
      ...highestRatedSorted.map((r) => r.productId),
    ];
    const reviewedProducts = await this.prisma.product.findMany({
      where: { id: { in: reviewedIds } },
      select: { id: true, name: true, slug: true, sku: true },
    });
    const reviewedMap = new Map(reviewedProducts.map((p) => [p.id, p]));

    return {
      topSelling,
      mostViewed: mostViewed.map((p) => ({ ...p, price: toNumber(p.price) })),
      mostReviewed: mostReviewedSorted.map((row) => ({
        product: reviewedMap.get(row.productId),
        reviewsCount: row._count._all,
      })),
      highestRated: highestRatedSorted.map((row) => ({
        product: reviewedMap.get(row.productId),
        averageRating: Number((row._avg.rating ?? 0).toFixed(2)),
        reviewsCount: row._count._all,
      })),
      lowStock,
      outOfStock,
    };
  }

  private async topSelling(take: number) {
    const grouped = await this.prisma.orderItem.groupBy({
      by: ['productId'],
      where: { order: { status: OrderStatus.DELIVERED } },
      _sum: { quantity: true, total: true },
      orderBy: { _sum: { quantity: 'desc' } },
      take,
    });
    const products = await this.prisma.product.findMany({
      where: { id: { in: grouped.map((g) => g.productId) } },
      select: { id: true, name: true, slug: true, sku: true, price: true },
    });
    const map = new Map(products.map((p) => [p.id, p]));
    return grouped.map((row) => ({
      product: map.get(row.productId)
        ? {
            ...map.get(row.productId),
            price: toNumber(map.get(row.productId)!.price),
          }
        : null,
      unitsSold: row._sum.quantity ?? 0,
      revenue: toNumber(row._sum.total ?? 0),
    }));
  }
}
