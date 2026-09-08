import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AdminRole } from '@prisma/client';
import { AuditLogsService } from '../audit-logs/audit-logs.service';
import { AuditContext, RequestAudit } from '../common/decorators/audit-context.decorator';
import { CurrentAdmin } from '../common/decorators/current-admin.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { PaginationQueryDto } from '../common/dto/pagination-query.dto';
import { JwtAdminGuard } from '../common/guards/jwt-admin.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { AuthAdmin } from '../common/types/auth';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { OrdersService } from './orders.service';

@ApiTags('Admin Orders')
@ApiBearerAuth()
@UseGuards(JwtAdminGuard, RolesGuard)
@Roles(AdminRole.SUPER_ADMIN, AdminRole.ADMIN, AdminRole.MANAGER)
@Controller('admin/orders')
export class AdminOrdersController {
  constructor(
    private readonly orders: OrdersService,
    private readonly audit: AuditLogsService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Admin order list' })
  list(@Query() query: PaginationQueryDto) {
    return this.orders.findAdmin(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Admin order details' })
  one(@Param('id') id: string) {
    return this.orders.findAdminOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update order notes' })
  update(@Param('id') id: string, @Body() dto: UpdateOrderDto) {
    return this.orders.updateAdmin(id, dto);
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'Change order status' })
  async status(
    @Param('id') id: string,
    @Body() dto: UpdateOrderStatusDto,
    @CurrentAdmin() admin: AuthAdmin,
    @RequestAudit() ctx: AuditContext,
  ) {
    const updated = await this.orders.changeStatus(
      id,
      dto.status,
      dto.comment ?? `Status changed to ${dto.status}`,
      admin.id,
      admin.id,
    );
    await this.audit.log({
      adminId: admin.id,
      action: 'Changed order status',
      entity: 'Order',
      entityId: id,
      newValue: { status: dto.status, comment: dto.comment },
      ipAddress: ctx.ipAddress,
      userAgent: ctx.userAgent,
    });
    return updated;
  }
}
