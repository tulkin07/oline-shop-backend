# ElectroShop — to‘liq sahifalar hujjati

Bu papkada loyihaning **barcha sahifalari** (ro‘yxat + har bir detail) yozilgan.

| Kim uchun | Fayl | Nima bor |
| --- | --- | --- |
| Mijoz sayti | [CUSTOMER.md](./CUSTOMER.md) | Home, katalog, mahsulot detail, savat, checkout, order detail, profil, manzil detail, wishlist, review |
| Admin panel | [ADMIN_PANEL.md](./ADMIN_PANEL.md) | Dashboard, order/mijoz/mahsulot/banner detail, katalog, ombor, sozlamalar, audit |

Baza URL: `https://YOUR-SERVER/api`  
Lokal: `http://localhost:3000/api`  
Swagger (barcha endpointlar): `/api/docs`

To‘lov tizimi yo‘q. Checkout = savat + manzil + `POST /orders` (naqd / kuryerga to‘lov).

## Qanday o‘qiladi

Har bir sahifada: **ekrandagi joy → API → nima uchun**. Detail sahifalarda field-jadval ham bor.

Tokenlar aralashmasin:

- Mijoz: `POST /auth/login` → `Authorization: Bearer …`
- Admin: `POST /admin/auth/login` → `Authorization: Bearer …`

Test:

- Admin: `admin@example.com` / `Admin123!`
- Mijoz: `customer@example.com` / `Customer123!`
