# EduNova - EdTech CRM & Inquiry System

Public inquiry form + secure admin dashboard. One repo, one deploy on Vercel.

- **Frontend:** React 18 + Vite (`client/`)
- **Backend:** Node.js + Express (`server/`), served on Vercel as a serverless function (`api/index.js`)
- **Database:** Supabase PostgreSQL via connection string (`pg`)
- **Auth:** custom JWT (bcrypt + jsonwebtoken + protected-route middleware). Supabase Auth is **not** used.

## Structure

```
.
├── api/index.js        # Vercel serverless entry (wraps the Express app)
├── server/             # Express app: routes, JWT middleware, db
│   ├── app.js          # app (no listen)    index.js -> local server
│   ├── db.js
│   ├── middleware/auth.js
│   └── routes/         # auth.js, inquiries.js
├── client/             # React app (Vite)
├── scripts/            # init-db.js, seed-admin.js
├── schema.sql          # tables: admins, inquiries
├── vercel.json
└── .env.example
```

## Local setup

```bash
cp .env.example .env          # fill DATABASE_URL, JWT_SECRET, ADMIN_*
npm install
npm --prefix client install
npm run db:init               # creates tables from schema.sql  (or paste schema.sql in Supabase SQL Editor)
npm run seed:admin            # creates admin from ADMIN_EMAIL / ADMIN_PASSWORD
npm run dev                   # API :5000 + web :5173 together
```

- Public form: http://localhost:5173/
- Admin login: http://localhost:5173/admin/login

## Environment variables

| Variable | Description |
|---|---|
| `DATABASE_URL` | Supabase PostgreSQL connection string (use the pooler URI) |
| `JWT_SECRET` | Random secret, 32+ chars (`openssl rand -hex 32`) |
| `JWT_EXPIRES_IN` | Token lifetime, default `8h` |
| `ADMIN_NAME` / `ADMIN_EMAIL` / `ADMIN_PASSWORD` | Used only by `npm run seed:admin` |
| `PORT`, `CLIENT_ORIGIN` | Local dev only |

## Deploy on Vercel (one time, frontend + backend together)

1. Push this repo to GitHub.
2. Vercel -> **Add New -> Project** -> import the repo. Leave the root directory as `/`. `vercel.json` already sets the build command and output folder.
3. Add environment variables: `DATABASE_URL`, `JWT_SECRET`, `JWT_EXPIRES_IN` (and nothing else is required).
4. Deploy.
5. Create tables and the admin **once**, from your own machine, using the same `DATABASE_URL`:
   ```bash
   npm run db:init
   npm run seed:admin
   ```
6. Open `https://<your-app>.vercel.app/api/health`. It should return `{"status":"ok","database":"connected"}`.

The frontend calls the relative path `/api`, so no CORS or API URL setup is needed in production.

## Testing the custom JWT auth

```bash
# 1. login -> token
curl -X POST https://<your-app>.vercel.app/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"ChangeMe@123"}'

# 2. protected route without token -> 401
curl -i https://<your-app>.vercel.app/api/inquiries

# 3. protected route with token -> 200
curl https://<your-app>.vercel.app/api/inquiries -H "Authorization: Bearer <TOKEN>"
```

In the browser, opening `/admin` while signed out redirects to `/admin/login`.

## API

| Method | Endpoint | Auth | Purpose |
|---|---|---|---|
| POST | `/api/inquiries` | public | Submit inquiry |
| POST | `/api/auth/login` | public | Get JWT |
| GET | `/api/auth/me` | admin | Validate token |
| GET | `/api/inquiries` | admin | List; `category`, `userType`, `status`, `search`, `page`, `limit` |
| GET | `/api/inquiries/stats` | admin | Dashboard counts |
| GET | `/api/inquiries/export` | admin | CSV export |
| PATCH | `/api/inquiries/:id/status` | admin | Update status |
| DELETE | `/api/inquiries/:id` | admin | Delete |

## Security notes

bcrypt (cost 12) password hashes, HS256 JWT with expiry, login rate limit, parameterised SQL, Helmet, RLS enabled on both tables (Supabase public keys cannot read them), CSV formula-injection guard.
Rate-limit counters live in each serverless instance's memory, so they are best-effort on Vercel.

## Live demo

`https://<your-app>.vercel.app`
