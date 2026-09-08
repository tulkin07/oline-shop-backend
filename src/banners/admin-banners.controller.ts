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
import { BannersService } from './banners.service';
import { CreateBannerDto } from './dto/create-banner.dto';
import { UpdateBannerStatusDto } from './dto/update-banner-status.dto';
import { UpdateBannerDto } from './dto/update-banner.dto';

@ApiTags('Admin Banners')
@ApiBearerAuth()
@UseGuards(JwtAdminGuard, RolesGuard)
@Roles(AdminRole.SUPER_ADMIN, AdminRole.ADMIN, AdminRole.MANAGER)
@Controller('admin/banners')
export class AdminBannersController {
  constructor(
    private readonly banners: BannersService,
    private readonly audit: AuditLogsService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Admin banner list' })
  list(@Query() query: PaginationQueryDto) {
    return this.banners.findAdmin(query);
  }

  @Post()
  @ApiOperation({ summary: 'Create banner' })
  async create(
    @Body() dto: CreateBannerDto,
    @CurrentAdmin() admin: AuthAdmin,
    @RequestAudit() ctx: AuditContext,
  ) {
    const created = await this.banners.create(dto);
    await this.audit.log({
      adminId: admin.id,
      action: 'Created banner',
      entity: 'Banner',
      entityId: created.id,
      newValue: created,
      ipAddress: ctx.ipAddress,
      userAgent: ctx.userAgent,
    });
    return created;
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get banner' })
  one(@Param('id') id: string) {
    return this.banners.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update banner' })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateBannerDto,
    @CurrentAdmin() admin: AuthAdmin,
    @RequestAudit() ctx: AuditContext,
  ) {
    const updated = await this.banners.update(id, dto);
    await this.audit.log({
      adminId: admin.id,
      action: 'Updated banner',
      entity: 'Banner',
      entityId: id,
      newValue: updated,
      ipAddress: ctx.ipAddress,
      userAgent: ctx.userAgent,
    });
    return updated;
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'Activate or deactivate banner' })
  status(@Param('id') id: string, @Body() dto: UpdateBannerStatusDto) {
    return this.banners.updateStatus(id, dto.isActive);
  }

  @Delete(':id')
  @Roles(AdminRole.SUPER_ADMIN, AdminRole.ADMIN)
  @ApiOperation({ summary: 'Soft-delete banner' })
  async remove(
    @Param('id') id: string,
    @CurrentAdmin() admin: AuthAdmin,
    @RequestAudit() ctx: AuditContext,
  ) {
    const removed = await this.banners.remove(id);
    await this.audit.log({
      adminId: admin.id,
      action: 'Deleted banner',
      entity: 'Banner',
      entityId: id,
      newValue: removed,
      ipAddress: ctx.ipAddress,
      userAgent: ctx.userAgent,
    });
    return removed;
  }
}
