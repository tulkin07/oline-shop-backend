# Admin panel — har bir sahifa va detail

Frontend yasaganda shu qoidaga qarang:

> Avval sahifani chizing. Keyin **tugma / kartochka / jadval / forma** ni toping. Shu joyning yonida qaysi API yozilgan bo‘lsa — faqat o‘shani chaqirasiz.

Baza: `https://YOUR-SERVER/api`  
Token: `Authorization: Bearer ACCESS_TOKEN`  
Customer login (`POST /auth/login`) **ishlamaydi**. Faqat `POST /admin/auth/login`.

Test: `admin@example.com` / `Admin123!`

Rollar: `SUPER_ADMIN`, `ADMIN`, `MANAGER`. O‘chirish / sozlamalar odatda SUPER_ADMIN yoki ADMIN.

---

# SAHIFALAR XARITASI

| # | Sahifa | Route | Asosiy API |
| --- | --- | --- | --- |
| 1 | Login | `/admin/login` | `POST /admin/auth/login` |
| 2 | Dashboard | `/admin/dashboard` | `GET /admin/dashboard` |
| 3 | Buyurtmalar | `/admin/orders` | `GET /admin/orders` |
| 4 | Buyurtma detail | `/admin/orders/:id` | `GET /admin/orders/:id` |
| 5 | Mijozlar | `/admin/customers` | `GET /admin/customers` |
| 6 | Mijoz detail | `/admin/customers/:id` | `GET /admin/customers/:id` |
| 7 | Kategoriyalar | `/admin/categories` | `GET /admin/categories` |
| 8 | Kategoriya create/edit | `/admin/categories/new` yoki `/:id` | `POST` / `PATCH /admin/categories` |
| 9 | Brendlar | `/admin/brands` | `GET /admin/brands` |
| 10 | Brend create/edit | `/admin/brands/new` yoki `/:id` | `POST` / `PATCH /admin/brands` |
| 11 | Mahsulotlar | `/admin/products` | `GET /admin/products` |
| 12 | Mahsulot yaratish | `/admin/products/new` | `POST /admin/products` |
| 13 | Mahsulot detail / tahrirlash | `/admin/products/:id` | `GET /admin/products/:id` |
| 14 | Bannerlar | `/admin/banners` | `GET /admin/banners` |
| 15 | Banner detail | `/admin/banners/:id` | `GET /admin/banners/:id` |
| 16 | Reviewlar | `/admin/reviews` | `GET /admin/reviews` |
| 17 | Ombor | `/admin/inventory` | `GET /admin/inventory` |
| 18 | Sozlamalar | `/admin/settings` | `GET /admin/settings` |
| 19 | Profil | `/admin/profile` | `GET /admin/profile` |
| 20 | Bildirishnomalar | `/admin/notifications` | `GET /admin/notifications` |
| 21 | Audit log | `/admin/audit-logs` | `GET /admin/audit-logs` |

Alohida `GET /admin/categories/:id` va `GET /admin/brands/:id` yo‘q — ro‘yxatdan tanlab forma to‘ldiriladi. Banner va mahsulotda alohida GET `:id` bor.

---

# LOGIN SAHIFASI

Ekran: email, parol, **Kirish** tugmasi.

## `POST /admin/auth/login`

- **Sahifa:** Login
- **Qayeri:** `Kirish` tugmasi
- **Nima uchun:** adminni tizimga kiritish. Javobdagi `accessToken` ni saqlaysiz, `admin.firstName` ni headerdagi ism uchun olasz.

```json
{ "email": "admin@example.com", "password": "Admin123!" }
```

## `POST /admin/auth/refresh`

- **Sahifa:** hech qaysi sahifada tugma yo‘q
- **Qayeri:** access token 401 qaytarganda, orqada avtomatik
- **Nima uchun:** foydalanuvchini qayta login qildirmasdan yangi token olish

```json
{ "refreshToken": "..." }
```

## `POST /admin/auth/logout`

- **Sahifa:** hamma admin sahifalar
- **Qayeri:** header / sidebar dagi **Chiqish** tugmasi
- **Nima uchun:** refresh tokenni o‘chirish, keyin login sahifaga yo‘naltirish

```json
{ "refreshToken": "..." }
```

---

# HEADER (barcha sahifalarda yuqorida)

## `GET /admin/auth/me`  yoki  `GET /admin/profile`

- **Sahifa:** hamma joy
- **Qayeri:** o‘ng yuqoridagi avatar + ism + role
- **Nima uchun:** “kim kirdi” ni ko‘rsatish. Sahifa yuklanganda 1 marta chaqiriladi.

## `GET /admin/notifications?unreadOnly=true`

- **Sahifa:** hamma joy
- **Qayeri:** qo‘ng‘iroqcha ikonkasi va ustidagi qizil raqam (o‘qilmagan soni)
- **Nima uchun:** yangi buyurtma / stock / review kelganini bildirish

## `GET /admin/notifications`

- **Sahifa:** hamma joy **yoki** Bildirishnomalar sahifasi
- **Qayeri:** qo‘ng‘iroqchani bosib ochiladigan **bildirishnomalar ro‘yxati**
- **Nima uchun:** “Yangi buyurtma ORD-…”, “Low stock” matnlarini chiqarish

## `PATCH /admin/notifications/:id/read`

