import { Body, Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { PaginationQueryDto } from '../common/dto/pagination-query.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { AuthUser } from '../common/types/auth';
import { CreateOrderDto } from './dto/create-order.dto';
import { OrdersService } from './orders.service';

@ApiTags('Orders')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('orders')
export class OrdersController {
  constructor(private readonly orders: OrdersService) {}

  @Get()
  @ApiOperation({ summary: 'List current customer orders' })
  list(@CurrentUser() user: AuthUser, @Query() query: PaginationQueryDto) {
    return this.orders.findMine(user.id, query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get customer order details' })
  one(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.orders.findMineOne(user.id, id);
  }

  @Post()
  @ApiOperation({ summary: 'Create cash-on-delivery order from cart' })
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateOrderDto) {
    return this.orders.create(user.id, dto);
  }

  @Post(':id/cancel')
  @ApiOperation({ summary: 'Cancel an order' })
  cancel(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.orders.cancelByCustomer(user.id, id);
  }

  @Post(':id/return')
  @ApiOperation({ summary: 'Request a return' })
  requestReturn(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.orders.requestReturn(user.id, id);
  }
}
