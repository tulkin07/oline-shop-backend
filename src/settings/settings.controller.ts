import { Body, Controller, Get, Patch, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AdminRole } from '@prisma/client';
import { Public } from '../common/decorators/public.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { JwtAdminGuard } from '../common/guards/jwt-admin.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { RequestAudit } from '../common/decorators/audit-context.decorator';
import { CurrentAdmin } from '../common/decorators/current-admin.decorator';
import { AuditContext } from '../common/decorators/audit-context.decorator';
import { AuthAdmin } from '../common/types/auth';
import { AuditLogsService } from '../audit-logs/audit-logs.service';
import { UpdateSettingsDto } from './dto/update-settings.dto';
import { SettingsService } from './settings.service';

@ApiTags('Settings')
@Controller()
export class SettingsController {
  constructor(
    private readonly settings: SettingsService,
    private readonly audit: AuditLogsService,
  ) {}

  @Public()
  @Get('settings')
  @ApiOperation({ summary: 'Public store settings' })
  getPublic() {
    return this.settings.get();
  }

  @Get('admin/settings')
  @UseGuards(JwtAdminGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Admin store settings' })
  getAdmin() {
    return this.settings.get();
  }

  @Patch('admin/settings')
  @UseGuards(JwtAdminGuard, RolesGuard)
  @Roles(AdminRole.SUPER_ADMIN, AdminRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update store settings' })
  async update(
    @Body() dto: UpdateSettingsDto,
    @CurrentAdmin() admin: AuthAdmin,
    @RequestAudit() audit: AuditContext,
  ) {
    const oldValue = await this.settings.get();
    const updated = await this.settings.update(dto);
    await this.audit.log({
      adminId: admin.id,
      action: 'Updated settings',
      entity: 'Setting',
      entityId: 'default',
      oldValue,
      newValue: updated,
      ipAddress: audit.ipAddress,
      userAgent: audit.userAgent,
    });
    return updated;
  }
}
