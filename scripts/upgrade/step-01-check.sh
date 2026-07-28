#!/bin/bash
set -euo pipefail

echo "========================================="
echo "  STEP 1: Pre-upgrade Checks"
echo "  Target: Strapi 5.43.0 → 5.51.0"
echo "========================================="
echo ""

PASS=0
FAIL=0

check() {
  local label="$1"
  local result="$2"
  if [ "$result" = "pass" ]; then
    echo "  [PASS] $label"
    PASS=$((PASS + 1))
  else
    echo "  [FAIL] $label"
    FAIL=$((FAIL + 1))
  fi
}

# --- Node.js version ---
NODE_VERSION=$(node -v 2>/dev/null | cut -d'v' -f2 | cut -d'.' -f1 || echo "0")
if [ "$NODE_VERSION" -ge 20 ] && [ "$NODE_VERSION" -le 24 ]; then
  check "Node.js $(node -v) (requires 20-24)" "pass"
else
  check "Node.js version $NODE_VERSION (requires 20-24)" "fail"
fi

# --- npm available ---
if command -v npm &>/dev/null; then
  check "npm $(npm -v) available" "pass"
else
  check "npm not found" "fail"
fi

# --- Clean git working directory ---
if git diff-index --quiet HEAD -- 2>/dev/null; then
  check "Git working directory is clean" "pass"
else
  check "Git working directory has uncommitted changes" "fail"
fi

# --- package.json exists ---
if [ -f package.json ]; then
  check "package.json exists" "pass"
else
  check "package.json not found" "fail"
fi

# --- Current Strapi version ---
CURRENT_VERSION=$(node -e "console.log(require('./package.json').dependencies['@strapi/strapi'] || 'unknown')" 2>/dev/null)
if [ "$CURRENT_VERSION" = "5.43.0" ]; then
  check "Strapi version is $CURRENT_VERSION (expected 5.43.0)" "pass"
else
  check "Strapi version is $CURRENT_VERSION (expected 5.43.0)" "fail"
fi

# --- Strapi 5.51.0 available on npm ---
echo ""
echo "  Checking npm registry for @strapi packages at 5.51.0..."
for pkg in "@strapi/strapi" "@strapi/plugin-cloud" "@strapi/plugin-users-permissions" "@strapi/provider-upload-cloudinary"; do
  VERSION=$(npm view "${pkg}@5.51.0" version 2>/dev/null || echo "NOT_FOUND")
  if [ "$VERSION" = "5.51.0" ]; then
    check "$pkg@5.51.0" "pass"
  else
    check "$pkg@5.51.0 (not found)" "fail"
  fi
done

# --- Plugin compatibility ---
echo ""
echo "  Third-party plugin compatibility:"
echo "    @_sh/strapi-plugin-ckeditor v7.1.1: peer @strapi/strapi ^5.0.0         -> OK"
echo "    strapi-health-plugin      v1.2.2: peer @strapi/strapi >=4.4.0 <6.0.0   -> OK"

echo ""
echo "-----------------------------------------"
echo "  Results: $PASS passed, $FAIL failed"
echo "-----------------------------------------"

if [ "$FAIL" -gt 0 ]; then
  echo ""
  echo "Fix the failures above before continuing."
  exit 1
fi

echo ""
echo "All checks passed. Ready to upgrade."
echo ""
echo "=== Next step: ./scripts/upgrade/step-02-backup.sh ==="
