import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PaginationQueryDto } from '../common/dto/pagination-query.dto';
import { getPagination, paginated } from '../common/utils/pagination';
import { uniqueSlug } from '../common/utils/slug';
import { toNumber } from '../common/utils/money';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';

@Injectable()
export class CategoriesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateCategoryDto) {
    if (dto.parentId) {
      await this.ensureExists(dto.parentId);
    }
    const slug = await uniqueSlug(dto.slug ?? dto.name, (s) =>
      this.prisma.category
        .findFirst({ where: { slug: s } })
        .then((c) => Boolean(c)),
    );
    return this.prisma.category.create({
      data: {
        name: dto.name,
        slug,
        description: dto.description,
        image: dto.image,
        parentId: dto.parentId,
        isActive: dto.isActive ?? true,
        sortOrder: dto.sortOrder ?? 0,
      },
    });
  }

  async findPublicTree() {
    const categories = await this.prisma.category.findMany({
      where: { deletedAt: null, isActive: true },
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
      include: { _count: { select: { products: true } } },
    });
    return this.buildTree(categories);
  }

  async findPublicOne(idOrSlug: string) {
    const category = await this.prisma.category.findFirst({
      where: {
        deletedAt: null,
        isActive: true,
        OR: [{ id: idOrSlug }, { slug: idOrSlug }],
      },
      include: {
        children: {
          where: { deletedAt: null, isActive: true },
          orderBy: { sortOrder: 'asc' },
        },
        parent: true,
        _count: { select: { products: true } },
      },
    });
    if (!category) {
      throw new NotFoundException({
        message: 'Category not found',
        error: 'NOT_FOUND',
      });
    }
    return category;
  }

  async findAdmin(query: PaginationQueryDto) {
    const { skip, take, page, limit } = getPagination(query);
    const where: Prisma.CategoryWhereInput = { deletedAt: null };
    if (query.search) {
      where.OR = [
        { name: { contains: query.search, mode: 'insensitive' } },
        { slug: { contains: query.search, mode: 'insensitive' } },
      ];
    }
    if (query.status === 'active') where.isActive = true;
    if (query.status === 'inactive') where.isActive = false;
    const [total, data] = await this.prisma.$transaction([
      this.prisma.category.count({ where }),
      this.prisma.category.findMany({
        where,
        skip,
        take,
        orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
        include: {
          parent: { select: { id: true, name: true, slug: true } },
          _count: { select: { products: true, children: true } },
        },
      }),
    ]);
    return paginated(data, total, page, limit);
  }

  async findAdminOne(id: string) {
    const category = await this.prisma.category.findFirst({
      where: { id, deletedAt: null },
      include: {
        parent: { select: { id: true, name: true, slug: true } },
        children: {
          where: { deletedAt: null },
          orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
          include: {
            _count: {
              select: {
                products: { where: { deletedAt: null } },
                children: { where: { deletedAt: null } },
              },
            },
          },
        },
        products: {
          where: { deletedAt: null },
          take: 20,
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            name: true,
            slug: true,
            sku: true,
            price: true,
            isActive: true,
            images: { where: { isMain: true }, take: 1, select: { url: true } },
          },
        },
        _count: {
          select: {
            products: { where: { deletedAt: null } },
            children: { where: { deletedAt: null } },
          },
        },
      },
    });
    if (!category) {
      throw new NotFoundException({
        message: 'Category not found',
        error: 'NOT_FOUND',
      });
    }
    return {
      ...category,
      products: category.products.map((product) => ({
        ...product,
        price: toNumber(product.price),
        image: product.images[0]?.url ?? null,
      })),
    };
  }

  async update(id: string, dto: UpdateCategoryDto) {
    const current = await this.ensureExists(id);
    if (dto.parentId === id) {
      throw new BadRequestException({
        message: 'Category cannot be its own parent',
        error: 'BAD_REQUEST',
      });
    }
    if (dto.parentId) {
      await this.ensureExists(dto.parentId);
    }
    let slug = current.slug;
    if (dto.slug || dto.name) {
      slug = await uniqueSlug(dto.slug ?? dto.name ?? current.name, (s) =>
        this.prisma.category
          .findFirst({ where: { slug: s, id: { not: id } } })
          .then((c) => Boolean(c)),
      );
    }
    return this.prisma.category.update({
      where: { id },
      data: {
        name: dto.name,
        slug,
        description: dto.description,
        image: dto.image,
        parentId: dto.parentId,
        isActive: dto.isActive,
        sortOrder: dto.sortOrder,
      },
    });
  }

  async remove(id: string) {
    const category = await this.ensureExists(id);
    const productCount = await this.prisma.product.count({
      where: { categoryId: id, deletedAt: null },
    });
    if (productCount > 0) {
      return this.prisma.category.update({
        where: { id },
        data: { isActive: false, deletedAt: new Date() },
      });
    }
    await this.prisma.category.updateMany({
      where: { parentId: id },
      data: { parentId: category.parentId },
    });
    return this.prisma.category.update({
      where: { id },
      data: { isActive: false, deletedAt: new Date() },
    });
  }

  private async ensureExists(id: string) {
    const category = await this.prisma.category.findFirst({
      where: { id, deletedAt: null },
    });
    if (!category) {
      throw new NotFoundException({
        message: 'Category not found',
        error: 'NOT_FOUND',
      });
    }
    return category;
  }

  private buildTree(
    categories: Array<{
      id: string;
      parentId: string | null;
      [key: string]: unknown;
    }>,
  ) {
    const map = new Map<string, Record<string, unknown> & { children: unknown[] }>();
    categories.forEach((c) => {
      map.set(c.id, { ...c, children: [] });
    });
    const roots: unknown[] = [];
    categories.forEach((c) => {
      const node = map.get(c.id);
      if (!node) return;
      if (c.parentId && map.has(c.parentId)) {
        (map.get(c.parentId)?.children as unknown[]).push(node);
      } else {
        roots.push(node);
      }
    });
    return roots;
  }
}
