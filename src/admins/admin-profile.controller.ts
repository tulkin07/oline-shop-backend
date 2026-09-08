import { Body, Controller, Get, Patch, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentAdmin } from '../common/decorators/current-admin.decorator';
import { JwtAdminGuard } from '../common/guards/jwt-admin.guard';
import { AuthAdmin } from '../common/types/auth';
import { ChangePasswordDto } from '../auth/dto/change-password.dto';
import { AdminAuthService } from './admin-auth.service';
import { UpdateAdminProfileDto } from './dto/update-admin-profile.dto';

@ApiTags('Admin Profile')
@ApiBearerAuth()
@UseGuards(JwtAdminGuard)
@Controller('admin/profile')
export class AdminProfileController {
  constructor(private readonly auth: AdminAuthService) {}

  @Get()
  @ApiOperation({ summary: 'Get admin profile' })
  me(@CurrentAdmin() admin: AuthAdmin) {
    return this.auth.me(admin.id);
  }

  @Patch()
  @ApiOperation({ summary: 'Update admin profile' })
  update(
    @CurrentAdmin() admin: AuthAdmin,
    @Body() dto: UpdateAdminProfileDto,
  ) {
    return this.auth.updateProfile(admin.id, dto);
  }

  @Patch('password')
  @ApiOperation({ summary: 'Change admin password' })
  password(
    @CurrentAdmin() admin: AuthAdmin,
    @Body() dto: ChangePasswordDto,
  ) {
    return this.auth.changePassword(admin.id, dto);
  }
}
