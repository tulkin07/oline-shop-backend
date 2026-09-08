import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AdminRole } from '@prisma/client';
import { CurrentAdmin } from '../common/decorators/current-admin.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { PaginationQueryDto } from '../common/dto/pagination-query.dto';
import { JwtAdminGuard } from '../common/guards/jwt-admin.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { AuthAdmin } from '../common/types/auth';
import { AdjustStockDto } from './dto/adjust-stock.dto';
import { InventoryService } from './inventory.service';

@ApiTags('Admin Inventory')
@ApiBearerAuth()
@UseGuards(JwtAdminGuard, RolesGuard)
@Roles(AdminRole.SUPER_ADMIN, AdminRole.ADMIN, AdminRole.MANAGER)
@Controller('admin/inventory')
export class InventoryController {
  constructor(private readonly inventory: InventoryService) {}

  @Get()
  @ApiOperation({ summary: 'Inventory overview' })
  list(@Query() query: PaginationQueryDto) {
    return this.inventory.list(query);
  }

  @Get('low-stock')
  @ApiOperation({ summary: 'Low stock products' })
  lowStock() {
    return this.inventory.lowStockSafe();
  }

  @Get('out-of-stock')
  @ApiOperation({ summary: 'Out of stock products' })
  outOfStock() {
    return this.inventory.outOfStockSafe();
  }

  @Get('movements')
  @ApiOperation({ summary: 'Stock movement history' })
  movements(@Query() query: PaginationQueryDto) {
    return this.inventory.movements(query);
  }

  @Post('adjust')
  @ApiOperation({ summary: 'Manual stock adjustment' })
  adjust(@Body() dto: AdjustStockDto, @CurrentAdmin() admin: AuthAdmin) {
    return this.inventory.adjust({ ...dto, adminId: admin.id });
  }
}
