#!/bin/bash

# Complete Deployment Script for RWA DeFi Platform
# Deploys all components: contracts, backend, frontend, ML services

set -e

echo "🚀 RWA DeFi Platform - Complete Deployment"
echo "=========================================="

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Configuration
ENVIRONMENT=${1:-"development"}
echo -e "${BLUE}Environment: ${ENVIRONMENT}${NC}\n"

# Step 1: Deploy Smart Contracts
echo -e "${YELLOW}Step 1: Deploying Smart Contracts${NC}"
echo "-----------------------------------"

if [ "$ENVIRONMENT" == "production" ]; then
    echo "Deploying to Arbitrum One (Mainnet)..."
    cd packages/contracts
    npm run deploy:production
elif [ "$ENVIRONMENT" == "testnet" ]; then
    echo "Deploying to Arbitrum Sepolia (Testnet)..."
    cd packages/contracts
    npm run deploy:testnet
else
    echo "Deploying to local network..."
    cd packages/contracts
    npx hardhat node &
    HARDHAT_PID=$!
    sleep 5
    npm run deploy:local
fi

cd ../..
echo -e "${GREEN}✓ Smart contracts deployed${NC}\n"

# Step 2: Setup Database
echo -e "${YELLOW}Step 2: Setting up Database${NC}"
echo "-----------------------------------"

cd packages/backend

if [ ! -f ".env" ]; then
    echo "Creating .env file..."
    cp .env.example .env
fi

echo "Running database migrations..."
npm run prisma:migrate:deploy

echo "Seeding database..."
npm run prisma:seed

cd ../..
echo -e "${GREEN}✓ Database setup complete${NC}\n"

# Step 3: Build and Deploy Backend
echo -e "${YELLOW}Step 3: Deploying Backend Services${NC}"
echo "-----------------------------------"

cd packages/backend

echo "Building backend..."
npm run build

if [ "$ENVIRONMENT" == "production" ] || [ "$ENVIRONMENT" == "testnet" ]; then
    echo "Building Docker image..."
    docker build -t rwa-backend:latest .
    
    echo "Deploying to Kubernetes..."
    kubectl apply -f ../../k8s/production/backend-deployment.yaml
else
    echo "Starting backend in development mode..."
    npm run start:dev &
    BACKEND_PID=$!
fi

cd ../..
echo -e "${GREEN}✓ Backend deployed${NC}\n"

# Step 4: Deploy ML Services
echo -e "${YELLOW}Step 4: Deploying ML Services${NC}"
echo "-----------------------------------"

cd packages/ml-services

if [ "$ENVIRONMENT" == "production" ] || [ "$ENVIRONMENT" == "testnet" ]; then
    echo "Building Docker image..."
    docker build -t rwa-ml-services:latest .
    
    echo "Deploying to Kubernetes..."
    kubectl apply -f ../../k8s/production/ml-services-deployment.yaml
else
    echo "Starting ML services..."
    python3 main.py &
    ML_PID=$!
fi

cd ../..
echo -e "${GREEN}✓ ML services deployed${NC}\n"

# Step 5: Build and Deploy Frontend
echo -e "${YELLOW}Step 5: Deploying Frontend${NC}"
echo "-----------------------------------"

cd rwa-defi-platform

if [ ! -f ".env.production" ]; then
    echo "Creating .env.production file..."
    cp .env.production.example .env.production
fi

echo "Building frontend..."
npm run build

if [ "$ENVIRONMENT" == "production" ] || [ "$ENVIRONMENT" == "testnet" ]; then
    echo "Deploying to CDN..."
    # Add your CDN deployment command here
    # Example: vercel deploy --prod
    echo "Frontend built. Deploy dist/ to your CDN."
else
    echo "Starting frontend preview..."
    npm run preview &
    FRONTEND_PID=$!
fi

cd ..
echo -e "${GREEN}✓ Frontend deployed${NC}\n"

# Step 6: Health Checks
echo -e "${YELLOW}Step 6: Running Health Checks${NC}"
echo "-----------------------------------"

sleep 5

if [ "$ENVIRONMENT" == "development" ]; then
    echo "Checking backend health..."
    curl -f http://localhost:3000/health || echo "Backend not ready yet"
    
    echo "Checking ML services health..."
    curl -f http://localhost:8000/health || echo "ML services not ready yet"
    
    echo "Checking frontend..."
    curl -f http://localhost:5173 || echo "Frontend not ready yet"
fi

echo -e "${GREEN}✓ Health checks complete${NC}\n"

# Summary
echo "=========================================="
echo -e "${GREEN}✓ Deployment Complete!${NC}"
echo "=========================================="

if [ "$ENVIRONMENT" == "development" ]; then
    echo ""
    echo "Services running:"
    echo "  Frontend:  http://localhost:5173"
    echo "  Backend:   http://localhost:3000"
    echo "  ML API:    http://localhost:8000"
    echo ""
    echo "Process IDs:"
    [ ! -z "$HARDHAT_PID" ] && echo "  Hardhat:   $HARDHAT_PID"
    [ ! -z "$BACKEND_PID" ] && echo "  Backend:   $BACKEND_PID"
    [ ! -z "$ML_PID" ] && echo "  ML:        $ML_PID"
    [ ! -z "$FRONTEND_PID" ] && echo "  Frontend:  $FRONTEND_PID"
    echo ""
    echo "To stop all services:"
    echo "  kill $HARDHAT_PID $BACKEND_PID $ML_PID $FRONTEND_PID"
fi

echo ""
echo "Next steps:"
echo "  1. Verify all services are running"
echo "  2. Run end-to-end tests: ./scripts/e2e-test.sh"
echo "  3. Access the application"
echo ""
