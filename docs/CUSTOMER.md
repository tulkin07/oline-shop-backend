# Mijoz sayti — har bir sahifa va detail

Har bir API uchun: **qaysi sahifa**, **ekrandagi aniq joy**, **nima uchun**.

| # | Sahifa | Route | Asosiy API |
| --- | --- | --- | --- |
| 1 | Ro‘yxatdan o‘tish | `/register` | `POST /auth/register` |
| 2 | Kirish | `/login` | `POST /auth/login` |
| 3 | Bosh sahifa | `/` | `GET /banners` + `GET /products` |
| 4 | Kategoriyalar | `/categories` | `GET /categories` |
| 5 | Kategoriya detail | `/categories/:id` | `GET /categories/:id` |
| 6 | Brendlar | `/brands` | `GET /brands` |
| 7 | Brend detail | `/brands/:id` | `GET /brands/:id` |
| 8 | Katalog / qidiruv | `/products` | `GET /products` |
| 9 | Mahsulot detail | `/products/:id` | `GET /products/:id` |
| 10 | Savat | `/cart` | `GET /cart` |
| 11 | Checkout | `/checkout` | `POST /orders` |
| 12 | Buyurtmalar | `/orders` | `GET /orders` |
| 13 | Buyurtma detail | `/orders/:id` | `GET /orders/:id` |
| 14 | Profil | `/profile` | `GET /auth/me` |
| 15 | Manzillar | `/addresses` | `GET /customers/me/addresses` |
| 16 | Manzil detail | `/addresses/:id` | `GET /customers/me/addresses/:id` |
| 17 | Xaridlar | `/profile/purchased` | `GET /customers/me/purchased-products` |
| 18 | Sevimlilar | `/wishlist` | `GET /wishlist` |
| 19 | Kabinet overview | `/account` | `GET /customers/me` |

Token kerak bo‘lgan joylarda:

```http
Authorization: Bearer ACCESS_TOKEN
```

Token `POST /auth/login` dan olinadi. Admin token ishlamaydi.

Test mijoz: `customer@example.com` / `Customer123!`

---

# 1. REGISTER (Ro‘yxatdan o‘tish)

Sahifa: `/register`  
Ekran: ism, familiya, email, telefon, parol, **Ro‘yxatdan o‘tish** tugmasi.

## `POST /auth/register`

- **Qayeri:** forma submit / tugma
- **Nima uchun:** yangi mijoz yaratish, darhol token berish, savat va wishlist ochish

```json
{
  "firstName": "Ali",
  "lastName": "Karimov",
  "email": "ali@example.com",
  "phone": "+998901234567",
  "password": "Secret123!"
}
```

Javobdan `accessToken`, `refreshToken`, `user` ni saqlang. Keyin Home ga o‘ting.

---

# 2. LOGIN

Sahifa: `/login`  
Ekran: login (email **yoki** telefon), parol, **Kirish**.

## `POST /auth/login`

- **Qayeri:** Kirish tugmasi
- **Nima uchun:** mavjud mijozni tizimga kiritish

```json
{
  "login": "customer@example.com",
  "password": "Customer123!"
}
```

`login` maydoniga telefon ham yoziladi: `+998901112233`.

Admin email ni shu yerga yozmang — bu customer login.

## `POST /auth/refresh`

- **Qayeri:** tugma yo‘q, 401 bo‘lganda orqada
- **Nima uchun:** access tokenni yangilash

```json
{ "refreshToken": "..." }
```

## `POST /auth/logout`

- **Qayeri:** headerdagi **Chiqish**
- **Nima uchun:** tokenni bekor qilish

```json
{ "refreshToken": "..." }
```

---

# 3. HEADER / LAYOUT (barcha sayt sahifalari)

Sahifa ochilganda (token bo‘lsa).

## `GET /auth/me`

- **Qayeri:** o‘ng yuqoridagi ism / avatar
- **Nima uchun:** “Ali Karimov” ni ko‘rsatish

## `GET /cart`

- **Qayeri:** savat ikonkasi ustidagi **raqam** (nechta item)
- **Nima uchun:** `itemsCount` ni badge qilib chiqarish

