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
import { CreateHomePromoDto } from './dto/create-home-promo.dto';
import { HomePromoQueryDto } from './dto/home-promo-query.dto';
import { UpdateHomePromoStatusDto } from './dto/update-home-promo-status.dto';
import { UpdateHomePromoDto } from './dto/update-home-promo.dto';
import { HomePromosService } from './home-promos.service';

@ApiTags('Admin Home Promos')
@ApiBearerAuth()
@UseGuards(JwtAdminGuard, RolesGuard)
@Roles(AdminRole.SUPER_ADMIN, AdminRole.ADMIN, AdminRole.MANAGER)
@Controller('admin/home-promos')
export class AdminHomePromosController {
  constructor(
    private readonly promos: HomePromosService,
    private readonly audit: AuditLogsService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Admin home promo list' })
  list(@Query() query: HomePromoQueryDto) {
    return this.promos.findAdmin(query);
  }

  @Post()
  @ApiOperation({ summary: 'Create home promo' })
  async create(
    @Body() dto: CreateHomePromoDto,
    @CurrentAdmin() admin: AuthAdmin,
    @RequestAudit() ctx: AuditContext,
  ) {
    const created = await this.promos.create(dto);
    await this.audit.log({
      adminId: admin.id,
      action: 'Created home promo',
      entity: 'HomePromo',
      entityId: created.id,
      newValue: created,
      ipAddress: ctx.ipAddress,
      userAgent: ctx.userAgent,
    });
    return created;
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get home promo' })
  one(@Param('id') id: string) {
    return this.promos.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update home promo' })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateHomePromoDto,
    @CurrentAdmin() admin: AuthAdmin,
    @RequestAudit() ctx: AuditContext,
  ) {
    const updated = await this.promos.update(id, dto);
    await this.audit.log({
      adminId: admin.id,
      action: 'Updated home promo',
      entity: 'HomePromo',
      entityId: id,
      newValue: updated,
      ipAddress: ctx.ipAddress,
      userAgent: ctx.userAgent,
    });
    return updated;
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'Activate or deactivate home promo' })
  status(@Param('id') id: string, @Body() dto: UpdateHomePromoStatusDto) {
    return this.promos.updateStatus(id, dto.isActive);
  }

  @Delete(':id')
  @Roles(AdminRole.SUPER_ADMIN, AdminRole.ADMIN)
  @ApiOperation({ summary: 'Soft-delete home promo' })
  async remove(
    @Param('id') id: string,
    @CurrentAdmin() admin: AuthAdmin,
    @RequestAudit() ctx: AuditContext,
  ) {
    const removed = await this.promos.remove(id);
    await this.audit.log({
      adminId: admin.id,
      action: 'Deleted home promo',
      entity: 'HomePromo',
      entityId: id,
      newValue: removed,
      ipAddress: ctx.ipAddress,
      userAgent: ctx.userAgent,
    });
    return removed;
  }
}
