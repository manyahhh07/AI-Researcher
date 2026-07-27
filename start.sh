#!/bin/bash
# ──────────────────────────────────────────────────────────────
# PaperSense AI — One-command launcher
# Usage: bash start.sh
# Starts FastAPI backend (port 8000) + React frontend (port 3000)
# ──────────────────────────────────────────────────────────────

set -e

RED='\033[0;31m'
GRN='\033[0;32m'
YLW='\033[1;33m'
CYN='\033[0;36m'
NC='\033[0m'

echo ""
echo -e "${CYN}🧠  PaperSense AI — Startup${NC}"
echo "────────────────────────────────────"

# ── Check for GROQ_API_KEY ─────────────────────────────────
if [ -f "backend/.env" ]; then
  export $(grep -v '^#' backend/.env | xargs)
fi

if [ -z "$GROQ_API_KEY" ]; then
  echo -e "${RED}✗  GROQ_API_KEY is not set.${NC}"
  echo ""
  echo "  Get a FREE key (no credit card) at:"
  echo -e "  ${YLW}https://console.groq.com${NC}"
  echo ""
  echo "  Then either:"
  echo "    export GROQ_API_KEY=gsk_..."
  echo "    OR copy backend/.env.example → backend/.env and fill it in"
  echo ""
  exit 1
fi

echo -e "${GRN}✓  GROQ_API_KEY detected${NC}"

# ── Backend ────────────────────────────────────────────────
echo ""
echo -e "${CYN}Starting FastAPI backend on http://localhost:8000${NC}"
cd backend
pip install -r requirements.txt -q
python main.py &
BACKEND_PID=$!
cd ..
sleep 2

# ── Frontend ───────────────────────────────────────────────
echo -e "${CYN}Starting React frontend on http://localhost:3000${NC}"
cd frontend
npm install --silent
npm start &
FRONTEND_PID=$!
cd ..

echo ""
echo -e "${GRN}✅  Both services running!${NC}"
echo "   Backend:  http://localhost:8000"
echo "   Frontend: http://localhost:3000"
echo "   API docs: http://localhost:8000/docs"
echo ""
echo -e "Press ${YLW}Ctrl+C${NC} to stop both."

# ── Cleanup on Ctrl+C ──────────────────────────────────────
trap "kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; echo ''; echo 'Stopped.'" INT
wait