## `GET /wishlist`

- **Qayeri:** yurak ikonkasi / sevimlilar soni
- **Nima uchun:** wishlist nechtaligini ko‘rsatish

## `GET /settings`

- **Qayeri:** footer: do‘kon nomi, telefon, email, manzil; header logo
- **Nima uchun:** do‘kon ma’lumotini chizish. Token shart emas.

| Ekran | Field |
| --- | --- |
| Logo | `logo` |
| Nom | `storeName` |
| Footer tavsif | `storeDescription` |
| Telefon | `phone` |
| Email | `email` |
| Manzil | `address` |
| Narx belgisi | `currency` (masalan `UZS`) |
| Checkout yetkazish | `deliveryFee`, `freeDeliveryThreshold` |

## `GET /categories`

- **Qayeri:** headerdagi **katalog menyu** (Elektronika → Smartphones…)
- **Nima uchun:** nested kategoriya daraxti. Token shart emas.

---

# 4. HOME (Bosh sahifa)

Sahifa: `/`

Sahifa ochilishi bilan parallel chaqiring.

## `GET /banners`

- **Qayeri:** eng tepadagi **hero slider** (katta rasm, title, tugma)
- **Nima uchun:** faqat aktiv va hozirgi sanadagi bannerlar keladi. `image`, `title`, `subtitle`, `buttonText`, `link`.
- Token shart emas.

## `GET /categories`

- **Qayeri:** “Kategoriyalar” grid (Telefon, Noutbuk, TV…)
- **Nima uchun:** har bir kartani kategoriya sahifasiga olib borish

## `GET /brands`

- **Qayeri:** “Brendlar” qatori (Apple, Samsung logo)
- **Nima uchun:** brend sahifasiga link

## `GET /products?isNew=true&limit=8`

- **Qayeri:** blok **Yangi mahsulotlar**
- **Nima uchun:** `isNew` flagdagi productlar

## `GET /products?featured=true&limit=8`

- **Qayeri:** blok **Tavsiya / Featured**
- **Nima uchun:** asosiy vitrina

## `GET /products?popular=true&limit=8`

- **Qayeri:** blok **Ommabop**
- **Nima uchun:** ko‘p ko‘rilgan/sotiladiganlar

Kartadagi **Savatga** → `POST /cart/items` (login bo‘lsa).  
Kartadagi **Yurak** → `POST /wishlist/:productId`.

---

# 5. KATEGORIYALAR RO‘YXATI

Sahifa: `/categories`

## `GET /categories`

- **Qayeri:** butun sahifa — daraxt yoki kartalar
- **Nima uchun:** barcha bo‘limlarni ko‘rsatish. Ichida `children` bor.

Karta bosilsa → `/categories/:id` yoki `/products?category=smartphones`

---

# 6. KATEGORIYA DETAIL

Sahifa: `/categories/:id` (id yoki slug, masalan `smartphones`)

## `GET /categories/:id`

- **Qayeri:** sahifa sarlavhasi, tavsif, rasm, ichki kategoriyalar
- **Nima uchun:** “Smartphones” haqida ma’lumot, `children` ni chiqarish

## `GET /products?category=smartphones&page=1&limit=20`

- **Qayeri:** shu kategoriyadagi **mahsulotlar grid**
- **Nima uchun:** telefonlar ro‘yxati. Filter/sort shu queryda.

---

# 7. BRENDLAR RO‘YXATI

Sahifa: `/brands`

## `GET /brands`

- **Qayeri:** brend logolari grid
- **Nima uchun:** Apple, Samsung… ni ko‘rsatish

---

# 8. BREND DETAIL

Sahifa: `/brands/:id` (id yoki slug: `apple`)

## `GET /brands/:id`

- **Qayeri:** brend nomi, logo, tavsif
- **Nima uchun:** brend sahifasi headeri

## `GET /products?brand=apple&page=1&limit=20`

- **Qayeri:** shu brendning **mahsulotlari**
- **Nima uchun:** faqat Apple mahsulotlari

---

