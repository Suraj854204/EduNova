# EduNova – EdTech CRM & Inquiry Management System

**A full-stack EdTech CRM platform for managing student inquiries, tracking leads, and streamlining admission operations.**

EduNova provides a public inquiry submission portal and a secure administrator dashboard where education businesses can manage prospective students, monitor inquiry statistics, filter leads, and track admission progress.

**Live Demo:** https://edu-nova-client.vercel.app  
**Admin Dashboard:** https://edu-nova-client.vercel.app/admin/login

-----
**DEMO-LOGIN**
ADMIN_NAME=Super Admin
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=ChangeMe@123

-----
## Key Features

### Public Inquiry Portal
- Responsive inquiry submission form.
- Collect student and parent information.
- Capture course interests and inquiry categories.
- Client-side and server-side validation.
- Secure inquiry storage in PostgreSQL.
- User-friendly success and error notifications.

### Admin Dashboard
- Secure administrator login using custom JWT authentication.
- Protected dashboard routes.
- View and manage student inquiries.
- Dashboard statistics and inquiry summaries.
- Search and filter inquiries.
- Filter by category, user type, and status.
- Pagination for inquiry records.
- Update inquiry status.
- Delete inquiry records.
- Export inquiry data as CSV.
- Automatic logout when authentication expires.

### Security
- Password hashing using bcrypt.
- JWT-based authentication.
- Protected API endpoints.
- Login rate limiting.
- Helmet security headers.
- Parameterized SQL queries.
- PostgreSQL Row Level Security (RLS).
- CSV formula-injection protection.
- Environment-based configuration.

---

## Technology Stack

| Layer | Technology |
|---|---|
| Frontend | React 18 |
| Build Tool | Vite |
| Backend | Node.js |
| API Framework | Express.js |
| Deployment | Vercel Serverless Functions |
| Database | Supabase PostgreSQL |
| Database Client | node-postgres (`pg`) |
| Authentication | JSON Web Token (JWT) |
| Password Hashing | bcrypt |
| Security | Helmet |
| API Communication | REST API |
| Version Control | Git & GitHub |

**Architecture:** Single repository, single Vercel deployment, frontend and backend hosted together.

---

## Project Structure

```text
EduNova/
│
├── api/
│   └── index.js                 # Vercel serverless entry point
│
├── server/
│   ├── app.js                   # Express application
│   ├── db.js                    # PostgreSQL connection
│   │
│   ├── middleware/
│   │   └── auth.js              # JWT authentication middleware
│   │
│   └── routes/
│       ├── auth.js              # Authentication routes
│       └── inquiries.js         # Inquiry management routes
│
├── client/
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── services/
│   │   └── ...
│   ├── index.html
│   └── package.json
│
├── scripts/
│   ├── init-db.js               # Database initialization
│   └── seed-admin.js            # Initial admin creation
│
├── schema.sql                   # PostgreSQL database schema
├── vercel.json                  # Vercel configuration
├── .env.example                 # Environment template
├── package.json
└── README.md
```

---

## Prerequisites

Before running EduNova locally, install:

- Node.js 20 or later.
- npm.
- Git.
- A Supabase account.
- A Supabase PostgreSQL database.

---

## Installation & Local Setup

### 1. Clone the Repository

```bash
git clone https://github.com/Suraj854204/EduNova.git

cd EduNova
```

### 2. Install Dependencies

```bash
npm install

npm --prefix client install
```

### 3. Configure Environment Variables

Create a `.env` file in the project root.

```bash
cp .env.example .env
```

Configure the following variables:

```env
# Database
DATABASE_URL=your_supabase_postgresql_connection_string

# JWT Authentication
JWT_SECRET=your_long_random_secret
JWT_EXPIRES_IN=8h

# Initial Administrator
ADMIN_NAME=Super Admin
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=YourStrongPassword

# Local Development
PORT=5000
CLIENT_ORIGIN=http://localhost:5173
```

