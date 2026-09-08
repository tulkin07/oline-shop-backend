import { Module } from '@nestjs/common';
import { ActivityService } from '../common/services/activity.service';
import { AdminCustomersController } from './admin-customers.controller';
import { CustomersController } from './customers.controller';
import { CustomersService } from './customers.service';

@Module({
  controllers: [CustomersController, AdminCustomersController],
  providers: [CustomersService, ActivityService],
  exports: [CustomersService],
})
export class CustomersModule {}
