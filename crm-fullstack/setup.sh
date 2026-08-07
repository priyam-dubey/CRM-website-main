#!/usr/bin/env bash
set -e

CYAN='\033[0;36m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo ""
echo -e "${CYAN}======================================="
echo "  BookingCRM — Full Stack Setup"
echo -e "=======================================${NC}"
echo ""

# Check node
if ! command -v node &>/dev/null; then
  echo "ERROR: Node.js >= 18 required. Install from https://nodejs.org"
  exit 1
fi
echo -e "${GREEN}✓${NC} Node $(node -v)"

# Check docker (optional)
if command -v docker &>/dev/null; then
  echo -e "${GREEN}✓${NC} Docker available"
  DOCKER=true
else
  echo -e "${YELLOW}!${NC} Docker not found — you'll need PostgreSQL installed locally"
  DOCKER=false
fi

echo ""
echo -e "${CYAN}Step 1: Installing frontend dependencies${NC}"
cd ../crm-frontend && npm install
echo -e "${GREEN}✓${NC} Frontend dependencies installed"

echo ""
echo -e "${CYAN}Step 2: Installing backend dependencies${NC}"
cd ../crm-backend && npm install
echo -e "${GREEN}✓${NC} Backend dependencies installed"

echo ""
echo -e "${CYAN}Step 3: Configuring environment${NC}"
[ ! -f .env ] && cp .env.example .env && echo -e "${GREEN}✓${NC} Created crm-backend/.env from example"
cd ../crm-frontend
[ ! -f .env ] && cat > .env << 'ENVEOF'
VITE_API_BASE_URL=http://localhost:4000/api/v1
VITE_USE_MOCK=false
ENVEOF
echo -e "${GREEN}✓${NC} Created crm-frontend/.env"

echo ""
echo -e "${CYAN}======================================="
echo "  Setup complete!"
echo -e "=======================================${NC}"
echo ""

if [ "$DOCKER" = true ]; then
  echo "Start the database:"
  echo "  cd crm-fullstack && docker-compose up -d postgres redis"
  echo ""
fi

echo "Then in two terminals:"
echo ""
echo -e "${CYAN}  Terminal 1 (Backend):${NC}"
echo "  cd crm-backend"
echo "  npm run db:generate   # needs network access to Prisma CDN"
echo "  npm run db:migrate"
echo "  npm run db:seed"
echo "  npm run start:dev"
echo ""
echo -e "${CYAN}  Terminal 2 (Frontend):${NC}"
echo "  cd crm-frontend"
echo "  npm run dev"
echo ""
echo "  Open: http://localhost:3000"
echo "  Login: admin@demo.com / password"
echo ""
echo -e "${YELLOW}Frontend-only mode (no backend needed):${NC}"
echo "  cd crm-frontend"
echo "  cp .env.mock .env.local && npm run dev"
