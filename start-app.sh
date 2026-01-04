#!/bin/bash

# FlouApp Startup Script - Keep both services running
# This script launches backend and frontend with auto-restart on crash

set -e

echo "🚀 FlouApp Startup"
echo "===================="

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Kill any existing processes
echo "${YELLOW}🛑 Cleaning up old processes...${NC}"
pkill -9 -f "node index.js" 2>/dev/null || true
pkill -9 -f "expo start" 2>/dev/null || true
sleep 2

# Function to keep a service running
start_service() {
  local name=$1
  local cmd=$2
  local cwd=$3
  
  while true; do
    echo "${GREEN}▶️  Starting $name...${NC}"
    cd "$cwd"
    eval "$cmd" &
    local PID=$!
    
    # Wait for process to exit (if it crashes)
    wait $PID 2>/dev/null || {
      local EXIT_CODE=$?
      echo "${RED}❌ $name crashed with exit code $EXIT_CODE${NC}"
      sleep 5
      continue
    }
  done
}

# Start Backend
echo "${GREEN}📦 Starting Backend (port 3001)${NC}"
start_service "Backend" "npm start" "/home/jj755403/FlouAppNew/backend" &
BACKEND_PID=$!

sleep 3

# Start Frontend
echo "${GREEN}📱 Starting Frontend (Expo)${NC}"
start_service "Frontend" "npm start" "/home/jj755403/FlouAppNew" &
FRONTEND_PID=$!

echo ""
echo "${GREEN}✅ FlouApp is running!${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Backend:  http://localhost:3001"
echo "Frontend: http://localhost:8081"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Press Ctrl+C to stop all services"
echo ""

# Keep script running and monitor both processes
trap "kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; exit" SIGINT SIGTERM

wait
