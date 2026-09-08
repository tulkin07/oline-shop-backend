import { Body, Controller, Get, Patch, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { CurrentAdmin } from '../common/decorators/current-admin.decorator';
import { JwtAdminGuard } from '../common/guards/jwt-admin.guard';
import { AuthAdmin } from '../common/types/auth';
import { ChangePasswordDto } from '../auth/dto/change-password.dto';
import { RefreshTokenDto } from '../auth/dto/refresh-token.dto';
import { AdminAuthService } from './admin-auth.service';
import { AdminLoginDto } from './dto/admin-login.dto';
import { UpdateAdminProfileDto } from './dto/update-admin-profile.dto';

@ApiTags('Admin Auth')
@Controller('admin/auth')
export class AdminAuthController {
  constructor(private readonly auth: AdminAuthService) {}

  @Post('login')
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @ApiOperation({
    summary: 'Admin login — use email + password (admin@example.com)',
  })
  login(@Body() dto: AdminLoginDto) {
    return this.auth.login(dto);
  }

  @Post('refresh')
  @ApiOperation({ summary: 'Refresh admin access token' })
  refresh(@Body() dto: RefreshTokenDto) {
    return this.auth.refresh(dto.refreshToken);
  }

  @Post('logout')
  @ApiOperation({ summary: 'Revoke admin refresh token' })
  logout(@Body() dto: RefreshTokenDto) {
    return this.auth.logout(dto.refreshToken);
  }

  @Get('me')
  @UseGuards(JwtAdminGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current admin' })
  me(@CurrentAdmin() admin: AuthAdmin) {
    return this.auth.me(admin.id);
  }

  @Patch('profile')
  @UseGuards(JwtAdminGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update current admin profile' })
  updateProfile(
    @CurrentAdmin() admin: AuthAdmin,
    @Body() dto: UpdateAdminProfileDto,
  ) {
    return this.auth.updateProfile(admin.id, dto);
  }

  @Patch('change-password')
  @UseGuards(JwtAdminGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Change admin password' })
  changePassword(
    @CurrentAdmin() admin: AuthAdmin,
    @Body() dto: ChangePasswordDto,
  ) {
    return this.auth.changePassword(admin.id, dto);
  }
}
