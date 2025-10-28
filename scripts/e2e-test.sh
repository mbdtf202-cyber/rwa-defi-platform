#!/bin/bash

# End-to-End Test Script for RWA DeFi Platform
# This script tests the complete user flow

set -e

echo "🧪 Starting End-to-End Tests..."
echo "================================"

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test counter
TESTS_PASSED=0
TESTS_FAILED=0

# Function to run test
run_test() {
    local test_name=$1
    local test_command=$2
    
    echo -e "\n${YELLOW}Testing: ${test_name}${NC}"
    
    if eval "$test_command"; then
        echo -e "${GREEN}✓ PASSED${NC}"
        ((TESTS_PASSED++))
        return 0
    else
        echo -e "${RED}✗ FAILED${NC}"
        ((TESTS_FAILED++))
        return 1
    fi
}

# 1. Test Smart Contracts
echo -e "\n📝 Phase 1: Smart Contract Tests"
echo "================================"

run_test "Compile contracts" "cd packages/contracts && npm run compile"
run_test "Run contract tests" "cd packages/contracts && npm test"

# 2. Test Backend Services
echo -e "\n🖥️  Phase 2: Backend Service Tests"
echo "================================"

run_test "Backend build" "cd packages/backend && npm run build"
run_test "Backend unit tests" "cd packages/backend && npm test"

# 3. Test Frontend
echo -e "\n🎨 Phase 3: Frontend Tests"
echo "================================"

run_test "Frontend build" "cd rwa-defi-platform && npm run build"

# 4. Test ML Services
echo -e "\n🤖 Phase 4: ML Service Tests"
echo "================================"

run_test "ML service health check" "python3 -c 'import packages.ml_services.main as ml; print(\"ML services OK\")'"

# Summary
echo -e "\n📊 Test Summary"
echo "================================"
echo -e "Tests Passed: ${GREEN}${TESTS_PASSED}${NC}"
echo -e "Tests Failed: ${RED}${TESTS_FAILED}${NC}"
echo -e "Total Tests: $((TESTS_PASSED + TESTS_FAILED))"

if [ $TESTS_FAILED -eq 0 ]; then
    echo -e "\n${GREEN}✓ All tests passed!${NC}"
    exit 0
else
    echo -e "\n${RED}✗ Some tests failed${NC}"
    exit 1
fi
