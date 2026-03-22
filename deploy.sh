#!/bin/bash
set -e
GREEN='\033[0;32m'; EARTH='\033[0;33m'; RED='\033[0;31m'; NC='\033[0m'

echo -e "${GREEN}"
echo "   ██████╗██████╗  ██████╗ ██████╗ ██╗   ██╗███████╗████████╗"
echo "  ██╔════╝██╔══██╗██╔═══██╗██╔══██╗██║   ██║██╔════╝╚══██╔══╝"
echo "  ██║     ██████╔╝██║   ██║██████╔╝██║   ██║█████╗     ██║"
echo "  ██║     ██╔══██╗██║   ██║██╔═══╝ ╚██╗ ██╔╝██╔══╝     ██║"
echo "  ╚██████╗██║  ██║╚██████╔╝██║      ╚████╔╝ ███████╗   ██║"
echo "   ╚═════╝╚═╝  ╚═╝ ╚═════╝ ╚═╝       ╚═══╝  ╚══════╝   ╚═╝"
echo -e "${NC}"
echo -e "${EARTH}  The Farm's Own AI Brain — Kenyan Smallholder Edition${NC}"
echo ""

if [ ! -f ".env" ]; then
  echo -e "${EARTH}⚠  No .env found. Creating from .env.example...${NC}"
  cp .env.example .env
  echo -e "${RED}✗  Fill in .env with your API keys, then run ./deploy.sh again.${NC}"
  exit 1
fi
echo -e "${GREEN}✓  .env found${NC}"

if ! docker info > /dev/null 2>&1; then
  echo -e "${RED}✗  Docker not running. Start Docker and retry.${NC}"
  exit 1
fi
echo -e "${GREEN}✓  Docker running${NC}"

echo ""
echo -e "${EARTH}🚀  Building CropVet... (first run downloads the CropMind AI model ~2GB)${NC}"
echo ""

docker compose down --remove-orphans 2>/dev/null || true
docker compose up --build -d

echo ""
echo -e "${GREEN}✅  CropVet is live!${NC}"
echo ""
echo "  🌿 Frontend  → http://localhost:3000"
echo "  ⚡ Backend   → http://localhost:8000"
echo "  📖 API Docs  → http://localhost:8000/docs"
echo "  🧠 Ollama    → http://localhost:11434"
echo ""
echo "  Stop:  docker compose down"
echo "  Logs:  docker compose logs -f"
echo ""
