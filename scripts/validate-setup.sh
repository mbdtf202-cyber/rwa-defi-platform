#!/bin/bash

# 项目设置验证脚本

echo "🔍 验证 RWA DeFi Platform 项目设置..."
echo ""

# 颜色
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

ERRORS=0
WARNINGS=0

# 检查 Node.js
echo "📦 检查 Node.js..."
if command -v node &> /dev/null; then
    NODE_VERSION=$(node -v)
    echo -e "${GREEN}✓${NC} Node.js $NODE_VERSION"
else
    echo -e "${RED}✗${NC} Node.js 未安装"
    ((ERRORS++))
fi

# 检查 npm
echo "📦 检查 npm..."
if command -v npm &> /dev/null; then
    NPM_VERSION=$(npm -v)
    echo -e "${GREEN}✓${NC} npm $NPM_VERSION"
else
    echo -e "${RED}✗${NC} npm 未安装"
    ((ERRORS++))
fi

# 检查 Python
echo "🐍 检查 Python..."
if command -v python3 &> /dev/null; then
    PYTHON_VERSION=$(python3 --version)
    echo -e "${GREEN}✓${NC} $PYTHON_VERSION"
else
    echo -e "${RED}✗${NC} Python3 未安装"
    ((ERRORS++))
fi

# 检查依赖
echo ""
echo "📦 检查项目依赖..."

if [ -d "node_modules" ]; then
    echo -e "${GREEN}✓${NC} 根目录依赖已安装"
else
    echo -e "${YELLOW}⚠${NC} 根目录依赖未安装"
    ((WARNINGS++))
fi

if [ -d "packages/contracts/node_modules" ]; then
    echo -e "${GREEN}✓${NC} 合约依赖已安装"
else
    echo -e "${YELLOW}⚠${NC} 合约依赖未安装"
    ((WARNINGS++))
fi

if [ -d "packages/backend/node_modules" ]; then
    echo -e "${GREEN}✓${NC} 后端依赖已安装"
else
    echo -e "${YELLOW}⚠${NC} 后端依赖未安装"
    ((WARNINGS++))
fi

if [ -d "rwa-defi-platform/node_modules" ]; then
    echo -e "${GREEN}✓${NC} 前端依赖已安装"
else
    echo -e "${YELLOW}⚠${NC} 前端依赖未安装"
    ((WARNINGS++))
fi

# 检查配置文件
echo ""
echo "⚙️  检查配置文件..."

if [ -f ".env" ]; then
    echo -e "${GREEN}✓${NC} .env 文件存在"
else
    echo -e "${YELLOW}⚠${NC} .env 文件不存在"
    ((WARNINGS++))
fi

if [ -f "packages/contracts/hardhat.config.ts" ]; then
    echo -e "${GREEN}✓${NC} Hardhat 配置存在"
else
    echo -e "${RED}✗${NC} Hardhat 配置缺失"
    ((ERRORS++))
fi

if [ -f "packages/backend/prisma/schema.prisma" ]; then
    echo -e "${GREEN}✓${NC} Prisma schema 存在"
else
    echo -e "${RED}✗${NC} Prisma schema 缺失"
    ((ERRORS++))
fi

# 检查编译产物
echo ""
echo "🔨 检查编译产物..."

if [ -d "packages/contracts/artifacts" ]; then
    echo -e "${GREEN}✓${NC} 合约已编译"
else
    echo -e "${YELLOW}⚠${NC} 合约未编译"
    ((WARNINGS++))
fi

if [ -d "packages/contracts/typechain-types" ]; then
    echo -e "${GREEN}✓${NC} TypeChain 类型已生成"
else
    echo -e "${YELLOW}⚠${NC} TypeChain 类型未生成"
    ((WARNINGS++))
fi

# 检查 Docker
echo ""
echo "🐳 检查 Docker..."
if command -v docker &> /dev/null; then
    echo -e "${GREEN}✓${NC} Docker 已安装"
    if docker ps &> /dev/null; then
        echo -e "${GREEN}✓${NC} Docker 正在运行"
    else
        echo -e "${YELLOW}⚠${NC} Docker 未运行"
        ((WARNINGS++))
    fi
else
    echo -e "${YELLOW}⚠${NC} Docker 未安装 (可选)"
fi

# 总结
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
if [ $ERRORS -eq 0 ] && [ $WARNINGS -eq 0 ]; then
    echo -e "${GREEN}✓ 所有检查通过！项目设置完整。${NC}"
elif [ $ERRORS -eq 0 ]; then
    echo -e "${YELLOW}⚠ 有 $WARNINGS 个警告，但可以继续。${NC}"
else
    echo -e "${RED}✗ 发现 $ERRORS 个错误和 $WARNINGS 个警告。${NC}"
    echo "请先解决错误再继续。"
fi
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

exit $ERRORS
