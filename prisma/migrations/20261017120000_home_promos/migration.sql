-- CreateEnum
CREATE TYPE "HomePromoType" AS ENUM ('PROMO', 'CATEGORY', 'BANNER', 'DEAL');

-- CreateTable
CREATE TABLE "HomePromo" (
    "id" TEXT NOT NULL,
    "type" "HomePromoType" NOT NULL,
    "title" TEXT NOT NULL,
    "subtitle" TEXT,
    "image" TEXT,
    "buttonText" TEXT,
    "link" TEXT,
    "badgeText" TEXT,
    "categoryId" TEXT,
    "productId" TEXT,
    "productsLimit" INTEGER NOT NULL DEFAULT 4,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HomePromo_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "HomePromo_isActive_idx" ON "HomePromo"("isActive");

-- CreateIndex
CREATE INDEX "HomePromo_sortOrder_idx" ON "HomePromo"("sortOrder");

-- CreateIndex
CREATE INDEX "HomePromo_type_idx" ON "HomePromo"("type");

-- AddForeignKey
ALTER TABLE "HomePromo" ADD CONSTRAINT "HomePromo_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HomePromo" ADD CONSTRAINT "HomePromo_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE SET NULL ON UPDATE CASCADE;
