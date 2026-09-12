# Products page — o‘quvchilar uchun

Faqat **Mahsulotlar (Products)** sahifasi. Create / Update / Delete qaysi endpoint bilan qilinadi.

**Base URL:** `http://localhost:3000/api` (yoki deploy URL + `/api`)  
**Swagger:** `/api/docs`

**Auth (majburiy):** admin token

```http
Authorization: Bearer ADMIN_ACCESS_TOKEN
```

Token: `POST /admin/auth/login`

```json
{
  "email": "admin@example.com",
  "password": "Admin123!"
}
```

Rollar:

| Amal | Kim qila oladi |
| --- | --- |
| List / Detail / Create / Update / Status / Images / Variants | `SUPER_ADMIN`, `ADMIN`, `MANAGER` |
| Delete (`DELETE`) | faqat `SUPER_ADMIN`, `ADMIN` |

---

## Tezkor jadval (Products page)

| Amal | Method | Endpoint | Frontend sahifa / tugma |
| --- | --- | --- | --- |
| Ro‘yxat | `GET` | `/admin/products` | `/admin/products` — jadval |
| Bitta mahsulot | `GET` | `/admin/products/:id` | `/admin/products/:id` — formani to‘ldirish |
| Yaratish | `POST` | `/admin/products` | `/admin/products/new` — **Saqlash** |
| Yangilash | `PATCH` | `/admin/products/:id` | detail — **Saqlash** |
| Aktiv / noaktiv | `PATCH` | `/admin/products/:id/status` | On/Off switch |
| O‘chirish | `DELETE` | `/admin/products/:id` | **O‘chirish** tugmasi |

Qo‘shimcha (shu sahifa ichida):

| Amal | Method | Endpoint |
| --- | --- | --- |
| Rasm fayl yuklash | `POST` | `/admin/uploads?folder=products` |
| Rasmni mahsulotga ulash | `POST` | `/admin/products/:id/images` |
| Asosiy rasm | `PATCH` | `/admin/products/:id/images/:imageId/main` |
| Rasmlar tartibi | `PATCH` | `/admin/products/:id/images/order` |
| Rasm o‘chirish | `DELETE` | `/admin/products/:id/images/:imageId` |
| Variant qo‘shish | `POST` | `/admin/products/:id/variants` |
| Variant yangilash | `PATCH` | `/admin/products/:id/variants/:variantId` |
| Variant o‘chirish | `DELETE` | `/admin/products/:id/variants/:variantId` |

Formadagi selectlar:

| Select | Endpoint |
| --- | --- |
| Kategoriya | `GET /admin/categories` |
| Brend | `GET /admin/brands` |

---

# 1. Ro‘yxat — `GET /admin/products`

**Sahifa:** `/admin/products`  
**Qachon:** sahifa ochilganda, filter/search/pagination o‘zgaganda.

### Query params

| Param | Misol | Nima qiladi |
| --- | --- | --- |
| `search` | `iphone` | nom / SKU qidiruv |
| `category` | `smartphones` | kategoriya id yoki slug |
| `brand` | `apple` | brend id yoki slug |
| `minPrice` | `1000000` | minimal narx |
| `maxPrice` | `20000000` | maksimal narx |
| `stock` | `in` yoki `out` | omborda bor / yo‘q |
| `featured` | `true` | featured |
| `isNew` | `true` | yangi |
| `popular` | `true` | ommabop |
| `isActive` | `true` / `false` | saytda ko‘rinadi |
| `page` | `1` | sahifa |
| `limit` | `20` | nechta qator |

### Misol

```http
GET /api/admin/products?search=iphone&page=1&limit=20&isActive=true
Authorization: Bearer ...
```

### Jadval fieldlari

| Ustun | Field |
| --- | --- |
| Rasm | `images` (asosiy) |
| Nom / SKU | `name`, `sku` |
| Narx | `price`, `oldPrice` |
| Ombor | `stock`, `reservedStock`, `availableStock` |
| Kategoriya / brend | `category`, `brand` |
| Flaglar | `isFeatured`, `isNew`, `isPopular` |
| Holat | `isActive` |

