import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ActivityType, OrderStatus, Prisma, ReviewStatus } from '@prisma/client';
import { ActivityService } from '../common/services/activity.service';
import { PaginationQueryDto } from '../common/dto/pagination-query.dto';
import { getPagination, paginated } from '../common/utils/pagination';
import { NotificationsService } from '../notifications/notifications.service';
import { PrismaService } from '../prisma/prisma.service';
import { CreateReviewDto, UpdateReviewDto } from './dto/review.dto';

@Injectable()
export class ReviewsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly activity: ActivityService,
    private readonly notifications: NotificationsService,
  ) {}

  async create(userId: string, productId: string, dto: CreateReviewDto) {
    const product = await this.prisma.product.findFirst({
      where: {
        deletedAt: null,
        OR: [{ id: productId }, { slug: productId }],
      },
    });
    if (!product) {
      throw new NotFoundException({
        message: 'Product not found',
        error: 'NOT_FOUND',
      });
    }
    const order = await this.prisma.order.findFirst({
      where: {
        id: dto.orderId,
        userId,
        status: OrderStatus.DELIVERED,
        items: { some: { productId: product.id } },
      },
    });
    if (!order) {
      throw new ForbiddenException({
        message: 'You can review a product only after a delivered purchase',
        error: 'FORBIDDEN',
      });
    }
    const duplicate = await this.prisma.review.findUnique({
      where: {
        userId_productId_orderId: {
          userId,
          productId: product.id,
          orderId: dto.orderId,
        },
      },
    });
    if (duplicate) {
      throw new BadRequestException({
        message: 'You already reviewed this product for this order',
        error: 'CONFLICT',
      });
    }
    const review = await this.prisma.review.create({
      data: {
        userId,
        productId: product.id,
        orderId: dto.orderId,
        rating: dto.rating,
        comment: dto.comment,
        status: ReviewStatus.PENDING,
      },
      include: {
        user: {
          select: { id: true, firstName: true, lastName: true, avatar: true },
        },
      },
    });
    await this.activity.log(userId, ActivityType.REVIEW_CREATED, {
      reviewId: review.id,
      productId: product.id,
    });
    await this.notifications.notifyAll(
      'NEW_REVIEW',
      'New product review',
      `A new review was submitted for ${product.name}`,
    );
    return review;
  }

  async listPublic(productId: string, query: PaginationQueryDto) {
    const product = await this.prisma.product.findFirst({
      where: { OR: [{ id: productId }, { slug: productId }] },
      select: { id: true },
    });
    const resolvedId = product?.id ?? productId;
    const { skip, take, page, limit } = getPagination(query);
    const where = { productId: resolvedId, status: ReviewStatus.APPROVED };
    const [total, data] = await this.prisma.$transaction([
      this.prisma.review.count({ where }),
      this.prisma.review.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: { id: true, firstName: true, lastName: true, avatar: true },
          },
        },
      }),
    ]);
    return paginated(data, total, page, limit);
  }

  async updateMine(userId: string, id: string, dto: UpdateReviewDto) {
    const review = await this.prisma.review.findUnique({ where: { id } });
    if (!review || review.userId !== userId) {
      throw new NotFoundException({
        message: 'Review not found',
        error: 'NOT_FOUND',
      });
    }
    return this.prisma.review.update({
      where: { id },
      data: {
        rating: dto.rating,
        comment: dto.comment,
        status: ReviewStatus.PENDING,
      },
    });
  }

  async deleteMine(userId: string, id: string) {
    const review = await this.prisma.review.findUnique({ where: { id } });
    if (!review || review.userId !== userId) {
      throw new NotFoundException({
        message: 'Review not found',
        error: 'NOT_FOUND',
      });
    }
    await this.prisma.review.delete({ where: { id } });
    return { deleted: true };
  }

  async findAdmin(query: PaginationQueryDto) {
    const { skip, take, page, limit } = getPagination(query);
    const where: Prisma.ReviewWhereInput = {};
    if (query.status) where.status = query.status as ReviewStatus;
    if (query.search) {
      where.OR = [
        { comment: { contains: query.search, mode: 'insensitive' } },
        { product: { name: { contains: query.search, mode: 'insensitive' } } },
      ];
    }
    const [total, data] = await this.prisma.$transaction([
      this.prisma.review.count({ where }),
      this.prisma.review.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: { id: true, firstName: true, lastName: true, email: true },
          },
          product: { select: { id: true, name: true, slug: true } },
        },
      }),
    ]);
    return paginated(data, total, page, limit);
  }

  async moderate(id: string, status: ReviewStatus) {
    const review = await this.prisma.review.findUnique({ where: { id } });
    if (!review) {
      throw new NotFoundException({
        message: 'Review not found',
        error: 'NOT_FOUND',
      });
    }
    return this.prisma.review.update({
      where: { id },
      data: { status },
    });
  }

  async remove(id: string) {
    const review = await this.prisma.review.findUnique({ where: { id } });
    if (!review) {
      throw new NotFoundException({
        message: 'Review not found',
        error: 'NOT_FOUND',
      });
    }
    await this.prisma.review.delete({ where: { id } });
    return { deleted: true };
  }
}
