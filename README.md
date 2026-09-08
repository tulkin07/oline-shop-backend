# ElectroShop Backend

Production-ready NestJS REST API for an online electronics store.

The backend covers customer shopping (catalog, cart, checkout, orders, reviews, wishlist) and a full admin API (dashboard, catalog, inventory, orders, customers, banners, settings). Checkout is **cash on delivery only**. There is no payment gateway.

## Tech stack

- NestJS + TypeScript
- PostgreSQL + Prisma ORM
- JWT access / refresh tokens
- class-validator + Swagger/OpenAPI
- bcrypt password hashing
- Helmet, CORS, rate limiting
- Docker Compose

## Installation

```bash
npm install
```

## Environment variables

Copy `.env.example` to `.env` and fill in your values:

```bash
cp .env.example .env
```

| Variable | Description |
| --- | --- |
| `DATABASE_URL` | Neon pooled connection (`-pooler`, `sslmode=require`) |
| `DIRECT_URL` | Neon direct connection (no pooler; Prisma migrate) |
| `JWT_SECRET` | Access token secret |
| `JWT_REFRESH_SECRET` | Refresh token secret |
| `JWT_EXPIRES_IN` | Access token TTL (example: `15m`) |
| `JWT_REFRESH_EXPIRES_IN` | Refresh token TTL (example: `7d`) |
| `PORT` | HTTP port (`3000`) |
| `CORS_ORIGIN` | Allowed origin (`*` for local development) |
| `UPLOAD_DIR` | Local upload directory (`./uploads`) |

Do not commit real secrets. `.env` is gitignored.

## Database setup (Neon)

1. Open [Neon Console](https://console.neon.tech), create a project, then **Connect**.
2. Put the **pooled** string into `DATABASE_URL` (host contains `-pooler`).
3. Put the **direct** string into `DIRECT_URL` (host without `-pooler`).
4. If you only have one URL, paste it into both. The string from Neon already includes `sslmode=require`.

```env
DATABASE_URL="postgresql://USER:PASSWORD@ep-xxx-pooler.region.aws.neon.tech/neondb?sslmode=require"
DIRECT_URL="postgresql://USER:PASSWORD@ep-xxx.region.aws.neon.tech/neondb?sslmode=require"
```

```bash
npx prisma generate
npx prisma migrate deploy
npx prisma db seed
```

Seeded accounts:

- Admin: `admin@example.com` / `Admin123!` (`SUPER_ADMIN`)
- Demo customer: `customer@example.com` / `Customer123!`

## Development

```bash
npm run start:dev
```

API base URL: `http://localhost:3000/api`

## Production

```bash
npm run build
npm run start:prod
```

`start:prod` runs `prisma migrate deploy`, then starts the API.

## Deploy on Render

Render GitHub’dan deploy qiladi. Avval loyihani GitHub’ga qo‘ying (`.env` ni commit qilmang).

1. [GitHub](https://github.com/new) da yangi repo oching va kodni push qiling.
2. [Render Dashboard](https://dashboard.render.com) → **New** → **Web Service** → shu repo.
3. Sozlamalar:

| Field | Value |
| --- | --- |
| Runtime | Node |
| Build Command | `npm ci && npm run build` |
| Start Command | `npm run start:prod` |
| Health Check Path | `/api/health` |

4. **Environment** ga Neon URL va JWT secretlarni qo‘ying:

```env
NODE_ENV=production
DATABASE_URL=  # Neon pooled (-pooler)
DIRECT_URL=    # Neon direct (no -pooler)
JWT_SECRET=
JWT_REFRESH_SECRET=
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d
CORS_ORIGIN=*
UPLOAD_DIR=./uploads
```

`PORT` ni yozmang — Render o‘zi beradi.

5. **Create Web Service**. Birinchi deploy’da migrate avtomatik ishlaydi.

Tayyor URL:

- API: `https://YOUR-SERVICE.onrender.com/api`
- Swagger: `https://YOUR-SERVICE.onrender.com/api/docs`
- Health: `https://YOUR-SERVICE.onrender.com/api/health`

Free planda birinchi so‘rov sekin bo‘lishi mumkin (cold start). Uploads Render diskida saqlanadi va redeploy’da yo‘qoladi; keyinroq S3/Cloudinary ulash mumkin.

## Swagger

Interactive docs (Bearer auth enabled):

[http://localhost:3000/api/docs](http://localhost:3000/api/docs)

Sahifa-sahifa hujjatlar (o‘quvchilar uchun):

- [Barcha sahifalar indeksi](docs/README.md)
- [Mijoz sayti — har sahifa va detail](docs/CUSTOMER.md)
- [Admin panel — har sahifa va detail](docs/ADMIN_PANEL.md)

## Docker

PostgreSQL + API:

```bash
docker compose up --build
```

The app container runs `prisma migrate deploy` on start. You still need a valid `DATABASE_URL` in `.env` (for Compose it should point at the `postgres` service, for example `postgresql://USER:PASSWORD@postgres:5432/DB`).

Postgres only:

```bash
docker compose up postgres
```

## Authentication

Customer:

```http
POST /api/auth/register
POST /api/auth/login
POST /api/auth/refresh
```

Admin:

```http
POST /api/admin/auth/login
```

Send the access token as:

```http
Authorization: Bearer <accessToken>
```

Roles: `SUPER_ADMIN`, `ADMIN`, `MANAGER`.

Passwords, password hashes and refresh tokens are never returned in API responses.

## API structure

Public:

- `GET /api/products`
- `GET /api/categories`
- `GET /api/brands`
- `GET /api/banners`
- `GET /api/products/:id/reviews`
- `GET /api/settings`

Customer (JWT):

- `/api/auth`
- `/api/cart`
- `/api/orders`
- `/api/customers/me`
- `/api/wishlist`

Admin (admin JWT):

- `/api/admin/auth`
- `/api/admin/dashboard`
- `/api/admin/products`
- `/api/admin/categories`
- `/api/admin/brands`
- `/api/admin/orders`
- `/api/admin/customers`
- `/api/admin/reviews`
- `/api/admin/banners`
- `/api/admin/inventory`
- `/api/admin/notifications`
- `/api/admin/audit-logs`
- `/api/admin/settings`
- `/api/admin/profile`

Orders are cash on delivery. The backend calculates prices from the database, reserves stock, snapshots product data on the order, and records status history.

## Response format

Success:

```json
{
  "success": true,
  "data": {}
}
```

Paginated lists also include `meta.page`, `meta.limit`, `meta.total`, `meta.totalPages`.

Error:

```json
{
  "success": false,
  "message": "Product not found",
  "error": "NOT_FOUND"
}
```
