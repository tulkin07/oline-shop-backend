import { Controller, Get, Param, Patch, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentAdmin } from '../common/decorators/current-admin.decorator';
import { JwtAdminGuard } from '../common/guards/jwt-admin.guard';
import { AuthAdmin } from '../common/types/auth';
import { NotificationsService } from './notifications.service';

@ApiTags('Admin Notifications')
@ApiBearerAuth()
@UseGuards(JwtAdminGuard)
@Controller('admin/notifications')
export class NotificationsController {
  constructor(private readonly notifications: NotificationsService) {}

  @Get()
  @ApiOperation({ summary: 'List admin notifications' })
  list(
    @CurrentAdmin() admin: AuthAdmin,
    @Query('unreadOnly') unreadOnly?: string,
  ) {
    return this.notifications.list(admin.id, unreadOnly === 'true');
  }

  @Patch('read-all')
  @ApiOperation({ summary: 'Mark all notifications as read' })
  readAll(@CurrentAdmin() admin: AuthAdmin) {
    return this.notifications.markAllRead(admin.id);
  }

  @Patch(':id/read')
  @ApiOperation({ summary: 'Mark a notification as read' })
  read(@Param('id') id: string, @CurrentAdmin() admin: AuthAdmin) {
    return this.notifications.markRead(id, admin.id);
  }
}
