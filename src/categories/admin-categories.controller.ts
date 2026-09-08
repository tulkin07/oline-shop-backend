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
import { RequestAudit } from '../common/decorators/audit-context.decorator';
import { CurrentAdmin } from '../common/decorators/current-admin.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { AuditContext } from '../common/decorators/audit-context.decorator';
import { PaginationQueryDto } from '../common/dto/pagination-query.dto';
import { JwtAdminGuard } from '../common/guards/jwt-admin.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { AuthAdmin } from '../common/types/auth';
import { CategoriesService } from './categories.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';

@ApiTags('Admin Categories')
@ApiBearerAuth()
@UseGuards(JwtAdminGuard, RolesGuard)
@Roles(AdminRole.SUPER_ADMIN, AdminRole.ADMIN, AdminRole.MANAGER)
@Controller('admin/categories')
export class AdminCategoriesController {
  constructor(
    private readonly categories: CategoriesService,
    private readonly audit: AuditLogsService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Admin category list' })
  list(@Query() query: PaginationQueryDto) {
    return this.categories.findAdmin(query);
  }

  @Post()
  @ApiOperation({ summary: 'Create category' })
  async create(
    @Body() dto: CreateCategoryDto,
    @CurrentAdmin() admin: AuthAdmin,
    @RequestAudit() ctx: AuditContext,
  ) {
    const created = await this.categories.create(dto);
    await this.audit.log({
      adminId: admin.id,
      action: 'Created category',
      entity: 'Category',
      entityId: created.id,
      newValue: created,
      ipAddress: ctx.ipAddress,
      userAgent: ctx.userAgent,
    });
    return created;
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update category' })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateCategoryDto,
    @CurrentAdmin() admin: AuthAdmin,
    @RequestAudit() ctx: AuditContext,
  ) {
    const updated = await this.categories.update(id, dto);
    await this.audit.log({
      adminId: admin.id,
      action: 'Updated category',
      entity: 'Category',
      entityId: id,
      newValue: updated,
      ipAddress: ctx.ipAddress,
      userAgent: ctx.userAgent,
    });
    return updated;
  }

  @Delete(':id')
  @Roles(AdminRole.SUPER_ADMIN, AdminRole.ADMIN)
  @ApiOperation({ summary: 'Soft-delete / archive category' })
  async remove(
    @Param('id') id: string,
    @CurrentAdmin() admin: AuthAdmin,
    @RequestAudit() ctx: AuditContext,
  ) {
    const removed = await this.categories.remove(id);
    await this.audit.log({
      adminId: admin.id,
      action: 'Deleted category',
      entity: 'Category',
      entityId: id,
      newValue: removed,
      ipAddress: ctx.ipAddress,
      userAgent: ctx.userAgent,
    });
    return removed;
  }
}
