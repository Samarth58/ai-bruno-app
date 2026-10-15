# Bruno — AI Gym Buddy

Intelligent fitness and gym companion backend built with **Fastify v5**, **TypeScript**, **PostgreSQL**, and **Drizzle ORM**. Engineered for high-throughput performance, strict security, and modular domain extensibility.

---

## Features

- **High-Performance Fastify Server**: Built with Node.js ES Modules and Fastify v5 with fast JSON serialization and routing.
- **Robust Authentication & Session Management**: Dual-token authentication (15m Access JWTs, 30d Refresh JWTs), Argon2id password hashing, PostgreSQL-backed session rotation, and automated replay detection.
- **Role-Based Access Control (RBAC)**: Enforced authorization guards (`authGuard`, `adminGuard`) with tenant isolation and IDOR protection.
- **Interactive OpenAPI Documentation**: Built-in Swagger UI and OpenAPI 3.0.3 schema explorer mounted live at `/docs`.
- **Database & Migrations**: PostgreSQL with connection pooling (`pg`) and type-safe schema modeling via Drizzle ORM.
- **Security & Reliability**: `@fastify/helmet` HTTP security headers, `@fastify/rate-limit` rate-limiting, CORS configuration for mobile and web, and graceful shutdown handling.
- **Comprehensive Testing**: Vitest integration test suite with schema-level database isolation safety guards.

---

## Documentation

- **[ARCHITECTURE.md](ARCHITECTURE.md)**: Deep dive into system design, request lifecycles, and sequence diagrams.
- **[AGENTS.md](AGENTS.md)**: Operational rules, code conventions, module generation guides, and test isolation principles for AI coding agents and developers.
- **Interactive API Docs**: Available at `http://localhost:3000/docs` when the server is running.

---

## Quick Start

### Prerequisites
- **Node.js**: `v20.x` or `v22.x`
- **npm**: `v10.x` or later
- **PostgreSQL**: `v14+` running instance (local, Docker, or managed cloud)

### Setup & Run

1. **Clone the repository:**
   ```bash
   git clone https://github.com/Spryntworks/Bruno-AI-Gym-Buddy.git
   cd "Bruno — AI Gym Buddy"
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure environment:**
   ```bash
   cp .env.example .env
   ```
   Set your `DATABASE_URL` and `JWT_SECRET` in `.env`.

4. **Run database migrations:**
   ```bash
   npm run db:generate
   npm run db:migrate
   ```

5. **Start development server:**
   ```bash
   npm run dev
   ```

6. **Verify health & documentation:**
   - Health check: `http://localhost:3000/health`
   - Swagger documentation: `http://localhost:3000/docs`

---

## Environment Configuration

Configuration variables are parsed and validated on boot using Zod (`src/config/env.ts`):

| Variable | Required | Default | Description |
| :--- | :--- | :--- | :--- |
| `DATABASE_URL` | **Yes** | — | PostgreSQL connection string |
| `JWT_SECRET` | **Yes** | — | Secret key for signing and verifying JWTs |
| `PORT` | No | `3000` | HTTP port for Fastify server |
| `NODE_ENV` | No | `development` | Runtime environment (`development`, `test`, `production`) |
| `RATE_LIMIT_MAX` | No | `100` | Global maximum requests per IP per window |
| `RATE_LIMIT_WINDOW_MS` | No | `60000` | Rate limiting window in milliseconds (1 min) |
| `CORS_ENABLED` | No | `true` | Enable/disable CORS headers |
| `CORS_ORIGIN` | No | `localhost:3000, 5173, ...` | Comma-separated list of allowed origins |
| `TEST_DB_SCHEMA` | No | `app_test` | Isolated test schema name for Vitest |

---

## API Overview

All domain routes are exposed under `/api/v1` (with root aliases for compatibility). All responses follow standardized JSON envelopes (`ok()` and `fail()`).

| Group | Method | Endpoint | Description | Auth |
| :--- | :--- | :--- | :--- | :--- |
| **System** | `GET` | `/health/live` | Liveness probe (process responsive) | None |
| | `GET` | `/health/ready` | Readiness probe (database connectivity ping) | None |
| | `GET` | `/docs` | Interactive Swagger UI documentation | None |
| **Auth** | `POST` | `/api/v1/register` | Register new user account | None |
| | `POST` | `/api/v1/login` | Authenticate user credentials & issue tokens | None |
| | `POST` | `/api/v1/refresh` | Rotate refresh token with replay protection | None |
| | `POST` | `/api/v1/logout` | Revoke active refresh session | None |
| **Users** | `GET` | `/api/v1/users/:id` | Get user profile (IDOR protected) | Bearer Token |
| | `PUT` | `/api/v1/users/:id` | Update profile information | Bearer Token |
| | `DELETE` | `/api/v1/users/:id` | Soft-delete user account and sessions | Bearer Token |
| **Admin** | `GET` | `/api/v1/admin/users` | List all users (admin only) | Admin Token |
| | `PATCH`| `/api/v1/admin/users/:id/role`| Update user role (`user`/`admin`) | Admin Token |
| | `POST` | `/api/v1/admin/users/:id/revoke-sessions`| Invalidate user sessions | Admin Token |

> For complete request/response schemas and payload examples, visit the live Swagger UI at `/docs`.

---

## Available Scripts

| Command | Description |
| :--- | :--- |
| `npm run dev` | Starts server in development mode with live TypeScript compilation |
| `npm run build` | Compiles TypeScript source to production JavaScript (`dist/`) |
| `npm start` | Runs the compiled production server (`dist/server.js`) |
| `npm run type-check` | Type-checks the codebase without emitting output |
| `npm run lint` | Runs ESLint static code quality checks |
| `npm run format` | Formats all source files with Prettier |
| `npm run db:generate`| Generates SQL migration files from Drizzle schema |
| `npm run db:migrate` | Applies pending database migrations |
| `npm test` | Runs the full Vitest integration test suite |
| `npm run test:watch` | Runs Vitest in interactive watch mode |

---

## Docker (Optional)

Run PostgreSQL and the application via Docker Compose:

```bash
# Start PostgreSQL and App
docker compose up -d

# Run migrations inside running container
npm run db:migrate

# Stop services
docker compose down
```

---

## License

Private / Proprietary.