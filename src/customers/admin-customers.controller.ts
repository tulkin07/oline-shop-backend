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
import { Roles } from '../common/decorators/roles.decorator';
import { PaginationQueryDto } from '../common/dto/pagination-query.dto';
import { JwtAdminGuard } from '../common/guards/jwt-admin.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { CustomersService } from './customers.service';
import { UpdateCustomerStatusDto } from './dto/update-customer-status.dto';

@ApiTags('Admin Customers')
@ApiBearerAuth()
@UseGuards(JwtAdminGuard, RolesGuard)
@Roles(AdminRole.SUPER_ADMIN, AdminRole.ADMIN, AdminRole.MANAGER)
@Controller('admin/customers')
export class AdminCustomersController {
  constructor(private readonly customers: CustomersService) {}

  @Get()
  @ApiOperation({ summary: 'Admin customer list' })
  list(@Query() query: PaginationQueryDto) {
    return this.customers.findAdmin(query);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Customer details with orders, purchased products, reviews, wishlist, activity',
  })
  one(@Param('id') id: string) {
    return this.customers.findAdminOne(id);
  }

  @Patch(':id/status')
  @Roles(AdminRole.SUPER_ADMIN, AdminRole.ADMIN)
  @ApiOperation({ summary: 'Activate or deactivate customer' })
  status(@Param('id') id: string, @Body() dto: UpdateCustomerStatusDto) {
    return this.customers.updateStatus(id, dto.isActive);
  }
}
