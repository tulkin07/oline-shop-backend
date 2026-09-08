import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { generateRawToken, hashToken } from '../common/utils/hash-token';
import { JwtPayload } from '../common/types/auth';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class TokensService {
  constructor(
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
    private readonly prisma: PrismaService,
  ) {}

  async issueCustomerTokens(userId: string, email: string) {
    const payload: JwtPayload = { sub: userId, email, type: 'customer' };
    return this.issue(payload, { userId });
  }

  async issueAdminTokens(
    adminId: string,
    email: string,
    role: JwtPayload['role'],
  ) {
    const payload: JwtPayload = {
      sub: adminId,
      email,
      type: 'admin',
      role,
    };
    return this.issue(payload, { adminId });
  }

  async rotateCustomerRefresh(rawToken: string) {
    const record = await this.findValid(rawToken);
    if (!record?.userId || !record.user) {
      return null;
    }
    await this.prisma.refreshToken.update({
      where: { id: record.id },
      data: { revokedAt: new Date() },
    });
    return this.issueCustomerTokens(record.user.id, record.user.email);
  }

  async rotateAdminRefresh(rawToken: string) {
    const record = await this.findValid(rawToken);
    if (!record?.adminId || !record.admin) {
      return null;
    }
    await this.prisma.refreshToken.update({
      where: { id: record.id },
      data: { revokedAt: new Date() },
    });
    return this.issueAdminTokens(
      record.admin.id,
      record.admin.email,
      record.admin.role,
    );
  }

  async revoke(rawToken: string): Promise<void> {
    const hashed = hashToken(rawToken);
    await this.prisma.refreshToken.updateMany({
      where: { token: hashed, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  private async issue(
    payload: JwtPayload,
    owner: { userId?: string; adminId?: string },
  ) {
    const accessToken = await this.jwt.signAsync(payload, {
      secret: this.config.getOrThrow<string>('jwt.secret'),
      expiresIn: this.config.get<string>('jwt.expiresIn') ?? '15m',
    } as Parameters<JwtService['signAsync']>[1]);
    const refreshToken = generateRawToken();
    const ttl = this.config.get<string>('jwt.refreshExpiresIn') ?? '7d';
    await this.prisma.refreshToken.create({
      data: {
        token: hashToken(refreshToken),
        userId: owner.userId,
        adminId: owner.adminId,
        expiresAt: new Date(Date.now() + addMilliseconds(ttl)),
      },
    });
    return {
      accessToken,
      refreshToken,
      tokenType: 'Bearer',
      expiresIn: this.config.get<string>('jwt.expiresIn') ?? '15m',
    };
  }

  private findValid(rawToken: string) {
    return this.prisma.refreshToken.findFirst({
      where: {
        token: hashToken(rawToken),
        revokedAt: null,
        expiresAt: { gt: new Date() },
      },
      include: { user: true, admin: true },
    });
  }
}

export function addMilliseconds(duration: string): number {
  const match = /^(\d+)([smhd])$/.exec(duration.trim());
  if (!match) {
    return 7 * 24 * 60 * 60 * 1000;
  }
  const value = Number(match[1]);
  const unit = match[2];
  const multipliers: Record<string, number> = {
    s: 1000,
    m: 60 * 1000,
    h: 60 * 60 * 1000,
    d: 24 * 60 * 60 * 1000,
  };
  return value * (multipliers[unit] ?? multipliers.d);
}
