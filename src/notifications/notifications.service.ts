import { Injectable } from '@nestjs/common';
import { NotificationType, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class NotificationsService {
  constructor(private readonly prisma: PrismaService) {}

  notifyAll(
    type: NotificationType,
    title: string,
    message: string,
    tx: Prisma.TransactionClient | PrismaService = this.prisma,
  ) {
    return tx.notification.create({
      data: { type, title, message },
    });
  }

  async list(adminId: string, unreadOnly?: boolean) {
    return this.prisma.notification.findMany({
      where: {
        AND: [
          { OR: [{ adminId: null }, { adminId }] },
          unreadOnly ? { isRead: false } : {},
        ],
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
  }

  async markRead(id: string, adminId: string) {
    return this.prisma.notification.update({
      where: { id },
      data: { isRead: true, adminId },
    });
  }

  async markAllRead(adminId: string) {
    await this.prisma.notification.updateMany({
      where: {
        isRead: false,
        OR: [{ adminId: null }, { adminId }],
      },
      data: { isRead: true },
    });
    return { updated: true };
  }
}
