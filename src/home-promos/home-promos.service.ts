import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { HomePromoType, Prisma } from '@prisma/client';
import { getPagination, paginated } from '../common/utils/pagination';
import { toNumber } from '../common/utils/money';
import { PrismaService } from '../prisma/prisma.service';
import { CreateHomePromoDto } from './dto/create-home-promo.dto';
import { HomePromoQueryDto } from './dto/home-promo-query.dto';
import { UpdateHomePromoDto } from './dto/update-home-promo.dto';

const productCardSelect = {
  id: true,
  name: true,
  slug: true,
  price: true,
  oldPrice: true,
  discountPercent: true,
  stock: true,
  isActive: true,
  deletedAt: true,
  images: {
    where: { isMain: true },
    take: 1,
    select: { url: true },
  },
} satisfies Prisma.ProductSelect;

type ProductCard = Prisma.ProductGetPayload<{ select: typeof productCardSelect }>;

const adminInclude = {
  category: { select: { id: true, name: true, slug: true } },
  product: { select: productCardSelect },
} satisfies Prisma.HomePromoInclude;

@Injectable()
export class HomePromosService {
  constructor(private readonly prisma: PrismaService) {}

  async findPublic() {
    const now = new Date();
    const promos = await this.prisma.homePromo.findMany({
      where: {
        deletedAt: null,
        isActive: true,
        AND: [
          { OR: [{ startDate: null }, { startDate: { lte: now } }] },
          { OR: [{ endDate: null }, { endDate: { gte: now } }] },
        ],
      },
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
      include: {
        category: {
          select: {
            id: true,
            name: true,
            slug: true,
            isActive: true,
            deletedAt: true,
            children: {
              where: { deletedAt: null, isActive: true },
              select: { id: true },
            },
          },
        },
        product: { select: productCardSelect },
      },
    });

    const result = await Promise.all(
      promos.map(async (promo) => {
        const base = {
          id: promo.id,
          type: promo.type,
          title: promo.title,
          subtitle: promo.subtitle,
          image: promo.image,
          buttonText: promo.buttonText,
          link: promo.link,
          badgeText: promo.badgeText,
          sortOrder: promo.sortOrder,
        };

        if (promo.type === HomePromoType.CATEGORY) {
          const category = promo.category;
          if (!category || !category.isActive || category.deletedAt) return null;
          const products = await this.prisma.product.findMany({
            where: {
              deletedAt: null,
              isActive: true,
              categoryId: { in: [category.id, ...category.children.map((c) => c.id)] },
            },
            orderBy: [{ isFeatured: 'desc' }, { isPopular: 'desc' }, { createdAt: 'desc' }],
            take: promo.productsLimit,
            select: productCardSelect,
          });
          return {
            ...base,
            link: base.link ?? `/categories/${category.slug}`,
            category: { id: category.id, name: category.name, slug: category.slug },
            products: products.map((p) => this.productCard(p)),
          };
        }

        if (promo.type === HomePromoType.DEAL) {
          const product = promo.product;
          if (!product || !product.isActive || product.deletedAt) return null;
          const card = this.productCard(product);
          return {
            ...base,
            image: base.image ?? card.image,
            link: base.link ?? `/products/${product.slug}`,
            product: card,
          };
        }

        return base;
      }),
    );

    return result.filter((item) => item !== null);
  }

  async findAdmin(query: HomePromoQueryDto) {
    const { skip, take, page, limit } = getPagination(query);
    const where: Prisma.HomePromoWhereInput = { deletedAt: null };
    if (query.search) {
      where.OR = [
        { title: { contains: query.search, mode: 'insensitive' } },
        { subtitle: { contains: query.search, mode: 'insensitive' } },
      ];
    }
    if (query.type) where.type = query.type;
    if (query.status === 'active') where.isActive = true;
    if (query.status === 'inactive') where.isActive = false;
    const [total, data] = await this.prisma.$transaction([
      this.prisma.homePromo.count({ where }),
      this.prisma.homePromo.findMany({
        where,
        skip,
        take,
        orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
        include: adminInclude,
      }),
    ]);
    return paginated(
      data.map((promo) => this.adminView(promo)),
      total,
      page,
      limit,
    );
  }

