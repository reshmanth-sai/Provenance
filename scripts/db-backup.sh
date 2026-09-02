#!/usr/bin/env bash
# Dump the Provenance database before any schema migration.
#
# Why this exists: `prisma migrate dev` detects drift and will reset the database,
# which silently destroyed all seed data, every uploaded document, and the entire
# hash chain during Phase 9C. A migration is not reversible; a dump is.
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ENV_FILE="$REPO_ROOT/.env"

if [[ ! -f "$ENV_FILE" ]]; then
  echo "db-backup: no .env at $ENV_FILE" >&2
  exit 1
fi

DATABASE_URL="$(grep -E '^DATABASE_URL=' "$ENV_FILE" | head -1 | cut -d= -f2- | tr -d '"'"'"'')"
if [[ -z "$DATABASE_URL" ]]; then
  echo "db-backup: DATABASE_URL not set in .env" >&2
  exit 1
fi

# Prisma appends query params (e.g. ?schema=public) that pg_dump rejects as invalid URI parameters.
DATABASE_URL="${DATABASE_URL%%\?*}"

PG_DUMP="$(command -v pg_dump || true)"
if [[ -z "$PG_DUMP" ]]; then
  for candidate in /opt/homebrew/opt/postgresql@16/bin/pg_dump /usr/local/opt/postgresql@16/bin/pg_dump; do
    [[ -x "$candidate" ]] && PG_DUMP="$candidate" && break
  done
fi
if [[ -z "$PG_DUMP" ]]; then
  echo "db-backup: pg_dump not found. Install PostgreSQL client tools or add pg_dump to PATH." >&2
  exit 1
fi

BACKUP_DIR="$REPO_ROOT/backups"
mkdir -p "$BACKUP_DIR"
OUT="$BACKUP_DIR/provenance-$(date +%Y%m%d-%H%M%S).sql"

"$PG_DUMP" "$DATABASE_URL" > "$OUT"

# A dump that is suspiciously small usually means the database was already empty.
SIZE=$(wc -c < "$OUT" | tr -d ' ')
echo "db-backup: wrote $OUT (${SIZE} bytes)"
if [[ "$SIZE" -lt 2000 ]]; then
  echo "db-backup: WARNING - dump is very small; the database may already be empty." >&2
fi
echo "db-backup: restore with -> psql \"\$DATABASE_URL\" < $OUT"
