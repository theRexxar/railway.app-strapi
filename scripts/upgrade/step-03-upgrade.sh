#!/bin/bash
set -euo pipefail

echo "========================================="
echo "  STEP 3: Run Upgrade Tool"
echo "  Target: 5.51.0"
echo "========================================="
echo ""

# Dry run first
echo "--- Dry Run ---"
echo ""

npx @strapi/upgrade to 5.51.0 --dry

echo ""
echo "-----------------------------------------"
echo "Review the dry run output above."
echo "It shows what files will be modified."
echo "-----------------------------------------"
echo ""
read -p "Continue with actual upgrade? (y/N) " -n 1 -r
echo ""

if [[ ! $REPLY =~ ^[Yy]$ ]]; then
  echo "Aborted. No changes were made."
  exit 0
fi

echo ""
echo "--- Running Upgrade ---"
echo ""

npx @strapi/upgrade to 5.51.0

echo ""
echo "Upgrade tool completed."
echo "package.json should now show Strapi 5.51.0."
echo ""

# Verify package.json was updated
NEW_VERSION=$(node -e "console.log(require('./package.json').dependencies['@strapi/strapi'] || 'unknown')" 2>/dev/null)
if [ "$NEW_VERSION" = "5.51.0" ]; then
  echo "[OK] package.json updated to 5.51.0"
else
  echo "[WARN] package.json shows $NEW_VERSION (expected 5.51.0)"
  echo "       The upgrade tool may have left dependencies pinned to the old version."
  echo "       Update manually: change all @strapi/* versions in package.json to 5.51.0"
fi

echo ""
echo "=== Next step: ./scripts/upgrade/step-04-install.sh ==="
