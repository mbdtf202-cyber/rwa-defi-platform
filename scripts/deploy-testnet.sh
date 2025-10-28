#!/bin/bash
# RWA DeFi Platform - Testnet Deployment Script
# This script deploys all contracts to Sepolia testnet and runs integration tests

set -e

echo "🚀 Starting RWA DeFi Platform Testnet Deployment"
echo "=================================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo -e "${RED}❌ Error: Please run this script from the project root directory${NC}"
    exit 1
fi

# Check if required environment variables are set
if [ ! -f "packages/contracts/.env.sepolia" ]; then
    echo -e "${RED}❌ Error: .env.sepolia file not found${NC}"
    echo "Please create packages/contracts/.env.sepolia with your configuration"
    exit 1
fi

echo -e "${BLUE}📋 Pre-deployment Checklist${NC}"
echo "================================"

# Step 1: Install dependencies
echo -e "${YELLOW}1. Installing dependencies...${NC}"
npm install
if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Dependency installation failed${NC}"
    exit 1
fi
echo -e "${GREEN}✅ Dependencies installed${NC}"

# Step 2: Compile contracts
echo -e "${YELLOW}2. Compiling contracts...${NC}"
cd packages/contracts
npm run compile
if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Contract compilation failed${NC}"
    exit 1
fi
echo -e "${GREEN}✅ Contracts compiled successfully${NC}"

# Step 3: Run tests
echo -e "${YELLOW}3. Running unit tests...${NC}"
npm run test
if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Unit tests failed${NC}"
    exit 1
fi
echo -e "${GREEN}✅ All unit tests passed${NC}"

# Step 4: Deploy to Sepolia
echo -e "${YELLOW}4. Deploying to Sepolia testnet...${NC}"
npx hardhat run scripts/deploy-production.ts --network sepolia
if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Deployment failed${NC}"
    exit 1
fi
echo -e "${GREEN}✅ Deployment successful${NC}"

# Step 5: Verify contracts
echo -e "${YELLOW}5. Verifying contracts on Etherscan...${NC}"
sleep 10 # Wait for Etherscan to index
npx hardhat run scripts/verify-contracts.ts --network sepolia
if [ $? -ne 0 ]; then
    echo -e "${YELLOW}⚠️  Contract verification failed (this is non-critical)${NC}"
else
    echo -e "${GREEN}✅ Contracts verified successfully${NC}"
fi

cd ../..

# Step 6: Generate deployment report
echo -e "${YELLOW}6. Generating deployment report...${NC}"
DEPLOYMENT_FILE="packages/contracts/deployments/sepolia.json"
if [ -f "$DEPLOYMENT_FILE" ]; then
    echo -e "${GREEN}✅ Deployment addresses saved to $DEPLOYMENT_FILE${NC}"
    echo -e "\n${BLUE}📄 Deployment Summary${NC}"
    echo "======================"
    cat $DEPLOYMENT_FILE | python3 -m json.tool
else
    echo -e "${RED}❌ Deployment file not found${NC}"
    exit 1
fi

echo -e "\n${GREEN}🎉 Testnet Deployment Complete!${NC}"
echo "=================================="
echo -e "${BLUE}Next Steps:${NC}"
echo "1. Update .env files with your actual API keys"
echo "2. Start backend: cd packages/backend && npm run start:dev"
echo "3. Start frontend: cd rwa-defi-platform && npm run dev"
echo "4. Test the application manually"
echo ""
echo -e "${BLUE}Useful Links:${NC}"
echo "- Sepolia Etherscan: https://sepolia.etherscan.io/"
echo "- Sepolia Faucet: https://sepoliafaucet.com/"
echo "- Contract addresses: packages/contracts/deployments/sepolia.json"
echo ""
echo -e "${YELLOW}⚠️  Remember: This is testnet deployment. Do not use real funds!${NC}"
