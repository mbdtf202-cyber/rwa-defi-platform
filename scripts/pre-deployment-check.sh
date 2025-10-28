#!/bin/bash
# Pre-Deployment Checklist Script
# Validates all requirements before mainnet deployment

set -e

echo "🔍 RWA DeFi Platform - Pre-Deployment Check"
echo "============================================="

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Counters
PASSED=0
FAILED=0
WARNINGS=0

# Helper functions
check_pass() {
    echo -e "${GREEN}✓${NC} $1"
    ((PASSED++))
}

check_fail() {
    echo -e "${RED}✗${NC} $1"
    ((FAILED++))
}

check_warn() {
    echo -e "${YELLOW}⚠${NC} $1"
    ((WARNINGS++))
}

echo ""
echo "📋 Section 1: Code Quality"
echo "─────────────────────────────"

# Check if all tests pass
echo -n "Running unit tests... "
cd packages/contracts
if npm run test > /dev/null 2>&1; then
    check_pass "All unit tests passing"
else
    check_fail "Unit tests failing"
fi

# Check test coverage
echo -n "Checking test coverage... "
COVERAGE=$(npm run test:coverage 2>/dev/null | grep "All files" | awk '{print $10}' | tr -d '%')
if [ -z "$COVERAGE" ]; then
    check_warn "Could not determine coverage"
elif [ "$COVERAGE" -ge 90 ]; then
    check_pass "Test coverage: ${COVERAGE}% (>90%)"
else
    check_fail "Test coverage: ${COVERAGE}% (<90%)"
fi

# Check for linting errors
echo -n "Running linter... "
if npm run lint > /dev/null 2>&1; then
    check_pass "No linting errors"
else
    check_warn "Linting warnings found"
fi

# Check for compilation warnings
echo -n "Checking compilation... "
if npm run compile > /dev/null 2>&1; then
    check_pass "Contracts compile without errors"
else
    check_fail "Compilation errors found"
fi

cd ../..

echo ""
echo "🔒 Section 2: Security"
echo "─────────────────────────────"

# Check for npm vulnerabilities
echo -n "Scanning npm dependencies... "
cd packages/contracts
VULNS=$(npm audit --json 2>/dev/null | grep -o '"high":[0-9]*' | cut -d':' -f2 || echo "0")
if [ "$VULNS" -eq 0 ]; then
    check_pass "No high-severity npm vulnerabilities"
else
    check_fail "Found $VULNS high-severity vulnerabilities"
fi

# Check if Slither is available and run it
echo -n "Running Slither analysis... "
if command -v slither &> /dev/null; then
    if slither . --json slither-report.json > /dev/null 2>&1; then
        check_pass "Slither analysis complete"
    else
        check_warn "Slither found potential issues"
    fi
else
    check_warn "Slither not installed (optional)"
fi

cd ../..

echo ""
echo "📄 Section 3: Documentation"
echo "─────────────────────────────"

# Check for required documentation files
REQUIRED_DOCS=(
    "README.md"
    "SECURITY_AUDIT_PREP.md"
    "DEPLOYMENT.md"
    "GETTING_STARTED.md"
)

for doc in "${REQUIRED_DOCS[@]}"; do
    if [ -f "$doc" ]; then
        check_pass "Found $doc"
    else
        check_fail "Missing $doc"
    fi
done

