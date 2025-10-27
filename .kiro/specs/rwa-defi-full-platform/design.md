# RWA DeFi 平台设计文档

## 概述

本文档描述 RWA（真实物业资产）+ DeFi + AI 一体化平台的技术架构、组件设计、数据模型和实现方案。

## 目录

1. [系统架构](#系统架构)
2. [技术栈](#技术栈)
3. [智能合约设计](#智能合约设计)
4. [后端服务设计](#后端服务设计)
5. [前端架构](#前端架构)
6. [AI/ML 架构](#aiml-架构)
7. [数据模型](#数据模型)
8. [安全设计](#安全设计)
9. [部署架构](#部署架构)
10. [API 设计](#api-设计)

---

## 系统架构

### 高层架构图

```
┌─────────────────────────────────────────────────────────────────┐
│                         前端层 (Frontend)                        │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐       │
│  │ Web App  │  │ Admin    │  │ Mobile   │  │ White    │       │
│  │ (React)  │  │ Panel    │  │ Wallet   │  │ Label    │       │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘       │
└────────────────────────┬────────────────────────────────────────┘
                         │ HTTPS/WebSocket
┌────────────────────────┴────────────────────────────────────────┐
│                      API 网关层 (API Gateway)                    │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  Kong / AWS API Gateway                                   │  │
│  │  - 认证/授权  - 限流  - 日志  - 监控                      │  │
│  └──────────────────────────────────────────────────────────┘  │
└────────────────────────┬────────────────────────────────────────┘
                         │
┌────────────────────────┴────────────────────────────────────────┐
│                      业务服务层 (Services)                       │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐       │
│  │ User     │  │ SPV      │  │ Token    │  │ Payment  │       │
│  │ Service  │  │ Service  │  │ Service  │  │ Service  │       │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘       │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐       │
│  │ KYC      │  │ Oracle   │  │ Audit    │  │ Market   │       │
│  │ Service  │  │ Service  │  │ Service  │  │ Service  │       │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘       │
└────────────────────────┬────────────────────────────────────────┘
                         │
┌────────────────────────┴────────────────────────────────────────┐
│                      AI/ML 服务层 (AI Services)                  │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐       │
│  │ AVM      │  │ Risk     │  │ Market   │  │ Predict  │       │
│  │ Engine   │  │ Scoring  │  │ Making   │  │ Maintain │       │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘       │
└────────────────────────┬────────────────────────────────────────┘
                         │
┌────────────────────────┴────────────────────────────────────────┐
│                      数据层 (Data Layer)                         │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐       │
│  │ PostgreSQL│ │ Redis    │  │ IPFS     │  │ S3       │       │
│  │ (主数据库)│  │ (缓存)   │  │ (文件)   │  │ (备份)   │       │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘       │
└────────────────────────┬────────────────────────────────────────┘
                         │
┌────────────────────────┴────────────────────────────────────────┐
│                      区块链层 (Blockchain)                       │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  EVM Compatible L2 (Arbitrum / Optimism / Polygon)       │  │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐               │  │
│  │  │ Token    │  │ Vault    │  │ AMM      │               │  │
│  │  │ Contract │  │ Contract │  │ Contract │               │  │
│  │  └──────────┘  └──────────┘  └──────────┘               │  │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐               │  │
│  │  │ Tranche  │  │ Lending  │  │ Oracle   │               │  │
│  │  │ Contract │  │ Contract │  │ Contract │               │  │
│  │  └──────────┘  └──────────┘  └──────────┘               │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

### 架构原则

1. **微服务架构**: 每个业务域独立服务，便于扩展和维护
2. **事件驱动**: 使用消息队列（Kafka/RabbitMQ）解耦服务
3. **API 优先**: 所有功能通过 RESTful API 暴露
4. **安全第一**: 多层安全防护，零信任架构
5. **可观测性**: 完整的日志、监控和追踪

---

## 技术栈

### 前端技术栈

```typescript
{
  "framework": "React 18 + TypeScript",
  "buildTool": "Vite",
  "styling": "Tailwind CSS",
  "animation": "Framer Motion",
  "stateManagement": "TanStack Query + Zustand",
  "charts": "Recharts + D3.js",
  "web3": "ethers.js / viem",
  "wallet": "WalletConnect + RainbowKit",
  "forms": "React Hook Form + Zod",
  "testing": "Vitest + React Testing Library"
}
```

### 后端技术栈

```typescript
{
  "runtime": "Node.js 20 LTS",
  "framework": "NestJS / Express",
  "language": "TypeScript",
  "database": "PostgreSQL 15",
  "cache": "Redis 7",
  "messageQueue": "Kafka / RabbitMQ",
  "orm": "Prisma / TypeORM",
  "validation": "Zod / class-validator",
  "testing": "Jest + Supertest"
}
```

### 智能合约技术栈

```solidity
{
  "language": "Solidity 0.8.20+",
  "framework": "Hardhat / Foundry",
  "libraries": "OpenZeppelin Contracts",
  "testing": "Hardhat + Foundry",
  "verification": "Certora / K Framework",
  "deployment": "Hardhat Deploy",
  "monitoring": "Tenderly / Defender"
}
```

### AI/ML 技术栈

```python
{
  "language": "Python 3.11",
  "framework": "FastAPI",
  "ml": "scikit-learn + XGBoost + LightGBM",
  "dl": "PyTorch + TensorFlow",
  "cv": "OpenCV + YOLO",
  "nlp": "Transformers + spaCy",
  "mlops": "MLflow + Kubeflow",
  "serving": "TorchServe / TensorFlow Serving"
}
```

---

## 智能合约设计

### 合约架构

```
┌─────────────────────────────────────────────────────────────┐
│                     Governance Layer                         │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ Timelock     │  │ Multisig     │  │ Pause        │      │
│  │ Controller   │  │ (Gnosis Safe)│  │ Guardian     │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
                            │
┌───────────────────────────┴─────────────────────────────────┐
│                     Core Contracts                           │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ Permissioned │  │ SPV          │  │ Oracle       │      │
│  │ Token        │  │ Registry     │  │ Aggregator   │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
                            │
┌───────────────────────────┴─────────────────────────────────┐
│                     DeFi Contracts                           │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ Vault        │  │ Tranche      │  │ AMM          │      │
│  │ Factory      │  │ Factory      │  │ Wrapper      │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
│  ┌──────────────┐  ┌──────────────┐                        │
│  │ Lending      │  │ Liquidation  │                        │
│  │ Pool         │  │ Engine       │                        │
│  └──────────────┘  └──────────────┘                        │
└─────────────────────────────────────────────────────────────┘
```

### 核心合约设计

#### 1. PermissionedToken.sol

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts-upgradeable/token/ERC20/ERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/PausableUpgradeable.sol";

/**
 * @title PermissionedToken
 * @dev 权限化 ERC20 代币，支持 KYC 白名单和转账限制
 */
contract PermissionedToken is 
    ERC20Upgradeable, 
    AccessControlUpgradeable, 
    PausableUpgradeable 
{
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
    bytes32 public constant BURNER_ROLE = keccak256("BURNER_ROLE");
    bytes32 public constant TRANSFER_ADMIN_ROLE = keccak256("TRANSFER_ADMIN_ROLE");
    
    // SPV ID 关联
    uint256 public spvId;
    
    // KYC 白名单
    mapping(address => bool) public isWhitelisted;
    
    // 锁仓信息
    mapping(address => uint256) public lockupUntil;
    
    // 分红信息
    mapping(address => uint256) public dividendBalance;
    
    // 事件
    event Whitelisted(address indexed account, bool status);
    event LockupSet(address indexed account, uint256 unlockTime);
    event DividendsDistributed(address indexed token, uint256 amount);
    event TransferRestricted(address indexed from, address indexed to, string reason);
    
    /**
     * @dev 初始化函数
     */
    function initialize(
        string memory name,
        string memory symbol,
        uint256 _spvId,
        address admin
    ) public initializer {
        __ERC20_init(name, symbol);
        __AccessControl_init();
        __Pausable_init();
        
        spvId = _spvId;
        _grantRole(DEFAULT_ADMIN_ROLE, admin);
        _grantRole(MINTER_ROLE, admin);
        _grantRole(BURNER_ROLE, admin);
        _grantRole(TRANSFER_ADMIN_ROLE, admin);
    }
    
    /**
     * @dev 铸造代币
     */
    function mint(address to, uint256 amount) 
        external 
        onlyRole(MINTER_ROLE) 
        whenNotPaused 
    {
        require(isWhitelisted[to], "Recipient not whitelisted");
        _mint(to, amount);
    }
    
    /**
     * @dev 销毁代币
     */
    function burn(address from, uint256 amount) 
        external 
        onlyRole(BURNER_ROLE) 
    {
        _burn(from, amount);
    }
    
    /**
     * @dev 转账前检查
     */
    function _beforeTokenTransfer(
        address from,
        address to,
        uint256 amount
    ) internal override whenNotPaused {
        if (from != address(0) && to != address(0)) {
            require(isTransferAllowed(from, to), "Transfer not allowed");
        }
        super._beforeTokenTransfer(from, to, amount);
    }
    
    /**
     * @dev 检查转账是否允许
     */
    function isTransferAllowed(address from, address to) 
        public 
        view 
        returns (bool) 
    {
        // 检查白名单
        if (!isWhitelisted[from] || !isWhitelisted[to]) {
            return false;
        }
        
        // 检查锁仓
        if (block.timestamp < lockupUntil[from]) {
            return false;
        }
        
        return true;
    }
    
    /**
     * @dev 设置白名单
     */
    function setWhitelist(address account, bool status) 
        external 
        onlyRole(TRANSFER_ADMIN_ROLE) 
    {
        isWhitelisted[account] = status;
        emit Whitelisted(account, status);
    }
    
    /**
     * @dev 设置锁仓
     */
    function setLockup(address account, uint256 unlockTime) 
        external 
        onlyRole(TRANSFER_ADMIN_ROLE) 
    {
        lockupUntil[account] = unlockTime;
        emit LockupSet(account, unlockTime);
    }
    
    /**
     * @dev 分配分红
     */
    function distributeDividends(address dividendToken, uint256 amount) 
        external 
        onlyRole(DEFAULT_ADMIN_ROLE) 
    {
        // 实现分红逻辑
        emit DividendsDistributed(dividendToken, amount);
    }
    
    /**
     * @dev 暂停合约
     */
    function pause() external onlyRole(DEFAULT_ADMIN_ROLE) {
        _pause();
    }
    
    /**
     * @dev 恢复合约
     */
    function unpause() external onlyRole(DEFAULT_ADMIN_ROLE) {
        _unpause();
    }
}
```

---

#### 2. TrancheFactory.sol

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title TrancheFactory
 * @dev 创建和管理分层证券
 */
contract TrancheFactory {
    struct TrancheConfig {
        string name;
        uint8 priority;      // 0 = Senior, 1 = Mezzanine, 2 = Junior
        uint256 targetYield; // 目标收益率 (basis points)
        uint256 allocation;  // 分配比例 (basis points)
    }
    
    struct Tranche {
        address tokenAddress;
        uint8 priority;
        uint256 targetYield;
        uint256 allocation;
        uint256 totalPaid;
        uint256 totalOwed;
    }
    
    // SPV ID => Tranche 数组
    mapping(uint256 => Tranche[]) public tranches;
    
    event TrancheCreated(uint256 indexed spvId, address[] trancheTokens);
    event CashflowDistributed(uint256 indexed spvId, uint256 amount);
    
    /**
     * @dev 创建分层证券
     */
    function createTranche(
        uint256 spvId,
        TrancheConfig[] memory configs
    ) external returns (address[] memory) {
        require(configs.length > 0, "No tranches specified");
        
        address[] memory trancheTokens = new address[](configs.length);
        
        for (uint256 i = 0; i < configs.length; i++) {
            // 部署新的 Tranche Token
            address trancheToken = _deployTrancheToken(
                spvId,
                configs[i].name,
                configs[i].priority
            );
            
            tranches[spvId].push(Tranche({
                tokenAddress: trancheToken,
                priority: configs[i].priority,
                targetYield: configs[i].targetYield,
                allocation: configs[i].allocation,
                totalPaid: 0,
                totalOwed: 0
            }));
            
            trancheTokens[i] = trancheToken;
        }
        
        emit TrancheCreated(spvId, trancheTokens);
        return trancheTokens;
    }
    
    /**
     * @dev 分配现金流
     */
    function distributeCashflow(uint256 spvId, uint256 amount) external {
        Tranche[] storage spvTranches = tranches[spvId];
        require(spvTranches.length > 0, "No tranches for SPV");
        
        // 按优先级排序
        _sortByPriority(spvTranches);
        
        uint256 remaining = amount;
        
        // 按优先级分配
        for (uint256 i = 0; i < spvTranches.length && remaining > 0; i++) {
            Tranche storage tranche = spvTranches[i];
            
            // 计算应付金额
            uint256 owed = tranche.totalOwed - tranche.totalPaid;
            uint256 payment = remaining > owed ? owed : remaining;
            
            if (payment > 0) {
                tranche.totalPaid += payment;
                remaining -= payment;
                
                // 转账到 Tranche Token 持有者
                _distributeToHolders(tranche.tokenAddress, payment);
            }
        }
        
        emit CashflowDistributed(spvId, amount);
    }
    
    function _deployTrancheToken(
        uint256 spvId,
        string memory name,
        uint8 priority
    ) internal returns (address) {
        // 实现 Tranche Token 部署逻辑
        // 返回新部署的合约地址
    }
    
    function _sortByPriority(Tranche[] storage trancheArray) internal {
        // 实现按优先级排序
    }
    
    function _distributeToHolders(address token, uint256 amount) internal {
        // 实现分红分配逻辑
    }
}
```

---

## 后端服务设计

### 服务架构

#### 1. User Service（用户服务）

**职责**:
- 用户注册和认证
- 用户资料管理
- 会话管理

**技术栈**: NestJS + PostgreSQL + Redis

**API 端点**:
```typescript
POST   /api/v1/users/register
POST   /api/v1/users/login
GET    /api/v1/users/profile
PUT    /api/v1/users/profile
POST   /api/v1/users/logout
POST   /api/v1/users/refresh-token
```

**数据模型**:
```typescript
interface User {
  id: string;
  email: string;
  passwordHash: string;
  walletAddress?: string;
  kycStatus: KYCStatus;
  userType: 'INDIVIDUAL' | 'INSTITUTIONAL';
  createdAt: Date;
  updatedAt: Date;
}

enum KYCStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  EXPIRED = 'EXPIRED'
}
```

---

#### 2. KYC Service（KYC 服务）

**职责**:
- 集成第三方 KYC 供应商
- 管理 KYC 状态
- 处理 KYC webhook

**技术栈**: NestJS + PostgreSQL + Redis

**集成供应商**:
- Onfido
- Persona
- Sumsub

**API 端点**:
```typescript
POST   /api/v1/kyc/start
GET    /api/v1/kyc/status/:userId
POST   /api/v1/kyc/webhook/:provider
GET    /api/v1/kyc/report/:userId
```

**KYC 流程**:
```
用户发起 KYC
    ↓
调用 KYC 供应商 API
    ↓
用户完成身份验证
    ↓
接收 Webhook 回调
    ↓
更新 KYC 状态
    ↓
仅存储结果哈希
    ↓
通知用户
```

---

#### 3. SPV Service（SPV 管理服务）

**职责**:
- SPV 创建和管理
- 物业关联
- 文档管理

**数据模型**:
```typescript
interface SPV {
  id: string;
  companyName: string;
  jurisdiction: string;
  legalRepresentative: string;
  registrationNumber: string;
  tokenAddress?: string;
  properties: Property[];
  documents: Document[];
  auditHistory: AuditRecord[];
  createdAt: Date;
  updatedAt: Date;
}

interface Property {
  id: string;
  spvId: string;
  address: string;
  type: 'COMMERCIAL' | 'RESIDENTIAL';
  area: number;
  purchasePrice: number;
  currentValue: number;
  occupancyRate: number;
  monthlyRent: number;
  documents: Document[];
}

interface Document {
  id: string;
  type: 'DEED' | 'LEASE' | 'AUDIT' | 'OTHER';
  ipfsHash: string;
  onchainHash?: string;
  uploadedBy: string;
  uploadedAt: Date;
}
```

---

#### 4. Token Service（代币服务）

**职责**:
- 代币发行和销毁
- 白名单管理
- 分红处理

**API 端点**:
```typescript
POST   /api/v1/tokens/mint
POST   /api/v1/tokens/burn
PUT    /api/v1/tokens/whitelist
POST   /api/v1/tokens/snapshot
POST   /api/v1/tokens/distribute-dividends
GET    /api/v1/tokens/:address/balance
```

**交互流程**:
```
API 请求
    ↓
验证权限
    ↓
准备交易数据
    ↓
调用托管服务签名
    ↓
广播交易到链上
    ↓
监听交易确认
    ↓
更新数据库
    ↓
返回结果
```

---

#### 5. Oracle Service（预言机服务）

**职责**:
- 聚合多源数据
- 推送数据上链
- 验证数据一致性

**数据源**:
- Chainlink Price Feeds
- 银行 API（租金确认）
- 物业管理系统
- 第三方估值服务

**数据推送流程**:
```
收集数据
    ↓
验证数据质量
    ↓
多源聚合（中位数/加权平均）
    ↓
生成签名
    ↓
推送到 Oracle 合约
    ↓
记录上链哈希
    ↓
触发相关业务逻辑
```

---

#### 6. Payment Service（支付服务）

**职责**:
- 法币入金处理
- 稳定币入金监听
- 出金处理

**集成服务**:
- Stripe（信用卡）
- 银行 API（ACH/Wire）
- Circle（USDC）

**入金流程**:
```
用户发起入金
    ↓
验证 KYC 状态
    ↓
调用支付网关
    ↓
等待支付确认
    ↓
调用 Token Service mint
    ↓
更新用户余额
    ↓
发送确认通知
```

---

## 前端架构

### 组件架构

```
src/
├── components/
│   ├── common/           # 通用组件
│   │   ├── Button/
│   │   ├── Card/
│   │   ├── Modal/
│   │   └── Input/
│   ├── layout/           # 布局组件
│   │   ├── Navbar/
│   │   ├── Sidebar/
│   │   └── Footer/
│   ├── dashboard/        # 仪表盘组件
│   │   ├── Overview/
│   │   ├── Holdings/
│   │   └── Dividends/
│   ├── market/           # 市场组件
│   │   ├── PropertyCard/
│   │   ├── PropertyDetail/
│   │   └── Filters/
│   ├── defi/             # DeFi 组件
│   │   ├── VaultCard/
│   │   ├── LiquidityPool/
│   │   └── BorrowInterface/
│   └── admin/            # 管理组件
│       ├── SPVManager/
│       ├── UserManager/
│       └── AuditViewer/
├── hooks/                # 自定义 Hooks
│   ├── useAuth.ts
│   ├── useContract.ts
│   ├── useWallet.ts
│   └── useQuery.ts
├── services/             # API 服务
│   ├── api.ts
│   ├── auth.ts
│   ├── contracts.ts
│   └── web3.ts
├── store/                # 状态管理
│   ├── authStore.ts
│   ├── walletStore.ts
│   └── uiStore.ts
├── types/                # TypeScript 类型
│   ├── api.ts
│   ├── contracts.ts
│   └── models.ts
├── utils/                # 工具函数
│   ├── format.ts
│   ├── validation.ts
│   └── helpers.ts
└── App.tsx
```

### 状态管理

使用 Zustand 进行全局状态管理：

```typescript
// store/authStore.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  refreshToken: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      
      login: async (email, password) => {
        const response = await api.post('/auth/login', { email, password });
        set({
          user: response.data.user,
          token: response.data.token,
          isAuthenticated: true,
        });
      },
      
      logout: () => {
        set({ user: null, token: null, isAuthenticated: false });
      },
      
      refreshToken: async () => {
        const response = await api.post('/auth/refresh');
        set({ token: response.data.token });
      },
    }),
    {
      name: 'auth-storage',
    }
  )
);
```

### Web3 集成

```typescript
// hooks/useContract.ts
import { useContract as useWagmiContract } from 'wagmi';
import { PermissionedTokenABI } from '../abis';

export function usePermissionedToken(address: string) {
  const contract = useWagmiContract({
    address,
    abi: PermissionedTokenABI,
  });
  
  const mint = async (to: string, amount: bigint) => {
    const tx = await contract.write.mint([to, amount]);
    await tx.wait();
    return tx;
  };
  
  const isTransferAllowed = async (from: string, to: string) => {
    return await contract.read.isTransferAllowed([from, to]);
  };
  
  return {
    contract,
    mint,
    isTransferAllowed,
  };
}
```

---

## AI/ML 架构

### ML Pipeline 架构

```
┌─────────────────────────────────────────────────────────────┐
│                     Data Ingestion Layer                     │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐   │
│  │ Blockchain│ │ Bank API │  │ Property │  │ Public   │   │
│  │ Events   │  │          │  │ Mgmt     │  │ Data     │   │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘   │
└────────────────────────┬────────────────────────────────────┘
                         │
┌────────────────────────┴────────────────────────────────────┐
│                     Data Processing Layer                    │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Apache Kafka / Airflow                              │  │
│  │  - Data Validation                                   │  │
│  │  - Feature Engineering                               │  │
│  │  - Data Quality Checks                               │  │
│  └──────────────────────────────────────────────────────┘  │
└────────────────────────┬────────────────────────────────────┘
                         │
┌────────────────────────┴────────────────────────────────────┐
│                     Feature Store                            │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Feast / Tecton                                       │  │
│  │  - Online Features (Redis)                           │  │
│  │  - Offline Features (S3/Parquet)                     │  │
│  └──────────────────────────────────────────────────────┘  │
└────────────────────────┬────────────────────────────────────┘
                         │
┌────────────────────────┴────────────────────────────────────┐
│                     Model Training Layer                     │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐   │
│  │ AVM      │  │ Risk     │  │ Market   │  │ Predict  │   │
│  │ Training │  │ Training │  │ Making   │  │ Maint    │   │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘   │
└────────────────────────┬────────────────────────────────────┘
                         │
┌────────────────────────┴────────────────────────────────────┐
│                     Model Registry                           │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  MLflow                                               │  │
│  │  - Model Versioning                                   │  │
│  │  - Experiment Tracking                                │  │
│  │  - Model Metadata                                     │  │
│  └──────────────────────────────────────────────────────┘  │
└────────────────────────┬────────────────────────────────────┘
                         │
┌────────────────────────┴────────────────────────────────────┐
│                     Model Serving Layer                      │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐                  │
│  │ FastAPI  │  │ TorchServe│ │ TF       │                  │
│  │ REST API │  │           │  │ Serving  │                  │
│  └──────────┘  └──────────┘  └──────────┘                  │
└────────────────────────┬────────────────────────────────────┘
                         │
┌────────────────────────┴────────────────────────────────────┐
│                     Monitoring Layer                         │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Prometheus + Grafana                                 │  │
│  │  - Model Performance                                  │  │
│  │  - Drift Detection                                    │  │
│  │  - Latency Monitoring                                 │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

### AVM（自动估值模型）设计

**模型架构**:
```python
class AVMEnsemble:
    def __init__(self):
        self.models = {
            'xgboost': XGBRegressor(),
            'lightgbm': LGBMRegressor(),
            'neural_net': MLPRegressor(),
        }
        self.meta_model = LinearRegression()
    
    def predict(self, features):
        # 集成预测
        predictions = []
        for model in self.models.values():
            pred = model.predict(features)
            predictions.append(pred)
        
        # 元模型聚合
        final_pred = self.meta_model.predict(np.array(predictions).T)
        
        # 计算置信区间
        std = np.std(predictions, axis=0)
        lower_ci = final_pred - 1.96 * std
        upper_ci = final_pred + 1.96 * std
        
        return {
            'value': final_pred,
            'lower_ci': lower_ci,
            'upper_ci': upper_ci,
            'confidence': self._calculate_confidence(std)
        }
```

**特征工程**:
```python
class FeatureEngineer:
    def create_features(self, property_data):
        features = {}
        
        # 基础特征
        features['area'] = property_data['area']
        features['age'] = datetime.now().year - property_data['built_year']
        features['location_score'] = self._calculate_location_score(
            property_data['lat'], 
            property_data['lon']
        )
        
        # 租金特征
        features['monthly_rent'] = property_data['monthly_rent']
        features['rent_per_sqft'] = property_data['monthly_rent'] / property_data['area']
        features['occupancy_rate'] = property_data['occupancy_rate']
        
        # 时间特征
        features['month'] = datetime.now().month
        features['quarter'] = (datetime.now().month - 1) // 3 + 1
        
        # 周边特征
        features['nearby_transactions'] = self._get_nearby_transactions(
            property_data['lat'],
            property_data['lon'],
            radius=1000  # meters
        )
        
        # 宏观经济特征
        features['cpi'] = self._get_cpi()
        features['interest_rate'] = self._get_interest_rate()
        
        return features
```

### 风控评分系统设计

**模型架构**:
```python
class RiskScoringModel:
    def __init__(self):
        self.default_model = XGBClassifier()
        self.ltv_model = XGBRegressor()
    
    def score(self, spv_data):
        features = self._prepare_features(spv_data)
        
        # 预测违约概率
        default_prob = self.default_model.predict_proba(features)[0][1]
        
        # 计算风险评分 (0-100)
        risk_score = self._calculate_risk_score(default_prob, features)
        
        # 建议 LTV
        suggested_ltv = self.ltv_model.predict(features)[0]
        
        # 识别风险因素
        risk_factors = self._identify_risk_factors(features)
        
        return {
            'risk_score': risk_score,
            'risk_level': self._get_risk_level(risk_score),
            'default_probability': default_prob,
            'suggested_ltv': suggested_ltv,
            'factors': risk_factors,
            'recommendations': self._generate_recommendations(risk_score)
        }
    
    def _calculate_risk_score(self, default_prob, features):
        # 综合多个因素计算风险评分
        score = default_prob * 100
        
        # 调整因素
        if features['rent_delinquency'] > 0.1:
            score += 10
        if features['maintenance_cost_ratio'] > 0.15:
            score += 5
        if features['market_volatility'] > 0.2:
            score += 8
        
        return min(100, score)
```

---

## 数据模型

### 数据库 Schema

#### Users Table
```sql
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    wallet_address VARCHAR(42),
    kyc_status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    kyc_hash VARCHAR(64),
    kyc_provider VARCHAR(50),
    kyc_completed_at TIMESTAMP,
    user_type VARCHAR(20) NOT NULL DEFAULT 'INDIVIDUAL',
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_wallet ON users(wallet_address);
CREATE INDEX idx_users_kyc_status ON users(kyc_status);
```

#### SPVs Table
```sql
CREATE TABLE spvs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_name VARCHAR(255) NOT NULL,
    jurisdiction VARCHAR(100) NOT NULL,
    legal_representative VARCHAR(255) NOT NULL,
    registration_number VARCHAR(100) UNIQUE NOT NULL,
    token_address VARCHAR(42),
    custody_account VARCHAR(255),
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_spvs_token_address ON spvs(token_address);
```

#### Properties Table
```sql
CREATE TABLE properties (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    spv_id UUID NOT NULL REFERENCES spvs(id),
    address TEXT NOT NULL,
    type VARCHAR(20) NOT NULL,
    area DECIMAL(10, 2) NOT NULL,
    purchase_price DECIMAL(15, 2) NOT NULL,
    current_value DECIMAL(15, 2),
    occupancy_rate DECIMAL(5, 2),
    monthly_rent DECIMAL(10, 2),
    lat DECIMAL(10, 8),
    lon DECIMAL(11, 8),
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_properties_spv ON properties(spv_id);
CREATE INDEX idx_properties_type ON properties(type);
```

#### Documents Table
```sql
CREATE TABLE documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    entity_type VARCHAR(20) NOT NULL,  -- 'SPV' or 'PROPERTY'
    entity_id UUID NOT NULL,
    type VARCHAR(50) NOT NULL,
    ipfs_hash VARCHAR(64) NOT NULL,
    onchain_hash VARCHAR(66),
    file_name VARCHAR(255),
    file_size BIGINT,
    uploaded_by UUID NOT NULL REFERENCES users(id),
    uploaded_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_documents_entity ON documents(entity_type, entity_id);
CREATE INDEX idx_documents_ipfs ON documents(ipfs_hash);
```

#### Transactions Table
```sql
CREATE TABLE transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id),
    type VARCHAR(20) NOT NULL,  -- 'MINT', 'BURN', 'TRANSFER', 'DIVIDEND'
    token_address VARCHAR(42) NOT NULL,
    amount DECIMAL(30, 18) NOT NULL,
    from_address VARCHAR(42),
    to_address VARCHAR(42),
    tx_hash VARCHAR(66) UNIQUE,
    block_number BIGINT,
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    confirmed_at TIMESTAMP
);

CREATE INDEX idx_transactions_user ON transactions(user_id);
CREATE INDEX idx_transactions_tx_hash ON transactions(tx_hash);
CREATE INDEX idx_transactions_status ON transactions(status);
```

#### Valuations Table
```sql
CREATE TABLE valuations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    spv_id UUID NOT NULL REFERENCES spvs(id),
    value DECIMAL(15, 2) NOT NULL,
    lower_ci DECIMAL(15, 2),
    upper_ci DECIMAL(15, 2),
    confidence DECIMAL(5, 4),
    model_version VARCHAR(50) NOT NULL,
    valuation_date DATE NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_valuations_spv ON valuations(spv_id);
CREATE INDEX idx_valuations_date ON valuations(valuation_date);
```

---

## 安全设计

### 认证与授权

**JWT 认证流程**:
```
用户登录
    ↓
验证凭证
    ↓
生成 Access Token (15分钟)
生成 Refresh Token (7天)
    ↓
返回 Tokens
    ↓
客户端存储 Tokens
    ↓
每次请求携带 Access Token
    ↓
Token 过期时使用 Refresh Token 刷新
```

**权限模型**:
```typescript
enum Role {
  USER = 'USER',
  ADMIN = 'ADMIN',
  OPERATOR = 'OPERATOR',
  AUDITOR = 'AUDITOR'
}

enum Permission {
  // User permissions
  VIEW_OWN_DATA = 'VIEW_OWN_DATA',
  MANAGE_OWN_PROFILE = 'MANAGE_OWN_PROFILE',
  
  // Admin permissions
  MANAGE_USERS = 'MANAGE_USERS',
  MANAGE_SPVS = 'MANAGE_SPVS',
  MINT_TOKENS = 'MINT_TOKENS',
  BURN_TOKENS = 'BURN_TOKENS',
  
  // Operator permissions
  UPLOAD_DOCUMENTS = 'UPLOAD_DOCUMENTS',
  TRIGGER_DIVIDENDS = 'TRIGGER_DIVIDENDS',
  
  // Auditor permissions
  VIEW_AUDIT_LOGS = 'VIEW_AUDIT_LOGS',
  EXPORT_REPORTS = 'EXPORT_REPORTS'
}
```

### 数据加密

**传输加密**:
- 所有 API 通信使用 HTTPS (TLS 1.3)
- WebSocket 使用 WSS

**存储加密**:
- 敏感数据使用 AES-256-GCM 加密
- 密钥使用 AWS KMS 或 HashiCorp Vault 管理
- 数据库连接使用 SSL

**密钥管理**:
```typescript
class KeyManagementService {
  async encryptSensitiveData(data: string): Promise<string> {
    const key = await this.getEncryptionKey();
    const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
    const encrypted = cipher.update(data, 'utf8', 'hex');
    return encrypted + cipher.final('hex');
  }
  
  async decryptSensitiveData(encrypted: string): Promise<string> {
    const key = await this.getEncryptionKey();
    const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
    const decrypted = decipher.update(encrypted, 'hex', 'utf8');
    return decrypted + decipher.final('utf8');
  }
}
```

### 审计日志

**审计日志结构**:
```typescript
interface AuditLog {
  id: string;
  timestamp: Date;
  userId: string;
  action: string;
  resource: string;
  resourceId: string;
  ipAddress: string;
  userAgent: string;
  requestBody?: any;
  responseStatus: number;
  changes?: {
    before: any;
    after: any;
  };
}
```

**审计日志记录**:
```typescript
@Injectable()
export class AuditInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;
    
    return next.handle().pipe(
      tap(response => {
        this.auditService.log({
          userId: user?.id,
          action: request.method,
          resource: request.url,
          ipAddress: request.ip,
          userAgent: request.headers['user-agent'],
          responseStatus: 200,
        });
      })
    );
  }
}
```

---

## 部署架构

### Kubernetes 部署

```yaml
# deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: rwa-api
spec:
  replicas: 3
  selector:
    matchLabels:
      app: rwa-api
  template:
    metadata:
      labels:
        app: rwa-api
    spec:
      containers:
      - name: api
        image: rwa-platform/api:latest
        ports:
        - containerPort: 3000
        env:
        - name: DATABASE_URL
          valueFrom:
            secretKeyRef:
              name: db-secret
              key: url
        - name: REDIS_URL
          valueFrom:
            secretKeyRef:
              name: redis-secret
              key: url
        resources:
          requests:
            memory: "512Mi"
            cpu: "500m"
          limits:
            memory: "1Gi"
            cpu: "1000m"
        livenessProbe:
          httpGet:
            path: /health
            port: 3000
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /ready
            port: 3000
          initialDelaySeconds: 5
          periodSeconds: 5
```

### 监控与告警

**Prometheus 配置**:
```yaml
# prometheus.yml
global:
  scrape_interval: 15s

scrape_configs:
  - job_name: 'rwa-api'
    static_configs:
      - targets: ['rwa-api:3000']
  
  - job_name: 'rwa-ml'
    static_configs:
      - targets: ['rwa-ml:8000']
```

**Grafana Dashboard**:
- API 请求率和延迟
- 数据库连接池状态
- 缓存命中率
- 智能合约交易状态
- ML 模型预测延迟
- 系统资源使用率

---

## API 设计

### RESTful API 规范

**基础 URL**: `https://api.rwa-platform.com/v1`

**认证**: Bearer Token in Authorization header

**响应格式**:
```typescript
interface APIResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
  };
}
```

**错误码**:
```typescript
enum ErrorCode {
  UNAUTHORIZED = 'UNAUTHORIZED',
  FORBIDDEN = 'FORBIDDEN',
  NOT_FOUND = 'NOT_FOUND',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  KYC_REQUIRED = 'KYC_REQUIRED',
  INSUFFICIENT_BALANCE = 'INSUFFICIENT_BALANCE',
  TRANSFER_RESTRICTED = 'TRANSFER_RESTRICTED',
  INTERNAL_ERROR = 'INTERNAL_ERROR'
}
```

### 关键 API 端点

#### 用户管理
```
POST   /api/v1/auth/register
POST   /api/v1/auth/login
POST   /api/v1/auth/refresh
GET    /api/v1/users/profile
PUT    /api/v1/users/profile
```

#### KYC
```
POST   /api/v1/kyc/start
GET    /api/v1/kyc/status
POST   /api/v1/kyc/webhook/:provider
```

#### SPV 管理
```
POST   /api/v1/spvs
GET    /api/v1/spvs
GET    /api/v1/spvs/:id
PUT    /api/v1/spvs/:id
POST   /api/v1/spvs/:id/documents
GET    /api/v1/spvs/:id/properties
```

#### 代币操作
```
POST   /api/v1/tokens/mint
POST   /api/v1/tokens/burn
PUT    /api/v1/tokens/whitelist
POST   /api/v1/tokens/distribute-dividends
GET    /api/v1/tokens/:address/balance
```

#### AI 服务
```
GET    /api/v1/avm/:spvId
GET    /api/v1/risk/score/:spvId
POST   /api/v1/maintenance/predict
```

---

**文档版本**: v1.0  
**创建日期**: 2025-10-27  
**最后更新**: 2025-10-27  
**状态**: 待审核
