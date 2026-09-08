import { Module } from '@nestjs/common';
import { AuditLogsModule } from '../audit-logs/audit-logs.module';
import { ActivityService } from '../common/services/activity.service';
import { InventoryModule } from '../inventory/inventory.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { SettingsModule } from '../settings/settings.module';
import { AdminOrdersController } from './admin-orders.controller';
import { OrdersController } from './orders.controller';
import { OrdersService } from './orders.service';

@Module({
  imports: [InventoryModule, SettingsModule, NotificationsModule, AuditLogsModule],
  controllers: [OrdersController, AdminOrdersController],
  providers: [OrdersService, ActivityService],
  exports: [OrdersService],
})
export class OrdersModule {}
