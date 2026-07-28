#!/bin/bash
set -euo pipefail

echo "========================================="
echo "  STEP 5: Post-upgrade Verification"
echo "========================================="
echo ""

echo "  Strapi version: $(node -e "console.log(require('./package.json').dependencies['@strapi/strapi'])")"
echo ""

echo "Manual verification checklist. Run the dev server (npm run dev), then check:"
echo ""
echo "  [ ] 1. Admin login works (JWT now defaults to HS256)"
echo "  [ ] 2. Admin logout / session persists correctly"
echo "  [ ] 3. Edit content — CKEditor5 field loads, saves, and publishes"
echo "  [ ] 4. Upload an image to Cloudinary — verify it appears in media library"
echo "  [ ] 5. Upload a PDF — verify it uploads as 'raw' resource_type"
echo "         Check logs for: [Cloudinary] PDF upload"
echo "  [ ] 6. Upload an SVG — verify URL contains fl_sanitize/"
echo "  [ ] 7. GET /health — returns 200 with memory/disk/database checks"
echo "  [ ] 8. GET /api/...(cached endpoint) — verify X-Cache: HIT/MISS headers"
echo "  [ ] 9. Algolia search — /api/search returns results"
echo "  [ ]10. Run: npm run generate:docs — generates without errors"
echo "  [ ]11. Run: node scripts/test-apis.js — all tests pass"
echo ""

echo "-----------------------------------------"
read -p "Have you completed all checks above? (y/N) " -n 1 -r
echo ""

if [[ ! $REPLY =~ ^[Yy]$ ]]; then
  echo "Complete the verification checklist, then re-run this script."
  exit 0
fi

echo ""
echo "========================================="
echo "  Verification Passed"
echo "========================================="
echo ""
echo "Next steps:"
echo "  1. Commit the upgrade:"
echo "     git add ."
echo "     git commit -m 'chore: upgrade strapi to 5.51.0'"
echo ""
echo "  2. Push and create PR:"
echo "     git push -u origin upgrade/strapi-5.51.0"
echo ""
echo "  3. Deploy to staging for further testing"
echo ""
echo "  4. After staging passes, deploy to production"
echo ""
echo "If anything goes wrong in production, run:"
echo "  ./scripts/upgrade/rollback.sh"
echo ""
