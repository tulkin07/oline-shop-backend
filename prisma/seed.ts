import { PrismaClient, AdminRole, ReviewStatus } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  const password = await bcrypt.hash('Admin123!', 12);

  const admin = await prisma.admin.upsert({
    where: { email: 'admin@example.com' },
    update: {},
    create: {
      firstName: 'Super',
      lastName: 'Admin',
      email: 'admin@example.com',
      phone: '+998900000000',
      password,
      role: AdminRole.SUPER_ADMIN,
    },
  });

  await prisma.setting.upsert({
    where: { id: 'default' },
    update: {},
    create: {
      id: 'default',
      storeName: 'ElectroShop',
      storeDescription: 'Online electronics store for phones, laptops and gadgets',
      phone: '+998711234567',
      email: 'support@electroshop.uz',
      address: 'Toshkent, Yunusobod',
      currency: 'UZS',
      deliveryFee: 25000,
      freeDeliveryThreshold: 1500000,
    },
  });

  const categoryNames = [
    'Smartphones',
    'Laptops',
    'Tablets',
    'Monitors',
    'TV',
    'Headphones',
    'Smart Watches',
    'Cameras',
    'Gaming',
    'Accessories',
  ];

  const categories = [];
  for (let i = 0; i < categoryNames.length; i += 1) {
    const name = categoryNames[i];
    const slug = name.toLowerCase().replace(/\s+/g, '-');
    const category = await prisma.category.upsert({
      where: { slug },
      update: {},
      create: {
        name,
        slug,
        description: `${name} category`,
        sortOrder: i + 1,
        isActive: true,
      },
    });
    categories.push(category);
  }

  const brandNames = [
    'Apple',
    'Samsung',
    'Xiaomi',
    'Sony',
    'LG',
    'Lenovo',
    'Asus',
    'Acer',
    'HP',
    'Dell',
    'JBL',
    'Huawei',
  ];

  const brands = [];
  for (const name of brandNames) {
    const slug = name.toLowerCase();
    const brand = await prisma.brand.upsert({
      where: { slug },
      update: {},
      create: {
        name,
        slug,
        description: `${name} official products`,
        logo: `https://placehold.co/200x80?text=${encodeURIComponent(name)}`,
        isActive: true,
      },
    });
    brands.push(brand);
  }

  const products: Array<{
    name: string;
    sku: string;
    price: number;
    oldPrice?: number;
    discountPercent?: number;
    stock: number;
    brand: string;
    category: string;
    featured: boolean;
    isNew: boolean;
    popular: boolean;
    short: string;
    description: string;
    variants?: Array<{
      sku: string;
      price: number;
      stock: number;
      attributes: Record<string, string>;
    }>;
  }> = [
    {
      name: 'iPhone 15 Pro',
      sku: 'IPH15P-256',
      price: 14999000,
      oldPrice: 16499000,
      discountPercent: 9,
      stock: 24,
      brand: 'Apple',
      category: 'Smartphones',
      featured: true,
      isNew: true,
      popular: true,
      short: 'Titanium smartphone with A17 Pro',
      description: 'iPhone 15 Pro with 256GB storage, 6.1-inch Super Retina display and USB-C.',
      variants: [
        { sku: 'IPH15P-128', price: 13499000, stock: 12, attributes: { storage: '128GB' } },
        { sku: 'IPH15P-256V', price: 14999000, stock: 18, attributes: { storage: '256GB' } },
        { sku: 'IPH15P-512', price: 17499000, stock: 8, attributes: { storage: '512GB' } },
      ],
    },
    {
      name: 'Samsung Galaxy S24 Ultra',
      sku: 'SGS24U-256',
      price: 13999000,
      oldPrice: 15499000,
      discountPercent: 10,
      stock: 18,
      brand: 'Samsung',
      category: 'Smartphones',
      featured: true,
      isNew: true,
      popular: true,
      short: 'Flagship Galaxy with S Pen',
      description: 'Galaxy S24 Ultra 256GB, 200MP camera and 6.8-inch Dynamic AMOLED display.',
      variants: [
        { sku: 'SGS24U-256V', price: 13999000, stock: 10, attributes: { storage: '256GB' } },
        { sku: 'SGS24U-512', price: 15999000, stock: 6, attributes: { storage: '512GB' } },
      ],
    },
    {
      name: 'Xiaomi 14',
      sku: 'MI14-256',
      price: 7999000,
      oldPrice: 8999000,
      discountPercent: 11,
      stock: 30,
      brand: 'Xiaomi',
      category: 'Smartphones',
      featured: false,
      isNew: true,
      popular: true,
      short: 'Leica-tuned flagship camera phone',
      description: 'Xiaomi 14 with Snapdragon 8 Gen 3 and 256GB storage.',
    },
    {
      name: 'MacBook Air 15 M3',
      sku: 'MBA15-M3',
      price: 18999000,
      oldPrice: 20999000,
      discountPercent: 10,
      stock: 12,
      brand: 'Apple',
      category: 'Laptops',
      featured: true,
      isNew: true,
      popular: true,
      short: '15-inch Air powered by M3',
      description: 'MacBook Air 15-inch with M3 chip, Liquid Retina display and MagSafe charging.',
      variants: [
        { sku: 'MBA15-8-256', price: 18999000, stock: 6, attributes: { ram: '8GB', storage: '256GB' } },
        { sku: 'MBA15-16-512', price: 23999000, stock: 4, attributes: { ram: '16GB', storage: '512GB' } },
      ],
    },
    {
      name: 'ASUS ROG Zephyrus G14',
      sku: 'ROG-G14',
      price: 21999000,
      stock: 9,
      brand: 'Asus',
      category: 'Laptops',
      featured: true,
      isNew: false,
      popular: true,
      short: 'Compact gaming laptop',
      description: 'ROG Zephyrus G14 with Ryzen processor, RTX graphics and 14-inch QHD display.',
    },
    {
      name: 'Lenovo Legion 5',
      sku: 'LEGION5-15',
      price: 16499000,
      stock: 11,
      brand: 'Lenovo',
      category: 'Laptops',
      featured: false,
      isNew: false,
      popular: true,
      short: 'Performance gaming notebook',
      description: 'Lenovo Legion 5 15-inch with high refresh display and dedicated GPU.',
    },
    {
      name: 'iPad Air 11',
      sku: 'IPADAIR11',
      price: 8999000,
      stock: 16,
      brand: 'Apple',
      category: 'Tablets',
      featured: true,
      isNew: true,
      popular: false,
      short: 'Thin iPad Air with M2',
      description: 'iPad Air 11-inch with M2 chip, Liquid Retina display and Apple Pencil support.',
    },
    {
      name: 'Samsung Galaxy Tab S9',
      sku: 'TABS9-128',
      price: 7499000,
      stock: 14,
      brand: 'Samsung',
      category: 'Tablets',
      featured: false,
      isNew: false,
      popular: true,
      short: 'AMOLED Android tablet',
      description: 'Galaxy Tab S9 with Dynamic AMOLED 2X display and included S Pen.',
    },
    {
      name: 'LG UltraGear 27',
      sku: 'LG-UG27',
      price: 4299000,
      stock: 20,
      brand: 'LG',
      category: 'Monitors',
      featured: false,
      isNew: true,
      popular: true,
      short: '27-inch 165Hz gaming monitor',
      description: 'LG UltraGear 27-inch QHD monitor with 1ms response time.',
    },
    {
      name: 'Dell UltraSharp 27',
      sku: 'DELL-U2724',
      price: 5899000,
      stock: 8,
      brand: 'Dell',
      category: 'Monitors',
      featured: false,
      isNew: false,
      popular: false,
      short: 'Color-accurate office display',
      description: 'Dell UltraSharp 27-inch 4K USB-C monitor for professional work.',
    },
    {
      name: 'Samsung 55 QLED 4K',
      sku: 'SAM-Q55',
      price: 8999000,
      oldPrice: 10499000,
      discountPercent: 14,
      stock: 7,
      brand: 'Samsung',
      category: 'TV',
      featured: true,
      isNew: false,
      popular: true,
      short: '55-inch QLED smart TV',
      description: 'Samsung 55-inch QLED 4K TV with Tizen OS and HDR10+.',
    },
    {
      name: 'Sony WH-1000XM5',
      sku: 'SONY-XM5',
      price: 4299000,
      stock: 22,
      brand: 'Sony',
      category: 'Headphones',
      featured: true,
      isNew: false,
      popular: true,
      short: 'Industry-leading noise cancelling',
      description: 'Sony WH-1000XM5 wireless headphones with 30-hour battery life.',
    },
    {
      name: 'JBL Tune 770NC',
      sku: 'JBL-770NC',
      price: 1299000,
      stock: 40,
      brand: 'JBL',
      category: 'Headphones',
      featured: false,
      isNew: true,
      popular: true,
      short: 'Affordable ANC headphones',
      description: 'JBL Tune 770NC over-ear headphones with Adaptive Noise Cancelling.',
    },
    {
      name: 'Apple Watch Series 9',
      sku: 'AW-S9-45',
      price: 5499000,
      stock: 15,
      brand: 'Apple',
      category: 'Smart Watches',
      featured: true,
      isNew: true,
      popular: true,
      short: 'S9 SiP and Double Tap',
      description: 'Apple Watch Series 9 GPS 45mm with Always-On Retina display.',
    },
    {
      name: 'Huawei Watch GT 4',
      sku: 'HW-GT4',
      price: 2499000,
      stock: 19,
      brand: 'Huawei',
      category: 'Smart Watches',
      featured: false,
      isNew: false,
      popular: true,
      short: 'Long battery smartwatch',
      description: 'Huawei Watch GT 4 with up to 14 days of battery life.',
    },
    {
      name: 'Sony Alpha ZV-E10',
      sku: 'SONY-ZVE10',
      price: 8999000,
      stock: 6,
      brand: 'Sony',
      category: 'Cameras',
      featured: false,
      isNew: true,
      popular: false,
      short: 'Vlogging APS-C camera',
      description: 'Sony ZV-E10 interchangeable-lens camera designed for content creation.',
    },
    {
      name: 'PlayStation 5 Slim',
      sku: 'PS5-SLIM',
      price: 7999000,
      stock: 10,
      brand: 'Sony',
      category: 'Gaming',
      featured: true,
      isNew: true,
      popular: true,
      short: 'Slim PS5 console',
      description: 'PlayStation 5 Slim with DualSense controller and 1TB SSD.',
    },
    {
      name: 'USB-C Hub 7-in-1',
      sku: 'ACC-HUB7',
      price: 299000,
      stock: 80,
      brand: 'HP',
      category: 'Accessories',
      featured: false,
      isNew: false,
      popular: true,
      short: 'Multiport USB-C hub',
      description: '7-in-1 USB-C hub with HDMI, USB-A, SD card reader and PD charging.',
    },
    {
      name: 'HP DeskJet 2720e',
      sku: 'HP-DJ2720',
      price: 1199000,
      stock: 13,
      brand: 'HP',
      category: 'Accessories',
      featured: false,
      isNew: false,
      popular: false,
      short: 'Wireless all-in-one printer',
      description: 'HP DeskJet 2720e with print, scan and copy for home office.',
    },
    {
      name: 'Acer Nitro 27',
      sku: 'ACER-NITRO27',
      price: 3599000,
      stock: 17,
      brand: 'Acer',
      category: 'Monitors',
      featured: false,
      isNew: true,
      popular: false,
      short: '165Hz gaming monitor',
      description: 'Acer Nitro 27-inch Full HD gaming monitor with Adaptive-Sync.',
    },
  ];

  const createdProducts = [];
  for (const item of products) {
    const brand = brands.find((b) => b.name === item.brand) ?? brands[0];
    const category =
      categories.find((c) => c.name === item.category) ?? categories[0];
    const slug = item.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const product = await prisma.product.upsert({
      where: { sku: item.sku },
      update: {},
      create: {
        name: item.name,
        slug,
        description: item.description,
        shortDescription: item.short,
        sku: item.sku,
        price: item.price,
        oldPrice: item.oldPrice,
        discountPercent: item.discountPercent ?? 0,
        stock: item.stock,
        lowStockThreshold: 5,
        brandId: brand.id,
        categoryId: category.id,
        isActive: true,
        isFeatured: item.featured,
        isNew: item.isNew,
        isPopular: item.popular,
        images: {
          create: [
            {
              url: `https://placehold.co/800x800?text=${encodeURIComponent(item.name)}`,
              alt: item.name,
              isMain: true,
              sortOrder: 0,
            },
            {
              url: `https://placehold.co/800x800/111/fff?text=${encodeURIComponent(item.brand)}`,
              alt: `${item.name} secondary`,
              isMain: false,
              sortOrder: 1,
            },
          ],
        },
        variants: item.variants
          ? {
              create: item.variants.map((variant) => ({
                sku: variant.sku,
                price: variant.price,
                stock: variant.stock,
                attributes: variant.attributes,
                isActive: true,
              })),
            }
          : undefined,
      },
    });
    createdProducts.push(product);
  }

  const demoPassword = await bcrypt.hash('Customer123!', 12);
  const customer = await prisma.user.upsert({
    where: { email: 'customer@example.com' },
    update: {},
    create: {
      firstName: 'Dilshod',
      lastName: 'Rahimov',
      email: 'customer@example.com',
      phone: '+998901112233',
      password: demoPassword,
      cart: { create: {} },
      wishlist: { create: {} },
    },
  });

  const bannerCount = await prisma.banner.count();
  if (bannerCount === 0) {
    await prisma.banner.createMany({
      data: [
        {
          title: 'New iPhone 15 Pro',
          subtitle: 'Titanium. So strong. So light. So Pro.',
          image: 'https://placehold.co/1400x500?text=iPhone+15+Pro',
          mobileImage: 'https://placehold.co/800x600?text=iPhone+15+Pro',
          buttonText: 'Shop now',
          link: '/products?search=iphone',
          sortOrder: 1,
          isActive: true,
        },
        {
          title: 'Gaming Week',
          subtitle: 'PlayStation 5 Slim and gaming laptops on sale',
          image: 'https://placehold.co/1400x500?text=Gaming+Week',
          buttonText: 'Explore',
          link: '/products?category=gaming',
          sortOrder: 2,
          isActive: true,
        },
      ],
    });
  }

  const sampleProduct = createdProducts[0];
  if (sampleProduct) {
    const order = await prisma.order.upsert({
      where: { orderNumber: 'ORD-SEED-0001' },
      update: {},
      create: {
        orderNumber: 'ORD-SEED-0001',
        userId: customer.id,
        status: 'DELIVERED',
        subtotal: sampleProduct.price,
        deliveryFee: 0,
        total: sampleProduct.price,
        addressSnapshot: {
          title: 'Home',
          city: 'Toshkent',
          street: 'Amir Temur',
          house: '10',
        },
        customerSnapshot: {
          firstName: customer.firstName,
          lastName: customer.lastName,
          email: customer.email,
          phone: customer.phone,
        },
        items: {
          create: {
            productId: sampleProduct.id,
            productName: sampleProduct.name,
            productSku: sampleProduct.sku,
            productImage: `https://placehold.co/800x800?text=${encodeURIComponent(sampleProduct.name)}`,
            price: sampleProduct.price,
            quantity: 1,
            total: sampleProduct.price,
          },
        },
        statusHistory: {
          create: {
            status: 'DELIVERED',
            comment: 'Seeded delivered order',
            changedBy: 'SYSTEM',
          },
        },
      },
    });

    await prisma.review.upsert({
      where: {
        userId_productId_orderId: {
          userId: customer.id,
          productId: sampleProduct.id,
          orderId: order.id,
        },
      },
      update: {},
      create: {
        userId: customer.id,
        productId: sampleProduct.id,
        orderId: order.id,
        rating: 5,
        comment: 'Excellent flagship phone, battery and camera are great.',
        status: ReviewStatus.APPROVED,
      },
    });
  }

  console.log(`Seeded admin ${admin.email} and ${createdProducts.length} products`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
