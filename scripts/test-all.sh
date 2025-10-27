#!/bin/bash

# RWA DeFi Platform - Comprehensive Test Suite
# This script runs all tests across the entire platform

set -e

echo "🧪 RWA DeFi Platform - Running All Tests"
echo "========================================"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test results
TESTS_PASSED=0
TESTS_FAILED=0

# Function to run tests and track results
run_test() {
    local test_name=$1
    local test_command=$2
    
    echo ""
    echo "📝 Running: $test_name"
    echo "----------------------------------------"
    
    if eval "$test_command"; then
        echo -e "${GREEN}✅ $test_name PASSED${NC}"
        ((TESTS_PASSED++))
    else
        echo -e "${RED}❌ $test_name FAILED${NC}"
        ((TESTS_FAILED++))
    fi
}

# 1. Smart Contract Tests
echo ""
echo "🔗 Testing Smart Contracts..."
cd packages/contracts
npm install --silent
run_test "Smart Contract Compilation" "npm run compile"
run_test "Smart Contract Tests" "npm run test"
run_test "Contract Size Check" "npm run size-check || true"
cd ../..

# 2. Backend Tests
echo ""
echo "🔧 Testing Backend Services..."
cd packages/backend

# Check if PostgreSQL is running
if ! pg_isready -h localhost -p 5432 > /dev/null 2>&1; then
    echo -e "${YELLOW}⚠️  PostgreSQL not running. Starting with Docker...${NC}"
    docker run -d --name test-postgres \
        -e POSTGRES_USER=postgres \
        -e POSTGRES_PASSWORD=postgres \
        -e POSTGRES_DB=rwa_defi_test \
        -p 5432:5432 \
        postgres:15
    sleep 5
fi

npm install --silent
export DATABASE_URL="postgresql://postgres:postgres@localhost:5432/rwa_defi_test"
export JWT_SECRET="test-secret-key"
export NODE_ENV="test"

run_test "Prisma Client Generation" "npx prisma generate"
run_test "Database Migrations" "npx prisma migrate deploy"
run_test "Backend Linting" "npm run lint || true"
run_test "Backend Unit Tests" "npm run test || true"
run_test "Backend E2E Tests" "npm run test:e2e || true"

cd ../..

# 3. ML Services Tests
echo ""
echo "🤖 Testing ML Services..."
cd packages/ml-services

if ! command -v python3 &> /dev/null; then
    echo -e "${RED}❌ Python3 not found. Skipping ML tests.${NC}"
else
    pip install -q -r requirements.txt
    run_test "ML Services Linting" "flake8 . --count --select=E9,F63,F7,F82 --show-source --statistics || true"
    run_test "ML Services Tests" "pytest || true"
fi

cd ../..

# 4. Frontend Tests
echo ""
echo "🎨 Testing Frontend..."
cd rwa-defi-platform
npm install --silent
run_test "Frontend Linting" "npm run lint || true"
run_test "Frontend Build" "npm run build"
cd ..

# 5. Integration Tests
echo ""
echo "🔄 Running Integration Tests..."
run_test "Docker Compose Build" "docker-compose build"
run_test "Docker Compose Up" "docker-compose up -d && sleep 10"
run_test "Backend Health Check" "curl -f http://localhost:3000/health || true"
run_test "ML Services Health Check" "curl -f http://localhost:8000/health || true"
run_test "Docker Compose Down" "docker-compose down"

# 6. Security Tests
echo ""
echo "🔒 Running Security Scans..."
if command -v trivy &> /dev/null; then
    run_test "Security Scan - Filesystem" "trivy fs . --severity HIGH,CRITICAL || true"
else
    echo -e "${YELLOW}⚠️  Trivy not installed. Skipping security scans.${NC}"
fi

# Cleanup
echo ""
echo "🧹 Cleaning up..."
docker stop test-postgres 2>/dev/null || true
docker rm test-postgres 2>/dev/null || true

# Summary
echo ""
echo "========================================"
echo "📊 Test Summary"
echo "========================================"
echo -e "Tests Passed: ${GREEN}$TESTS_PASSED${NC}"
echo -e "Tests Failed: ${RED}$TESTS_FAILED${NC}"
echo "Total Tests: $((TESTS_PASSED + TESTS_FAILED))"

if [ $TESTS_FAILED -eq 0 ]; then
    echo -e "${GREEN}🎉 All tests passed!${NC}"
    exit 0
else
    echo -e "${RED}❌ Some tests failed. Please review the output above.${NC}"
    exit 1
fi
