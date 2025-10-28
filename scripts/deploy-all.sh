#!/bin/bash

echo "🚀 Deploying RWA DeFi Platform"
echo "=============================="

# Check if network is provided
NETWORK=${1:-localhost}
echo "📡 Target Network: $NETWORK"

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo ""
echo "${YELLOW}1️⃣  Compiling Smart Contracts...${NC}"
cd packages/contracts
npm run compile
echo "${GREEN}✅ Contracts compiled${NC}"

echo ""
echo "${YELLOW}2️⃣  Deploying Contracts to $NETWORK...${NC}"
npx hardhat run scripts/deploy.ts --network $NETWORK
echo "${GREEN}✅ Contracts deployed${NC}"

echo ""
echo "${YELLOW}3️⃣  Deploying TrancheFactory...${NC}"
npx hardhat run scripts/deploy-tranche.ts --network $NETWORK
echo "${GREEN}✅ TrancheFactory deployed${NC}"

cd ../..

echo ""
echo "${YELLOW}4️⃣  Running Database Migrations...${NC}"
cd packages/backend
npx prisma migrate deploy
echo "${GREEN}✅ Database migrated${NC}"

echo ""
echo "${YELLOW}5️⃣  Seeding Database...${NC}"
npx prisma db seed
echo "${GREEN}✅ Database seeded${NC}"

cd ../..

echo ""
echo "=============================="
echo "${GREEN}🎉 Deployment Complete!${NC}"
echo "=============================="
echo ""
echo "📝 Next Steps:"
echo "  1. Update .env with deployed contract addresses"
echo "  2. Start backend: cd packages/backend && npm run start"
echo "  3. Start frontend: cd rwa-defi-platform && npm run dev"
echo "  4. Start ML service: cd packages/ml-services && python main.py"
