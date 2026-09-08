import { Injectable } from '@nestjs/common';
import { ActivityType, Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class ActivityService {
  constructor(private readonly prisma: PrismaService) {}

  log(
    userId: string,
    type: ActivityType,
    metadata?: Prisma.InputJsonValue,
    tx: Prisma.TransactionClient | PrismaService = this.prisma,
  ) {
    return tx.userActivity.create({
      data: {
        userId,
        type,
        metadata: metadata ?? Prisma.JsonNull,
      },
    });
  }
}
