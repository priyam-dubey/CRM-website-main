#!/usr/bin/env bash
set -e
echo "============================================"
echo "  BookingCRM — Setup"
echo "============================================"

# Check node
if ! command -v node &>/dev/null; then
  echo "ERROR: Node.js is required. Install from https://nodejs.org (v18+)"
  exit 1
fi
echo "Node: $(node -v)"

# Install deps
echo ""
echo "Installing dependencies..."
npm install

echo ""
echo "============================================"
echo "  Ready! Start the dev server:"
echo ""
echo "    npm run dev"
echo ""
echo "  Then open http://localhost:3000"
echo "  Login: admin@demo.com / password"
echo "============================================"