**Important:** Use your Supabase PostgreSQL connection string. Prefer the Supabase Session Pooler connection string when using the pooler configuration.

Generate a secure JWT secret:

```bash
openssl rand -hex 32
```

Never commit `.env` to GitHub.

### 4. Initialize the Database

Run:

```bash
npm run db:init
```

Alternatively, open the Supabase SQL Editor and execute the contents of:

```text
schema.sql
```

This creates the required database tables and security policies.

### 5. Create the First Administrator

Run:

```bash
npm run seed:admin
```

The administrator credentials are read from:

- `ADMIN_NAME`
- `ADMIN_EMAIL`
- `ADMIN_PASSWORD`

The password is hashed using bcrypt before being stored in the database.

**Security:** Change the initial administrator password before using the application publicly. Never expose administrator credentials in frontend code or commit them to GitHub.

### 6. Start the Development Server

```bash
npm run dev
```

The development environment runs:

| Service | URL |
|---|---|
| Frontend | http://localhost:5173 |
| Backend API | http://localhost:5000 |
| Admin Login | http://localhost:5173/admin/login |

---

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `DATABASE_URL` | Yes | Supabase PostgreSQL connection string |
| `JWT_SECRET` | Yes | Secret used to sign JWT tokens |
| `JWT_EXPIRES_IN` | No | Token expiration (default: `8h`) |
| `ADMIN_NAME` | For seeding | Initial administrator name |
| `ADMIN_EMAIL` | For seeding | Initial administrator email |
| `ADMIN_PASSWORD` | For seeding | Initial administrator password |
| `PORT` | Local | Express server port |
| `CLIENT_ORIGIN` | Local | Frontend development URL |

---

## API Documentation

Base URL:

```text
/api
```

### Authentication APIs

| Method | Endpoint | Access | Description |
|---|---|---|---|
| POST | `/api/auth/login` | Public | Administrator login |
| GET | `/api/auth/me` | Admin | Validate JWT token |

### Inquiry APIs

| Method | Endpoint | Access | Description |
|---|---|---|---|
| POST | `/api/inquiries` | Public | Submit a new inquiry |
| GET | `/api/inquiries` | Admin | Retrieve inquiries |
| GET | `/api/inquiries/stats` | Admin | Get dashboard statistics |
| GET | `/api/inquiries/export` | Admin | Export inquiries as CSV |
| PATCH | `/api/inquiries/:id/status` | Admin | Update inquiry status |
| DELETE | `/api/inquiries/:id` | Admin | Delete an inquiry |

### Inquiry Filtering

The inquiry listing endpoint supports:

```text
GET /api/inquiries?category=course
GET /api/inquiries?userType=student
GET /api/inquiries?status=pending
GET /api/inquiries?search=suraj
GET /api/inquiries?page=1&limit=10
```

Multiple filters can be combined.

### Authentication Example

Administrator login:

```bash
curl -X POST https://your-app.vercel.app/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@example.com",
    "password": "YourStrongPassword"
  }'
```

Use the returned JWT token for protected endpoints:

