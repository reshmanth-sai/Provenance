# Provenance

Provenance is a tamper-evident credential-verification platform featuring candidate, issuer, recruiter, and admin roles with self-upload document analysis and per-issuer tamper-evident hash chains.

---

## Prerequisites

- **Node.js**: `v20.x` or higher
- **npm**: `v10.x` or higher (configured for npm workspaces)
- **Docker** & **Docker Compose**: For running the local PostgreSQL database

---

## Quick Start (Local Development)

### 1. Environment Setup

Copy `.env.example` to `.env`:

```bash
cp .env.example .env
```

### 2. Install Dependencies

Install all workspace dependencies from the root:

```bash
npm install
```

### 3. Start Database Service

Bring up the PostgreSQL container:

```bash
docker-compose up -d
```

### 4. Run Database Migrations

Apply Prisma schema migrations to the database and generate the Prisma Client:

```bash
npm run db:migrate -- --name init
```

### 5. Start Backend API Server

Run the Express API development server (listening on port 4000):

```bash
npm run dev:api
```

Health check:
```bash
curl http://localhost:4000/health
# Output: {"status":"ok","db":"connected"}
```

### 6. Start Frontend Web Server

In a separate terminal, start the Next.js development server (listening on port 3000):

```bash
npm run dev:web
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Repository Structure

```
provenance/
  ├── apps/
  │   ├── api/            # Express + TypeScript backend
  │   └── web/            # Next.js App Router + Tailwind frontend
  ├── packages/
  │   └── db/             # Prisma schema, migrations, and database client
  ├── storage/
  │   └── uploads/        # Local file upload directory (gitignored)
  ├── docker-compose.yml  # PostgreSQL 16 service definition
  ├── .env.example        # Environment variables template
  ├── .gitignore          # Git ignore rules
  └── package.json        # Root workspace configuration
```

---

## Workspace Scripts Reference

- `npm run dev:api`: Starts the Express API server with hot-reloading (`tsx watch`).
- `npm run dev:web`: Starts the Next.js frontend dev server.
- `npm run db:migrate`: Executes Prisma database migrations.
- `npm run db:generate`: Generates Prisma client types from `schema.prisma`.
- `npm run build`: Compiles all workspace packages and apps.
