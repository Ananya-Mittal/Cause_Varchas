#!/bin/bash
# setup_frontend.sh — Sets up the Expo frontend
# Usage: bash setup_frontend.sh

set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo ""
echo -e "${GREEN}🌾 Varchas Frontend Setup (Expo)${NC}"
echo "======================================="

# ── 1. Check Node ────────────────────────────────────────────────────────────
echo -e "\n${YELLOW}[1/4] Checking Node.js...${NC}"
node --version || { echo -e "${RED}Node not found. Install LTS from nodejs.org${NC}"; exit 1; }
npm --version

# ── 2. Install packages ───────────────────────────────────────────────────────
echo -e "\n${YELLOW}[2/4] Installing npm packages...${NC}"
npm install
echo "  ✅ node_modules installed"

# ── 3. Detect PC IP ───────────────────────────────────────────────────────────
echo -e "\n${YELLOW}[3/4] Detecting your LAN IP...${NC}"
if [[ "$OSTYPE" == "darwin"* ]]; then
  LOCAL_IP=$(ipconfig getifaddr en0 2>/dev/null || ipconfig getifaddr en1 2>/dev/null || echo "UNKNOWN")
else
  LOCAL_IP=$(hostname -I 2>/dev/null | awk '{print $1}' || echo "UNKNOWN")
fi

echo "  Your LAN IP appears to be: ${GREEN}${LOCAL_IP}${NC}"

if [ "$LOCAL_IP" != "UNKNOWN" ]; then
  # Auto-patch client.ts with detected IP
  if [[ "$OSTYPE" == "darwin"* ]]; then
    sed -i '' "s|http://[0-9.]*:5000|http://${LOCAL_IP}:5000|g" src/api/client.ts
  else
    sed -i "s|http://[0-9.]*:5000|http://${LOCAL_IP}:5000|g" src/api/client.ts
  fi
  echo "  ✅ AUTO-PATCHED src/api/client.ts → http://${LOCAL_IP}:5000"
else
  echo -e "  ${YELLOW}Could not detect IP. Manually set BASE_URL in src/api/client.ts${NC}"
fi

# ── 4. Done ───────────────────────────────────────────────────────────────────
echo -e "\n${GREEN}════════════════════════════════════════${NC}"
echo -e "${GREEN}✅ Frontend setup complete!${NC}"
echo -e "${GREEN}════════════════════════════════════════${NC}"
echo ""
echo "Make sure backend is running at: http://${LOCAL_IP}:5000"
echo ""
echo "To start Expo:"
echo -e "  ${YELLOW}npx expo start${NC}"
echo ""
echo "Then scan the QR code with Expo Go on your phone."
echo "(Phone must be on the same WiFi as this PC)"
echo ""