- **Sahifa:** hamma joy
- **Qayeri:** bildirishnomalar ro‘yxatidagi **bitta qatorni bosganda**
- **Nima uchun:** shu xabarni o‘qilgan qilish, qizil nuqtani yo‘qotish

## `PATCH /admin/notifications/read-all`

- **Sahifa:** hamma joy
- **Qayeri:** dropdown ichidagi **Hammasi o‘qildi** tugmasi
- **Nima uchun:** barcha bildirishnomalarni o‘qilgan qilish

---

# DASHBOARD

Sahifa: `/admin/dashboard`  
Rasm (Dealport) dagi **hamma blok** shu API lardan to‘ladi.

Sahifa ochilishi bilan **bitta** so‘rov yetadi: `GET /admin/dashboard`.  
Filter/toggle o‘zgaganda faqat shu blokning API sini qayta chaqiring.

## `GET /admin/dashboard`

Butun sahifa. Javob tuzilishi rasmga mos:

### Yuqori 3 karta — `kpis` (Last 7 days)

| Ekrandagi joy | Field | Nima uchun |
| --- | --- | --- |
| **Total Sales** katta raqam | `kpis.totalSales.value` | oxirgi 7 kun yetkazilgan buyurtmalar summasi |
| Yashil/qizil % | `kpis.totalSales.changePercent` | oldingi 7 kunga nisbatan |
| “Compared to …” kichik summa | `kpis.totalSales.previousValue` | oldingi period |
| **Total Orders** | `kpis.totalOrders.value` | 7 kundagi barcha orderlar soni |
| Orders % | `kpis.totalOrders.changePercent` | o‘sish/pasayish |
| Oldingi orderlar | `kpis.totalOrders.previousValue` | oldingi 7 kun |
| **Pending** 509 | `kpis.pending.orders` | hozirgi PENDING buyurtmalar |
| Pending **204 User** | `kpis.pending.users` | pendingdagi unikal mijozlar |
| **Canceled** 94 | `kpis.cancelled.value` | 7 kunda bekor qilinganlar |
| Canceled % | `kpis.cancelled.changePercent` | oldingi 7 kunga nisbatan |

### Report for this week — `weeklyReport`

| Ekrandagi joy | Field |
| --- | --- |
| Customers | `weeklyReport.stats.customers` |
| Total Products | `weeklyReport.stats.totalProducts` |
| Stock Products | `weeklyReport.stats.stockProducts` |
| Out of Stock | `weeklyReport.stats.outOfStock` |
| Revenue | `weeklyReport.stats.revenue` |
| Area chart (Sun–Sat) | `weeklyReport.chart.active` — `day`, `value` (`revenue`) |
| This week tugmasi | `weeklyReport.chart.thisWeek` (qayta so‘rovsiz) |
| Last week tugmasi | `weeklyReport.chart.lastWeek` |

Tooltip dagi `14k` = `chart[].value` (kunlik revenue).

### Users in last 30 minutes — `realtimeUsers`

| Ekrandagi joy | Field |
| --- | --- |
| Katta raqam 21.5K | `realtimeUsers.total` |
| Users per minute barlar | `realtimeUsers.perMinute[]` (`time`, `users`) — 30 ta minut |

### Sales by Country — `salesByCountry[]`

Manzildagi `country` / `region` / `city` (yetkazish snapshot). O‘zbekiston do‘konida odatda viloyat (Toshkent…).

| Ekrandagi joy | Field |
| --- | --- |
| Nom + flag o‘rniga kod | `name`, `code` |
| Savdo (30k) | `sales` |
| % o‘sish | `changePercent` |
| Progress bar kengligi | `share` (eng katta qator = 100%) |

### Best Selling Product — `bestSelling[]`

| Ustun | Field |
| --- | --- |
| Rasm + nom | `image`, `name` |
| Total Order | `totalOrders` (sotilgan dona) |
| Status badge | `status`: `"Stock"` yoki `"Stock out"` |
| Price | `price` |
| Details link | `/admin/products/:id` — `id` |

### Top Products — `topProducts[]`

