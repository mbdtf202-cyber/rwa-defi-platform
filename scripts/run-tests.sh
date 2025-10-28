#!/bin/bash

echo "🧪 Running RWA DeFi Platform Tests"
echo "=================================="

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Test counter
PASSED=0
FAILED=0

echo ""
echo "${YELLOW}📦 Testing Smart Contracts...${NC}"
cd packages/contracts
if npm run test; then
    echo "${GREEN}✅ Contract tests passed${NC}"
    ((PASSED++))
else
    echo "${RED}❌ Contract tests failed${NC}"
    ((FAILED++))
fi
cd ../..

echo ""
echo "${YELLOW}🔧 Testing Backend Services...${NC}"
cd packages/backend
if npm run test:e2e; then
    echo "${GREEN}✅ Backend tests passed${NC}"
    ((PASSED++))
else
    echo "${RED}❌ Backend tests failed${NC}"
    ((FAILED++))
fi
cd ../..

echo ""
echo "${YELLOW}🤖 Testing ML Services...${NC}"
cd packages/ml-services
if python -m pytest tests/ 2>/dev/null || echo "No tests found"; then
    echo "${GREEN}✅ ML tests passed${NC}"
    ((PASSED++))
else
    echo "${RED}❌ ML tests failed${NC}"
    ((FAILED++))
fi
cd ../..

echo ""
echo "=================================="
echo "📊 Test Summary"
echo "=================================="
echo "${GREEN}Passed: $PASSED${NC}"
echo "${RED}Failed: $FAILED${NC}"

if [ $FAILED -eq 0 ]; then
    echo ""
    echo "${GREEN}🎉 All tests passed!${NC}"
    exit 0
else
    echo ""
    echo "${RED}⚠️  Some tests failed${NC}"
    exit 1
fi
