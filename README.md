# Provenance

Provenance is a tamper-evident credential-verification platform featuring candidate, issuer, recruiter, and admin roles with self-upload document analysis and per-issuer tamper-evident hash chains.

---

## Prerequisites

- **Node.js**: `v20.x` or higher
- **npm**: `v10.x` or higher (configured for npm workspaces)
- **Docker** & **Docker Compose**: For running the local PostgreSQL database (or PostgreSQL 16)
- **System Binaries**:
  - `tesseract` (for OCR text extraction): `brew install tesseract`
  - `poppler` (for PDF rasterization via `pdftoppm`): `brew install poppler`

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

**Option A: Using Docker Compose (Recommended if Docker is installed)**
```bash
docker-compose up -d
```

**Option B: Using Native PostgreSQL 16 (Homebrew)**
```bash
# Start PostgreSQL service
brew services start postgresql@16

# Ensure postgres role and provenance database exist (first-time only)
psql -d postgres -c "CREATE ROLE postgres WITH SUPERUSER LOGIN PASSWORD 'postgres';"
psql -U postgres -d postgres -c "CREATE DATABASE provenance;"
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
  └── README.md           # Project documentation
```

---

## Why This Is Not SSRF: Architectural Safety and Issuer Connectors

Provenance includes an active public verification connector for institutions that publish public certificate verification registries (such as Coursera). It operates under a strict anti-SSRF architectural policy:

### 1. What Is Strictly Prohibited
- **No arbitrary URL fetching:** Provenance never extracts a URL or QR code payload from an uploaded document and fetches it. Allowing document contents to define the scheme, host, port, or path is textbook SSRF.

### 2. What Issuer Connectors Do Instead
- **Decoupled Host Selection:** Connector selection is steered exclusively by the candidate's self-declared institution name (`claimedIssuerName`), matched against a static alias registry. Document OCR text never influences which host is contacted.
- **Constant Hostnames:** The destination host (`www.coursera.org`) is a hardcoded module-level constant.
- **Strictly Constrained Segments:** The only variable element in the request is an alphanumeric token strictly validated against `/^[A-Z0-9]{8,20}$/`. The token is interpolated into predefined, hardcoded path templates.

### 3. Concrete Safety & Defense-in-Depth Controls
1. **Fixed Host Assertion:** Before dispatch, the constructed URL is parsed and asserted to match `targetUrl.host === connector.host` and `targetUrl.protocol === "https:"`. Any discrepancy throws a fatal safety violation.
2. **Pre-Request Regex Assertion:** Verification codes are re-validated immediately before request generation; strings containing slashes, dots, query parameters, or invalid characters are rejected with zero network requests.
3. **Manual Redirect Policy:** HTTP client requests use `redirect: "manual"`. The connector never follows 3xx redirects to external locations.
4. **Bounded Latency & Timeouts:** Outbound requests are governed by a 5-second `AbortController` timeout.
5. **Response Body Cap:** Response payload reading is hard-capped at 512KB to eliminate memory exhaustion vectors.
6. **Request Capping:** At most 3 sequential path templates are queried per lookup, short-circuiting on the first 200 response.
7. **24-Hour Caching:** Query results are cached in the `IssuerLookup` database table for 24 hours, preventing redundant outbound traffic.
8. **Safe Logging:** Request logs record only timestamp, destination host, path template, HTTP status, and duration. Response bodies and URLs containing personal identifiers are never logged.
9. **Third-Party Privacy Protection:** Extracted recipient names from public issuer pages are never stored in plaintext in any table, column, API response, or rendered view. Only a SHA-256 hash (`rawNameHash`) is persisted for auditability.
10. **Zero-Network Demonstrations:** Outbound requests can be completely disabled by setting `ISSUER_LOOKUP_ENABLED=false` in `.env`.

### 4. Brittle HTML Parsing Discipline
Public issuer HTML structures evolve without notice. If name extraction from HTML fails for any reason (CSS changes, JavaScript-only rendering, network timeout), the engine strictly produces `issuer_lookup_unavailable` (`inconclusive`), **never** an accusation of forgery (`issuer_lookup_name_mismatch`).


---

## Workspace Scripts Reference

- `npm run dev:api`: Starts the Express API server with hot-reloading (`tsx watch`).
- `npm run dev:web`: Starts the Next.js frontend dev server.
- `npm run db:migrate`: Executes Prisma database migrations.
- `npm run db:generate`: Generates Prisma client types from `schema.prisma`.
- `npm run build`: Compiles all workspace packages and apps.