| Ekran | Field |
| --- | --- |
| Rasm | `image` |
| Nom | `name` |
| ID (#FXZ-4567) | `sku` |
| Price | `price` |

---

Filterlar alohida (sahifani to‘liq qayta yuklamasdan):

## `GET /admin/dashboard/kpis?range=7d`

- **Qayeri:** yuqori 3 karta
- **Nima uchun:** periodni o‘zgartirish. Default `7d` (rasmdagi Last 7 days).

## `GET /admin/dashboard/weekly-report?week=this`

- **Qayeri:** **This week / Last week** tugmalari + area chart
- **Nima uchun:** `week=this` yoki `week=last`. `chart.active` shu hafta. Stats shu haftaning revenue sini yangilaydi.

## `GET /admin/dashboard/realtime-users`

- **Qayeri:** o‘ngdagi “Users in last 30 minutes”
- **Nima uchun:** 30–60 soniyada poll qilish (jonli grafik)

## `GET /admin/dashboard/sales-by-country`

- **Qayeri:** Sales by Country ro‘yxati
- **Nima uchun:** faqat shu blokni yangilash

## `GET /admin/dashboard/best-sellers?search=&status=stock&limit=8`

- **Qayeri:** Best Selling jadval + Filter
- **Nima uchun:** qidiruv va Stock / Stock out. `status=out` — tugaganlar.

## `GET /admin/dashboard/top-products?search=`

- **Qayeri:** o‘ng pastdagi Top Products search
- **Nima uchun:** nom/SKU bo‘yicha qidirish. Input yozilganda shu API.

---

Qo‘shimcha analytics (rasmdagi asosiy dashboard uchun shart emas):

## `GET /admin/dashboard/sales?range=30d`

Katta savdo grafigi boshqa range uchun. `range`: `today` | `yesterday` | `7d` | `30d` | `this_week` | `last_week` | `this_month` | `last_month` | `this_year` | `custom`.  
Alias: `GET /admin/analytics/sales?range=30d`

## `GET /admin/dashboard/orders?range=30d`

Status diagramma + so‘nggi 10 buyurtma.

## `GET /admin/dashboard/customers?range=30d`

Mijoz statistikasi / top spender.

## `GET /admin/dashboard/products`

Top selling / most viewed / low stock — alohida analytics sahifa uchun.

---

# BUYURTMALAR RO‘YXATI

Sahifa: `/admin/orders`  
Ekran: qidiruv, status filter, sana, jadval, pagination.

## `GET /admin/orders`

- **Sahifa:** Buyurtmalar ro‘yxati
- **Qayeri:** **jadvalning o‘zi** (har bir qator = 1 order)
- **Nima uchun:** orderNumber, mijoz ismi, total, status, sanani chiqarish

| Jadval ustuni | Field |
| --- | --- |
| Raqam | `orderNumber` |
| Mijoz | `user.firstName` `user.lastName` / `customerSnapshot` |
| Jami | `total` |
| Status | `status` |
| Sana | `createdAt` |
| To‘lov | `paymentMethod`, `paymentStatus` |

Qidiruv input: `?search=` (raqam, email, telefon, ism)  
Status select: `?status=PENDING`  
Sana: `?dateFrom=&dateTo=`  
Sort: `?sortBy=total` yoki `createdAt`, `?order=desc`  
Sahifa: `?page=1&limit=20`

Qatorni bosish → detail sahifaga.

---

# BUYURTMA DETAIL

Sahifa: `/admin/orders/:id`

## `GET /admin/orders/:id`

- **Sahifa:** Buyurtma detail
- **Qayeri:** butun sahifa ma’lumoti shu javobdan
- **Nima uchun:** bitta buyurtmani to‘liq ko‘rish. Ro‘yxatdagi qator yetarli emas.

| Sahifa qismi | Field | Nima uchun |
| --- | --- | --- |
| Sarlavha | `orderNumber` | “ORD-…” |
| Status chip | `status` | hozirgi bosqich |
| To‘lov | `paymentMethod` = `CASH_ON_DELIVERY`, `paymentStatus` | naqd / kuryer |
| Mijoz kartasi | `user` (`firstName`, `lastName`, `email`, `phone`) | kim buyurtma qildi. Click → `/admin/customers/:user.id` |
| Snapshot (o‘zgarmas) | `customerSnapshot` | o‘sha paytdagi ism/tel |
| Yetkazish | `addressSnapshot` | ko‘cha, uy, telefon |
| Mahsulotlar jadvali | `items[]` | `productName`, `productImage`, `sku`, `quantity`, `price`, `total`. Snapshot — product o‘zgarsa ham eski nom qoladi |
| Summa | `subtotal`, `discount`, `deliveryFee`, `total` | chek |
| Izoh (mijoz) | `notes` | checkoutdagi matn |
| Timeline | `statusHistory[]` | `fromStatus`, `toStatus`/`status`, `comment`, `changedBy`, `createdAt` |

## `PATCH /admin/orders/:id/status`

- **Sahifa:** Buyurtma detail
- **Qayeri:** status select yonidagi **Saqlash / Tasdiqlash / Jo‘natildi / Bekor** tugmalari
- **Nima uchun:** buyurtmani keyingi bosqichga o‘tkazish. Omborga “tayyorla”, kuryerga “jo‘nat” shu API.

```json
{ "status": "CONFIRMED", "comment": "Qabul qilindi" }
```

Ruxsat etilgan o‘tishlar (boshqasi 400):

```text
PENDING            → CONFIRMED, CANCELLED
CONFIRMED          → PROCESSING, CANCELLED
PROCESSING         → PACKED, CANCELLED
PACKED             → SHIPPED
SHIPPED            → DELIVERED, RETURN_REQUESTED
DELIVERED          → RETURN_REQUESTED
RETURN_REQUESTED   → RETURNED, DELIVERED (rad etish)
CANCELLED / RETURNED → (yakun, o‘zgarmaydi)
```

Tugmalarni shu jadvalga qarab hide/show qiling. Masalan PACKED da “Bekor” yo‘q.

## `PATCH /admin/orders/:id`

- **Sahifa:** Buyurtma detail
- **Qayeri:** “Ichki izoh” textarea + **Saqlash**
- **Nima uchun:** statusni o‘zgartirmasdan faqat admin izohini yozish

```json
{ "notes": "Mijoz kechki yetkazish so‘radi" }
```

---

# MIJOZLAR RO‘YXATI

Sahifa: `/admin/customers`

## `GET /admin/customers`

- **Sahifa:** Mijozlar ro‘yxati
- **Qayeri:** jadval: ism, email, telefon, buyurtmalar soni, jami xarajat
- **Nima uchun:** kimlar ro‘yxatdan o‘tganini ko‘rish

| Ustun | Field |
| --- | --- |
| Ism | `firstName` `lastName` |
| Email | `email` |
| Telefon | `phone` |
| Avatar | `avatar` |
| Buyurtmalar | `totalOrders` |
| Sarflangan | `totalSpent` (faqat DELIVERED) |
| Holat | `isActive` |

Qidiruv: `?search=`  
Aktiv/blok: `?status=active` yoki `inactive`  
Pagination: `?page=1&limit=20`

Qator click → detail.

## `PATCH /admin/customers/:id/status`

- **Sahifa:** Mijozlar ro‘yxati **yoki** detail
- **Qayeri:** har qatordagi **Bloklash / Yoqish** switch
- **Nima uchun:** yomon mijozni tizimga kiritmaslik. Login qilolmay qoladi. Faqat ADMIN / SUPER_ADMIN.

```json
{ "isActive": false }
```

---

# MIJOZ DETAIL

Sahifa: `/admin/customers/:id`

## `GET /admin/customers/:id`

Bitta so‘rov. Sahifani bo‘laklarga bo‘ling. Boshqa API shart emas.

| Sahifa qismi | Qaysi field | Nima uchun |
| --- | --- | --- |
| Yuqori profil | `firstName`, `lastName`, `email`, `phone`, `avatar`, `isActive`, `createdAt` | kim ekanini ko‘rsatish |
| Stat kartalar | `totalOrders`, `totalSpent`, `averageOrderValue`, `lastOrder` | qanchalik yaxshi mijoz |
| Tab “Buyurtmalar” | `orders` (oxirgi 20) | shu odamning orderlari. Qator → `/admin/orders/:id` |
| Tab “Xarid qilgan mahsulotlar” | `purchasedProducts` | qaysi telefon/noutbukni olgan (faqat yetkazilgan). `lastOrderId` review uchun |
| Tab “Reviewlar” | `reviews` | nima yozgan, qaysi product |
| Tab “Wishlist” | `wishlist.items` | nima saqlagan, hali olmagan |
| Tab “Manzillar” | `addresses` | qayerga yetkaziladi (`title`, `city`, `street`, `isDefault`) |
| Tab “Faoliyat” | `activities` | `REGISTERED`, `LOGIN`, `ORDER_CREATED`, `ORDER_CANCELLED`, `REVIEW_CREATED`, `PROFILE_UPDATED`, `ADDRESS_ADDED` |

Switch **Bloklash** — yuqoridagi `PATCH /admin/customers/:id/status`.

---

# KATEGORIYALAR RO‘YXATI

Sahifa: `/admin/categories`  
Chapda daraxt, o‘ngda forma (yoki alohida create/edit sahifa).

## `GET /admin/categories`

- **Qayeri:** chapdagi **kategoriyalar daraxti / jadvali** (nom, product count, aktiv)
- **Nima uchun:** Smartphones, Laptops… ni ko‘rsatish, qaysi birini tahrirlashni tanlash. Nested `children` keladi.

Alohida GET `:id` yo‘q — tanlangan node ni listdan oling.

---

# KATEGORIYA CREATE / EDIT (detail)

Sahifa: `/admin/categories/new` yoki `/admin/categories/:id`

Forma maydonlari:

| Input | Body field | Nima uchun |
| --- | --- | --- |
| Nom | `name` | “Smartphones” |
| Slug (ixtiyoriy) | `slug` | bo‘sh qolsa backend yasaydi |
| Tavsif | `description` | kategoriya sahifasi matni |
| Rasm | `image` | avval upload, keyin url |
| Ota kategoriya | `parentId` | ichki bo‘lim (Telefon → Smartphones) |
| Aktiv | `isActive` | saytda ko‘rinsin |
| Tartib | `sortOrder` | menyudagi joy |

## `POST /admin/categories`

- **Qayeri:** **Yangi kategoriya** tugmasi / forma submit
- **Nima uchun:** yangi bo‘lim qo‘shish

```json
{
  "name": "Smartphones",
  "description": "Telefonlar",
  "image": "/uploads/categories/phones.png",
  "parentId": null,
  "isActive": true,
  "sortOrder": 1
}
```

Ichki bo‘lsa `parentId` = ota UUID.

## `PATCH /admin/categories/:id`

- **Qayeri:** tanlangan kategoriyaning **Saqlash**
- **Nima uchun:** nom, rasm, tartib, aktivni yangilash. Body — yuqoridagi fieldlar (hammasi ixtiyoriy).

## `DELETE /admin/categories/:id`

- **Qayeri:** qatordagi **O‘chirish**
- **Nima uchun:** keraksiz bo‘limni yashirish. Ichida mahsulot bo‘lsa umuman o‘chmaydi, arxivlanadi.

Rasm: `POST /admin/uploads?folder=categories`

---

# BRENDLAR RO‘YXATI

Sahifa: `/admin/brands`

## `GET /admin/brands`

- **Qayeri:** Apple, Samsung… **kartalar/jadval**
- **Nima uchun:** brendlar ro‘yxatini chiqarish (`name`, `logo`, `isActive`, product count)

Alohida GET `:id` yo‘q — kartadan tanlab forma to‘ldiring.

---

# BREND CREATE / EDIT (detail)

Sahifa: `/admin/brands/new` yoki `/admin/brands/:id`

| Input | Field |
| --- | --- |
| Nom | `name` |
| Slug | `slug` |
| Tavsif | `description` |
| Logo | `logo` |
| Aktiv | `isActive` |

## `POST /admin/brands`

- **Qayeri:** **Brend qo‘shish** forma
- **Nima uchun:** yangi brend

```json
{
  "name": "Apple",
  "description": "Apple Inc.",
  "logo": "/uploads/brands/apple.png",
  "isActive": true
}
```

## `PATCH /admin/brands/:id`

- **Qayeri:** kartadagi **Tahrirlash** → **Saqlash**
- **Nima uchun:** logoni / nomni yangilash

## `DELETE /admin/brands/:id`

- **Qayeri:** **O‘chirish**
- **Nima uchun:** brendni arxivlash

Logo: `POST /admin/uploads?folder=brands`

---

# MAHSULOTLAR RO‘YXATI

Sahifa: `/admin/products`

## `GET /admin/products`

- **Qayeri:** mahsulotlar **jadvali** (rasm, nom, narx, stock, kategoriya, holat)
- **Nima uchun:** katalogni boshqarish

| Ustun | Field |
| --- | --- |
| Rasm | `images` (asosiy) |
| Nom / SKU | `name`, `sku` |
| Narx | `price`, `oldPrice` |
| Omborda | `stock`, `reservedStock`, `availableStock` |
| Kategoriya / brend | `category`, `brand` |
| Flaglar | `isFeatured`, `isNew`, `isPopular` |
| Holat | `isActive` |

Query — filtrlar:

`search`, `category`, `brand`, `minPrice`, `maxPrice`, `stock=in|out`, `featured=true`, `isNew=true`, `popular=true`, `isActive=true|false`, `page`, `limit`

**Yangi mahsulot** tugmasi API emas — `/admin/products/new` ga olib boradi.  
Qator / **Ko‘rish** → mahsulot detail.

## `PATCH /admin/products/:id/status`

- **Qayeri:** jadvaldagi **On/Off** switch
- **Nima uchun:** o‘chirmasdan saytdan yashirish

```json
{ "isActive": false }
```

## `DELETE /admin/products/:id`

- **Qayeri:** qatordagi **O‘chirish**
- **Nima uchun:** arxivlash (buyurtma tarixi saqlanadi). SUPER_ADMIN / ADMIN.

---

# MAHSULOT YARATISH

Sahifa: `/admin/products/new`

Formani ochishdan oldin dropdownlar:

## `GET /admin/categories`

- **Qayeri:** **Kategoriya** select
- **Nima uchun:** mahsulotni qaysi bo‘limga qo‘yish

## `GET /admin/brands`

- **Qayeri:** **Brend** select
- **Nima uchun:** Apple/Samsung tanlash

## `POST /admin/products`

- **Qayeri:** pastdagi **Yaratish / Saqlash**
- **Nima uchun:** yangi telefon/noutbukni bazaga yozish

| Forma bloki | Field | Majburiy |
| --- | --- | --- |
| Nom | `name` | ha |
| Slug | `slug` | yo‘q (avto) |
| To‘liq tavsif | `description` | ha |
| Qisqa tavsif | `shortDescription` | yo‘q |
| SKU | `sku` | ha |
| Barkod | `barcode` | yo‘q |
| Narx | `price` | ha |
| Eski narx | `oldPrice` | yo‘q |
| Chegirma % | `discountPercent` | yo‘q (0–100) |
| Stock | `stock` | yo‘q (default 0) |
| Low stock chegara | `lowStockThreshold` | yo‘q (default 5) |
| Brend | `brandId` UUID | ha |
| Kategoriya | `categoryId` UUID | ha |
| Saytda | `isActive` | yo‘q |
| Featured / Yangi / Ommabop | `isFeatured` `isNew` `isPopular` | yo‘q |
| Rasmlar | `images[]` | yo‘q |
| Variantlar | `variants[]` | yo‘q |

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
    { "url": "/uploads/products/iphone.jpg", "alt": "iPhone 15 Pro", "isMain": true, "sortOrder": 0 }
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

Rasmlarni avval `POST /admin/uploads?folder=products` qiling, `url` ni `images` ga qo‘ying. Yoki mahsulot yaratilgandan keyin alohida image API.

---

# MAHSULOT DETAIL / TAHRIRLASH

Sahifa: `/admin/products/:id` (view + edit bitta sahifa bo‘lishi mumkin)

## `GET /admin/products/:id`

- **Sahifa:** mahsulot detail
- **Qayeri:** butun sahifa / formani **oldindan to‘ldirish**
- **Nima uchun:** mavjud mahsulotni ko‘rish va o‘zgartirish. Create sahifasida chaqirilmaydi.

| Blok | Field |
| --- | --- |
| Asosiy info | `name`, `slug`, `sku`, `barcode`, `description`, `shortDescription` |
| Narx | `price`, `oldPrice`, `discountPercent` |
| Ombor | `stock`, `reservedStock`, `availableStock`, `lowStockThreshold` |
| Bog‘lanish | `brand`, `category`, `brandId`, `categoryId` |
| Flaglar | `isActive`, `isFeatured`, `isNew`, `isPopular` |
| Statistika | `viewsCount`, `averageRating`, `reviewsCount` |
| Galereya | `images[]` (`id`, `url`, `isMain`, `sortOrder`) |
| Variantlar | `variants[]` (`id`, `sku`, `price`, `stock`, `reservedStock`, `availableStock`, `attributes`, `isActive`) |

## `PATCH /admin/products/:id`

- **Qayeri:** **Saqlash** tugmasi
- **Nima uchun:** narx, tavsif, stock, flaglarni yangilash. Body — create bilan bir xil, hammasi ixtiyoriy.

## `PATCH /admin/products/:id/status`

- **Qayeri:** “Saytda ko‘rinsin” toggle
- **Nima uchun:** aktiv/noaktiv

## `DELETE /admin/products/:id`

- **Qayeri:** **O‘chirish**
- **Nima uchun:** arxivlash

---

# MAHSULOT RASMLARI (detail sahifasining rasm bloki)

Ketma-ketlik: faylni serverga yuklash → mahsulotga ulash → asosiy qilish / tartiblash / o‘chirish.

## `POST /admin/uploads?folder=products`

- **Qayeri:** “Rasm yuklash” input / drag-drop
- **Nima uchun:** faylni serverga qo‘yish. Qaytgan `url` ni keyingi API larga berasiz. O‘zi mahsulotga ulanmaydi.

`multipart/form-data`, field nomi: `file`. Max 8MB. jpeg/png/webp/gif/svg.

## `POST /admin/products/:id/images`

- **Qayeri:** rasm yuklangandan keyin **galereyaga qo‘shish**
- **Nima uchun:** shu url ni mahsulotga bog‘lash

```json
{ "url": "/uploads/products/a.jpg", "alt": "Old tomon", "isMain": false, "sortOrder": 1 }
```

## `PATCH /admin/products/:id/images/:imageId/main`

- **Qayeri:** rasm kartasidagi **Asosiy rasm** yulduzcha
- **Nima uchun:** katalogda ko‘rinadigan asosiy suratni tanlash

## `PATCH /admin/products/:id/images/order`

- **Qayeri:** rasmlarni **sudrab tartiblash**
- **Nima uchun:** 1-rasm, 2-rasm ketma-ketligi

```json
{
  "items": [
    { "id": "IMAGE_UUID_1", "sortOrder": 0 },
    { "id": "IMAGE_UUID_2", "sortOrder": 1 }
  ]
}
```

## `DELETE /admin/products/:id/images/:imageId`

- **Qayeri:** rasm kartasidagi **x**
- **Nima uchun:** keraksiz rasmni olib tashlash

---

# MAHSULOT VARIANTLARI (detail: 128GB / 256GB bloki)

## `POST /admin/products/:id/variants`

- **Qayeri:** “Variant qo‘shish” forma
- **Nima uchun:** iPhone 128GB va 256GB ni alohida narx/stock qilish

```json
{
  "sku": "IPH15P-512",
  "price": 17999000,
  "stock": 5,
  "attributes": { "storage": "512GB", "color": "Black" },
  "isActive": true
}
```

`attributes` — erkin obyekt (`storage`, `ram`, `color`…). Front tugmalarni shu kalitlardan chizadi.

## `PATCH /admin/products/:id/variants/:variantId`

- **Qayeri:** variant qatoridagi **tahrirlash**
- **Nima uchun:** 256GB narxini / stockini o‘zgartirish. Body — yuqoridagi bilan bir xil.

## `DELETE /admin/products/:id/variants/:variantId`

- **Qayeri:** variant qatoridagi **o‘chirish**
- **Nima uchun:** shu variant endi sotilmasin (deactivate)

---

# BANNERLAR RO‘YXATI

Sahifa: `/admin/banners`

## `GET /admin/banners`

- **Qayeri:** bannerlar **ro‘yxati** (preview rasm, title, aktiv, sanalar)
- **Nima uchun:** qaysi hero bannerlar borini ko‘rish

## `PATCH /admin/banners/:id/status`

- **Qayeri:** ro‘yxatdagi **On/Off** switch
- **Nima uchun:** slaydni saytda ko‘rsatish yoki yashirish

```json
{ "isActive": false }
```

## `DELETE /admin/banners/:id`

- **Qayeri:** **O‘chirish**
- **Nima uchun:** banner kerak emas

---

# BANNER CREATE / DETAIL

Sahifa: `/admin/banners/new` va `/admin/banners/:id`

## `GET /admin/banners/:id`

- **Qayeri:** tahrirlash formasini ochganda
- **Nima uchun:** title, rasm, link, start/end date ni inputlarga qo‘yish

| Input | Field | Nima uchun |
| --- | --- | --- |
| Sarlavha | `title` | slayddagi katta yozuv |
| Tagline | `subtitle` | kichik matn |
| Desktop rasm | `image` | majburiy |
| Mobil rasm | `mobileImage` | ixtiyoriy |
| Tugma matni | `buttonText` | “Xarid qilish” |
| Link | `link` | masalan `/products/iphone-15-pro` |
| Tartib | `sortOrder` | slayd ketma-ketligi |
| Aktiv | `isActive` | saytda ko‘rinsin |
| Boshlanish | `startDate` | ISO sana |
| Tugash | `endDate` | ISO sana |

Mijoz saytidagi `GET /banners` faqat **aktiv** va hozirgi sana oralig‘idagilarni qaytaradi.

## `POST /admin/banners`

- **Qayeri:** **Banner qo‘shish** forma submit
- **Nima uchun:** yangi slayd

```json
{
  "title": "iPhone 15 Pro",
  "subtitle": "Titanium. A17 Pro.",
  "image": "/uploads/banners/hero.jpg",
  "mobileImage": "/uploads/banners/hero-m.jpg",
  "buttonText": "Xarid qilish",
  "link": "/products/iphone-15-pro",
  "sortOrder": 0,
  "isActive": true,
  "startDate": "2026-01-01T00:00:00.000Z",
  "endDate": "2026-12-31T23:59:59.000Z"
}
```

## `PATCH /admin/banners/:id`

- **Qayeri:** tahrirlashdagi **Saqlash**
- **Nima uchun:** matn/link/sana o‘zgartirish. Body — create fieldlari, ixtiyoriy.

Rasm: avval `POST /admin/uploads?folder=banners`, keyin `image` fieldga url.

---

# REVIEWLAR

Sahifa: `/admin/reviews`  
Alohida review detail GET yo‘q — jadval + tasdiq/rad yetadi. Mijoz/mahsulotga link qiling.

## `GET /admin/reviews?status=PENDING`

- **Qayeri:** “Kutilayotgan reviewlar” **jadvali** (yulduz, izoh, mahsulot, mijoz)
- **Nima uchun:** tasdiqlanmagan fikrlarni moderatsiya qilish

Tablar: `?status=PENDING` | `APPROVED` | `REJECTED`  
Qidiruv / pagination: `search`, `page`, `limit`

| Ustun | Field |
| --- | --- |
| Yulduz | `rating` |
| Izoh | `comment` |
| Mahsulot | `product` |
| Mijoz | `user` |
| Holat | `status` |

## `PATCH /admin/reviews/:id/approve`

- **Qayeri:** qatordagi **yashil Tasdiqlash**
- **Nima uchun:** review saytdagi mahsulot sahifasida chiqsin. Body yo‘q.

## `PATCH /admin/reviews/:id/reject`

- **Qayeri:** **qizil Rad etish**
- **Nima uchun:** haqorat/spam ni saytga chiqarmaslik. Body yo‘q.

## `DELETE /admin/reviews/:id`

- **Qayeri:** **O‘chirish**
- **Nima uchun:** umuman olib tashlash. SUPER_ADMIN / ADMIN.

---

# OMBOR

Sahifa: `/admin/inventory`  
Tablar: hammasi / kam qolgan / tugagan / harakatlar.

## `GET /admin/inventory`

- **Qayeri:** asosiy **stock jadvali**
- **Nima uchun:** omborda nima qolganini ko‘rish. Pagination: `page`, `limit`, `search`

Ustunlar: mahsulot, sku, `stock`, `reservedStock`, `availableStock`, `lowStockThreshold`.

## `GET /admin/inventory/low-stock`

- **Qayeri:** “Ogohlantirish” filtri / sariq blok
- **Nima uchun:** threshold dan kam mahsulotlarni alohida ko‘rsatish

## `GET /admin/inventory/out-of-stock`

- **Qayeri:** “Tugagan” filtri / qizil blok
- **Nima uchun:** `availableStock === 0`

## `GET /admin/inventory/movements`

- **Qayeri:** “Harakatlar tarixi” tab (kim qachon +10 qo‘shdi, sale, damage)
- **Nima uchun:** ombor auditini ko‘rish. Pagination bor.

## `POST /admin/inventory/adjust`

- **Qayeri:** “Stock qo‘shish / ayirish” modal (mahsulot tanla, son, sabab)
- **Nima uchun:** yangi partiya kelganda `RESTOCK`, buzilganini `DAMAGE`

```json
{
  "productId": "PRODUCT_UUID",
  "variantId": null,
  "type": "RESTOCK",
  "quantity": 10,
  "reason": "Yangi partiya keldi"
}
```

`type`: `RESTOCK` | `ADJUSTMENT` | `DAMAGE` | `SALE` | `RETURN`  
Variantli mahsulotda `variantId` yuboring. `quantity` musbat butun son.

Mahsulot select uchun `GET /admin/products?search=` ishlating.

---

# SOZLAMALAR

Sahifa: `/admin/settings`  
Do‘kon nomi, logo, telefon, yetkazib berish narxi.

## `GET /admin/settings`

- **Qayeri:** formani ochganda inputlarni to‘ldirish
- **Nima uchun:** hozirgi sozlamani ko‘rsatish

## `PATCH /admin/settings`

- **Qayeri:** pastdagi **Saqlash**
- **Nima uchun:** checkout dagi yetkazish narxi va sayt footeri shu yerdan keladi. SUPER_ADMIN / ADMIN.

| Input | Field |
| --- | --- |
| Do‘kon nomi | `storeName` |
| Tavsif | `storeDescription` |
| Logo | `logo` |
| Favicon | `favicon` |
| Telefon | `phone` |
| Email | `email` |
| Manzil | `address` |
| Valyuta | `currency` (`UZS`) |
| Yetkazish narxi | `deliveryFee` |
| Bepul yetkazish chegarasi | `freeDeliveryThreshold` |

```json
{
  "storeName": "ElectroShop",
  "storeDescription": "Elektronika do‘koni",
  "logo": "/uploads/settings/logo.png",
  "phone": "+998901234567",
  "email": "shop@example.com",
  "address": "Toshkent, Yunusobod",
  "currency": "UZS",
  "deliveryFee": 25000,
  "freeDeliveryThreshold": 500000
}
```

Logo: `POST /admin/uploads?folder=settings`

---

# PROFIL

Sahifa: `/admin/profile`

## `GET /admin/profile`  yoki  `GET /admin/auth/me`

- **Qayeri:** ism, email, role, avatar (email/role odatda read-only)
- **Nima uchun:** admin o‘z ma’lumotini ko‘rishi

## `PATCH /admin/profile`  yoki  `PATCH /admin/auth/profile`

- **Qayeri:** “Ism, telefon, avatar” formasi **Saqlash**
- **Nima uchun:** o‘z profilini yangilash (role o‘zgarmaydi)

```json
{
  "firstName": "Ali",
  "lastName": "Admin",
  "phone": "+998901234567",
  "avatar": "/uploads/avatars/me.jpg"
}
```

## `PATCH /admin/profile/password`  yoki  `PATCH /admin/auth/change-password`

- **Qayeri:** alohida “Parolni almashtirish” bloki
- **Nima uchun:** parolni almashtirish. Kamida 8 belgi, harf + raqam.

```json
{
  "currentPassword": "Admin123!",
  "newPassword": "YangiParol1"
}
```

Avatar: `POST /admin/uploads?folder=avatars` → url ni profile PATCH ga.

---

# BILDIRISHNOMALAR SAHIFASI

Sahifa: `/admin/notifications`  
Header dropdown yetmasa, to‘liq sahifa qiling. API lar header bilan bir xil.

- Ro‘yxat: `GET /admin/notifications`
- Faqat o‘qilmagan: `GET /admin/notifications?unreadOnly=true`
- Bitta o‘qildi: `PATCH /admin/notifications/:id/read`
- Hammasi: `PATCH /admin/notifications/read-all`

Qator bosilsa `link` / `entityId` bo‘yicha order yoki product detail ga o‘ting.

---

# AUDIT LOG

Sahifa: `/admin/audit-logs`  
Faqat SUPER_ADMIN / ADMIN. Ko‘rish, tugma kam.

## `GET /admin/audit-logs`

- **Qayeri:** log **jadvali** (“Ali mahsulot yaratdi”, “Status CONFIRMED qilindi”)
- **Nima uchun:** xavfsizlik / nazorat

Query: `search`, `dateFrom`, `dateTo`, `page`, `limit`

Ustunlar: sana, admin, `action`, `entity`, `entityId`, IP.

---

# RASM YUKLASH (umumiy)

## `POST /admin/uploads?folder=...`

Bu alohida sahifa emas. **Har bir rasm input** shu API ni chaqiradi.

| Qayerda rasm tanlanadi | folder |
| --- | --- |
| Mahsulot galereyasi | `products` |
| Kategoriya rasmi | `categories` |
| Brend logosi | `brands` |
| Banner | `banners` |
| Do‘kon logosi | `settings` |
| Admin avatar | `avatars` |

`Content-Type: multipart/form-data`, field: `file`. Javobdagi `url` ni tegishli create/update bodyga yozasiz.

---

# QISQA XOTIRA

| Men qaysi joyni bosaman | Qaysi API |
| --- | --- |
| Login → Kirish | `POST /admin/auth/login` |
| Header dagi ism | `GET /admin/profile` |
| Qo‘ng‘iroqcha | `GET /admin/notifications` |
| Dashboard (butun sahifa) | `GET /admin/dashboard` |
| KPI kartalar (7 kun) | `GET /admin/dashboard/kpis` |
| This week / Last week | `GET /admin/dashboard/weekly-report` |
| Users 30 min | `GET /admin/dashboard/realtime-users` |
| Sales by Country | `GET /admin/dashboard/sales-by-country` |
| Best selling jadval | `GET /admin/dashboard/best-sellers` |
| Top Products search | `GET /admin/dashboard/top-products` |
| Orders jadval | `GET /admin/orders` |
| Order ochish | `GET /admin/orders/:id` |
| Statusni o‘zgartirish | `PATCH /admin/orders/:id/status` |
| Customers jadval | `GET /admin/customers` |
| Mijozni ochish | `GET /admin/customers/:id` |
| Kategoriya daraxti | `GET /admin/categories` |
| Kategoriya saqlash | `POST` yoki `PATCH /admin/categories` |
| Brendlar | `GET /admin/brands` |
| Mahsulotlar jadval | `GET /admin/products` |
| Mahsulot ochish | `GET /admin/products/:id` |
| Mahsulot saqlash (yangi) | `POST /admin/products` |
| Mahsulot saqlash (eski) | `PATCH /admin/products/:id` |
| Rasm qo‘shish | `POST /admin/products/:id/images` |
| Variant qo‘shish | `POST /admin/products/:id/variants` |
| Banner ochish | `GET /admin/banners/:id` |
| Banner On/Off | `PATCH /admin/banners/:id/status` |
| Review tasdiq | `PATCH /admin/reviews/:id/approve` |
| Stock +10 | `POST /admin/inventory/adjust` |
| Sozlamalar saqlash | `PATCH /admin/settings` |
