import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PaginationQueryDto } from '../common/dto/pagination-query.dto';
import { getPagination, paginated } from '../common/utils/pagination';
import { PrismaService } from '../prisma/prisma.service';
import { CreateBannerDto } from './dto/create-banner.dto';
import { UpdateBannerDto } from './dto/update-banner.dto';

@Injectable()
export class BannersService {
  constructor(private readonly prisma: PrismaService) {}

  findPublic() {
    const now = new Date();
    return this.prisma.banner.findMany({
      where: {
        deletedAt: null,
        isActive: true,
        AND: [
          { OR: [{ startDate: null }, { startDate: { lte: now } }] },
          { OR: [{ endDate: null }, { endDate: { gte: now } }] },
        ],
      },
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }],
    });
  }

  async findAdmin(query: PaginationQueryDto) {
    const { skip, take, page, limit } = getPagination(query);
    const where: Prisma.BannerWhereInput = { deletedAt: null };
    if (query.search) {
      where.OR = [
        { title: { contains: query.search, mode: 'insensitive' } },
        { subtitle: { contains: query.search, mode: 'insensitive' } },
      ];
    }
    if (query.status === 'active') where.isActive = true;
    if (query.status === 'inactive') where.isActive = false;
    const [total, data] = await this.prisma.$transaction([
      this.prisma.banner.count({ where }),
      this.prisma.banner.findMany({
        where,
        skip,
        take,
        orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }],
      }),
    ]);
    return paginated(data, total, page, limit);
  }

  async findOne(id: string) {
    const banner = await this.prisma.banner.findFirst({
      where: { id, deletedAt: null },
    });
    if (!banner) {
      throw new NotFoundException({
        message: 'Banner not found',
        error: 'NOT_FOUND',
      });
    }
    return banner;
  }

  create(dto: CreateBannerDto) {
    return this.prisma.banner.create({
      data: {
        title: dto.title,
        subtitle: dto.subtitle,
        image: dto.image,
        mobileImage: dto.mobileImage,
        buttonText: dto.buttonText,
        link: dto.link,
        sortOrder: dto.sortOrder ?? 0,
        isActive: dto.isActive ?? true,
        startDate: dto.startDate ? new Date(dto.startDate) : null,
        endDate: dto.endDate ? new Date(dto.endDate) : null,
      },
    });
  }

  async update(id: string, dto: UpdateBannerDto) {
    await this.findOne(id);
    return this.prisma.banner.update({
      where: { id },
      data: {
        title: dto.title,
        subtitle: dto.subtitle,
        image: dto.image,
        mobileImage: dto.mobileImage,
        buttonText: dto.buttonText,
        link: dto.link,
        sortOrder: dto.sortOrder,
        isActive: dto.isActive,
        startDate: dto.startDate ? new Date(dto.startDate) : undefined,
        endDate: dto.endDate ? new Date(dto.endDate) : undefined,
      },
    });
  }

  async updateStatus(id: string, isActive: boolean) {
    await this.findOne(id);
    return this.prisma.banner.update({
      where: { id },
      data: { isActive },
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.banner.update({
      where: { id },
      data: { isActive: false, deletedAt: new Date() },
    });
  }
}
