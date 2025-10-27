#!/bin/bash

# RWA DeFi Platform - Quick Start Script
# This script sets up and starts the entire platform

set -e

echo "🚀 RWA DeFi Platform - Quick Start"
echo "===================================="

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Check prerequisites
echo ""
echo "📋 Checking prerequisites..."

check_command() {
    if ! command -v $1 &> /dev/null; then
        echo "❌ $1 is not installed. Please install it first."
        exit 1
    else
        echo "✅ $1 is installed"
    fi
}

check_command node
check_command npm
check_command docker
check_command docker-compose

# Check Node version
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "❌ Node.js version must be 18 or higher. Current: $(node -v)"
    exit 1
fi
echo "✅ Node.js version is compatible"

# Install dependencies
echo ""
echo "📦 Installing dependencies..."
npm install

# Setup environment files
echo ""
echo "⚙️  Setting up environment files..."

if [ ! -f packages/backend/.env ]; then
    echo "Creating backend .env file..."
    cp .env.example packages/backend/.env
    echo -e "${YELLOW}⚠️  Please update packages/backend/.env with your configuration${NC}"
fi

if [ ! -f packages/ml-services/.env ]; then
    echo "Creating ML services .env file..."
    echo "MODEL_PATH=/app/models" > packages/ml-services/.env
    echo "LOG_LEVEL=INFO" >> packages/ml-services/.env
fi

if [ ! -f rwa-defi-platform/.env ]; then
    echo "Creating frontend .env file..."
    echo "VITE_API_URL=http://localhost:3000" > rwa-defi-platform/.env
    echo "VITE_CHAIN_ID=31337" >> rwa-defi-platform/.env
fi

# Setup database
echo ""
echo "🗄️  Setting up database..."
cd packages/backend
npx prisma generate
echo -e "${YELLOW}⚠️  Make sure PostgreSQL is running before starting the backend${NC}"
cd ../..

# Compile smart contracts
echo ""
echo "🔗 Compiling smart contracts..."
cd packages/contracts
npm install
npm run compile
cd ../..

# Start services with Docker Compose
echo ""
echo "🐳 Starting services with Docker Compose..."
docker-compose up -d

# Wait for services to be ready
echo ""
echo "⏳ Waiting for services to start..."
sleep 10

# Check service health
echo ""
echo "🏥 Checking service health..."

check_service() {
    local service=$1
    local url=$2
    
    if curl -f -s "$url" > /dev/null; then
        echo -e "${GREEN}✅ $service is running${NC}"
    else
        echo -e "${YELLOW}⚠️  $service is not responding yet${NC}"
    fi
}

check_service "Backend API" "http://localhost:3000/health"
check_service "ML Services" "http://localhost:8000/health"
check_service "Frontend" "http://localhost:5173"

# Display access information
echo ""
echo "===================================="
echo "✨ Platform is ready!"
echo "===================================="
echo ""
echo "📍 Access URLs:"
echo "   Frontend:    http://localhost:5173"
echo "   Backend API: http://localhost:3000"
echo "   API Docs:    http://localhost:3000/api"
echo "   ML Services: http://localhost:8000"
echo "   ML Docs:     http://localhost:8000/docs"
echo ""
echo "📚 Next steps:"
echo "   1. Update environment files with your configuration"
echo "   2. Run database migrations: cd packages/backend && npx prisma migrate deploy"
echo "   3. Deploy smart contracts: cd packages/contracts && npm run deploy:local"
echo "   4. Access the frontend at http://localhost:5173"
echo ""
echo "🛑 To stop all services:"
echo "   docker-compose down"
echo ""
echo "📖 For more information, see README.md"
echo ""
