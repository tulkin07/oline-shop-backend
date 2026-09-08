import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AdminRole } from '@prisma/client';
import { AuditLogsService } from '../audit-logs/audit-logs.service';
import { AuditContext, RequestAudit } from '../common/decorators/audit-context.decorator';
import { CurrentAdmin } from '../common/decorators/current-admin.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { JwtAdminGuard } from '../common/guards/jwt-admin.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { AuthAdmin } from '../common/types/auth';
import { CreateProductDto, ProductImageInputDto, ProductVariantInputDto } from './dto/create-product.dto';
import { ProductQueryDto } from './dto/product-query.dto';
import { ReorderImagesDto } from './dto/reorder-images.dto';
import { UpdateProductStatusDto } from './dto/update-product-status.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { ProductsService } from './products.service';

@ApiTags('Admin Products')
@ApiBearerAuth()
@UseGuards(JwtAdminGuard, RolesGuard)
@Roles(AdminRole.SUPER_ADMIN, AdminRole.ADMIN, AdminRole.MANAGER)
@Controller('admin/products')
export class AdminProductsController {
  constructor(
    private readonly products: ProductsService,
    private readonly audit: AuditLogsService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Admin product list' })
  list(@Query() query: ProductQueryDto) {
    return this.products.findAdmin(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Admin product details' })
  one(@Param('id') id: string) {
    return this.products.findAdminOne(id);
  }

  @Post()
  @ApiOperation({ summary: 'Create product' })
  async create(
    @Body() dto: CreateProductDto,
    @CurrentAdmin() admin: AuthAdmin,
    @RequestAudit() ctx: AuditContext,
  ) {
    const created = await this.products.create(dto);
    await this.audit.log({
      adminId: admin.id,
      action: 'Created product',
      entity: 'Product',
      entityId: created.id,
      newValue: created as never,
      ipAddress: ctx.ipAddress,
      userAgent: ctx.userAgent,
    });
    return created;
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update product' })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateProductDto,
    @CurrentAdmin() admin: AuthAdmin,
    @RequestAudit() ctx: AuditContext,
  ) {
    const updated = await this.products.update(id, dto);
    await this.audit.log({
      adminId: admin.id,
      action: 'Updated product',
      entity: 'Product',
      entityId: id,
      newValue: updated as never,
      ipAddress: ctx.ipAddress,
      userAgent: ctx.userAgent,
    });
    return updated;
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'Activate or deactivate product' })
  async status(
    @Param('id') id: string,
    @Body() dto: UpdateProductStatusDto,
    @CurrentAdmin() admin: AuthAdmin,
    @RequestAudit() ctx: AuditContext,
  ) {
    const updated = await this.products.updateStatus(id, dto.isActive);
    await this.audit.log({
      adminId: admin.id,
      action: 'Changed product status',
      entity: 'Product',
      entityId: id,
      newValue: updated as never,
      ipAddress: ctx.ipAddress,
      userAgent: ctx.userAgent,
    });
    return updated;
  }

  @Delete(':id')
  @Roles(AdminRole.SUPER_ADMIN, AdminRole.ADMIN)
  @ApiOperation({ summary: 'Soft-delete product' })
  async remove(
    @Param('id') id: string,
    @CurrentAdmin() admin: AuthAdmin,
    @RequestAudit() ctx: AuditContext,
  ) {
    const removed = await this.products.remove(id);
    await this.audit.log({
      adminId: admin.id,
      action: 'Deleted product',
      entity: 'Product',
      entityId: id,
      newValue: removed as never,
      ipAddress: ctx.ipAddress,
      userAgent: ctx.userAgent,
    });
    return removed;
  }

  @Post(':id/images')
  @ApiOperation({ summary: 'Add product image' })
  addImage(@Param('id') id: string, @Body() dto: ProductImageInputDto) {
    return this.products.addImage(id, dto);
  }

  @Delete(':id/images/:imageId')
  @ApiOperation({ summary: 'Delete product image' })
  deleteImage(
    @Param('id') id: string,
    @Param('imageId') imageId: string,
  ) {
    return this.products.deleteImage(id, imageId);
  }

  @Patch(':id/images/:imageId/main')
  @ApiOperation({ summary: 'Set main product image' })
  setMain(@Param('id') id: string, @Param('imageId') imageId: string) {
    return this.products.setMainImage(id, imageId);
  }

  @Patch(':id/images/order')
  @ApiOperation({ summary: 'Reorder product images' })
  reorder(@Param('id') id: string, @Body() dto: ReorderImagesDto) {
    return this.products.reorderImages(id, dto);
  }

  @Post(':id/variants')
  @ApiOperation({ summary: 'Add product variant' })
  addVariant(@Param('id') id: string, @Body() dto: ProductVariantInputDto) {
    return this.products.addVariant(id, dto);
  }

  @Patch(':id/variants/:variantId')
  @ApiOperation({ summary: 'Update product variant' })
  updateVariant(
    @Param('id') id: string,
    @Param('variantId') variantId: string,
    @Body() dto: ProductVariantInputDto,
  ) {
    return this.products.updateVariant(id, variantId, dto);
  }

  @Delete(':id/variants/:variantId')
  @ApiOperation({ summary: 'Deactivate product variant' })
  deleteVariant(
    @Param('id') id: string,
    @Param('variantId') variantId: string,
  ) {
    return this.products.deleteVariant(id, variantId);
  }
}