# Check if contracts have NatSpec comments
echo -n "Checking NatSpec documentation... "
CONTRACTS_WITH_NATSPEC=$(grep -r "@title\|@notice\|@dev" packages/contracts/contracts/*.sol | wc -l)
if [ "$CONTRACTS_WITH_NATSPEC" -gt 20 ]; then
    check_pass "Contracts have NatSpec documentation"
else
    check_warn "Limited NatSpec documentation"
fi

echo ""
echo "🧪 Section 4: Testing"
echo "─────────────────────────────"

# Check if integration tests exist
if [ -d "packages/contracts/test/integration" ]; then
    check_pass "Integration tests present"
else
    check_warn "No integration tests found"
fi

# Check if E2E tests exist
if [ -f "packages/backend/test/app.e2e-spec.ts" ]; then
    check_pass "E2E tests present"
else
    check_warn "No E2E tests found"
fi

# Check if testnet deployment was done
if [ -f "packages/contracts/deployments/sepolia.json" ]; then
    check_pass "Testnet deployment completed"
else
    check_fail "No testnet deployment found"
fi

echo ""
echo "⚙️  Section 5: Configuration"
echo "─────────────────────────────"

# Check for production environment files
if [ -f "packages/contracts/.env.production.example" ]; then
    check_pass "Production env example exists"
else
    check_warn "No production env example"
fi

# Check if deployment scripts exist
REQUIRED_SCRIPTS=(
    "packages/contracts/scripts/deploy-production.ts"
    "packages/contracts/scripts/verify-contracts.ts"
)

for script in "${REQUIRED_SCRIPTS[@]}"; do
    if [ -f "$script" ]; then
        check_pass "Found $(basename $script)"
    else
        check_fail "Missing $(basename $script)"
    fi
done

# Check hardhat config
if grep -q "mainnet" packages/contracts/hardhat.config.ts; then
    check_pass "Mainnet configuration present"
else
    check_fail "No mainnet configuration"
fi

echo ""
echo "🔐 Section 6: Access Control"
echo "─────────────────────────────"

# Check if Timelock is implemented
if [ -f "packages/contracts/contracts/Timelock.sol" ]; then
    check_pass "Timelock contract exists"
else
    check_fail "No Timelock contract"
fi

# Check for role-based access control
if grep -r "AccessControl" packages/contracts/contracts/*.sol > /dev/null; then
    check_pass "Access control implemented"
else
    check_fail "No access control found"
fi

# Check for pausable functionality
if grep -r "Pausable" packages/contracts/contracts/*.sol > /dev/null; then
    check_pass "Pausable functionality present"
else
    check_warn "No pausable functionality"
fi

echo ""
echo "📊 Section 7: Monitoring & Backup"
echo "─────────────────────────────"

# Check for monitoring configuration
if [ -d "k8s/production" ]; then
    check_pass "Production k8s configs exist"
else
    check_warn "No production k8s configs"
fi

# Check for backup procedures
if grep -q "backup" README.md || grep -q "backup" DEPLOYMENT.md; then
    check_pass "Backup procedures documented"
else
    check_warn "No backup procedures documented"
fi

# Check for monitoring setup
if [ -d "k8s/production/logging" ]; then
    check_pass "Logging infrastructure configured"
else
    check_warn "No logging infrastructure"
fi

echo ""
echo "🎯 Section 8: Audit Status"
echo "─────────────────────────────"

# Check if audit report exists
if [ -f "audit-report.pdf" ] || [ -f "AUDIT_REPORT.md" ]; then
    check_pass "Audit report available"
else
    check_fail "No audit report found"
fi

# Check if audit issues are resolved
if [ -f "AUDIT_FIXES.md" ]; then
    check_pass "Audit fixes documented"
else
    check_warn "No audit fixes documentation"
fi

echo ""
echo "═══════════════════════════════════════════"
echo "📈 Summary"
echo "═══════════════════════════════════════════"
echo -e "${GREEN}Passed:${NC}   $PASSED"
echo -e "${YELLOW}Warnings:${NC} $WARNINGS"
echo -e "${RED}Failed:${NC}   $FAILED"
echo ""

# Determine overall status
if [ $FAILED -eq 0 ]; then
    if [ $WARNINGS -eq 0 ]; then
        echo -e "${GREEN}✓ All checks passed! Ready for deployment.${NC}"
        exit 0
    else
        echo -e "${YELLOW}⚠ All critical checks passed, but there are warnings.${NC}"
        echo "Review warnings before proceeding with deployment."
        exit 0
    fi
else
    echo -e "${RED}✗ Deployment blocked! Fix failed checks before proceeding.${NC}"
    exit 1
fi