```bash
curl https://your-app.vercel.app/api/inquiries \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

Unauthenticated requests to protected endpoints should return:

```json
{
  "message": "Unauthorized"
}
```

The exact response structure depends on the API implementation.

---

## Deployment – Vercel

EduNova is designed for a single-repository deployment.

The React frontend and Express backend are deployed together using Vercel.

### Step 1: Push to GitHub

```bash
git add .
git commit -m "Prepare EduNova for deployment"
git push origin main
```

### Step 2: Import the Project

1. Open https://vercel.com
2. Select **Add New → Project**.
3. Import the EduNova GitHub repository.
4. Keep the project root directory as the repository root (`/`).
5. Verify the build configuration from `vercel.json`.

### Step 3: Configure Environment Variables

Add these variables in:

**Vercel → Project → Settings → Environment Variables**

```env
DATABASE_URL=your_supabase_database_url
JWT_SECRET=your_secure_random_secret
JWT_EXPIRES_IN=8h
```

Do not add the initial admin credentials to Vercel unless your application specifically needs them at runtime. They are intended for the local seeding process.

### Step 4: Deploy

Click **Deploy** and wait for the build to complete.

### Step 5: Initialize Production Database

From your local machine, configure `.env` with the production Supabase database connection string.

Then execute:

```bash
npm run db:init
npm run seed:admin
```

Run these commands only once for initial setup. Avoid rerunning the seeder unless it is designed to safely handle existing administrator records.

### Step 6: Verify Deployment

Open:

```text
https://your-app.vercel.app/api/health
```

Expected response:

```json
{
  "status": "ok",
  "database": "connected"
}
```

This is the expected response if the health endpoint is implemented as described.

---

## Authentication Architecture

EduNova uses custom JWT authentication rather than Supabase Auth.

Authentication flow:

1. Administrator submits email and password.
2. Express retrieves the administrator record from PostgreSQL.
3. bcrypt verifies the password.
4. JWT is generated using the server-side secret.
5. Client uses the token for authenticated API requests.
6. Authentication middleware validates the token.
7. Authorized administrators can access protected resources.

**Note:** JWT signing secrets must remain exclusively on the server. Use secure token storage and HTTPS in production. If cookies are used, configure HttpOnly, Secure, and SameSite attributes appropriately.

---

## Database Architecture

EduNova uses Supabase PostgreSQL as its relational database.

Primary tables:

| Table | Purpose |
|---|---|
| `admins` | Stores administrator accounts and password hashes |
| `inquiries` | Stores student and parent inquiry submissions |

Database security includes Row Level Security policies.

The application connects through the PostgreSQL connection string using the `pg` package. Supabase Auth is not used.

---

## Production Security Considerations

- Use strong, unique administrator passwords.
- Keep `.env` out of version control.
- Use a cryptographically random JWT secret.
- Enforce HTTPS.
- Validate and sanitize incoming request data.
- Use parameterized SQL queries.
- Protect all administrative endpoints with authentication middleware.
- Configure appropriate CORS restrictions.
- Use secure authentication token storage.
- Configure database connection pooling.
- Monitor API errors and database connectivity.
- Consider shared rate limiting using Redis or another centralized store.

**Vercel note:** In-memory rate-limit counters are not shared between serverless instances. Therefore, the login rate limiter provides best-effort protection rather than globally enforced rate limiting.

---

## Testing

### Check API Health

```bash
curl https://your-app.vercel.app/api/health
```

### Test Authentication

```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"YourStrongPassword"}'
```

### Test Protected Route Without Token

```bash
curl -i http://localhost:5000/api/inquiries
```

Expected: `401 Unauthorized`.

### Test Protected Route With Token

```bash
curl http://localhost:5000/api/inquiries \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

Expected: `200 OK` for a valid authenticated request.

---

## Live Application

| Section | Link |
|---|---|
| Public Website | https://edu-nova-client.vercel.app |
| Admin Login | https://edu-nova-client.vercel.app/admin/login |
| GitHub Repository | https://github.com/Suraj854204/EduNova |

---

## Future Enhancements

- Student admission pipeline.
- Lead assignment to admission counselors.
- Email and WhatsApp notifications.
- Follow-up reminders.
- Course and batch management.
- Role-based access control for multiple staff members.
- Advanced analytics and reporting.
- Activity logs and audit trails.
- Centralized rate limiting.

---

## Author

**Suraj Kumar Singh**

B.Tech – Computer Science & Engineering

- GitHub: https://github.com/Suraj854204

---

## License

This project is intended for educational and development purposes. Add an explicit open-source license if you intend to permit public reuse and redistribution.

---

**EduNova – Simplifying Student Inquiries and Admission Management.**
