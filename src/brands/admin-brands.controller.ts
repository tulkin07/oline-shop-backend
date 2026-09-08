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
import { PaginationQueryDto } from '../common/dto/pagination-query.dto';
import { JwtAdminGuard } from '../common/guards/jwt-admin.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { AuthAdmin } from '../common/types/auth';
import { BrandsService } from './brands.service';
import { CreateBrandDto } from './dto/create-brand.dto';
import { UpdateBrandDto } from './dto/update-brand.dto';

@ApiTags('Admin Brands')
@ApiBearerAuth()
@UseGuards(JwtAdminGuard, RolesGuard)
@Roles(AdminRole.SUPER_ADMIN, AdminRole.ADMIN, AdminRole.MANAGER)
@Controller('admin/brands')
export class AdminBrandsController {
  constructor(
    private readonly brands: BrandsService,
    private readonly audit: AuditLogsService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Admin brand list' })
  list(@Query() query: PaginationQueryDto) {
    return this.brands.findAdmin(query);
  }

  @Post()
  @ApiOperation({ summary: 'Create brand' })
  async create(
    @Body() dto: CreateBrandDto,
    @CurrentAdmin() admin: AuthAdmin,
    @RequestAudit() ctx: AuditContext,
  ) {
    const created = await this.brands.create(dto);
    await this.audit.log({
      adminId: admin.id,
      action: 'Created brand',
      entity: 'Brand',
      entityId: created.id,
      newValue: created,
      ipAddress: ctx.ipAddress,
      userAgent: ctx.userAgent,
    });
    return created;
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update brand' })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateBrandDto,
    @CurrentAdmin() admin: AuthAdmin,
    @RequestAudit() ctx: AuditContext,
  ) {
    const updated = await this.brands.update(id, dto);
    await this.audit.log({
      adminId: admin.id,
      action: 'Updated brand',
      entity: 'Brand',
      entityId: id,
      newValue: updated,
      ipAddress: ctx.ipAddress,
      userAgent: ctx.userAgent,
    });
    return updated;
  }

  @Delete(':id')
  @Roles(AdminRole.SUPER_ADMIN, AdminRole.ADMIN)
  @ApiOperation({ summary: 'Soft-delete brand' })
  async remove(
    @Param('id') id: string,
    @CurrentAdmin() admin: AuthAdmin,
    @RequestAudit() ctx: AuditContext,
  ) {
    const removed = await this.brands.remove(id);
    await this.audit.log({
      adminId: admin.id,
      action: 'Deleted brand',
      entity: 'Brand',
      entityId: id,
      newValue: removed,
      ipAddress: ctx.ipAddress,
      userAgent: ctx.userAgent,
    });
    return removed;
  }
}
