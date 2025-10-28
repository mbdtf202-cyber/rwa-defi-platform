# Quick Start Guide / 快速启动指南

## English Version

### 🚀 Frontend is Running!

The RWA DeFi Platform frontend is now accessible at:

**Frontend URL:** http://localhost:5173

### What You Can Do Now

1. **View the Landing Page**
   - Open your browser and navigate to http://localhost:5173
   - Explore the modern UI with property marketplace, DeFi vaults, and AI insights

2. **Connect Your Wallet**
   - Click the "Connect Wallet" button in the navigation bar
   - Use MetaMask or other Web3 wallets to connect

3. **Explore Features**
   - Property Market: Browse tokenized real estate properties
   - DeFi Vaults: View yield-generating vaults
   - Borrow/Lend: Access lending and borrowing features
   - AI Insights: See AI-powered property valuations
   - Admin Panel: Manage SPVs and properties (admin only)

### ⚠️ Backend Status

The backend server is currently experiencing configuration issues. The frontend will display mock data until the backend is fully operational.

**Known Issues:**
- Database connection not configured
- Some services need dependency injection fixes
- IPFS client compatibility with Node.js v24

### 🔧 To Fix Backend Issues

1. **Configure Database**
   ```bash
   # Install PostgreSQL if not already installed
   brew install postgresql@14  # macOS
   
   # Start PostgreSQL
   brew services start postgresql@14
   
   # Create database
   createdb rwa_defi
   
   # Run migrations
   cd packages/backend
   npx prisma migrate dev
   ```

2. **Install Redis**
   ```bash
   brew install redis
   brew services start redis
   ```

3. **Restart Backend**
   ```bash
   cd packages/backend
   npm run dev
   ```

### 📱 Current Features Available (Frontend Only)

- ✅ Modern, responsive UI
- ✅ Wallet connection (RainbowKit)
- ✅ Property marketplace interface
- ✅ DeFi vaults dashboard
- ✅ Borrow/Lend interface
- ✅ AI insights visualization
- ✅ Admin panel UI
- ⏳ Backend API integration (pending)

### 🎯 Next Steps

1. Fix backend configuration issues
2. Connect frontend to backend APIs
3. Test end-to-end user flows
4. Deploy to testnet

---

## 中文版本

### 🚀 前端已启动！

RWA DeFi 平台前端现在可以访问了：

**前端地址:** http://localhost:5173

### 现在可以做什么

1. **查看登陆页面**
   - 打开浏览器访问 http://localhost:5173
   - 探索现代化的UI，包括房产市场、DeFi金库和AI洞察

2. **连接钱包**
   - 点击导航栏中的"连接钱包"按钮
   - 使用MetaMask或其他Web3钱包连接

3. **探索功能**
   - 房产市场：浏览代币化的房地产资产
   - DeFi金库：查看收益生成金库
   - 借贷功能：访问借贷功能
   - AI洞察：查看AI驱动的房产估值
   - 管理面板：管理SPV和房产（仅管理员）

### ⚠️ 后端状态

后端服务器目前遇到配置问题。在后端完全运行之前，前端将显示模拟数据。

**已知问题：**
- 数据库连接未配置
- 某些服务需要依赖注入修复
- IPFS客户端与Node.js v24不兼容

### 🔧 修复后端问题

1. **配置数据库**
   ```bash
   # 如果尚未安装PostgreSQL，请安装
   brew install postgresql@14  # macOS
   
   # 启动PostgreSQL
   brew services start postgresql@14
   
   # 创建数据库
   createdb rwa_defi
   
   # 运行迁移
   cd packages/backend
   npx prisma migrate dev
   ```

2. **安装Redis**
   ```bash
   brew install redis
   brew services start redis
   ```

3. **重启后端**
   ```bash
   cd packages/backend
   npm run dev
   ```

### 📱 当前可用功能（仅前端）

- ✅ 现代化、响应式UI
- ✅ 钱包连接（RainbowKit）
- ✅ 房产市场界面
- ✅ DeFi金库仪表板
- ✅ 借贷界面
- ✅ AI洞察可视化
- ✅ 管理面板UI
- ⏳ 后端API集成（待完成）

### 🎯 下一步

1. 修复后端配置问题
2. 将前端连接到后端API
3. 测试端到端用户流程
4. 部署到测试网

---

## 技术栈 / Tech Stack

### Frontend
- React 19 + TypeScript
- Vite
- TailwindCSS
- Framer Motion
- RainbowKit + Wagmi
- Zustand (State Management)
- Recharts (Data Visualization)

### Backend (In Progress)
- NestJS
- Prisma ORM
- PostgreSQL
- Redis
- Bull (Job Queue)
- Ethers.js

### Smart Contracts
- Solidity
- Hardhat
- OpenZeppelin

---

## 支持 / Support

如果遇到问题，请查看：
- [完整文档](./README.md)
- [部署指南](./DEPLOYMENT.md)
- [故障排除](./GETTING_STARTED.md)

For issues, please refer to:
- [Full Documentation](./README.md)
- [Deployment Guide](./DEPLOYMENT.md)
- [Troubleshooting](./GETTING_STARTED.md)
