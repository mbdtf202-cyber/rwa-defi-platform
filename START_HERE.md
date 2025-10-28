# 🚀 开始使用 RWA DeFi Platform

## 快速启动（5分钟）

### 前置要求
```bash
✅ Node.js >= 20.0.0
✅ Python >= 3.11
✅ PostgreSQL >= 15
✅ Redis >= 7
```

### 一键启动

```bash
# 1. 安装所有依赖
npm install

# 2. 配置环境变量
cp packages/backend/.env.example packages/backend/.env
cp packages/contracts/.env.example packages/contracts/.env
cp rwa-defi-platform/.env.example rwa-defi-platform/.env

# 3. 启动所有服务
./scripts/deploy-all.sh development
```

### 访问应用

- 🎨 **前端**: http://localhost:5173
- 🖥️ **后端 API**: http://localhost:3000
- 🤖 **ML API**: http://localhost:8000
- 📊 **API 文档**: http://localhost:3000/api

---

## 详细步骤

### 1. 克隆项目

```bash
git clone <repository-url>
cd rwa-defi-platform
```

### 2. 安装依赖

```bash
# 安装所有包
npm install

# 或分别安装
cd packages/contracts && npm install
cd ../backend && npm install
cd ../../rwa-defi-platform && npm install
cd ../packages/ml-services && pip install -r requirements.txt
```

### 3. 配置数据库

```bash
# 启动 PostgreSQL
# macOS: brew services start postgresql
# Linux: sudo systemctl start postgresql

# 创建数据库
createdb rwa_platform_dev

# 运行迁移
cd packages/backend
npm run prisma:migrate:dev
npm run prisma:seed
```

### 4. 启动智能合约本地节点

```bash
cd packages/contracts
npx hardhat node
```

在新终端中部署合约：

```bash
cd packages/contracts
npm run deploy:local
```

### 5. 启动后端服务

```bash
cd packages/backend
npm run start:dev
```

### 6. 启动 ML 服务

```bash
cd packages/ml-services
python main.py
```

### 7. 启动前端

```bash
cd rwa-defi-platform
npm run dev
```

---

## 测试

### 运行所有测试

```bash
./scripts/e2e-test.sh
```

### 分别测试

```bash
# 智能合约测试
cd packages/contracts
npm test

# 后端测试
cd packages/backend
npm test

# 前端测试
cd rwa-defi-platform
npm test
```

---

## 部署

### 测试网部署

```bash
# 1. 获取测试网 ETH
# 访问: https://faucet.quicknode.com/arbitrum/sepolia

# 2. 配置环境变量
# 编辑 packages/contracts/.env
# 添加 PRIVATE_KEY 和 ARBITRUM_SEPOLIA_RPC_URL

# 3. 部署
./scripts/deploy-all.sh testnet
```

### 生产部署

```bash
# ⚠️ 仅在安全审计通过后执行！
./scripts/deploy-all.sh production
```

---

## 常见问题

### 数据库连接失败

```bash
# 检查 PostgreSQL 是否运行
pg_isready

# 检查连接字符串
echo $DATABASE_URL
```

### 端口已被占用

```bash
# 查找占用端口的进程
lsof -i :3000  # 后端
lsof -i :5173  # 前端
lsof -i :8000  # ML 服务

# 终止进程
kill -9 <PID>
```

### 合约部署失败

```bash
# 清除缓存
cd packages/contracts
npx hardhat clean
npm run compile

# 重新部署
npm run deploy:local
```

---

## 项目结构

```
rwa-defi-platform/
├── packages/
│   ├── contracts/          # 智能合约
│   │   ├── contracts/      # Solidity 合约
│   │   ├── test/           # 合约测试
│   │   └── scripts/        # 部署脚本
│   │
│   ├── backend/            # 后端服务
│   │   ├── src/
│   │   │   ├── modules/    # 功能模块
│   │   │   └── common/     # 共享代码
│   │   └── test/           # 后端测试
│   │
│   └── ml-services/        # ML 服务
│       ├── main.py         # FastAPI 应用
│       └── models/         # ML 模型
│
├── rwa-defi-platform/      # 前端应用
│   ├── src/
│   │   ├── components/     # React 组件
│   │   ├── hooks/          # 自定义 hooks
│   │   └── store/          # 状态管理
│   └── public/             # 静态资源
│
├── k8s/                    # Kubernetes 配置
├── scripts/                # 自动化脚本
└── docs/                   # 文档
```

---

## 开发工作流

### 1. 创建新功能

```bash
# 创建新分支
git checkout -b feature/your-feature

# 开发...

# 运行测试
npm test

# 提交
git add .
git commit -m "feat: add your feature"
git push origin feature/your-feature
```

### 2. 代码审查

- 创建 Pull Request
- 等待 CI/CD 通过
- 请求代码审查
- 合并到主分支

### 3. 部署

```bash
# 自动部署（通过 CI/CD）
git push origin main

# 或手动部署
./scripts/deploy-all.sh production
```

---

## 有用的命令

### 智能合约

```bash
# 编译
npm run compile

# 测试
npm test

# 部署
npm run deploy:testnet

# 验证
npm run verify:deployment
```

### 后端

```bash
# 开发模式
npm run start:dev

# 生产构建
npm run build
npm run start:prod

# 数据库
npm run prisma:studio
npm run prisma:migrate:dev
```

### 前端

```bash
# 开发模式
npm run dev

# 生产构建
npm run build
npm run preview
```

### ML 服务

```bash
# 启动服务
python main.py

# 训练模型
python train_models.py

# 测试 API
curl http://localhost:8000/health
```

---

## 获取帮助

### 文档
- 📖 [完整文档](./README.md)
- 🚀 [部署指南](./QUICK_DEPLOYMENT_GUIDE.md)
- 📊 [API 文档](http://localhost:3000/api)

### 支持
- 💬 GitHub Issues
- 📧 Email: support@rwa-platform.com
- 💬 Discord: [链接]

---

## 下一步

1. ✅ 完成快速启动
2. 📖 阅读[完整文档](./README.md)
3. 🧪 运行测试
4. 🚀 部署到测试网
5. 🎉 开始开发！

---

**祝你开发愉快！** 🎉
