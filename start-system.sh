#!/bin/bash
set -e

echo "🚀 Starting RWA DeFi Platform..."

# Kill any existing processes
pkill -f "hardhat node" || true
pkill -f "nest start" || true
pkill -f "vite" || true
pkill -f "python.*main.py" || true

# Start Hardhat node
echo "Starting Hardhat node..."
cd packages/contracts
npx hardhat node > /tmp/hardhat.log 2>&1 &
HARDHAT_PID=$!
cd ../..
sleep 3

# Deploy contracts
echo "Deploying contracts..."
cd packages/contracts
npx hardhat run scripts/deploy.ts --network localhost > /tmp/deploy.log 2>&1
cd ../..

# Start backend
echo "Starting backend..."
cd packages/backend
npm run start:dev > /tmp/backend.log 2>&1 &
BACKEND_PID=$!
cd ../..
sleep 5

# Start ML services
echo "Starting ML services..."
cd packages/ml-services
python3 main.py > /tmp/ml.log 2>&1 &
ML_PID=$!
cd ../..
sleep 3

# Start frontend
echo "Starting frontend..."
cd rwa-defi-platform
npm run dev > /tmp/frontend.log 2>&1 &
FRONTEND_PID=$!
cd ..

echo ""
echo "✅ System started!"
echo ""
echo "Services:"
echo "  Frontend:  http://localhost:5173"
echo "  Backend:   http://localhost:3000"
echo "  ML API:    http://localhost:8000"
echo ""
echo "PIDs:"
echo "  Hardhat:   $HARDHAT_PID"
echo "  Backend:   $BACKEND_PID"
echo "  ML:        $ML_PID"
echo "  Frontend:  $FRONTEND_PID"
echo ""
echo "Logs:"
echo "  tail -f /tmp/hardhat.log"
echo "  tail -f /tmp/backend.log"
echo "  tail -f /tmp/ml.log"
echo "  tail -f /tmp/frontend.log"
echo ""
echo "To stop: kill $HARDHAT_PID $BACKEND_PID $ML_PID $FRONTEND_PID"