**Yangi mahsulot** tugmasi API emas → `/admin/products/new` route.

---

# 2. Create — `POST /admin/products`

**Sahifa:** `/admin/products/new`  
**Qachon:** forma **Yaratish / Saqlash** bosilganda.

### Majburiy fieldlar

| Field | Type | Izoh |
| --- | --- | --- |
| `name` | string | mahsulot nomi |
| `description` | string | to‘liq tavsif |
| `sku` | string | unique kod |
| `price` | number | narx (≥ 0) |
| `brandId` | UUID | brend |
| `categoryId` | UUID | kategoriya |

### Ixtiyoriy fieldlar

| Field | Type | Default / izoh |
| --- | --- | --- |
| `slug` | string | berilmasa `name` dan avto |
| `shortDescription` | string | qisqa matn |
| `barcode` | string | barkod |
| `oldPrice` | number | eski narx |
| `discountPercent` | int 0–100 | chegirma |
| `stock` | int | default `0` |
| `lowStockThreshold` | int | default `5` |
| `isActive` | boolean | default `true` |
| `isFeatured` | boolean | default `false` |
| `isNew` | boolean | default `true` |
| `isPopular` | boolean | default `false` |
| `images[]` | array | rasm URL lar |
| `variants[]` | array | variantlar |

### Request body misol

```json
{
  "name": "iPhone 15 Pro",
  "description": "Titanium, A17 Pro",
  "shortDescription": "Flagman telefon",
  "sku": "IPH15P-256",
  "barcode": "123456789",
  "price": 14999000,
  "oldPrice": 16999000,
  "discountPercent": 12,
  "stock": 20,
  "lowStockThreshold": 5,
  "brandId": "BRAND_UUID",
  "categoryId": "CATEGORY_UUID",
  "isActive": true,
  "isFeatured": true,
  "isNew": true,
  "isPopular": false,
  "images": [
    {
      "url": "/uploads/products/iphone.jpg",
      "alt": "iPhone 15 Pro",
      "isMain": true,
      "sortOrder": 0
    }
  ],
  "variants": [
    {
      "sku": "IPH15P-256",
      "price": 14999000,
      "stock": 10,
      "attributes": { "storage": "256GB" },
      "isActive": true
    }
  ]
}
```

### Rasm yuklash tartibi (create oldidan yoki keyin)

1. Fayl yuklash:

```http
POST /api/admin/uploads?folder=products
Content-Type: multipart/form-data
Authorization: Bearer ...

file=<image>
```

2. Qaytgan `url` ni `images[].url` ga qo‘ying **yoki** create dan keyin:

```http
POST /api/admin/products/:id/images
```

```json
{
  "url": "/uploads/products/a.jpg",
  "alt": "Old tomon",
  "isMain": false,
  "sortOrder": 1
}
```

Upload: max **8MB**, formatlar: jpeg / png / webp / gif / svg.

---

# 3. Detail (formani to‘ldirish) — `GET /admin/products/:id`

**Sahifa:** `/admin/products/:id`  
**Qachon:** tahrirlash sahifasi ochilganda (create sahifasida **chaqirilmaydi**).

```http
GET /api/admin/products/PRODUCT_UUID
Authorization: Bearer ...
```

| Blok | Field |
| --- | --- |
| Asosiy | `name`, `slug`, `sku`, `barcode`, `description`, `shortDescription` |
| Narx | `price`, `oldPrice`, `discountPercent` |
| Ombor | `stock`, `reservedStock`, `availableStock`, `lowStockThreshold` |
| Bog‘lanish | `brandId`, `categoryId`, `brand`, `category` |
| Flaglar | `isActive`, `isFeatured`, `isNew`, `isPopular` |
| Stats | `viewsCount`, `averageRating`, `reviewsCount` |
| Galereya | `images[]` (`id`, `url`, `isMain`, `sortOrder`) |
| Variantlar | `variants[]` (`id`, `sku`, `price`, `stock`, `attributes`, `isActive`) |

---

# 4. Update — `PATCH /admin/products/:id`

**Sahifa:** `/admin/products/:id`  
**Qachon:** **Saqlash** tugmasi.