# 9. MAHSULOTLAR KATALOGI (Shop)

Sahifa: `/products`  
Ekran: chapda filter, o‘ngda grid, tepada search/sort, pastda pagination.

## `GET /products`

- **Qayeri:** **mahsulot kartalari grid** + pagination (`meta`)
- **Nima uchun:** katalogning asosiy ro‘yxati

Query — filtr panelining har bir elementi:

| Filtr UI | Query | Nima uchun |
| --- | --- | --- |
| Qidiruv input | `search=iphone` | nom/sku bo‘yicha |
| Kategoriya checkbox | `category=phones` | id yoki slug |
| Brend checkbox | `brand=apple` | id yoki slug |
| Narx slider | `minPrice` `maxPrice` | narx oralig‘i |
| Faqat borlari | `stock=in` | omborda bor |
| Featured | `featured=true` | vitrina |
| Yangi | `isNew=true` | yangi |
| Ommabop | `popular=true` | mashhur |
| Sort select | `sort=price_asc` | `price_desc`, `newest`, `popular` |
| Pagination | `page` `limit` | 20 tadan |

Karta bosilsa → product detail.

## `GET /categories` va `GET /brands`

- **Qayeri:** chapdagi filter checkboxlari
- **Nima uchun:** filtr variantlarini chizish

---

# 10. MAHSULOT DETAIL (eng muhim sahifa)

Sahifa: `/products/:id` (id yoki slug: `iphone-15-pro`)

Sahifa ochilganda:

## `GET /products/:id`

- **Qayeri:** butun detail
  - chap: rasmlar galereyasi (`images`, `isMain`)
  - o‘ng: nom, narx, `oldPrice`, chegirma, SKU
  - brend/kategoriya link
  - qisqa tavsif / to‘liq tavsif
  - stock: `availableStock` (0 bo‘lsa “Tugagan”, savat disable)
  - variantlar: `variants` (128GB tugma — `attributes`, alohida `price`/`stock`)
  - yulduz: `averageRating`, `reviewsCount`
- **Nima uchun:** bitta mahsulotni sotish sahifasi. Bu GET viewsCount ni oshiradi.

Variant tanlanganda narxni `variant.price` dan ko‘rsating. Savatga shu `variantId` ketadi.

## `GET /products/:id/reviews?page=1`

- **Qayeri:** pastdagi **Sharhler** tab (faqat tasdiqlanganlar)
- **Nima uchun:** mijoz izohlarini chiqarish. Token shart emas.

## `POST /cart/items`

- **Qayeri:** **Savatga qo‘shish** tugmasi
- **Nima uchun:** tanlangan product + variant + sonini savatga yozish. Login shart.

```json
{
  "productId": "UUID",
  "variantId": "UUID-yoki-null",
  "quantity": 1
}
```

Variant majburiy bo‘lsa (128/256 bor) — `variantId` yuborilmasa xato.

## `POST /wishlist/:productId`

- **Qayeri:** yurak **Sevimlilarga**
- **Nima uchun:** keyinroq olish uchun saqlash. Duplicate bo‘lsa xato.

## `DELETE /wishlist/:productId`

- **Qayeri:** yurak allaqachon qizil bo‘lsa (olish)
- **Nima uchun:** sevimlidan chiqarish

## `POST /products/:id/reviews`

- **Qayeri:** “Fikr qoldirish” forma (faqat **yetkazilgan** xarid bo‘lsa ko‘rsatiladi)
- **Nima uchun:** 1–5 yulduz + izoh. `orderId` — shu mahsulot bo‘lgan DELIVERED order.

```json
{
  "rating": 5,
  "comment": "Yaxshi telefon",
  "orderId": "ORDER_UUID"
}
```

Admin tasdiqlamaguncha saytda chiqmaydi (`PENDING`).

Tegishli `orderId` ni `GET /customers/me/purchased-products` (`lastOrderId`) yoki `GET /orders` dan oling.

## `GET /products/:id` — ekran maydonlari

