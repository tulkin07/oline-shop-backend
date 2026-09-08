import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ActivityType } from '@prisma/client';
import { ActivityService } from '../common/services/activity.service';
import { HashService } from '../common/services/hash.service';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { sanitizeUser } from '../users/user.serializer';
import { ChangePasswordDto } from './dto/change-password.dto';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { TokensService } from './tokens.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly hash: HashService,
    private readonly tokens: TokensService,
    private readonly activity: ActivityService,
    private readonly notifications: NotificationsService,
  ) {}

  async register(dto: RegisterDto) {
    const existing = await this.prisma.user.findFirst({
      where: {
        OR: [{ email: dto.email.toLowerCase() }, { phone: dto.phone }],
      },
    });
    if (existing) {
      throw new ConflictException({
        message: 'Email or phone is already registered',
        error: 'CONFLICT',
      });
    }
    const password = await this.hash.hash(dto.password);
    const user = await this.prisma.$transaction(async (tx) => {
      const created = await tx.user.create({
        data: {
          firstName: dto.firstName,
          lastName: dto.lastName,
          email: dto.email.toLowerCase(),
          phone: dto.phone,
          password,
          cart: { create: {} },
          wishlist: { create: {} },
        },
      });
      await tx.userActivity.create({
        data: { userId: created.id, type: ActivityType.REGISTERED },
      });
      return created;
    });
    await this.notifications.notifyAll(
      'NEW_CUSTOMER',
      'New customer registered',
      `${user.firstName} ${user.lastName} (${user.email}) just registered`,
    );
    const tokens = await this.tokens.issueCustomerTokens(user.id, user.email);
    return { user: sanitizeUser(user), ...tokens };
  }

  async login(dto: LoginDto) {
    const raw = (dto.login ?? dto.email ?? '').trim();
    if (!raw) {
      throw new UnauthorizedException({
        message: 'Email, phone or login is required',
        error: 'UNAUTHORIZED',
      });
    }
    const identifier = raw.toLowerCase();
    const user = await this.prisma.user.findFirst({
      where: {
        deletedAt: null,
        OR: [{ email: identifier }, { phone: raw }],
      },
    });
    if (!user || !user.isActive) {
      const admin = await this.prisma.admin.findUnique({
        where: { email: identifier },
      });
      if (admin) {
        throw new UnauthorizedException({
          message:
            'This is a customer login. Use POST /api/admin/auth/login with { "email": "admin@example.com", "password": "Admin123!" }',
          error: 'UNAUTHORIZED',
        });
      }
      throw new UnauthorizedException({
        message: 'Invalid credentials',
        error: 'UNAUTHORIZED',
      });
    }
    const valid = await this.hash.compare(dto.password, user.password);
    if (!valid) {
      throw new UnauthorizedException({
        message: 'Invalid credentials',
        error: 'UNAUTHORIZED',
      });
    }
    await this.activity.log(user.id, ActivityType.LOGIN);
    const tokens = await this.tokens.issueCustomerTokens(user.id, user.email);
    return { user: sanitizeUser(user), ...tokens };
  }

  async refresh(refreshToken: string) {
    const tokens = await this.tokens.rotateCustomerRefresh(refreshToken);
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

  async me(userId: string) {
    const user = await this.prisma.user.findUniqueOrThrow({
      where: { id: userId },
    });
    return sanitizeUser(user);
  }

  async updateProfile(userId: string, dto: UpdateProfileDto) {
    if (dto.email || dto.phone) {
      const clash = await this.prisma.user.findFirst({
        where: {
          id: { not: userId },
          OR: [
            dto.email ? { email: dto.email.toLowerCase() } : undefined,
            dto.phone ? { phone: dto.phone } : undefined,
          ].filter(Boolean) as { email?: string; phone?: string }[],
        },
      });
      if (clash) {
        throw new ConflictException({
          message: 'Email or phone is already in use',
          error: 'CONFLICT',
        });
      }
    }
    const user = await this.prisma.user.update({
      where: { id: userId },
      data: {
        firstName: dto.firstName,
        lastName: dto.lastName,
        email: dto.email?.toLowerCase(),
        phone: dto.phone,
        avatar: dto.avatar,
      },
    });
    await this.activity.log(userId, ActivityType.PROFILE_UPDATED);
    return sanitizeUser(user);
  }

  async changePassword(userId: string, dto: ChangePasswordDto) {
    const user = await this.prisma.user.findUniqueOrThrow({
      where: { id: userId },
    });
    const valid = await this.hash.compare(dto.currentPassword, user.password);
    if (!valid) {
      throw new UnauthorizedException({
        message: 'Current password is incorrect',
        error: 'UNAUTHORIZED',
      });
    }
    const password = await this.hash.hash(dto.newPassword);
    await this.prisma.user.update({
      where: { id: userId },
      data: { password },
    });
    return { changed: true };
  }
}
