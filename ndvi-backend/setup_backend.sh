#!/bin/bash
# setup_backend.sh — Run this ONCE to set up the entire backend
# Usage: bash setup_backend.sh

set -e  # Exit on any error

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo ""
echo -e "${GREEN}🌾 Varchas Backend Setup${NC}"
echo "================================"

# ── 1. Check Python ──────────────────────────────────────────────────────────
echo -e "\n${YELLOW}[1/6] Checking Python version...${NC}"
python3 --version || { echo -e "${RED}Python 3 not found. Install from python.org${NC}"; exit 1; }

# ── 2. Virtual environment ───────────────────────────────────────────────────
echo -e "\n${YELLOW}[2/6] Creating virtual environment...${NC}"
if [ ! -d "venv" ]; then
  python3 -m venv venv
  echo "  ✅ venv created"
else
  echo "  ✅ venv already exists"
fi

# Activate
source venv/bin/activate 2>/dev/null || source venv/Scripts/activate 2>/dev/null
echo "  ✅ venv activated"

# ── 3. Install dependencies ───────────────────────────────────────────────────
echo -e "\n${YELLOW}[3/6] Installing Python dependencies...${NC}"
pip install --upgrade pip -q
pip install -r requirements.txt -q
echo "  ✅ All packages installed"

# ── 4. Create .env if missing ─────────────────────────────────────────────────
echo -e "\n${YELLOW}[4/6] Checking .env config...${NC}"
if [ ! -f ".env" ]; then
  cat > .env << 'EOF'
# Varchas Backend Configuration
# ─────────────────────────────
SECRET_KEY=varchas_dev_secret_change_in_production_xyz789
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_HOURS=4
DATABASE_URL=sqlite:///./agri_credit.db
GEE_PROJECT_ID=agricultural-land-486413
MODEL_PATH=ml/model.pkl
FEATURES_PATH=ml/features.pkl
EOF
  echo "  ✅ .env created (edit GEE_PROJECT_ID if needed)"
else
  echo "  ✅ .env already exists"
fi

# ── 5. Train ML model ─────────────────────────────────────────────────────────
echo -e "\n${YELLOW}[5/6] Training ML model (this takes ~30 seconds)...${NC}"
mkdir -p ml
python -m ml.train_model
echo "  ✅ model.pkl + features.pkl saved"

# ── 6. Test server start ──────────────────────────────────────────────────────
echo -e "\n${YELLOW}[6/6] Setup complete!${NC}"
echo ""
echo -e "${GREEN}════════════════════════════════════════${NC}"
echo -e "${GREEN}✅ Varchas backend is ready to start!${NC}"
echo -e "${GREEN}════════════════════════════════════════${NC}"
echo ""
echo "To start the server:"
echo -e "  ${YELLOW}source venv/bin/activate${NC}"
echo -e "  ${YELLOW}python -m uvicorn app:app --host 0.0.0.0 --port 5000 --reload${NC}"
echo ""
echo "API Docs will be at: http://localhost:5000/docs"
echo ""
echo "For GEE (satellite data), authenticate once:"
echo -e "  ${YELLOW}python -c \"import ee; ee.Authenticate()\"${NC}"
echo ""
