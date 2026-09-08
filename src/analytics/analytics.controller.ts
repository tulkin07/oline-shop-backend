import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AdminRole } from '@prisma/client';
import { Roles } from '../common/decorators/roles.decorator';
import { JwtAdminGuard } from '../common/guards/jwt-admin.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { AnalyticsService } from './analytics.service';
import { AnalyticsQueryDto } from './dto/analytics-query.dto';

@ApiTags('Admin Dashboard')
@ApiBearerAuth()
@UseGuards(JwtAdminGuard, RolesGuard)
@Roles(AdminRole.SUPER_ADMIN, AdminRole.ADMIN, AdminRole.MANAGER)
@Controller('admin')
export class AnalyticsController {
  constructor(private readonly analytics: AnalyticsService) {}

  @Get('dashboard')
  @ApiOperation({ summary: 'Dashboard overview' })
  dashboard() {
    return this.analytics.dashboard();
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
