import { Module } from '@nestjs/common';
import { AuditLogsModule } from '../audit-logs/audit-logs.module';
import { ActivityService } from '../common/services/activity.service';
import { NotificationsModule } from '../notifications/notifications.module';
import { AdminReviewsController } from './admin-reviews.controller';
import { ReviewsController } from './reviews.controller';
import { ReviewsService } from './reviews.service';

@Module({
  imports: [NotificationsModule, AuditLogsModule],
  controllers: [ReviewsController, AdminReviewsController],
  providers: [ReviewsService, ActivityService],
  exports: [ReviewsService],
})
export class ReviewsModule {}