  async findOne(id: string) {
    const promo = await this.prisma.homePromo.findFirst({
      where: { id, deletedAt: null },
      include: adminInclude,
    });
    if (!promo) {
      throw new NotFoundException({
        message: 'Home promo not found',
        error: 'NOT_FOUND',
      });
    }
    return this.adminView(promo);
  }

  async create(dto: CreateHomePromoDto) {
    await this.validate(dto);
    const created = await this.prisma.homePromo.create({
      data: {
        type: dto.type,
        title: dto.title,
        subtitle: dto.subtitle,
        image: dto.image,
        buttonText: dto.buttonText,
        link: dto.link,
        badgeText: dto.badgeText,
        categoryId: dto.categoryId,
        productId: dto.productId,
        productsLimit: dto.productsLimit ?? 4,
        sortOrder: dto.sortOrder ?? 0,
        isActive: dto.isActive ?? true,
        startDate: dto.startDate ? new Date(dto.startDate) : null,
        endDate: dto.endDate ? new Date(dto.endDate) : null,
      },
    });
    return this.findOne(created.id);
  }

  async update(id: string, dto: UpdateHomePromoDto) {
    const current = await this.findOne(id);
    await this.validate({
      type: dto.type ?? current.type,
      image: dto.image ?? current.image ?? undefined,
      categoryId: dto.categoryId ?? current.categoryId ?? undefined,
      productId: dto.productId ?? current.productId ?? undefined,
    });
    await this.prisma.homePromo.update({
      where: { id },
      data: {
        type: dto.type,
        title: dto.title,
        subtitle: dto.subtitle,
        image: dto.image,
        buttonText: dto.buttonText,
        link: dto.link,
        badgeText: dto.badgeText,
        categoryId: dto.categoryId,
        productId: dto.productId,
        productsLimit: dto.productsLimit,
        sortOrder: dto.sortOrder,
        isActive: dto.isActive,
        startDate: dto.startDate ? new Date(dto.startDate) : undefined,
        endDate: dto.endDate ? new Date(dto.endDate) : undefined,
      },
    });
    return this.findOne(id);
  }

  async updateStatus(id: string, isActive: boolean) {
    await this.findOne(id);
    await this.prisma.homePromo.update({ where: { id }, data: { isActive } });
    return this.findOne(id);
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.homePromo.update({
      where: { id },
      data: { isActive: false, deletedAt: new Date() },
    });
  }

  private async validate(input: {
    type: HomePromoType;
    image?: string;
    categoryId?: string;
    productId?: string;
  }) {
    const fail = (message: string) => {
      throw new BadRequestException({ message, error: 'BAD_REQUEST' });
    };

    if (
      (input.type === HomePromoType.PROMO || input.type === HomePromoType.BANNER) &&
      !input.image
    ) {
      fail(`image is required for ${input.type}`);
    }

    if (input.type === HomePromoType.CATEGORY) {
      if (!input.categoryId) fail('categoryId is required for CATEGORY');
      const category = await this.prisma.category.findFirst({
        where: { id: input.categoryId, deletedAt: null },
        select: { id: true },
      });
      if (!category) fail('Category not found');
    }

    if (input.type === HomePromoType.DEAL) {
      if (!input.productId) fail('productId is required for DEAL');
      const product = await this.prisma.product.findFirst({
        where: { id: input.productId, deletedAt: null },
        select: { id: true },
      });
      if (!product) fail('Product not found');
    }
  }

  private productCard(product: ProductCard) {
    const price = toNumber(product.price);
    const oldPrice = product.oldPrice === null ? null : toNumber(product.oldPrice);
    return {
      id: product.id,
      name: product.name,
      slug: product.slug,
      price,
      oldPrice,
      discountPercent: product.discountPercent,
      discountAmount: oldPrice !== null && oldPrice > price ? oldPrice - price : 0,
      inStock: product.stock > 0,
      image: product.images[0]?.url ?? null,
    };
  }

  private adminView(
    promo: Prisma.HomePromoGetPayload<{ include: typeof adminInclude }>,
  ) {
    return {
      ...promo,
      product: promo.product ? this.productCard(promo.product) : null,
    };
  }
}