| Ekrandagi joy | Field |
| --- | --- |
| Galereya | `images[]` (`url`, `isMain`, `sortOrder`) |
| Nom | `name` |
| Narx | `price`, `oldPrice`, `discountPercent` |
| SKU | `sku` |
| Brend link | `brand.slug` / `brand.name` |
| Kategoriya link | `category.slug` / `category.name` |
| Qisqa / to‘liq matn | `shortDescription`, `description` |
| Omborda | `availableStock` (`stock - reservedStock`) |
| Variant tugmalari | `variants[]` (`attributes`, `price`, `availableStock`, `sku`) |
| Yulduz | `averageRating`, `reviewsCount` |

`availableStock === 0` bo‘lsa **Savatga** disable.

## `PATCH /reviews/:id`

- **Qayeri:** o‘z reviewsi yonidagi **Tahrirlash** (faqat o‘ziniki)
- **Nima uchun:** yulduz/izohni o‘zgartirish. Qayta `PENDING` bo‘lishi mumkin.

```json
{ "rating": 4, "comment": "Yaxshi, lekin quti ezilgan" }
```

## `DELETE /reviews/:id`

- **Qayeri:** o‘z reviewsi yonidagi **O‘chirish**
- **Nima uchun:** izohni olib tashlash

---

# 11. SAVAT

Sahifa: `/cart`  
Login shart.

## `GET /cart`

- **Qayeri:** butun sahifa — qatorlar, rasm, nom, variant, narx, soni, jami `subtotal`
- **Nima uchun:** savatni chizish

| Ekran | Field |
| --- | --- |
| Qator id (PATCH/DELETE uchun) | `items[].id` |
| Mahsulot | `items[].product` |
| Variant | `items[].variant` |
| Soni | `items[].quantity` |
| Qator jami | `items[].lineTotal` |
| Pastki jami | `subtotal` |
| Badge | `itemsCount` |

## `PATCH /cart/items/:id`

- **Qayeri:** qatordagi **+ / −** yoki quantity input
- **Nima uchun:** sonini o‘zgartirish. Stock yetmasa xato.

```json
{ "quantity": 2 }
```

`:id` — `cartItem.id`, productId emas.

## `DELETE /cart/items/:id`

- **Qayeri:** qatordagi **o‘chirish**
- **Nima uchun:** bitta mahsulotni savatdan olish

## `DELETE /cart`

- **Qayeri:** **Savatni tozalash**
- **Nima uchun:** hammasini o‘chirish

## `GET /settings`

- **Qayeri:** pastki jami yonida “Yetkazish: 25 000 so‘m”
- **Nima uchun:** `deliveryFee`, `freeDeliveryThreshold` ni ko‘rsatish (hali order emas, taxminiy)

**Rasmiylashtirish** tugmasi → `/checkout`

---

# 12. CHECKOUT (buyurtma berish)

Sahifa: `/checkout`  
Login shart. To‘lov formasi yo‘q — faqat manzil + tasdiq.

Sahifa ochilganda:

## `GET /cart`

- **Qayeri:** o‘ngdagi **buyurtma xulosasi** (mahsulotlar, subtotal)
- **Nima uchun:** nima sotib olinayotganini ko‘rsatish. Bo‘sh savat bo‘lsa checkoutga kiritmang.

## `GET /customers/me/addresses`

- **Qayeri:** chapdagi **manzil tanlash** (radio: Uy, Ish)
- **Nima uchun:** qayerga yetkazish. `isDefault` ni oldindan belgilang.

## `GET /settings`

- **Qayeri:** yetkazish narxi / bepul yetkazish chegarasi
- **Nima uchun:** jami = savat subtotal + delivery (threshold dan oshsa 0). Backend baribir qayta hisoblaydi.

## `POST /orders`

- **Qayeri:** **Buyurtma berish** tugmasi
- **Nima uchun:** savatdan order yaratish, stock reserve, savatni tozalash. Narxni frontend yubormaydi.

```json
{
  "addressId": "ADDRESS_UUID",
  "notes": "Qo‘ng‘iroq qiling"
}
```

Muvaffaqiyat → `/orders/:id` (kelgan order).

