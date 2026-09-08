import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { AuthUser } from '../common/types/auth';
import { CustomersService } from './customers.service';
import { CreateAddressDto } from './dto/create-address.dto';
import { UpdateAddressDto } from './dto/update-address.dto';

@ApiTags('Customers')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('customers/me')
export class CustomersController {
  constructor(private readonly customers: CustomersService) {}

  @Get()
  @ApiOperation({ summary: 'Full current customer profile' })
  me(@CurrentUser() user: AuthUser) {
    return this.customers.me(user.id);
  }

  @Get('addresses')
  @ApiOperation({ summary: 'List customer addresses' })
  addresses(@CurrentUser() user: AuthUser) {
    return this.customers.listAddresses(user.id);
  }

  @Post('addresses')
  @ApiOperation({ summary: 'Create address' })
  createAddress(
    @CurrentUser() user: AuthUser,
    @Body() dto: CreateAddressDto,
  ) {
    return this.customers.createAddress(user.id, dto);
  }

  @Get('addresses/:id')
  @ApiOperation({ summary: 'Get address' })
  getAddress(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.customers.getAddress(user.id, id);
  }

  @Patch('addresses/:id')
  @ApiOperation({ summary: 'Update address' })
  updateAddress(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() dto: UpdateAddressDto,
  ) {
    return this.customers.updateAddress(user.id, id, dto);
  }

  @Delete('addresses/:id')
  @ApiOperation({ summary: 'Delete address' })
  deleteAddress(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.customers.deleteAddress(user.id, id);
  }

  @Get('purchased-products')
  @ApiOperation({ summary: 'Products purchased from delivered orders' })
  purchased(@CurrentUser() user: AuthUser) {
    return this.customers.purchasedProducts(user.id);
  }
}
