import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { JwtPayload } from '../../common/types/auth';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class JwtAdminStrategy extends PassportStrategy(Strategy, 'jwt-admin') {
  constructor(
    config: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: config.getOrThrow<string>('jwt.secret'),
    });
  }

  async validate(payload: JwtPayload) {
    if (payload.type !== 'admin') {
      throw new UnauthorizedException({
        message: 'Admin token required',
        error: 'UNAUTHORIZED',
      });
    }
    const admin = await this.prisma.admin.findFirst({
      where: { id: payload.sub, isActive: true },
    });
    if (!admin) {
      throw new UnauthorizedException({
        message: 'Admin account is inactive or not found',
        error: 'UNAUTHORIZED',
      });
    }
    return {
      id: admin.id,
      email: admin.email,
      type: 'admin' as const,
      role: admin.role,
    };
  }
}