Yangi manzil kerak bo‘lsa avval address create (pastda).

---

# 13. BUYURTMALAR RO‘YXATI

Sahifa: `/orders`  
Login shart.

## `GET /orders?page=1&limit=10`

- **Qayeri:** “Mening buyurtmalarim” **kartalar/jadval**
- **Nima uchun:** orderNumber, status, total, sana. Filter: `?status=PENDING`

Karta → order detail.

---

# 14. BUYURTMA DETAIL

Sahifa: `/orders/:id`  
Login shart. Faqat o‘z buyurtmasi.

## `GET /orders/:id`

- **Qayeri:** butun sahifa
  - yuqori: raqam, status (PENDING…DELIVERED)
  - mahsulotlar (`items` — snapshot nom/narx/rasm)
  - manzil (`addressSnapshot`)
  - summa: subtotal, deliveryFee, total
  - timeline: `statusHistory`
  - `paymentMethod`: CASH_ON_DELIVERY
- **Nima uchun:** buyurtma holatini kuzatish

| Ekran | Field |
| --- | --- |
| Raqam | `orderNumber` |
| Status chip | `status` |
| Mahsulot qatori | `items[]` (`productName`, `productImage`, `price`, `quantity`, `total`) |
| Manzil | `addressSnapshot` |
| Mijoz snapshot | `customerSnapshot` |
| Subtotal / yetkazish / jami | `subtotal`, `deliveryFee`, `total` |
| Chegirma | `discount` |
| To‘lov | `paymentMethod` = `CASH_ON_DELIVERY`, `paymentStatus` |
| Izoh | `notes` |
| Timeline | `statusHistory[]` (`status`, `comment`, `createdAt`) |

## `POST /orders/:id/cancel`

- **Qayeri:** **Bekor qilish** tugmasi (faqat PENDING / CONFIRMED / PROCESSING da ko‘rsat)
- **Nima uchun:** buyurtmani bekor qilish, stock qaytadi

## `POST /orders/:id/return`

- **Qayeri:** **Qaytarish so‘rash** (faqat SHIPPED / DELIVERED)
- **Nima uchun:** admin ga RETURN_REQUESTED yuborish

Yetkazilgandan keyin mahsulot yonida “Fikr yozish” → product detail review formasi.

---

# 15. PROFIL

Sahifa: `/profile`  
Login shart.

## `GET /auth/me`  yoki  `GET /customers/me`

- **Qayeri:** ism, email, telefon, avatar
- **Nima uchun:** `customers/me` to‘liqroq (statistika ham). Oddiy forma uchun `/auth/me` yetadi.

## `PATCH /auth/profile`

- **Qayeri:** profil formasi **Saqlash**
- **Nima uchun:** ism/email/telefon/avatar yangilash

```json
{
  "firstName": "Ali",
  "lastName": "Karimov",
  "phone": "+998901234567",
  "avatar": "/uploads/avatars/me.jpg"
}
```

## `PATCH /auth/change-password`

- **Qayeri:** “Parolni almashtirish” bloki
- **Nima uchun:** `currentPassword` + `newPassword`

## `POST /uploads/avatar`

- **Qayeri:** avatar rasm input
- **Nima uchun:** rasm yuklash, user.avatar avtomatik yangilanadi (multipart `file`)

---

# 16. MANZILLAR RO‘YXATI

Sahifa: `/profile/addresses` yoki `/addresses`

## `GET /customers/me/addresses`

- **Qayeri:** manzillar **kartalari** (Uy, Ish, default belgi)
- **Nima uchun:** checkoutda tanlanadigan manzillarni boshqarish

## `POST /customers/me/addresses`

- **Qayeri:** **Yangi manzil** forma submit
- **Nima uchun:** yangi yetkazish manzili. Birinchisi avtomatik default.

```json
{
  "title": "Uy",
  "firstName": "Ali",
  "lastName": "Karimov",
  "phone": "+998901234567",
  "region": "Toshkent",
  "city": "Toshkent",
  "district": "Yunusobod",
  "street": "Amir Temur",
  "house": "10",
  "apartment": "5",
  "postalCode": "100000",
  "comment": "Domofon 12",
  "isDefault": true
}
```

