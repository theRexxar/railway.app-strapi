#!/bin/bash
set -euo pipefail

echo "========================================="
echo "  STEP 4: Install & Build"
echo "========================================="
echo ""

echo "--- Removing old node_modules and lockfile ---"
rm -rf node_modules package-lock.json
echo "Done."

echo ""
echo "--- Installing dependencies (npm install) ---"
npm install
echo "Done."

echo ""
echo "--- Generating API docs ---"
npm run generate:docs 2>/dev/null || echo "[WARN] generate:docs had an issue — check after build"
echo "Done."

echo ""
echo "--- Building Strapi ---"
npm run build

echo ""
echo "========================================="
echo "  Install & Build Complete"
echo "========================================="
echo ""
echo "  Strapi version: $(node -e "console.log(require('./package.json').dependencies['@strapi/strapi'])")"
echo ""
echo "=== Next step: ./scripts/upgrade/step-05-verify.sh ==="