Body — create bilan bir xil, lekin **hamma field ixtiyoriy** (`PartialType`). Faqat o‘zgarganlarini yuboring.

```http
PATCH /api/admin/products/PRODUCT_UUID
Authorization: Bearer ...
Content-Type: application/json
```

```json
{
  "price": 13999000,
  "stock": 15,
  "isFeatured": true,
  "shortDescription": "Yangilangan tavsif"
}
```

### Faqat status (On/Off)

```http
PATCH /api/admin/products/PRODUCT_UUID/status
```

```json
{ "isActive": false }
```

`isActive: false` → o‘chirilmaydi, faqat saytdan yashiriladi.

---

# 5. Delete — `DELETE /admin/products/:id`

**Sahifa:** `/admin/products` yoki detail  
**Qachon:** **O‘chirish** tugmasi.

```http
DELETE /api/admin/products/PRODUCT_UUID
Authorization: Bearer ...
```

- Soft-delete (arxiv): buyurtma tarixi saqlanadi.
- Faqat `SUPER_ADMIN` / `ADMIN` (MANAGER o‘chira olmaydi).

---

# 6. Rasmlar (detail sahifa)

| Tugma / UI | Endpoint |
| --- | --- |
| Fayl tanlash | `POST /admin/uploads?folder=products` |
| Galereyaga qo‘shish | `POST /admin/products/:id/images` |
| Asosiy rasm ⭐ | `PATCH /admin/products/:id/images/:imageId/main` |
| Drag & drop tartib | `PATCH /admin/products/:id/images/order` |
| Rasmni o‘chirish ✕ | `DELETE /admin/products/:id/images/:imageId` |

Tartib body:

```json
{
  "items": [
    { "id": "IMAGE_UUID_1", "sortOrder": 0 },
    { "id": "IMAGE_UUID_2", "sortOrder": 1 }
  ]
}
```

---

# 7. Variantlar (128GB / 256GB)

### Qo‘shish — `POST /admin/products/:id/variants`

```json
{
  "sku": "IPH15P-512",
  "price": 17999000,
  "stock": 5,
  "attributes": { "storage": "512GB", "color": "Black" },
  "isActive": true
}
```

### Yangilash — `PATCH /admin/products/:id/variants/:variantId`

Body create variant bilan bir xil (yoki qisman).

### O‘chirish — `DELETE /admin/products/:id/variants/:variantId`

Variant deactivate qilinadi (sotuvdan olinadi).

---

# Frontend oqimi (qisqa)

### Create

1. `GET /admin/categories` + `GET /admin/brands` — selectlar
2. (ixtiyoriy) `POST /admin/uploads?folder=products` — rasm
3. `POST /admin/products` — yaratish
4. Success → `/admin/products/:id` yoki ro‘yxatga qaytish

### Update

1. `GET /admin/products/:id` — formani to‘ldirish
2. `PATCH /admin/products/:id` — saqlash
3. Status uchun alohida: `PATCH /admin/products/:id/status`

### Delete

1. Confirm modal
2. `DELETE /admin/products/:id`
3. Ro‘yxatni qayta yuklash: `GET /admin/products`

---

# Eslatmalar

1. Customer katalog (`GET /products`) **boshqa** API — faqat o‘qish, create/update/delete yo‘q.
2. Admin CRUD faqat `/admin/products...` orqali.
3. Delete hard delete emas — soft delete.
4. Token customer token emas, **admin** token bo‘lishi shart.
5. To‘liq panel hujjati: [ADMIN_PANEL.md](./ADMIN_PANEL.md)

---

# Checklist (dars / topshiriq)

- [ ] Login → admin token olish
- [ ] `GET /admin/products` bilan jadval chiqarish
- [ ] `POST /admin/products` bilan yangi mahsulot yaratish
- [ ] `GET /admin/products/:id` bilan detail ochish
- [ ] `PATCH /admin/products/:id` bilan narx/stock yangilash
- [ ] `PATCH /admin/products/:id/status` bilan On/Off
- [ ] `DELETE /admin/products/:id` bilan o‘chirish
- [ ] (bonus) rasm upload + variant CRUD