## `DELETE /customers/me/addresses/:id`

- **Qayeri:** kartadagi **o‘chirish**
- **Nima uchun:** keraksiz manzilni olish

---

# 17. MANZIL DETAIL / TAHRIRLASH

Sahifa: `/addresses/:id` yoki modal

## `GET /customers/me/addresses/:id`

- **Qayeri:** tahrirlash formasini to‘ldirish
- **Nima uchun:** bitta manzilni ochish

| Input | Field |
| --- | --- |
| Nom (Uy / Ish) | `title` |
| Ism / familiya | `firstName`, `lastName` |
| Telefon | `phone` |
| Viloyat / shahar / tuman | `region`, `city`, `district` |
| Ko‘cha / uy / xonadon | `street`, `house`, `apartment` |
| Pochta | `postalCode` |
| Izoh | `comment` |
| Default | `isDefault` |

## `PATCH /customers/me/addresses/:id`

- **Qayeri:** **Saqlash**
- **Nima uchun:** ko‘chani / default ni o‘zgartirish. `isDefault: true` qolganlarini default qilmaydi (backend o‘zi yechadi).

---

# 18. XARID QILINGAN MAHSULOTLAR

Sahifa: `/profile/purchased` yoki profil tab

## `GET /customers/me/purchased-products`

- **Qayeri:** “Sotib olinganlar” grid
- **Nima uchun:** faqat **DELIVERED** orderlardagi mahsulotlar. Review yozish shu ro‘yxatdan boshlanadi.

Har bir karta: `product` (id, name, slug, image, brand), `quantity`, `lastOrderId`.  
**Fikr yozish** → `/products/:id` + `POST /products/:id/reviews` (`orderId` = `lastOrderId`).

---

# 19. SEVIMLILAR (Wishlist)

Sahifa: `/wishlist`

## `GET /wishlist`

- **Qayeri:** sevimli mahsulotlar grid
- **Nima uchun:** saqlanganlar ro‘yxati

## `DELETE /wishlist/:productId`

- **Qayeri:** kartadagi yurak / o‘chirish
- **Nima uchun:** sevimlidan chiqarish

## `POST /cart/items`

- **Qayeri:** wishlistdagi **Savatga**
- **Nima uchun:** sevimlidan savatga o‘tkazish

---

# 20. TO‘LIQ MIJOZ PROFILI (ixtiyoriy bitta so‘rov)

## `GET /customers/me`

- **Qayeri:** kabinet overview (statistika + oxirgi order + qisqa wishlist)
- **Nima uchun:** `totalOrders`, `totalSpent`, `addresses`, `reviews`, `activities` birga

Agar sahifalar bo‘lak-bo‘lak bo‘lsa, alohida API larni ishlating (yuqoridagilar).

---

# MIJOZ SAYTI XARITASI

| Sahifa | Asosiy API |
| --- | --- |
| Register | `POST /auth/register` |
| Login | `POST /auth/login` |
| Home | `GET /banners` + `GET /products?featured=true` + `GET /categories` |
| Katalog | `GET /products` |
| Kategoriya detail | `GET /categories/:id` + `GET /products?category=` |
| Brend detail | `GET /brands/:id` + `GET /products?brand=` |
| Mahsulot detail | `GET /products/:id` + `GET /products/:id/reviews` |
| Savat | `GET /cart` |
| Checkout | `GET /cart` + `GET /customers/me/addresses` + `POST /orders` |
| Orderlar | `GET /orders` |
| Order detail | `GET /orders/:id` |
| Profil | `GET /auth/me` + `PATCH /auth/profile` |
| Manzillar | `GET/POST/PATCH/DELETE /customers/me/addresses` |
| Wishlist | `GET /wishlist` |
| Xaridlar | `GET /customers/me/purchased-products` |

Javob formati (barcha API):

```json
{ "success": true, "data": {} }
```

Ro‘yxatlarda qo‘shimcha: `meta.page`, `meta.limit`, `meta.total`, `meta.totalPages`.
