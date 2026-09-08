import { Prisma, ReviewStatus } from '@prisma/client';
import { toNumber } from '../common/utils/money';

const productInclude = {
  brand: true,
  category: true,
  images: { orderBy: { sortOrder: 'asc' as const } },
  variants: { orderBy: { createdAt: 'asc' as const } },
  _count: {
    select: {
      reviews: { where: { status: ReviewStatus.APPROVED } },
    },
  },
} satisfies Prisma.ProductInclude;

export type ProductWithRelations = Prisma.ProductGetPayload<{
  include: typeof productInclude;
}> & {
  reviews?: { rating: number }[];
};

export function serializeProduct(
  product: ProductWithRelations,
  extras?: { averageRating?: number; reviewsCount?: number },
) {
  const availableStock = product.stock - product.reservedStock;
  const avg =
    extras?.averageRating ??
    (product.reviews && product.reviews.length
      ? product.reviews.reduce((s, r) => s + r.rating, 0) / product.reviews.length
      : 0);
  const reviewsCount = extras?.reviewsCount ?? product._count?.reviews ?? 0;
  return {
    id: product.id,
    name: product.name,
    slug: product.slug,
    description: product.description,
    shortDescription: product.shortDescription,
    sku: product.sku,
    barcode: product.barcode,
    price: toNumber(product.price),
    oldPrice: product.oldPrice ? toNumber(product.oldPrice) : null,
    discountPercent: product.discountPercent,
    stock: product.stock,
    reservedStock: product.reservedStock,
    availableStock,
    lowStockThreshold: product.lowStockThreshold,
    brandId: product.brandId,
    categoryId: product.categoryId,
    isActive: product.isActive,
    isFeatured: product.isFeatured,
    isNew: product.isNew,
    isPopular: product.isPopular,
    viewsCount: product.viewsCount,
    createdAt: product.createdAt,
    updatedAt: product.updatedAt,
    brand: product.brand,
    category: product.category,
    images: product.images,
    variants: product.variants?.map((v) => ({
      ...v,
      price: toNumber(v.price),
      availableStock: v.stock - v.reservedStock,
    })),
    averageRating: Number(avg.toFixed(2)),
    reviewsCount,
  };
}

export { productInclude };
