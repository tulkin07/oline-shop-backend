import {
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { HashService } from '../common/services/hash.service';
import { PrismaService } from '../prisma/prisma.service';
import { TokensService } from '../auth/tokens.service';
import { ChangePasswordDto } from '../auth/dto/change-password.dto';
import { sanitizeAdmin } from './admin.serializer';
import { AdminLoginDto } from './dto/admin-login.dto';
import { UpdateAdminProfileDto } from './dto/update-admin-profile.dto';

@Injectable()
export class AdminAuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly hash: HashService,
    private readonly tokens: TokensService,
  ) {}

  async login(dto: AdminLoginDto) {
    const email = (dto.email ?? dto.login ?? '').trim().toLowerCase();
    if (!email) {
      throw new UnauthorizedException({
        message: 'Email is required',
        error: 'UNAUTHORIZED',
      });
    }
    const admin = await this.prisma.admin.findUnique({
      where: { email },
    });
    if (!admin || !admin.isActive) {
      throw new UnauthorizedException({
        message: 'Invalid credentials',
        error: 'UNAUTHORIZED',
      });
    }
    const valid = await this.hash.compare(dto.password, admin.password);
    if (!valid) {
      throw new UnauthorizedException({
        message: 'Invalid credentials',
        error: 'UNAUTHORIZED',
      });
    }
    const tokens = await this.tokens.issueAdminTokens(
      admin.id,
      admin.email,
      admin.role,
    );
    return { admin: sanitizeAdmin(admin), ...tokens };
  }

  async refresh(refreshToken: string) {
    const tokens = await this.tokens.rotateAdminRefresh(refreshToken);
    if (!tokens) {
      throw new UnauthorizedException({
        message: 'Invalid refresh token',
        error: 'UNAUTHORIZED',
      });
    }
    return tokens;
  }

  async logout(refreshToken: string) {
    await this.tokens.revoke(refreshToken);
    return { loggedOut: true };
  }

  async me(adminId: string) {
    const admin = await this.prisma.admin.findUniqueOrThrow({
      where: { id: adminId },
    });
    return sanitizeAdmin(admin);
  }

  async updateProfile(adminId: string, dto: UpdateAdminProfileDto) {
    const admin = await this.prisma.admin.update({
      where: { id: adminId },
      data: {
        firstName: dto.firstName,
        lastName: dto.lastName,
        phone: dto.phone,
        avatar: dto.avatar,
      },
    });
    return sanitizeAdmin(admin);
  }

  async changePassword(adminId: string, dto: ChangePasswordDto) {
    const admin = await this.prisma.admin.findUniqueOrThrow({
      where: { id: adminId },
    });
    const valid = await this.hash.compare(dto.currentPassword, admin.password);
    if (!valid) {
      throw new UnauthorizedException({
        message: 'Current password is incorrect',
        error: 'UNAUTHORIZED',
      });
    }
    await this.prisma.admin.update({
      where: { id: adminId },
      data: { password: await this.hash.hash(dto.newPassword) },
    });
    return { changed: true };
  }
}
