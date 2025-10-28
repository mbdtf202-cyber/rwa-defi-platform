# 🚀 RWA DeFi Platform - 快速参考指南

## 📋 常用命令

### 项目设置
```bash
# 完整设置
./scripts/setup-project.sh

# 快速启动
./scripts/quick-start.sh

# 运行所有测试
./scripts/test-all.sh
```

### 智能合约
```bash
cd packages/contracts

# 编译
npx hardhat compile

# 测试
npx hardhat test

# 部署到本地
npx hardhat run scripts/deploy.ts --network localhost

# 部署到测试网
npx hardhat run scripts/deploy.ts --network sepolia

# 验证合约
npx hardhat run scripts/verify.ts --network sepolia
```

### 后端服务
```bash
cd packages/backend

# 开发模式
npm run dev

# 生成 Prisma Client
npx prisma generate

# 运行迁移
npx prisma migrate dev

# 查看数据库
npx prisma studio

# 运行测试
npm run test

# 构建
npm run build

# 生产模式
npm run start
```

### 前端应用
```bash
cd rwa-defi-platform

# 开发模式
npm run dev

# 构建
npm run build

# 预览构建
npm run preview

# Lint
npm run lint
```

### ML服务
```bash
cd packages/ml-services

# 安装依赖
pip install -r requirements.txt

# 启动服务
python main.py

# 运行测试
pytest
```

### Docker
```bash
# 启动所有服务
docker-compose up -d

# 查看日志
docker-compose logs -f

# 停止服务
docker-compose down

# 重建镜像
docker-compose build

# 只启动数据库
docker-compose up -d postgres redis
```

### Kubernetes
```bash
# 应用配置
kubectl apply -f k8s/

# 查看 Pods
kubectl get pods

# 查看服务
kubectl get services

# 查看日志
kubectl logs -f <pod-name>

# 删除部署
kubectl delete -f k8s/
```

## 🔗 重要URL

### 开发环境
- **前端**: http://localhost:5173
- **后端 API**: http://localhost:3000/api/v1
- **ML API**: http://localhost:8000
- **ML API 文档**: http://localhost:8000/docs
- **Prisma Studio**: http://localhost:5555
- **本地区块链**: http://localhost:8545

### 监控
- **Prometheus**: http://localhost:9090
- **Grafana**: http://localhost:3001

## 📁 项目结构

```
rwa-defi-platform/
├── packages/
│   ├── contracts/          # 智能合约
│   │   ├── contracts/      # Solidity 合约
│   │   ├── test/           # 合约测试
│   │   └── scripts/        # 部署脚本
│   ├── backend/            # 后端服务
│   │   ├── src/
│   │   │   ├── modules/    # 功能模块
│   │   │   └── common/     # 共享代码
│   │   ├── prisma/         # 数据库 Schema
│   │   └── test/           # 测试
│   └── ml-services/        # ML 服务
│       └── main.py         # FastAPI 应用
├── rwa-defi-platform/      # 前端应用
│   └── src/
│       ├── components/     # React 组件
│       └── utils/          # 工具函数
├── k8s/                    # Kubernetes 配置
├── scripts/                # 实用脚本
└── .github/workflows/      # CI/CD
```

## 🔑 环境变量

### 必需变量
```bash
DATABASE_URL=postgresql://...
JWT_SECRET=your-secret
PRIVATE_KEY=0x...
```

### 可选变量
```bash
ONFIDO_API_KEY=...
STRIPE_SECRET_KEY=...
IPFS_API_URL=...
```

查看 `.env.example` 获取完整列表

## 🧪 测试

### 运行特定测试
```bash
# 单个合约测试
npx hardhat test test/PermissionedToken.test.ts

# 带覆盖率
npx hardhat coverage

# 后端特定测试
npm run test -- auth.service.spec.ts

# 前端组件测试
npm run test -- Dashboard.test.tsx
```

## 🐛 调试

### 后端调试
```bash
# 启用调试日志
NODE_ENV=development DEBUG=* npm run dev
```

### 合约调试
```bash
# 启用 Hardhat console
npx hardhat console --network localhost

# 查看 Gas 报告
REPORT_GAS=true npx hardhat test
```

### 前端调试
- 使用浏览器 DevTools
- React DevTools 扩展
- Redux DevTools (如果使用)

## 📊 监控和日志

### 查看日志
```bash
# 后端日志
tail -f packages/backend/logs/app.log

# Docker 日志
docker-compose logs -f backend

# Kubernetes 日志
kubectl logs -f deployment/backend
```

### 健康检查
```bash
# 后端健康
curl http://localhost:3000/health

# ML 服务健康
curl http://localhost:8000/health
```

## 🔧 故障排除

### 常见问题

**问题**: 合约编译失败  
**解决**: 
```bash
cd packages/contracts
rm -rf cache artifacts
npx hardhat clean
npx hardhat compile
```

**问题**: 数据库连接失败  
**解决**:
```bash
# 检查 PostgreSQL 是否运行
docker-compose ps postgres

# 重启数据库
docker-compose restart postgres
```

**问题**: 前端构建失败  
**解决**:
```bash
cd rwa-defi-platform
rm -rf node_modules dist
npm install
npm run build
```

**问题**: 端口已被占用  
**解决**:
```bash
# 查找占用端口的进程
lsof -i :3000

# 杀死进程
kill -9 <PID>
```

## 📚 文档链接

- [README.md](README.md) - 项目概述
- [GETTING_STARTED.md](GETTING_STARTED.md) - 快速开始
- [PROJECT_STATUS.md](PROJECT_STATUS.md) - 项目状态
- [DEPLOYMENT.md](DEPLOYMENT.md) - 部署指南
- [CONTRIBUTING.md](CONTRIBUTING.md) - 贡献指南
- [PROJECT_ENHANCEMENT_PLAN.md](PROJECT_ENHANCEMENT_PLAN.md) - 完善计划
- [PROJECT_COMPLETION_REPORT.md](PROJECT_COMPLETION_REPORT.md) - 完成报告

## 🆘 获取帮助

1. 查看相关文档
2. 检查 GitHub Issues
3. 查看错误日志
4. 运行诊断脚本

## 🎯 快速任务清单

### 首次设置
- [ ] 克隆仓库
- [ ] 安装依赖: `npm install`
- [ ] 复制环境变量: `cp .env.example .env`
- [ ] 启动数据库: `docker-compose up -d postgres redis`
- [ ] 运行迁移: `cd packages/backend && npx prisma migrate dev`
- [ ] 编译合约: `cd packages/contracts && npx hardhat compile`

### 日常开发
- [ ] 启动后端: `cd packages/backend && npm run dev`
- [ ] 启动ML服务: `cd packages/ml-services && python main.py`
- [ ] 启动前端: `cd rwa-defi-platform && npm run dev`
- [ ] 运行测试: `npm run test`

### 部署前
- [ ] 运行所有测试
- [ ] 检查 Lint
- [ ] 构建所有包
- [ ] 更新文档
- [ ] 创建 Git tag

---

**提示**: 将此文件加入书签以便快速访问！
