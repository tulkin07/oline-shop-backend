import { Module } from '@nestjs/common';
import { AuditLogsModule } from '../audit-logs/audit-logs.module';
import { AdminHomePromosController } from './admin-home-promos.controller';
import { HomePromosController } from './home-promos.controller';
import { HomePromosService } from './home-promos.service';

@Module({
  imports: [AuditLogsModule],
  controllers: [HomePromosController, AdminHomePromosController],
  providers: [HomePromosService],
})
export class HomePromosModule {}
