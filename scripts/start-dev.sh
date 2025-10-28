#!/bin/bash

# RWA DeFi Platform - Development Server Startup Script
# 启动开发服务器脚本

set -e

echo "🚀 Starting RWA DeFi Platform Development Environment"
echo "======================================================"
echo ""

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if .env exists
if [ ! -f .env ]; then
    echo -e "${YELLOW}⚠️  .env file not found. Copying from .env.example...${NC}"
    cp .env.example .env
    echo -e "${GREEN}✅ .env file created. Please update it with your configuration.${NC}"
    echo ""
fi

# Check if node_modules exists
if [ ! -d node_modules ]; then
    echo -e "${YELLOW}📦 Installing dependencies...${NC}"
    npm install
    echo -e "${GREEN}✅ Dependencies installed${NC}"
    echo ""
fi

# Check if backend dependencies are installed
if [ ! -d packages/backend/node_modules ]; then
    echo -e "${YELLOW}📦 Installing backend dependencies...${NC}"
    cd packages/backend
    npm install
    cd ../..
    echo -e "${GREEN}✅ Backend dependencies installed${NC}"
    echo ""
fi

# Check if frontend dependencies are installed
if [ ! -d rwa-defi-platform/node_modules ]; then
    echo -e "${YELLOW}📦 Installing frontend dependencies...${NC}"
    cd rwa-defi-platform
    npm install
    cd ..
    echo -e "${GREEN}✅ Frontend dependencies installed${NC}"
    echo ""
fi

# Check if Prisma client is generated
echo -e "${BLUE}🔧 Generating Prisma client...${NC}"
cd packages/backend
npx prisma generate 2>/dev/null || echo -e "${YELLOW}⚠️  Prisma generation skipped (database may not be configured)${NC}"
cd ../..
echo ""

echo -e "${GREEN}✅ All checks passed!${NC}"
echo ""
echo -e "${BLUE}📋 Starting Services:${NC}"
echo "  • Backend API: http://localhost:3000"
echo "  • Frontend: http://localhost:5173"
echo "  • API Docs: http://localhost:3000/api/docs"
echo ""
echo -e "${YELLOW}💡 Tips:${NC}"
echo "  • Press Ctrl+C to stop all services"
echo "  • Backend logs will be prefixed with [BACKEND]"
echo "  • Frontend logs will be prefixed with [FRONTEND]"
echo ""
echo "======================================================"
echo ""

# Function to cleanup on exit
cleanup() {
    echo ""
    echo -e "${YELLOW}🛑 Stopping all services...${NC}"
    kill 0
    exit 0
}

trap cleanup SIGINT SIGTERM

# Start backend in background
echo -e "${BLUE}[BACKEND]${NC} Starting backend server..."
cd packages/backend
npm run dev 2>&1 | sed 's/^/[BACKEND] /' &
BACKEND_PID=$!
cd ../..

# Wait a bit for backend to start
sleep 3

# Start frontend in background
echo -e "${BLUE}[FRONTEND]${NC} Starting frontend server..."
cd rwa-defi-platform
npm run dev 2>&1 | sed 's/^/[FRONTEND] /' &
FRONTEND_PID=$!
cd ..

echo ""
echo -e "${GREEN}✅ All services started!${NC}"
echo ""
echo -e "${BLUE}🌐 Access the application:${NC}"
echo "  • Frontend: ${GREEN}http://localhost:5173${NC}"
echo "  • Backend API: ${GREEN}http://localhost:3000${NC}"
echo "  • API Documentation: ${GREEN}http://localhost:3000/api/docs${NC}"
echo ""
echo -e "${YELLOW}Press Ctrl+C to stop all services${NC}"
echo ""

# Wait for both processes
wait $BACKEND_PID $FRONTEND_PID
