import { Module } from '@nestjs/common';
import { ActivityService } from '../common/services/activity.service';
import { WishlistController } from './wishlist.controller';
import { WishlistService } from './wishlist.service';

@Module({
  controllers: [WishlistController],
  providers: [WishlistService, ActivityService],
  exports: [WishlistService],
})
export class WishlistModule {}
