# RWA DeFi Platform - 真实资产 + DeFi + AI 一体化平台

## 项目概述

这是一个创新的 RWA（真实物业资产）+ DeFi + AI 一体化平台，通过合规的 SPV 结构将真实物业资产上链，结合 DeFi 流动性机制和 AI 智能分析，打造下一代资产金融化平台。

## 核心特性

### 🏢 真实资产代币化
- 权限性 RWA Token（ERC-3643/ERC-1400）
- SPV 结构确保法律合规
- 透明的 NAV 计算与分红机制
- KYC/AML 全流程监管

### 💎 DeFi 深度集成
- 受限 AMM 流动性池
- 多策略智能金库（Vaults）
- 分层证券化（Tranches）
- 抵押借贷协议
- 自动做市与收益优化

### 🤖 AI 智能驱动
- 实时资产估值引擎（AVM）
- 智能风控与动态 LTV
- 预测性维护（IoT + CV）
- 强化学习做市策略
- 个性化投资推荐

## 技术栈

- **前端框架**: React 18 + TypeScript
- **构建工具**: Vite
- **UI 库**: Tailwind CSS
- **动画**: Framer Motion
- **图表**: Recharts
- **状态管理**: TanStack Query
- **图标**: Lucide React

## 快速开始

### 安装依赖

```bash
npm install
```

### 启动开发服务器

```bash
npm run dev
```

访问 http://localhost:5173 查看应用

### 构建生产版本

```bash
npm run build
```

### 预览生产构建

```bash
npm run preview
```

## 项目结构

```
rwa-defi-platform/
├── src/
│   ├── components/          # React 组件
│   │   ├── Navbar.tsx      # 导航栏
│   │   ├── Hero.tsx        # 首页英雄区
│   │   ├── Dashboard.tsx   # 投资仪表盘
│   │   ├── PropertyMarket.tsx  # 资产市场
│   │   ├── DeFiVaults.tsx  # DeFi 金库
│   │   ├── AIInsights.tsx  # AI 洞察
│   │   └── Footer.tsx      # 页脚
│   ├── types/              # TypeScript 类型定义
│   ├── utils/              # 工具函数
│   ├── App.tsx             # 主应用组件
│   ├── main.tsx            # 应用入口
│   └── index.css           # 全局样式
├── public/                 # 静态资源
├── index.html             # HTML 模板
├── tailwind.config.js     # Tailwind 配置
├── tsconfig.json          # TypeScript 配置
└── package.json           # 项目依赖
```

## 核心页面

### 1. 首页（Hero）
- 平台介绍与核心价值主张
- 关键数据统计展示
- 四大核心特性卡片
- 精美动画与交互效果

### 2. 投资仪表盘（Dashboard）
- 投资组合总览
- 实时 NAV 与收益图表
- 持仓明细与分配比例
- 收益趋势分析

### 3. 资产市场（Property Market）
- 全球优质物业资产展示
- 资产筛选（商业/住宅）
- 详细资产信息卡片
- 投资者数量与入住率

### 4. DeFi 金库（Vaults）
- 多策略智能金库
- 风险等级分类
- TVL 与 APY 实时展示
- 灵活锁定期选择

### 5. AI 洞察（AI Insights）
- AI 估值预测 vs 实际对比
- 综合风险评分雷达图
- 智能投资建议
- 预测性维护提醒

## 设计亮点

### 🎨 视觉设计
- 深色主题配色方案
- 渐变色彩系统
- 玻璃态（Glassmorphism）卡片
- 响应式布局设计

### ✨ 动画效果
- 页面切换过渡动画
- 组件进入动画
- 悬停交互效果
- 数据可视化动画
- 加载状态动画

### 🎯 用户体验
- 直观的导航系统
- 清晰的信息层级
- 流畅的交互反馈
- 移动端适配

## 下一步开发计划

### 智能合约集成
- [ ] 连接 Web3 钱包（MetaMask, WalletConnect）
- [ ] 权限性 Token 合约交互
- [ ] Vault 存取款功能
- [ ] 借贷协议集成

### 后端 API
- [ ] 用户认证与 KYC 流程
- [ ] 资产数据 API
- [ ] 交易历史记录
- [ ] 实时价格 Oracle

### AI 功能
- [ ] 估值模型 API 集成
- [ ] 风控评分系统
- [ ] 预测性分析仪表盘
- [ ] 个性化推荐引擎

### 合规功能
- [ ] KYC/AML 验证流程
- [ ] 投资者资格审核
- [ ] 文档管理系统
- [ ] 审计报告生成

## 贡献指南

欢迎提交 Issue 和 Pull Request！

## 许可证

MIT License

## 联系方式

- 网站: https://rwa-defi.example.com
- Email: contact@rwa-defi.example.com
- Twitter: @RWADeFi

---

Built with ❤️ using React, TypeScript & Framer Motion
