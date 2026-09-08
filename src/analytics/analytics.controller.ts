import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AdminRole } from '@prisma/client';
import { Roles } from '../common/decorators/roles.decorator';
import { JwtAdminGuard } from '../common/guards/jwt-admin.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { AnalyticsService } from './analytics.service';
import { AnalyticsQueryDto } from './dto/analytics-query.dto';
import {
  DashboardProductQueryDto,
  DashboardWeekQueryDto,
} from './dto/dashboard-query.dto';

@ApiTags('Admin Dashboard')
@ApiBearerAuth()
@UseGuards(JwtAdminGuard, RolesGuard)
@Roles(AdminRole.SUPER_ADMIN, AdminRole.ADMIN, AdminRole.MANAGER)
@Controller('admin')
export class AnalyticsController {
  constructor(private readonly analytics: AnalyticsService) {}

  @Get('dashboard')
  @ApiOperation({
    summary:
      'Full dashboard page: 7-day KPIs, weekly report, realtime users, sales by region, best sellers, top products',
  })
  dashboard() {
    return this.analytics.dashboard();
  }

  @Get('dashboard/kpis')
  @ApiOperation({
    summary: 'Top KPI cards (sales, orders, pending, cancelled) with period comparison',
  })
  kpis(@Query() query: AnalyticsQueryDto) {
    return this.analytics.kpis({ ...query, range: query.range ?? '7d' });
  }

  @Get('dashboard/weekly-report')
  @ApiOperation({
    summary: 'Report for this week / last week: stats + Sun–Sat area chart',
  })
  weeklyReport(@Query() query: DashboardWeekQueryDto) {
    return this.analytics.weeklyReport(query);
  }

  @Get('dashboard/realtime-users')
  @ApiOperation({
    summary: 'Users in last 30 minutes and users-per-minute bar chart',
  })
  realtimeUsers() {
    return this.analytics.realtimeUsers();
  }

  @Get('dashboard/sales-by-country')
  @ApiOperation({
    summary:
      'Sales by delivery region/country with growth % and share for progress bars',
  })
  salesByCountry() {
    return this.analytics.salesByCountry();
  }

  @Get('dashboard/best-sellers')
  @ApiOperation({
    summary: 'Best selling products table (image, orders, stock status, price)',
  })
  bestSellers(@Query() query: DashboardProductQueryDto) {
    return this.analytics.bestSellers(query);
  }

  @Get('dashboard/top-products')
  @ApiOperation({
    summary: 'Top products widget (searchable: image, name, SKU, price)',
  })
  topProducts(@Query() query: DashboardProductQueryDto) {
    return this.analytics.topProductsWidget({
      ...query,
      limit: query.limit ?? 6,
    });
  }

  @Get('dashboard/sales')
  @ApiOperation({ summary: 'Sales analytics with chart data' })
  sales(@Query() query: AnalyticsQueryDto) {
    return this.analytics.sales(query);
  }

  @Get('dashboard/orders')
  @ApiOperation({ summary: 'Order analytics' })
  orders(@Query() query: AnalyticsQueryDto) {
    return this.analytics.ordersAnalytics(query);
  }

  @Get('dashboard/customers')
  @ApiOperation({ summary: 'Customer analytics' })
  customers(@Query() query: AnalyticsQueryDto) {
    return this.analytics.customersAnalytics(query);
  }

  @Get('dashboard/products')
  @ApiOperation({ summary: 'Product analytics' })
  products() {
    return this.analytics.productsAnalytics();
  }

  @Get('analytics/sales')
  @ApiOperation({ summary: 'Sales analytics alias' })
  salesAlias(@Query() query: AnalyticsQueryDto) {
    return this.analytics.sales(query);
  }
}
