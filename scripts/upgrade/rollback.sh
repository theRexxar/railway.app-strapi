#!/bin/bash
set -euo pipefail

echo "========================================="
echo "  ROLLBACK: Strapi 5.51.0 → 5.43.0"
echo "========================================="
echo ""

echo "This will:"
echo "  1. Revert package.json and package-lock.json to 5.43.0"
echo "  2. Remove and reinstall node_modules"
echo "  3. Rebuild the project"
echo "  4. Optionally restore the database from backup"
echo ""

read -p "Proceed with rollback? (y/N) " -n 1 -r
echo ""

if [[ ! $REPLY =~ ^[Yy]$ ]]; then
  echo "Aborted."
  exit 0
fi

echo ""
echo "--- Reverting package.json and lockfile ---"
git checkout -- package.json package-lock.json 2>/dev/null || true
echo "Done."

echo ""
echo "--- Removing node_modules ---"
rm -rf node_modules
echo "Done."

echo ""
echo "--- Reinstalling at 5.43.0 ---"
npm install
echo "Done."

echo ""
echo "--- Rebuilding ---"
npm run build
echo "Done."

# Check for database backup to restore
BACKUP_DIR="backups"
if [ -d "$BACKUP_DIR" ]; then
  LATEST_BACKUP=$(ls -t "${BACKUP_DIR}"/backup_before_5.51.0_*.sql 2>/dev/null | head -1 || echo "")
  if [ -n "$LATEST_BACKUP" ]; then
    echo ""
    echo "A database backup exists: $LATEST_BACKUP"
    read -p "Restore database from this backup? (y/N) " -n 1 -r
    echo ""

    if [[ $REPLY =~ ^[Yy]$ ]]; then
      if [ -f .env ]; then
        set -a
        source .env 2>/dev/null || true
        set +a
      fi

      if [ -n "${DATABASE_URL:-}" ] && command -v psql &>/dev/null; then
        psql "$DATABASE_URL" < "$LATEST_BACKUP"
        echo "[OK] Database restored."
      else
        echo "[FAIL] Cannot restore. Set DATABASE_URL and install psql."
      fi
    fi
  fi
fi

echo ""
echo "========================================="
echo "  Rollback Complete"
echo "========================================="
echo ""
echo "  Strapi version: $(node -e "console.log(require('./package.json').dependencies['@strapi/strapi'])")"
echo "  You may need to re-deploy if this was already deployed."
echo ""
