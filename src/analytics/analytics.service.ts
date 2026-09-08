import { Injectable } from '@nestjs/common';
import { OrderStatus, ReviewStatus } from '@prisma/client';
import { toNumber } from '../common/utils/money';
import { InventoryService } from '../inventory/inventory.service';
import { PrismaService } from '../prisma/prisma.service';
import { AnalyticsQueryDto } from './dto/analytics-query.dto';
import {
  DashboardProductQueryDto,
  DashboardWeekQueryDto,
} from './dto/dashboard-query.dto';
import {
  eachDay,
  percentChange,
  previousPeriod,
  resolveRange,
  weekRange,
  weekdayLabel,
  ymd,
} from './date-range';

@Injectable()
export class AnalyticsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly inventory: InventoryService,
  ) {}

  async dashboard() {
    const [
      kpis,
      weeklyReport,
      realtimeUsers,
      salesByCountry,
      bestSelling,
      topProducts,
    ] = await Promise.all([
      this.kpis({ range: '7d' }),
      this.weeklyReport({ week: 'this' }),
      this.realtimeUsers(),
      this.salesByCountry(),
      this.bestSellers({ limit: 8 }),
      this.topProductsWidget({ limit: 6 }),
    ]);

    return {
      kpis,
      weeklyReport,
      realtimeUsers,
      salesByCountry,
      bestSelling,
      topProducts,
    };
  }

  async kpis(query: AnalyticsQueryDto) {
    const range = query.range ?? '7d';
    const { from, to } = resolveRange(range, query.dateFrom, query.dateTo);
    const previous = previousPeriod(from, to);
    const [current, prior, pendingRows] = await Promise.all([
      this.periodOrderMetrics(from, to),
      this.periodOrderMetrics(previous.from, previous.to),
      this.prisma.order.findMany({
        where: { status: OrderStatus.PENDING },
        select: { userId: true },
      }),
    ]);

    return {
      label: range === '7d' ? 'Last 7 days' : range,
      range: { from, to },
      previousRange: previous,
      totalSales: {
        value: current.sales,
        previousValue: prior.sales,
        changePercent: percentChange(current.sales, prior.sales),
      },
      totalOrders: {
        value: current.orders,
        previousValue: prior.orders,
        changePercent: percentChange(current.orders, prior.orders),
      },
      pending: {
        orders: pendingRows.length,
        users: new Set(pendingRows.map((row) => row.userId)).size,
      },
      cancelled: {
        value: current.cancelled,
        previousValue: prior.cancelled,
        changePercent: percentChange(current.cancelled, prior.cancelled),
      },
    };
  }

  async weeklyReport(query: DashboardWeekQueryDto) {
    const week = query.week ?? 'this';
    const { from, to } = weekRange(week);
    const thisWeek = weekRange('this');
    const lastWeek = weekRange('last');
    const [customers, inventory, revenueAgg, thisWeekChart, lastWeekChart] =
      await Promise.all([
        this.prisma.user.count({ where: { deletedAt: null } }),
        this.inventoryCounts(),
        this.prisma.order.aggregate({
          where: {
            status: OrderStatus.DELIVERED,
            createdAt: { gte: from, lte: to },
          },
          _sum: { total: true },
        }),
        this.weekChart(thisWeek.from, thisWeek.to),
        this.weekChart(lastWeek.from, lastWeek.to),
      ]);

    return {
      week,
      range: { from, to },
      stats: {
        customers,
        totalProducts: inventory.totalProducts,
        stockProducts: inventory.stockProducts,
        outOfStock: inventory.outOfStock,
        revenue: toNumber(revenueAgg._sum.total ?? 0),
      },
      chart: {
        thisWeek: thisWeekChart,
        lastWeek: lastWeekChart,
        active: week === 'last' ? lastWeekChart : thisWeekChart,
      },
    };
  }

  async realtimeUsers() {
    const to = new Date();
    const from = new Date(to.getTime() - 30 * 60 * 1000);
    const activities = await this.prisma.userActivity.findMany({
      where: { createdAt: { gte: from, lte: to } },
      select: { userId: true, createdAt: true },
    });
    const unique = new Set(activities.map((row) => row.userId));
    const buckets = new Map<string, Set<string>>();
    for (let i = 29; i >= 0; i -= 1) {
      const minute = new Date(to.getTime() - i * 60 * 1000);
      minute.setSeconds(0, 0);
      buckets.set(minute.toISOString(), new Set());
    }
    for (const row of activities) {
      const minute = new Date(row.createdAt);
      minute.setSeconds(0, 0);
      const key = minute.toISOString();
      buckets.get(key)?.add(row.userId);
    }

    return {
      total: unique.size,
      windowMinutes: 30,
      from,
      to,
      perMinute: [...buckets.entries()].map(([time, users]) => ({
        time,
        users: users.size,
      })),
    };
  }

  async salesByCountry() {
    const { from, to } = resolveRange('30d');
    const previous = previousPeriod(from, to);
    const [currentOrders, previousOrders] = await Promise.all([
      this.deliveredLocationSales(from, to),
      this.deliveredLocationSales(previous.from, previous.to),
    ]);
    const maxSales = Math.max(0, ...currentOrders.map((row) => row.sales));
    return currentOrders.map((row) => {
      const previousSales =
        previousOrders.find((item) => item.name === row.name)?.sales ?? 0;
      return {
        name: row.name,
        code: row.code,
        sales: row.sales,
        previousSales,
        changePercent: percentChange(row.sales, previousSales),
        share: maxSales === 0 ? 0 : Number(((row.sales / maxSales) * 100).toFixed(1)),
      };
    });
  }

  async bestSellers(query: DashboardProductQueryDto) {
    const take = query.limit ?? 8;
    const grouped = await this.prisma.orderItem.groupBy({
      by: ['productId'],
      where: { order: { status: OrderStatus.DELIVERED } },
      _sum: { quantity: true, total: true },
      orderBy: { _sum: { quantity: 'desc' } },
      take: 50,
    });
    const products = await this.productsByIds(
      grouped.map((row) => row.productId),
    );
    const search = query.search?.trim().toLowerCase();
    return grouped
      .map((row) => {
        const product = products.get(row.productId);
        if (!product) return null;
        const availableStock = product.stock - product.reservedStock;
        const status = availableStock > 0 ? 'Stock' : 'Stock out';
        return {
          id: product.id,
          name: product.name,
          slug: product.slug,
          sku: product.sku,
          image: product.images[0]?.url ?? null,
          price: toNumber(product.price),
          totalOrders: row._sum.quantity ?? 0,
          revenue: toNumber(row._sum.total ?? 0),
          availableStock,
          status,
        };
      })
      .filter((row): row is NonNullable<typeof row> => {
        if (!row) return false;
        if (search && !`${row.name} ${row.sku}`.toLowerCase().includes(search)) {
          return false;
        }
        if (query.status === 'stock' && row.status !== 'Stock') return false;
        if (query.status === 'out' && row.status !== 'Stock out') return false;
        return true;
      })
      .slice(0, take);
  }

  async topProductsWidget(query: DashboardProductQueryDto) {
    const take = query.limit ?? 6;
    const search = query.search?.trim();
    if (search) {
      const products = await this.prisma.product.findMany({
        where: {
          deletedAt: null,
          OR: [
            { name: { contains: search, mode: 'insensitive' } },
            { sku: { contains: search, mode: 'insensitive' } },
          ],
        },
        take,
        orderBy: { viewsCount: 'desc' },
        include: {
          images: { where: { isMain: true }, take: 1, select: { url: true } },
        },
      });
      return products.map((product) => ({
        id: product.id,
        name: product.name,
        sku: product.sku,
        image: product.images[0]?.url ?? null,
        price: toNumber(product.price),
      }));
    }
    const sellers = await this.bestSellers({ limit: take });
    return sellers.map((row) => ({
      id: row.id,
      name: row.name,
      sku: row.sku,
      image: row.image,
      price: row.price,
    }));
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
      const key = ymd(order.createdAt);
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

  private async periodOrderMetrics(from: Date, to: Date) {
    const [sales, orders, cancelled] = await Promise.all([
      this.prisma.order.aggregate({
        where: {
          status: OrderStatus.DELIVERED,
          createdAt: { gte: from, lte: to },
        },
        _sum: { total: true },
      }),
      this.prisma.order.count({
        where: { createdAt: { gte: from, lte: to } },
      }),
      this.prisma.order.count({
        where: {
          status: OrderStatus.CANCELLED,
          createdAt: { gte: from, lte: to },
        },
      }),
    ]);
    return {
      sales: toNumber(sales._sum.total ?? 0),
      orders,
      cancelled,
    };
  }

  private async inventoryCounts() {
    const products = await this.prisma.product.findMany({
      where: { deletedAt: null },
      select: { stock: true, reservedStock: true },
    });
    let stockProducts = 0;
    let outOfStock = 0;
    for (const product of products) {
      if (product.stock - product.reservedStock > 0) {
        stockProducts += 1;
      } else {
        outOfStock += 1;
      }
    }
    return {
      totalProducts: products.length,
      stockProducts,
      outOfStock,
    };
  }

  private async weekChart(from: Date, to: Date) {
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
      const key = ymd(order.createdAt);
      const bucket = buckets.get(key);
      if (bucket) {
        bucket.orders += 1;
        bucket.revenue += toNumber(order.total);
      }
    }
    return [...buckets.entries()].map(([date, value]) => {
      const parsed = new Date(`${date}T12:00:00`);
      return {
        date,
        day: weekdayLabel(parsed),
        orders: value.orders,
        revenue: value.revenue,
        value: value.revenue,
      };
    });
  }

  private async deliveredLocationSales(from: Date, to: Date) {
    const orders = await this.prisma.order.findMany({
      where: {
        status: OrderStatus.DELIVERED,
        createdAt: { gte: from, lte: to },
      },
      select: { total: true, addressSnapshot: true },
    });
    const grouped = new Map<string, { name: string; code: string; sales: number }>();
    for (const order of orders) {
      const location = this.locationFromSnapshot(order.addressSnapshot);
      const current = grouped.get(location.name) ?? {
        name: location.name,
        code: location.code,
        sales: 0,
      };
      current.sales += toNumber(order.total);
      grouped.set(location.name, current);
    }
    return [...grouped.values()].sort((a, b) => b.sales - a.sales);
  }

  private locationFromSnapshot(snapshot: unknown) {
    const data = (snapshot ?? {}) as {
      country?: string;
      region?: string;
      city?: string;
    };
    const name =
      data.country?.trim() ||
      data.region?.trim() ||
      data.city?.trim() ||
      'Unknown';
    return {
      name,
      code: name.slice(0, 2).toUpperCase(),
    };
  }

  private async productsByIds(ids: string[]) {
    const products = await this.prisma.product.findMany({
      where: { id: { in: ids } },
      select: {
        id: true,
        name: true,
        slug: true,
        sku: true,
        price: true,
        stock: true,
        reservedStock: true,
        images: { where: { isMain: true }, take: 1, select: { url: true } },
      },
    });
    return new Map(products.map((product) => [product.id, product]));
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
