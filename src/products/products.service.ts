import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, ReviewStatus } from '@prisma/client';
import { getPagination, paginated, parseSortOrder } from '../common/utils/pagination';
import { uniqueSlug } from '../common/utils/slug';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProductDto, ProductImageInputDto, ProductVariantInputDto } from './dto/create-product.dto';
import { ProductQueryDto } from './dto/product-query.dto';
import { ReorderImagesDto } from './dto/reorder-images.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { productInclude, serializeProduct } from './product.serializer';

@Injectable()
export class ProductsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateProductDto) {
    await this.assertRelations(dto.brandId, dto.categoryId);
    const slug = await uniqueSlug(dto.slug ?? dto.name, (s) =>
      this.prisma.product.findFirst({ where: { slug: s } }).then((p) => Boolean(p)),
    );
    const product = await this.prisma.product.create({
      data: {
        name: dto.name,
        slug,
        description: dto.description,
        shortDescription: dto.shortDescription,
        sku: dto.sku,
        barcode: dto.barcode,
        price: dto.price,
        oldPrice: dto.oldPrice,
        discountPercent: dto.discountPercent ?? 0,
        stock: dto.stock ?? 0,
        lowStockThreshold: dto.lowStockThreshold ?? 5,
        brandId: dto.brandId,
        categoryId: dto.categoryId,
        isActive: dto.isActive ?? true,
        isFeatured: dto.isFeatured ?? false,
        isNew: dto.isNew ?? true,
        isPopular: dto.isPopular ?? false,
        images: dto.images?.length
          ? { create: this.normalizeImages(dto.images) }
          : undefined,
        variants: dto.variants?.length
          ? { create: dto.variants.map((v) => this.toVariantData(v)) }
          : undefined,
      },
      include: productInclude,
    });
    return serializeProduct(product);
  }

  async findPublic(query: ProductQueryDto) {
    const { skip, take, page, limit } = getPagination(query);
    const where = await this.buildWhere(query, true);
    const orderBy = this.buildOrder(query);
    const [total, rows] = await this.prisma.$transaction([
      this.prisma.product.count({ where }),
      this.prisma.product.findMany({
        where,
        skip,
        take,
        orderBy,
        include: {
          ...productInclude,
          reviews: {
            where: { status: ReviewStatus.APPROVED },
            select: { rating: true },
          },
        },
      }),
    ]);
    return paginated(
      rows.map((p) => serializeProduct(p)),
      total,
      page,
      limit,
    );
  }

  async findAdmin(query: ProductQueryDto) {
    const { skip, take, page, limit } = getPagination(query);
    const where = await this.buildWhere(query, false);
    const [total, rows] = await this.prisma.$transaction([
      this.prisma.product.count({ where }),
      this.prisma.product.findMany({
        where,
        skip,
        take,
        orderBy: this.buildOrder(query),
        include: {
          ...productInclude,
          reviews: {
            where: { status: ReviewStatus.APPROVED },
            select: { rating: true },
          },
        },
      }),
    ]);
    return paginated(
      rows.map((p) => serializeProduct(p)),
      total,
      page,
      limit,
    );
  }

  async findPublicOne(idOrSlug: string) {
    const product = await this.prisma.product.findFirst({
      where: {
        deletedAt: null,
        isActive: true,
        OR: [{ id: idOrSlug }, { slug: idOrSlug }],
      },
      include: {
        ...productInclude,
        reviews: {
          where: { status: ReviewStatus.APPROVED },
          select: { rating: true },
        },
      },
    });
    if (!product) {
      throw new NotFoundException({
        message: 'Product not found',
        error: 'NOT_FOUND',
      });
    }
    await this.prisma.product.update({
      where: { id: product.id },
      data: { viewsCount: { increment: 1 } },
    });
    return serializeProduct({ ...product, viewsCount: product.viewsCount + 1 });
  }

  async findAdminOne(id: string) {
    const product = await this.prisma.product.findFirst({
      where: { id, deletedAt: null },
      include: {
        ...productInclude,
        reviews: {
          where: { status: ReviewStatus.APPROVED },
          select: { rating: true },
        },
      },
    });
    if (!product) {
      throw new NotFoundException({
        message: 'Product not found',
        error: 'NOT_FOUND',
      });
    }
    return serializeProduct(product);
  }

  async update(id: string, dto: UpdateProductDto) {
    const current = await this.ensureExists(id);
    if (dto.brandId || dto.categoryId) {
      await this.assertRelations(
        dto.brandId ?? current.brandId,
        dto.categoryId ?? current.categoryId,
      );
    }
    let slug = current.slug;
    if (dto.slug || dto.name) {
      slug = await uniqueSlug(dto.slug ?? dto.name ?? current.name, (s) =>
        this.prisma.product
          .findFirst({ where: { slug: s, id: { not: id } } })
          .then((p) => Boolean(p)),
      );
    }
    const product = await this.prisma.product.update({
      where: { id },
      data: {
        name: dto.name,
        slug,
        description: dto.description,
        shortDescription: dto.shortDescription,
        sku: dto.sku,
        barcode: dto.barcode,
        price: dto.price,
        oldPrice: dto.oldPrice,
        discountPercent: dto.discountPercent,
        stock: dto.stock,
        lowStockThreshold: dto.lowStockThreshold,
        brandId: dto.brandId,
        categoryId: dto.categoryId,
        isActive: dto.isActive,
        isFeatured: dto.isFeatured,
        isNew: dto.isNew,
        isPopular: dto.isPopular,
      },
      include: productInclude,
    });
    return serializeProduct(product);
  }

  async updateStatus(id: string, isActive: boolean) {
    await this.ensureExists(id);
    const product = await this.prisma.product.update({
      where: { id },
      data: { isActive },
      include: productInclude,
    });
    return serializeProduct(product);
  }

  async remove(id: string) {
    await this.ensureExists(id);
    const product = await this.prisma.product.update({
      where: { id },
      data: { isActive: false, deletedAt: new Date() },
      include: productInclude,
    });
    return serializeProduct(product);
  }

  async addImage(productId: string, dto: ProductImageInputDto) {
    await this.ensureExists(productId);
    if (dto.isMain) {
      await this.prisma.productImage.updateMany({
        where: { productId },
        data: { isMain: false },
      });
    }
    const count = await this.prisma.productImage.count({ where: { productId } });
    return this.prisma.productImage.create({
      data: {
        productId,
        url: dto.url,
        alt: dto.alt,
        isMain: dto.isMain ?? count === 0,
        sortOrder: dto.sortOrder ?? count,
      },
    });
  }

  async deleteImage(productId: string, imageId: string) {
    const image = await this.prisma.productImage.findFirst({
      where: { id: imageId, productId },
    });
    if (!image) {
      throw new NotFoundException({
        message: 'Image not found',
        error: 'NOT_FOUND',
      });
    }
    await this.prisma.productImage.delete({ where: { id: imageId } });
    if (image.isMain) {
      const next = await this.prisma.productImage.findFirst({
        where: { productId },
        orderBy: { sortOrder: 'asc' },
      });
      if (next) {
        await this.prisma.productImage.update({
          where: { id: next.id },
          data: { isMain: true },
        });
      }
    }
    return { deleted: true };
  }

  async setMainImage(productId: string, imageId: string) {
    const image = await this.prisma.productImage.findFirst({
      where: { id: imageId, productId },
    });
    if (!image) {
      throw new NotFoundException({
        message: 'Image not found',
        error: 'NOT_FOUND',
      });
    }
    await this.prisma.$transaction([
      this.prisma.productImage.updateMany({
        where: { productId },
        data: { isMain: false },
      }),
      this.prisma.productImage.update({
        where: { id: imageId },
        data: { isMain: true },
      }),
    ]);
    return this.prisma.productImage.findUniqueOrThrow({ where: { id: imageId } });
  }

  async reorderImages(productId: string, dto: ReorderImagesDto) {
    await this.ensureExists(productId);
    await this.prisma.$transaction(
      dto.items.map((item) =>
        this.prisma.productImage.update({
          where: { id: item.id },
          data: { sortOrder: item.sortOrder },
        }),
      ),
    );
    return this.prisma.productImage.findMany({
      where: { productId },
      orderBy: { sortOrder: 'asc' },
    });
  }

  async addVariant(productId: string, dto: ProductVariantInputDto) {
    await this.ensureExists(productId);
    return this.prisma.productVariant.create({
      data: { productId, ...this.toVariantData(dto) },
    });
  }

  async updateVariant(
    productId: string,
    variantId: string,
    dto: Partial<ProductVariantInputDto>,
  ) {
    await this.ensureVariant(productId, variantId);
    return this.prisma.productVariant.update({
      where: { id: variantId },
      data: {
        sku: dto.sku,
        price: dto.price,
        stock: dto.stock,
        attributes: dto.attributes,
        isActive: dto.isActive,
      },
    });
  }

  async deleteVariant(productId: string, variantId: string) {
    await this.ensureVariant(productId, variantId);
    await this.prisma.productVariant.update({
      where: { id: variantId },
      data: { isActive: false },
    });
    return { deleted: true };
  }

  private async buildWhere(
    query: ProductQueryDto,
    publicOnly: boolean,
  ): Promise<Prisma.ProductWhereInput> {
    const where: Prisma.ProductWhereInput = { deletedAt: null };
    if (publicOnly) where.isActive = true;
    if (query.search) {
      where.OR = [
        { name: { contains: query.search, mode: 'insensitive' } },
        { sku: { contains: query.search, mode: 'insensitive' } },
        { description: { contains: query.search, mode: 'insensitive' } },
        { barcode: { contains: query.search, mode: 'insensitive' } },
      ];
    }
    if (query.category) {
      const category = await this.prisma.category.findFirst({
        where: { OR: [{ id: query.category }, { slug: query.category }] },
      });
      if (category) where.categoryId = category.id;
      else where.categoryId = 'none';
    }
    if (query.brand) {
      const brand = await this.prisma.brand.findFirst({
        where: { OR: [{ id: query.brand }, { slug: query.brand }] },
      });
      if (brand) where.brandId = brand.id;
      else where.brandId = 'none';
    }
    if (query.minPrice !== undefined || query.maxPrice !== undefined) {
      where.price = {
        gte: query.minPrice,
        lte: query.maxPrice,
      };
    }
    if (query.stock === 'in') where.stock = { gt: 0 };
    if (query.stock === 'out') where.stock = { lte: 0 };
    if (query.stock === 'low') {
      where.AND = [
        { stock: { gt: 0 } },
        { lowStockThreshold: { gt: 0 } },
      ];
    }
    if (query.featured === true || query.sort === 'featured') where.isFeatured = true;
    if (query.isNew === true) where.isNew = true;
    if (query.popular === true) where.isPopular = true;
    if (query.isActive !== undefined && !publicOnly) where.isActive = query.isActive;
    if (query.status === 'active') where.isActive = true;
    if (query.status === 'inactive') where.isActive = false;
    return where;
  }

  private buildOrder(query: ProductQueryDto): Prisma.ProductOrderByWithRelationInput {
    const sort = query.sort ?? query.sortBy;
    const dir = parseSortOrder(query.order);
    switch (sort) {
      case 'price_asc':
        return { price: 'asc' };
      case 'price_desc':
        return { price: 'desc' };
      case 'newest':
      case 'createdAt':
        return { createdAt: 'desc' };
      case 'popular':
        return { viewsCount: 'desc' };
      case 'name':
        return { name: dir };
      case 'stock':
        return { stock: dir };
      default:
        return { createdAt: dir };
    }
  }

  private normalizeImages(images: ProductImageInputDto[]) {
    const hasMain = images.some((i) => i.isMain);
    return images.map((img, index) => ({
      url: img.url,
      alt: img.alt,
      isMain: hasMain ? Boolean(img.isMain) : index === 0,
      sortOrder: img.sortOrder ?? index,
    }));
  }

  private toVariantData(dto: ProductVariantInputDto) {
    return {
      sku: dto.sku,
      price: dto.price,
      stock: dto.stock ?? 0,
      attributes: dto.attributes as Prisma.InputJsonValue,
      isActive: dto.isActive ?? true,
    };
  }

  private async assertRelations(brandId: string, categoryId: string) {
    const [brand, category] = await Promise.all([
      this.prisma.brand.findFirst({ where: { id: brandId, deletedAt: null } }),
      this.prisma.category.findFirst({
        where: { id: categoryId, deletedAt: null },
      }),
    ]);
    if (!brand) {
      throw new BadRequestException({
        message: 'Brand not found',
        error: 'BAD_REQUEST',
      });
    }
    if (!category) {
      throw new BadRequestException({
        message: 'Category not found',
        error: 'BAD_REQUEST',
      });
    }
  }

  private async ensureExists(id: string) {
    const product = await this.prisma.product.findFirst({
      where: { id, deletedAt: null },
    });
    if (!product) {
      throw new NotFoundException({
        message: 'Product not found',
        error: 'NOT_FOUND',
      });
    }
    return product;
  }

  private async ensureVariant(productId: string, variantId: string) {
    const variant = await this.prisma.productVariant.findFirst({
      where: { id: variantId, productId },
    });
    if (!variant) {
      throw new NotFoundException({
        message: 'Variant not found',
        error: 'NOT_FOUND',
      });
    }
    return variant;
  }
}
