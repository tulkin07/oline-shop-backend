import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ActivityService } from '../common/services/activity.service';
import { HashService } from '../common/services/hash.service';
import { NotificationsModule } from '../notifications/notifications.module';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtAdminStrategy } from './strategies/jwt-admin.strategy';
import { JwtStrategy } from './strategies/jwt.strategy';
import { TokensService } from './tokens.service';

@Module({
  imports: [PassportModule, JwtModule.register({}), NotificationsModule],
  controllers: [AuthController],
  providers: [
    AuthService,
    TokensService,
    JwtStrategy,
    JwtAdminStrategy,
    HashService,
    ActivityService,
  ],
  exports: [TokensService, HashService, ActivityService, JwtAdminStrategy],
})
export class AuthModule {}
