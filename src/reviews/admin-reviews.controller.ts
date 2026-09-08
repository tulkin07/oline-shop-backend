import {
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AdminRole, ReviewStatus } from '@prisma/client';
import { AuditLogsService } from '../audit-logs/audit-logs.service';
import { AuditContext, RequestAudit } from '../common/decorators/audit-context.decorator';
import { CurrentAdmin } from '../common/decorators/current-admin.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { PaginationQueryDto } from '../common/dto/pagination-query.dto';
import { JwtAdminGuard } from '../common/guards/jwt-admin.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { AuthAdmin } from '../common/types/auth';
import { ReviewsService } from './reviews.service';

@ApiTags('Admin Reviews')
@ApiBearerAuth()
@UseGuards(JwtAdminGuard, RolesGuard)
@Roles(AdminRole.SUPER_ADMIN, AdminRole.ADMIN, AdminRole.MANAGER)
@Controller('admin/reviews')
export class AdminReviewsController {
  constructor(
    private readonly reviews: ReviewsService,
    private readonly audit: AuditLogsService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Admin reviews list' })
  list(@Query() query: PaginationQueryDto) {
    return this.reviews.findAdmin(query);
  }

  @Patch(':id/approve')
  @ApiOperation({ summary: 'Approve review' })
  async approve(
    @Param('id') id: string,
    @CurrentAdmin() admin: AuthAdmin,
    @RequestAudit() ctx: AuditContext,
  ) {
    const review = await this.reviews.moderate(id, ReviewStatus.APPROVED);
    await this.audit.log({
      adminId: admin.id,
      action: 'Approved review',
      entity: 'Review',
      entityId: id,
      newValue: review,
      ipAddress: ctx.ipAddress,
      userAgent: ctx.userAgent,
    });
    return review;
  }

  @Patch(':id/reject')
  @ApiOperation({ summary: 'Reject review' })
  async reject(
    @Param('id') id: string,
    @CurrentAdmin() admin: AuthAdmin,
    @RequestAudit() ctx: AuditContext,
  ) {
    const review = await this.reviews.moderate(id, ReviewStatus.REJECTED);
    await this.audit.log({
      adminId: admin.id,
      action: 'Rejected review',
      entity: 'Review',
      entityId: id,
      newValue: review,
      ipAddress: ctx.ipAddress,
      userAgent: ctx.userAgent,
    });
    return review;
  }

  @Delete(':id')
  @Roles(AdminRole.SUPER_ADMIN, AdminRole.ADMIN)
  @ApiOperation({ summary: 'Delete review' })
  async remove(
    @Param('id') id: string,
    @CurrentAdmin() admin: AuthAdmin,
    @RequestAudit() ctx: AuditContext,
  ) {
    const result = await this.reviews.remove(id);
    await this.audit.log({
      adminId: admin.id,
      action: 'Deleted review',
      entity: 'Review',
      entityId: id,
      ipAddress: ctx.ipAddress,
      userAgent: ctx.userAgent,
    });
    return result;
  }
}
