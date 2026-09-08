import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { AdminAuthController } from './admin-auth.controller';
import { AdminAuthService } from './admin-auth.service';
import { AdminProfileController } from './admin-profile.controller';

@Module({
  imports: [AuthModule],
  controllers: [AdminAuthController, AdminProfileController],
  providers: [AdminAuthService],
  exports: [AdminAuthService],
})
export class AdminsModule {}
