import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PaginationQueryDto } from '../common/dto/pagination-query.dto';
import { getPagination, paginated } from '../common/utils/pagination';
import { uniqueSlug } from '../common/utils/slug';
import { PrismaService } from '../prisma/prisma.service';
import { CreateBrandDto } from './dto/create-brand.dto';
import { UpdateBrandDto } from './dto/update-brand.dto';

@Injectable()
export class BrandsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateBrandDto) {
    const slug = await uniqueSlug(dto.slug ?? dto.name, (s) =>
      this.prisma.brand.findFirst({ where: { slug: s } }).then((b) => Boolean(b)),
    );
    return this.prisma.brand.create({
      data: {
        name: dto.name,
        slug,
        description: dto.description,
        logo: dto.logo,
        isActive: dto.isActive ?? true,
      },
    });
  }

  findPublic() {
    return this.prisma.brand.findMany({
      where: { deletedAt: null, isActive: true },
      orderBy: { name: 'asc' },
      include: { _count: { select: { products: true } } },
    });
  }

  async findPublicOne(idOrSlug: string) {
    const brand = await this.prisma.brand.findFirst({
      where: {
        deletedAt: null,
        isActive: true,
        OR: [{ id: idOrSlug }, { slug: idOrSlug }],
      },
      include: { _count: { select: { products: true } } },
    });
    if (!brand) {
      throw new NotFoundException({
        message: 'Brand not found',
        error: 'NOT_FOUND',
      });
    }
    return brand;
  }

  async findAdmin(query: PaginationQueryDto) {
    const { skip, take, page, limit } = getPagination(query);
    const where: Prisma.BrandWhereInput = { deletedAt: null };
    if (query.search) {
      where.OR = [
        { name: { contains: query.search, mode: 'insensitive' } },
        { slug: { contains: query.search, mode: 'insensitive' } },
      ];
    }
    if (query.status === 'active') where.isActive = true;
    if (query.status === 'inactive') where.isActive = false;
    const [total, data] = await this.prisma.$transaction([
      this.prisma.brand.count({ where }),
      this.prisma.brand.findMany({
        where,
        skip,
        take,
        orderBy: { name: 'asc' },
        include: { _count: { select: { products: true } } },
      }),
    ]);
    return paginated(data, total, page, limit);
  }

  async update(id: string, dto: UpdateBrandDto) {
    const current = await this.ensureExists(id);
    let slug = current.slug;
    if (dto.slug || dto.name) {
      slug = await uniqueSlug(dto.slug ?? dto.name ?? current.name, (s) =>
        this.prisma.brand
          .findFirst({ where: { slug: s, id: { not: id } } })
          .then((b) => Boolean(b)),
      );
    }
    return this.prisma.brand.update({
      where: { id },
      data: {
        name: dto.name,
        slug,
        description: dto.description,
        logo: dto.logo,
        isActive: dto.isActive,
      },
    });
  }

  async remove(id: string) {
    await this.ensureExists(id);
    return this.prisma.brand.update({
      where: { id },
      data: { isActive: false, deletedAt: new Date() },
    });
  }

  private async ensureExists(id: string) {
    const brand = await this.prisma.brand.findFirst({
      where: { id, deletedAt: null },
    });
    if (!brand) {
      throw new NotFoundException({
        message: 'Brand not found',
        error: 'NOT_FOUND',
      });
    }
    return brand;
  }
}
