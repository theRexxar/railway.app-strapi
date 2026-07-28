#!/bin/bash
set -euo pipefail

echo "========================================="
echo "  STEP 2: Database Backup"
echo "========================================="
echo ""

BACKUP_DIR="backups"
BACKUP_FILE="${BACKUP_DIR}/backup_before_5.51.0_$(date +%Y%m%d_%H%M%S).sql"

mkdir -p "$BACKUP_DIR"

# Load env
if [ -f .env ]; then
  set -a
  source .env 2>/dev/null || true
  set +a
fi

# Find a working pg_dump (prefer PG16+)
PG_DUMP=""
for candidate in \
  "/opt/homebrew/opt/postgresql@16/bin/pg_dump" \
  "/opt/homebrew/opt/postgresql@17/bin/pg_dump" \
  "/opt/homebrew/opt/libpq/bin/pg_dump" \
  "$(command -v pg_dump 2>/dev/null || echo '')"; do
  if [ -n "$candidate" ] && [ -x "$candidate" ]; then
    PG_DUMP="$candidate"
    break
  fi
done

if [ -z "$PG_DUMP" ]; then
  echo "[FAIL] pg_dump not found. Install with: brew install postgresql@16"
  exit 1
fi

echo "Using: $PG_DUMP ($($PG_DUMP --version | head -1))"

# Try DATABASE_URL first
if [ -n "${DATABASE_URL:-}" ]; then
  echo "Using DATABASE_URL..."
  "$PG_DUMP" "$DATABASE_URL" --no-owner --no-acl > "$BACKUP_FILE"
  echo "[OK] Backup saved to $BACKUP_FILE ($(du -h "$BACKUP_FILE" | cut -f1))"

# Try individual params
elif [ -n "${DATABASE_HOST:-}" ] && [ -n "${DATABASE_NAME:-}" ]; then
  echo "Using individual DB params..."
  PGPASSWORD="${DATABASE_PASSWORD:-}" "$PG_DUMP" \
    -h "${DATABASE_HOST}" \
    -p "${DATABASE_PORT:-5432}" \
    -U "${DATABASE_USERNAME:-postgres}" \
    -d "${DATABASE_NAME}" \
    --no-owner --no-acl > "$BACKUP_FILE"
  echo "[OK] Backup saved to $BACKUP_FILE ($(du -h "$BACKUP_FILE" | cut -f1))"

else
  echo "[FAIL] Neither DATABASE_URL nor DATABASE_HOST/DATABASE_NAME found in .env"
  exit 1
fi

echo ""
echo "=== Next step: ./scripts/upgrade/step-03-upgrade.sh ==="
