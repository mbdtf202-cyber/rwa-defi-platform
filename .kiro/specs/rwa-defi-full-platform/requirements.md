# RWA DeFi 平台完整需求文档

## 引言

本文档定义了 RWA（真实物业资产）+ DeFi + AI 一体化平台的完整功能需求，从底层智能合约到前端体验、从 AI 模型到合规运维的所有具体细节。

## 术语表（Glossary）

- **RWA (Real World Asset)**: 真实世界资产，本项目特指物业资产
- **SPV (Special Purpose Vehicle)**: 特殊目的实体，用于资产隔离和代币化
- **NAV (Net Asset Value)**: 资产净值
- **KYC (Know Your Customer)**: 客户身份识别
- **AML (Anti-Money Laundering)**: 反洗钱
- **LTV (Loan-to-Value)**: 贷款价值比
- **Tranche**: 分层证券，按优先级分配现金流
- **AVM (Automated Valuation Model)**: 自动估值模型
- **PoR (Proof of Reserve)**: 储备证明
- **AMM (Automated Market Maker)**: 自动做市商
- **TVL (Total Value Locked)**: 总锁仓价值
- **Oracle**: 预言机，提供链下数据到链上的桥接

---

## 一、平台总体必备功能

### 需求 1: 多租户 SPV 管理系统

**用户故事**: 作为平台管理员，我希望能够创建和管理多个 SPV 实体，以便将不同的物业资产进行隔离和代币化。

#### 验收标准

1. **WHEN** 管理员访问 SPV 管理面板，**THE System** SHALL 显示所有已创建的 SPV 列表
2. **WHEN** 管理员创建新 SPV，**THE System** SHALL 要求输入公司信息、管辖区、法人代表信息
3. **WHEN** 管理员上传法律文件（产权证、注册文件），**THE System** SHALL 将文件存储到 IPFS 并记录哈希值
4. **WHEN** SPV 创建成功，**THE System** SHALL 生成唯一的 SPV ID 并关联到链上 Token 合约
5. **WHEN** 管理员关联物业到 SPV，**THE System** SHALL 验证物业所有权文件并更新资产清单

**优先级**: MUST

**数据模型**:
```typescript
interface SPV {
  id: string;
  companyName: string;
  jurisdiction: string;
  legalRepresentative: string;
  registrationNumber: string;
  properties: Property[];
  custodyAccount: string;
  documents: Document[];
  auditHistory: AuditRecord[];
  createdAt: Date;
  updatedAt: Date;
}
```

**API 接口**:
- `POST /api/spv` - 创建新 SPV
- `GET /api/spv/{id}` - 获取 SPV 详情
- `PUT /api/spv/{id}` - 更新 SPV 信息
- `PUT /api/spv/{id}/documents` - 上传法律文件
- `GET /api/spv/{id}/properties` - 获取关联物业列表

---

### 需求 2: 权限化 Token 发放与治理平台

**用户故事**: 作为平台管理员，我希望能够发行和管理权限化代币，以便确保只有经过 KYC 的合格投资者才能持有和交易资产代币。

#### 验收标准

1. **WHEN** 管理员发行新代币，**THE System** SHALL 在链上调用 mint 函数并关联 SPV ID
2. **WHEN** 代币被铸造，**THE Smart Contract** SHALL 触发 Mint 事件包含地址、数量和 SPV ID
3. **WHEN** 未通过 KYC 的用户尝试接收代币，**THE Smart Contract** SHALL 拒绝转账并触发 TransferRestricted 事件
4. **WHEN** 管理员设置锁仓规则，**THE System** SHALL 更新链上转账限制并在 UI 显示锁定期
5. **WHEN** 管理员创建快照，**THE System** SHALL 记录所有持币地址和余额用于分红或投票

**优先级**: MUST

**智能合约事件**:
```solidity
event Mint(address indexed to, uint256 amount, uint256 indexed spvId);
event Burn(address indexed from, uint256 amount, uint256 indexed spvId);
event TransferRestricted(address indexed from, address indexed to, string reason);
event LockupSet(address indexed holder, uint256 unlockTime);
event Snapshot(uint256 indexed snapshotId, uint256 timestamp);
```

**API 接口**:
- `POST /api/token/mint` - 发行代币
- `POST /api/token/burn` - 销毁代币
- `PUT /api/token/whitelist` - 管理白名单
- `POST /api/token/snapshot` - 创建快照
- `GET /api/token/{address}/balance` - 查询余额

---

### 需求 3: 链上链下数据一致性层

**用户故事**: 作为合规审计员，我希望所有关键文件和数据都有链上存证，以便验证数据的真实性和完整性。

#### 验收标准

1. **WHEN** 用户上传法律文件，**THE System** SHALL 将文件存储到 IPFS 并返回内容哈希
2. **WHEN** IPFS 哈希生成后，**THE System** SHALL 将哈希写入智能合约和数据库
3. **WHEN** 用户查看文件，**THE System** SHALL 显示验证标签表明文件已上链存证
4. **WHEN** 审计员验证文件，**THE System** SHALL 允许通过哈希从 IPFS 下载原文件并对比
5. **WHEN** 租金收据上传，**THE System** SHALL 自动生成哈希并触发分红流程

**优先级**: MUST

**数据流程**:
```
文件上传 → IPFS Pin → 生成哈希 → 写入合约 → 写入数据库 → UI 显示验证标签
```

**API 接口**:
- `POST /api/documents/upload` - 上传文件并生成哈希
- `GET /api/documents/{hash}/verify` - 验证文件完整性
- `GET /api/documents/{hash}/download` - 从 IPFS 下载文件
- `POST /api/proof/store` - 存储链上证明

---

### 需求 4: KYC/AML 工作流

**用户故事**: 作为投资者，我希望能够完成 KYC 认证流程，以便获得投资平台资产的资格。

#### 验收标准

1. **WHEN** 新用户注册，**THE System** SHALL 引导用户启动 KYC 流程
2. **WHEN** 用户提交 KYC 信息，**THE System** SHALL 调用第三方 KYC 服务（Onfido/Persona/Sumsub）
3. **WHEN** KYC 完成，**THE System** SHALL 仅存储结果哈希到链上和数据库，明文数据保留在 KYC 供应商
4. **WHEN** 用户交易触发 AML 规则，**THE System** SHALL 生成告警并通知合规团队
5. **WHEN** 用户 KYC 状态为"已验证"，**THE System** SHALL 允许用户接收和持有代币

**优先级**: MUST

**KYC 状态**:
- `PENDING` - 待审核
- `APPROVED` - 已通过
- `REJECTED` - 已拒绝
- `EXPIRED` - 已过期

**API 接口**:
- `POST /api/kyc/start` - 启动 KYC 流程
- `GET /api/kyc/{userId}/status` - 查询 KYC 状态
- `POST /api/kyc/webhook` - 接收 KYC 供应商回调
- `POST /api/aml/scan` - 执行 AML 扫描
- `GET /api/aml/alerts` - 获取 AML 告警列表

---

### 需求 5: 投资者仪表盘

**用户故事**: 作为投资者，我希望能够在仪表盘中查看我的持仓、NAV、分红历史和交易记录，以便了解我的投资状况。

#### 验收标准

1. **WHEN** 投资者登录，**THE System** SHALL 显示总持仓价值（代币数量 × 最新 NAV）
2. **WHEN** 投资者查看资产明细，**THE System** SHALL 显示每个 SPV 的持仓份额和当前估值
3. **WHEN** 投资者查看分红历史，**THE System** SHALL 显示所有历史分红记录和待领取金额
4. **WHEN** 投资者申请赎回，**THE System** SHALL 验证锁定期并提交赎回请求
5. **WHEN** 投资者下载税务报表，**THE System** SHALL 生成符合司法区要求的 PDF 文件

**优先级**: MUST

**仪表盘模块**:
- 总览（NAV、AUM、收益率）
- 资产明细（每个 SPV 的份额）
- 分红日历和历史
- 借贷/抵押状态
- LP 流动性状态
- 交易历史
- 税务文件下载
- 通知和告警

**API 接口**:
- `GET /api/investor/dashboard` - 获取仪表盘数据
- `GET /api/investor/holdings` - 获取持仓明细
- `GET /api/investor/dividends` - 获取分红历史
- `POST /api/investor/redeem` - 申请赎回
- `GET /api/investor/tax-report` - 下载税务报表

---

## 二、智能合约层

### 需求 6: Permissioned Token 合约

**用户故事**: 作为智能合约开发者，我需要实现一个权限化的 ERC-20 代币合约，以便控制代币的转移和分红。

#### 验收标准

1. **WHEN** 调用 mint 函数，**THE Contract** SHALL 验证调用者具有 MINTER_ROLE 权限
2. **WHEN** 代币转移前，**THE Contract** SHALL 调用 isTransferAllowed 检查发送方和接收方的 KYC 状态
3. **IF** 接收方未通过 KYC，**THEN THE Contract** SHALL 拒绝转账并触发 TransferRestricted 事件
4. **WHEN** 管理员调用 distributeDividends，**THE Contract** SHALL 按持币比例分配分红代币
5. **WHEN** 设置转账规则，**THE Contract** SHALL 验证调用者具有 ADMIN_ROLE 权限

**优先级**: MUST

**合约接口**:
```solidity
interface IPermissionedToken {
    function mint(address to, uint256 amount, uint256 spvId) external;
    function burn(address from, uint256 amount) external;
    function isTransferAllowed(address from, address to) external view returns (bool);
    function setTransferRule(bytes32 ruleHash) external;
    function distributeDividends(address dividendToken, uint256 amount) external;
    function snapshot() external returns (uint256);
}
```

---

### 需求 7: Tranche Factory 与分层代币

**用户故事**: 作为资产管理者，我希望能够将 SPV 的现金流分层为不同优先级的证券，以便满足不同风险偏好的投资者需求。

#### 验收标准

1. **WHEN** 创建 Tranche，**THE Contract** SHALL 生成 Senior、Mezzanine 和 Junior 三种代币
2. **WHEN** 现金流分配时，**THE Contract** SHALL 优先支付 Senior tranche 的本金和利息
3. **WHILE** Senior tranche 未完全支付，**THE Contract** SHALL 不向 Mezzanine 和 Junior 分配
4. **WHEN** 现金流不足以支付所有 tranche，**THE Contract** SHALL 按优先级部分支付并记录欠款
5. **WHEN** 提前偿付发生，**THE Contract** SHALL 按合约约定的回购条款执行

**优先级**: HIGH

**合约接口**:
```solidity
interface ITrancheFactory {
    function createTranche(
        uint256 spvId,
        TrancheConfig[] memory configs
    ) external returns (address[] memory trancheTokens);
    
    function distributeCashflow(uint256 spvId, uint256 amount) external;
    function getTranchePriority(address trancheToken) external view returns (uint8);
}

struct TrancheConfig {
    string name;
    uint8 priority;
    uint256 targetYield;
    uint256 allocation;
}
```

---

### 需求 8: Vault 策略合约

**用户故事**: 作为投资者，我希望能够将资金存入智能金库，让系统自动执行收益策略并分配收益。

#### 验收标准

1. **WHEN** 用户存入资金，**THE Contract** SHALL 铸造金库份额代币并记录用户份额
2. **WHEN** 策略合约执行 harvest，**THE Contract** SHALL 收集收益并按份额分配给用户
3. **WHEN** 添加新策略，**THE Contract** SHALL 验证策略已通过 timelock 和白名单审核
4. **WHEN** 用户提取资金，**THE Contract** SHALL 销毁份额代币并转移对应资产
5. **WHEN** 计算管理费，**THE Contract** SHALL 按 AUM 的百分比收取并转给管理员

**优先级**: MUST

**合约接口**:
```solidity
interface IVault {
    function deposit(uint256 poolId, uint256 amount) external;
    function withdraw(uint256 poolId, uint256 shares) external;
    function addStrategy(uint256 poolId, address strategy) external;
    function harvest(uint256 poolId) external;
    function getShareValue(uint256 poolId) external view returns (uint256);
}
```

---

### 需求 9: 权限化 AMM 包装器

**用户故事**: 作为流动性提供者，我希望能够为 RWA 代币提供流动性并赚取手续费，同时确保只有合格投资者才能参与。

#### 验收标准

1. **WHEN** 用户添加流动性，**THE Contract** SHALL 验证用户在白名单中
2. **WHEN** 用户设置流动性区间，**THE Contract** SHALL 验证区间参数的合理性
3. **WHEN** 交易发生，**THE Contract** SHALL 收取手续费并分配给 LP
4. **WHEN** 用户移除流动性，**THE Contract** SHALL 计算并转移应得的本金和手续费
5. **WHEN** 计算无常损失，**THE System** SHALL 在 UI 显示估算值

**优先级**: HIGH

**合约接口**:
```solidity
interface IPermissionedAMM {
    function addLiquidity(
        uint256 poolId,
        uint256 amountA,
        uint256 amountB,
        uint256 rangeLow,
        uint256 rangeHigh
    ) external returns (uint256 liquidity);
    
    function removeLiquidity(uint256 poolId, uint256 liquidity) external;
    function swap(uint256 poolId, uint256 amountIn, address tokenIn) external;
    function claimFees(uint256 poolId) external;
}
```

---

### 需求 10: 借贷池合约

**用户故事**: 作为投资者，我希望能够使用 RWA 代币作为抵押品借入稳定币，以便提高资金使用效率。

#### 验收标准

1. **WHEN** 用户存入抵押品，**THE Contract** SHALL 记录抵押品数量和类型
2. **WHEN** 用户借款，**THE Contract** SHALL 验证 LTV 比率未超过限制
3. **WHEN** 抵押品价值下降导致 LTV 超过清算阈值，**THE Contract** SHALL 允许清算人执行清算
4. **WHEN** 清算发生，**THE Contract** SHALL 触发 Liquidation 事件并记录链上
5. **WHEN** AI 风控系统建议调整 LTV，**THE System** SHALL 通知管理员审批后更新参数

**优先级**: HIGH

**合约接口**:
```solidity
interface ILendingPool {
    function depositCollateral(address token, uint256 amount) external;
    function borrow(uint256 amount) external;
    function repay(uint256 amount) external;
    function liquidate(address borrower) external;
    function getLTV(address borrower) external view returns (uint256);
    function updateLTVLimit(address token, uint256 newLimit) external;
}
```

**清算条件**:
- 当前 LTV > 清算阈值（例如 85%）
- 抵押品价值由 Oracle 提供
- 清算人获得清算奖励（例如 5%）

---

### 需求 11: Oracle 集成合约

**用户故事**: 作为系统，我需要从可信的 Oracle 获取链下数据（租金确认、估值、储备证明），以便触发链上操作。

#### 验收标准

1. **WHEN** Oracle 推送租金确认数据，**THE Contract** SHALL 验证数据签名并存储
2. **WHEN** Oracle 推送估值数据，**THE Contract** SHALL 更新 SPV 的 NAV 值
3. **WHEN** Oracle 数据过期（超过阈值时间），**THE Contract** SHALL 标记数据为 stale
4. **WHEN** 多个 Oracle 数据不一致，**THE Contract** SHALL 使用中位数或触发人工审核
5. **WHEN** 合约读取 Oracle 数据，**THE Contract** SHALL 提供 getLatestValue 接口

**优先级**: MUST

**合约接口**:
```solidity
interface IOracle {
    function updateValue(uint256 spvId, bytes32 key, uint256 value, bytes memory signature) external;
    function getLatestValue(uint256 spvId, bytes32 key) external view returns (uint256 value, uint256 timestamp);
    function isStale(uint256 spvId, bytes32 key) external view returns (bool);
}
```

**数据类型**:
- `RENT_CONFIRMATION` - 租金到账确认
- `NAV_VALUATION` - 资产估值
- `PROOF_OF_RESERVE` - 储备证明
- `OCCUPANCY_RATE` - 入住率

---

### 需求 12: 管理控制、Timelock 和多签

**用户故事**: 作为平台治理者，我需要确保所有敏感操作都经过多签审批和时间锁定，以便防止单点故障和恶意操作。

#### 验收标准

1. **WHEN** 执行合约升级，**THE System** SHALL 要求至少 3/5 的多签签名
2. **WHEN** 提交敏感操作，**THE System** SHALL 将操作放入 timelock 队列（例如 48 小时）
3. **WHEN** timelock 期间到期，**THE System** SHALL 允许执行操作
4. **WHEN** 紧急情况发生，**THE Contract** SHALL 允许管理员调用 pause 函数暂停操作
5. **WHEN** 合约暂停，**THE Contract** SHALL 阻止所有提现和交易操作

**优先级**: MUST

**多签配置**:
- 签名人数量: 5
- 所需签名: 3
- Timelock 延迟: 48 小时
- 紧急操作: 需要 4/5 签名

---

## 三、后端服务层

### 需求 13: 用户与 KYC 服务

**用户故事**: 作为后端系统，我需要管理用户账户和 KYC 状态，以便确保合规性。

#### 验收标准

1. **WHEN** 用户注册，**THE System** SHALL 创建用户账户并生成唯一 ID
2. **WHEN** 用户启动 KYC，**THE System** SHALL 调用第三方 KYC 服务 API
3. **WHEN** KYC 完成，**THE System** SHALL 仅存储结果哈希，不存储 PII 明文
4. **WHEN** 企业用户注册，**THE System** SHALL 启动 KYB（企业 KYC）流程
5. **WHEN** 导出 KYC 报表，**THE System** SHALL 生成包含所有 KYC 状态的 CSV 文件

**优先级**: MUST

**数据模型**:
```typescript
interface User {
  id: string;
  email: string;
  walletAddress?: string;
  kycStatus: 'PENDING' | 'APPROVED' | 'REJECTED' | 'EXPIRED';
  kycHash: string;
  kycProvider: 'ONFIDO' | 'PERSONA' | 'SUMSUB';
  kycCompletedAt?: Date;
  userType: 'INDIVIDUAL' | 'INSTITUTIONAL';
  createdAt: Date;
}
```

---

### 需求 14: 支付与法币入金服务

**用户故事**: 作为投资者，我希望能够使用法币或稳定币入金，以便购买 RWA 代币。

#### 验收标准

1. **WHEN** 用户选择法币入金，**THE System** SHALL 集成 Stripe 或银行转账通道
2. **WHEN** 用户完成法币支付，**THE System** SHALL 验证 KYC 状态后发起 mint 操作
3. **WHEN** 用户选择稳定币入金，**THE System** SHALL 验证链上转账并更新余额
4. **WHEN** 入金完成，**THE System** SHALL 发送确认邮件并更新用户持仓
5. **WHEN** 用户申请出金，**THE System** SHALL 验证锁定期并处理提现请求

**优先级**: MUST

**支付方式**:
- 银行转账（ACH, Wire Transfer）
- 信用卡/借记卡（Stripe）
- 稳定币（USDC, USDT）
- 加密货币桥接

**API 接口**:
- `POST /api/payment/fiat/initiate` - 发起法币支付
- `POST /api/payment/crypto/deposit` - 稳定币入金
- `POST /api/payment/withdraw` - 申请提现
- `GET /api/payment/history` - 查询支付历史

---

### 需求 15: 编排引擎

**用户故事**: 作为系统，我需要监听链上事件并触发相应的离链业务流程，以便实现自动化操作。

#### 验收标准

1. **WHEN** 监听到租金到账事件，**THE System** SHALL 自动调用 distributeDividends 合约函数
2. **WHEN** 租金未按时到账，**THE System** SHALL 生成告警并通知运营团队
3. **WHEN** 链上交易失败，**THE System** SHALL 自动重试最多 3 次
4. **WHEN** 处理业务流程，**THE System** SHALL 确保幂等性避免重复执行
5. **WHEN** 记录事件，**THE System** SHALL 为每个链上交易生成业务流水记录

**优先级**: MUST

**事件处理流程**:
```
链上事件 → 事件监听器 → 业务逻辑处理 → 数据库更新 → 通知发送
```

**关键特性**:
- 可靠重试机制
- 幂等性保证
- 事件追踪和审计
- 错误处理和告警

---

### 需求 16: 会计与税务报表服务

**用户故事**: 作为投资者，我希望能够下载符合我所在司法区要求的税务报表，以便完成纳税申报。

#### 验收标准

1. **WHEN** 用户请求年度报表，**THE System** SHALL 生成包含所有分红和资本利得的 PDF
2. **WHEN** 生成报表，**THE System** SHALL 根据用户司法区选择正确的税表格式
3. **WHEN** 计算资本利得，**THE System** SHALL 使用 FIFO 或用户指定的成本基础方法
4. **WHEN** 报表生成完成，**THE System** SHALL 发送邮件通知并提供下载链接
5. **WHEN** 审计需要，**THE System** SHALL 提供所有交易的详细记录

**优先级**: MUST

**支持的税表格式**:
- 美国: Form 1099
- 新加坡: IR8A
- 英国: Self Assessment
- 其他: 通用格式

**API 接口**:
- `GET /api/accounting/{userId}/yearly-report` - 生成年度报表
- `GET /api/accounting/{userId}/capital-gains` - 计算资本利得
- `GET /api/accounting/{userId}/dividends` - 获取分红记录

---

### 需求 17: 审计追踪与证明存储

**用户故事**: 作为审计员，我需要访问完整的操作日志和文件证明，以便验证平台的合规性。

#### 验收标准

1. **WHEN** 任何操作发生，**THE System** SHALL 记录操作者、时间、操作类型和结果
2. **WHEN** 文件上传，**THE System** SHALL 生成 IPFS 哈希并存储到审计日志
3. **WHEN** 审计员查询日志，**THE System** SHALL 提供时间范围和操作类型的筛选
4. **WHEN** 验证文件，**THE System** SHALL 允许通过哈希从 IPFS 下载并对比
5. **WHEN** 导出审计报告，**THE System** SHALL 生成包含所有操作的 CSV 文件

**优先级**: MUST

**审计日志字段**:
- 操作 ID
- 操作者（用户 ID 或系统）
- 操作类型
- 操作时间
- 操作结果（成功/失败）
- 相关数据哈希
- IP 地址

---

### 需求 18: 二级市场撮合引擎

**用户故事**: 作为投资者，我希望能够在二级市场买卖 RWA 代币，以便在需要时退出投资。

#### 验收标准

1. **WHEN** 用户下单，**THE System** SHALL 验证用户 KYC 状态和代币锁定期
2. **WHEN** 订单匹配成功，**THE System** SHALL 执行链上转账并更新订单状态
3. **WHEN** 订单部分成交，**THE System** SHALL 更新剩余数量并继续匹配
4. **WHEN** OTC 订单创建，**THE System** SHALL 通知对手方并等待确认
5. **WHEN** 交易完成，**THE System** SHALL 记录交易历史并触发 AML 扫描

**优先级**: HIGH

**订单类型**:
- 限价单（Limit Order）
- 市价单（Market Order）
- OTC 订单（场外交易）

**API 接口**:
- `POST /api/marketplace/order` - 创建订单
- `DELETE /api/marketplace/order/{id}` - 取消订单
- `GET /api/marketplace/orderbook` - 获取订单簿
- `GET /api/marketplace/trades` - 获取成交记录

---

## 四、前端与用户体验

### 需求 19: 用户入驻流程

**用户故事**: 作为新用户，我希望能够快速完成注册和认证流程，以便开始投资。

#### 验收标准

1. **WHEN** 用户访问注册页面，**THE System** SHALL 显示清晰的步骤指引
2. **WHEN** 用户提交邮箱，**THE System** SHALL 发送验证邮件
3. **WHEN** 用户点击验证链接，**THE System** SHALL 激活账户并引导到 KYC 流程
4. **WHEN** 用户完成 KYC，**THE System** SHALL 显示钱包连接选项
5. **WHEN** 用户签署投资者协议，**THE System** SHALL 使用电子签名服务并存储签名哈希

**优先级**: MUST

**流程步骤**:
1. 注册（邮箱 + 密码）
2. 邮件验证
3. KYC 认证
4. 连接钱包（可选）
5. 法币入金选项
6. 签署投资者协议
7. 完成入驻

---

### 需求 20: 资产详情页面

**用户故事**: 作为投资者，我希望能够查看资产的详细信息，以便做出投资决策。

#### 验收标准

1. **WHEN** 用户访问资产详情页，**THE System** SHALL 显示产权摘要和基本信息
2. **WHEN** 显示租约信息，**THE System** SHALL 匿名化租户信息保护隐私
3. **WHEN** 显示估值图表，**THE System** SHALL 展示历史 NAV 和 AI 预测的置信区间
4. **WHEN** 显示维护记录，**THE System** SHALL 列出所有历史维护工单和成本
5. **WHEN** 用户下载文件，**THE System** SHALL 验证用户权限并提供 IPFS 链接

**优先级**: MUST

**页面模块**:
- 资产概览（位置、类型、面积）
- 产权信息（所有权、SPV 关联）
- 租约明细（租金、期限、匿名化租户）
- 估值图表（历史 NAV + AI 预测）
- 维护记录（工单、成本、影响）
- 风险评分（AI 生成）
- 分红历史
- 文档下载（产权证、审计报告）

---

### 需求 21: 流动性与 AMM 界面

**用户故事**: 作为流动性提供者，我希望能够通过直观的界面添加和管理流动性，以便赚取手续费收益。

#### 验收标准

1. **WHEN** 用户添加流动性，**THE System** SHALL 显示当前池子的 TVL 和 APY
2. **WHEN** 用户设置流动性区间，**THE System** SHALL 提供滑块工具并显示预期收益
3. **WHEN** 显示无常损失，**THE System** SHALL 基于历史波动率计算估算值
4. **WHEN** 用户移除流动性，**THE System** SHALL 显示应得的本金和累计手续费
5. **WHEN** 用户领取奖励，**THE System** SHALL 调用合约并更新余额

**优先级**: HIGH

**UI 功能**:
- 添加/移除流动性
- 集中流动性区间设置
- 收益模拟器
- 无常损失计算器
- 历史手续费收益图表
- LP 代币余额显示

---

### 需求 22: 借贷与抵押界面

**用户故事**: 作为借款人，我希望能够使用 RWA 代币作为抵押借入稳定币，以便获得流动性。

#### 验收标准

1. **WHEN** 用户查看借款额度，**THE System** SHALL 基于抵押品价值和 LTV 计算可借金额
2. **WHEN** 显示利率，**THE System** SHALL 展示当前利率和历史利率曲线
3. **WHEN** 用户借款，**THE System** SHALL 显示清算价格和健康因子
4. **WHEN** 用户还款，**THE System** SHALL 更新债务余额和健康因子
5. **WHEN** 接近清算，**THE System** SHALL 发送告警通知用户

**优先级**: HIGH

**UI 功能**:
- 抵押品存入/取出
- 可借金额计算
- 利率显示
- 健康因子监控
- 清算价格提醒
- 还款操作
- 债务历史记录

---

### 需求 23: 管理员运营面板

**用户故事**: 作为平台运营人员，我需要一个管理面板来执行日常运营任务和监控系统状态。

#### 验收标准

1. **WHEN** 运营人员上传租金数据，**THE System** SHALL 验证数据格式并批量处理
2. **WHEN** 触发分红，**THE System** SHALL 显示预览并要求确认后执行
3. **WHEN** 查看审计视图，**THE System** SHALL 显示所有待审核的操作
4. **WHEN** 触发清算，**THE System** SHALL 显示借款人列表和清算条件
5. **WHEN** 管理通知模板，**THE System** SHALL 允许编辑和预览邮件/站内信模板

**优先级**: MUST

**面板功能**:
- SPV 管理
- 租金数据上传
- 分红批量操作
- 清算触发
- 用户 KYC 审核
- 审计日志查看
- 通知模板管理
- 系统监控仪表盘

---

## 五、AI 模块

### 需求 24: 数据管道与特征工程

**用户故事**: 作为 AI 系统，我需要从多个数据源收集和处理数据，以便训练和运行机器学习模型。

#### 验收标准

1. **WHEN** 接收链上租金数据，**THE System** SHALL 验证交易哈希并提取金额和时间
2. **WHEN** 接收银行 webhook，**THE System** SHALL 验证签名并匹配到对应 SPV
3. **WHEN** 导入物业管理数据，**THE System** SHALL 解析 CSV/API 并标准化格式
4. **WHEN** 获取公开数据，**THE System** SHALL 调用第三方 API 并缓存结果
5. **WHEN** 数据质量不足，**THE System** SHALL 标记数据源并触发告警

**优先级**: MUST

**数据源**:
- 链上租金交易
- 银行转账确认
- 物业管理系统（API/CSV）
- 公开房产交易数据
- CPI/利率数据
- 卫星/街景图像

**特征示例**:
- 周边成交均价
- 月租金收入
- 空置率
- 物业年龄
- 维修成本历史
- 季节性指标
- 地理位置特征

---

### 需求 25: 自动估值模型（AVM）

**用户故事**: 作为系统，我需要使用 AI 模型自动估算资产价值，以便提供实时 NAV 更新。

#### 验收标准

1. **WHEN** 请求估值，**THE System** SHALL 返回估值、置信区间上下限
2. **WHEN** 生成估值解释，**THE System** SHALL 使用 SHAP 值展示特征贡献度
3. **WHEN** 模型更新，**THE System** SHALL 记录版本号和训练时间戳
4. **WHEN** 估值变化超过阈值，**THE System** SHALL 触发审计标注流程
5. **WHEN** 查询历史估值，**THE System** SHALL 返回指定日期的估值和模型版本

**优先级**: MUST

**API 接口**:
```typescript
GET /api/avm/{spvId}?date=2025-10-27
Response: {
  value: 5000000,
  lowerCI: 4800000,
  upperCI: 5200000,
  confidence: 0.92,
  modelVersion: "v2.3.1",
  contributions: [
    { feature: "location", impact: 0.35 },
    { feature: "rent_income", impact: 0.28 },
    { feature: "occupancy", impact: 0.15 }
  ]
}
```

**模型要求**:
- 准确率 > 95%
- 预测延迟 < 500ms
- 可解释性（SHAP）
- 版本控制

---

### 需求 26: 智能做市机器人

**用户故事**: 作为系统，我需要使用强化学习优化流动性池的参数，以便最大化 LP 收益。

#### 验收标准

1. **WHEN** 执行策略，**THE System** SHALL 输出流动性区间调整建议
2. **WHEN** 回测策略，**THE System** SHALL 使用历史数据模拟收益和无常损失
3. **WHEN** 生成报告，**THE System** SHALL 对比新旧策略的收益差异
4. **WHEN** 策略表现不佳，**THE System** SHALL 自动回滚到上一个稳定版本
5. **WHEN** 执行交易，**THE System** SHALL 通过托管机器人签名并提交

**优先级**: HIGH

**策略输出**:
```typescript
{
  poolId: 1,
  action: "REBALANCE",
  rangeLow: 0.95,
  rangeHigh: 1.05,
  amount: 100000,
  expectedAPY: 12.5,
  expectedIL: 2.3
}
```

**回测指标**:
- 累计手续费收益
- 无常损失
- 夏普比率
- 最大回撤

---

### 需求 27: 风控评分系统

**用户故事**: 作为风控系统，我需要评估每个资产的风险并提供 LTV 建议，以便降低违约风险。

#### 验收标准

1. **WHEN** 计算风险评分，**THE System** SHALL 输出 0-100 的风险分数
2. **WHEN** 预测违约概率，**THE System** SHALL 基于历史数据和当前状态计算 PD
3. **WHEN** 建议 LTV，**THE System** SHALL 根据风险评分动态调整建议值
4. **WHEN** 风险评分变化，**THE System** SHALL 触发告警并生成操作建议
5. **WHEN** 显示风险因素，**THE System** SHALL 列出主要风险来源和权重

**优先级**: MUST

**风险评分输出**:
```typescript
{
  spvId: 123,
  riskScore: 35,  // 0-100, 越低越好
  riskLevel: "LOW",
  defaultProbability: 0.02,
  suggestedLTV: 0.75,
  factors: [
    { name: "rent_delinquency", weight: 0.4, value: "low" },
    { name: "market_volatility", weight: 0.3, value: "medium" },
    { name: "maintenance_cost", weight: 0.3, value: "low" }
  ],
  recommendations: [
    "Maintain current LTV",
    "Monitor rent collection closely"
  ]
}
```

---

### 需求 28: 预测性维护系统

**用户故事**: 作为物业管理者，我希望 AI 能够预测设备故障和维护需求，以便提前安排维修降低成本。

#### 验收标准

1. **WHEN** 分析现场图片，**THE System** SHALL 使用计算机视觉检测建筑问题
2. **WHEN** 处理 IoT 数据，**THE System** SHALL 识别设备异常模式
3. **WHEN** 生成工单，**THE System** SHALL 输出维修优先级和预计成本
4. **WHEN** 预测影响，**THE System** SHALL 估算维修对租金收入的影响天数
5. **WHEN** 工单创建，**THE System** SHALL 在运营面板显示并允许接单

**优先级**: MEDIUM

**维护预测输出**:
```typescript
{
  propertyId: 456,
  issue: "HVAC system degradation",
  priority: "HIGH",
  estimatedCost: 5000,
  impactDays: 3,
  confidence: 0.87,
  recommendations: [
    "Schedule inspection within 2 weeks",
    "Budget $5000-$7000 for repair"
  ]
}
```

---

### 需求 29: 模型监控与治理

**用户故事**: 作为 ML 工程师，我需要监控模型性能并在性能下降时自动回滚，以便确保模型质量。

#### 验收标准

1. **WHEN** 检测概念漂移，**THE System** SHALL 计算 drift score 并与阈值对比
2. **WHEN** 模型性能下降，**THE System** SHALL 自动回滚到上一个稳定版本
3. **WHEN** 记录模型对账，**THE System** SHALL 对比预测值和实际值并计算误差
4. **WHEN** 审计模型，**THE System** SHALL 提供完整的训练数据和参数日志
5. **WHEN** 生成报告，**THE System** SHALL 展示 MAE、AUC、drift score 等指标

**优先级**: MUST

**监控指标**:
- MAE (Mean Absolute Error)
- AUC (Area Under Curve)
- Drift Score
- Data Completeness
- Prediction Latency
- Model Version

**告警条件**:
- MAE > 阈值
- Drift Score > 0.3
- Data Completeness < 90%
- Prediction Latency > 1s

---

## 六、安全与合规

### 需求 30: 多签、Timelock 与紧急暂停

**用户故事**: 作为安全管理员，我需要确保所有关键操作都经过多重审批和时间延迟，以便防止单点故障。

#### 验收标准

1. **WHEN** 提交合约升级，**THE System** SHALL 要求至少 3/5 的多签签名
2. **WHEN** 操作进入 timelock，**THE System** SHALL 等待 48 小时后才允许执行
3. **WHEN** 紧急情况发生，**THE System** SHALL 允许 4/5 签名人调用 pause 函数
4. **WHEN** 合约暂停，**THE System** SHALL 阻止所有提现、交易和敏感操作
5. **WHEN** 恢复操作，**THE System** SHALL 要求多签确认并记录原因

**优先级**: MUST

**配置参数**:
- 多签签名人: 5 人
- 所需签名: 3/5（常规）、4/5（紧急）
- Timelock 延迟: 48 小时
- 暂停功能: 启用

---

### 需求 31: 形式化验证

**用户故事**: 作为智能合约审计员，我需要对核心合约进行形式化验证，以便确保关键不变式始终成立。

#### 验收标准

1. **WHEN** 验证 Token 合约，**THE System** SHALL 证明总供应量守恒
2. **WHEN** 验证 Vault 合约，**THE System** SHALL 证明用户份额总和等于总存款
3. **WHEN** 验证权限控制，**THE System** SHALL 证明只有授权角色能调用敏感函数
4. **WHEN** 验证 Tranche 合约，**THE System** SHALL 证明现金流分配符合优先级规则
5. **WHEN** 生成验证报告，**THE System** SHALL 列出所有已验证的不变式和假设

**优先级**: HIGH

**验证工具**:
- Certora Prover
- K Framework
- Symbolic Execution

**关键不变式**:
- Token 总供应量守恒
- Vault 份额总和 = 总存款
- 权限边界正确
- Tranche 优先级正确

---

### 需求 32: Oracle 安全机制

**用户故事**: 作为系统，我需要确保 Oracle 数据的可靠性和安全性，以便防止价格操纵攻击。

#### 验收标准

1. **WHEN** 接收 Oracle 数据，**THE System** SHALL 验证多个数据源的一致性
2. **WHEN** 数据源不一致，**THE System** SHALL 使用中位数或触发人工审核
3. **WHEN** 价格异常波动，**THE System** SHALL 触发断路器并暂停相关操作
4. **WHEN** Oracle 数据过期，**THE System** SHALL 标记为 stale 并拒绝使用
5. **WHEN** 检测闪电贷攻击，**THE System** SHALL 使用 TWAP 价格而非即时价格

**优先级**: MUST

**安全措施**:
- 多源数据聚合
- 中位数/加权平均
- 价格偏差检测
- 断路器机制
- TWAP 价格
- 数据新鲜度检查

---

### 需求 33: 渗透测试与漏洞赏金

**用户故事**: 作为安全团队，我需要进行全面的安全测试并设立漏洞赏金计划，以便发现和修复潜在漏洞。

#### 验收标准

1. **WHEN** 上线前，**THE System** SHALL 完成至少 2 次第三方安全审计
2. **WHEN** 启动漏洞赏金，**THE System** SHALL 在 Immunefi 或 HackerOne 发布计划
3. **WHEN** 收到漏洞报告，**THE System** SHALL 在 24 小时内响应并评估严重性
4. **WHEN** 确认漏洞，**THE System** SHALL 按严重性支付赏金并修复问题
5. **WHEN** 修复完成，**THE System** SHALL 发布安全公告并更新文档

**优先级**: MUST

**审计要求**:
- 至少 2 次第三方审计
- 覆盖所有核心合约
- 包含经济模型审计
- 提供审计报告

**漏洞赏金等级**:
- Critical: $50,000 - $100,000
- High: $10,000 - $50,000
- Medium: $5,000 - $10,000
- Low: $1,000 - $5,000

---

### 需求 34: 合规记录保全

**用户故事**: 作为合规官，我需要保留所有 KYC/AML 审计日志和操作记录，以便应对监管审查。

#### 验收标准

1. **WHEN** 执行 KYC 操作，**THE System** SHALL 记录操作者、时间和结果
2. **WHEN** 触发 AML 告警，**THE System** SHALL 记录告警原因和处理决策
3. **WHEN** 执行治理投票，**THE System** SHALL 记录所有投票和 timelock 操作
4. **WHEN** 监管机构请求数据，**THE System** SHALL 提供完整的审计追踪
5. **WHEN** 保留记录，**THE System** SHALL 按司法区要求保存至少 7 年

**优先级**: MUST

**记录类型**:
- KYC/AML 审计日志
- 操作决策记录
- 治理投票记录
- Timelock 操作记录
- 清算记录
- 分红记录

---

## 七、运维与监控

### 需求 35: 指标监控系统

**用户故事**: 作为运维工程师，我需要实时监控系统的关键指标，以便及时发现和解决问题。

#### 验收标准

1. **WHEN** 监控合约层，**THE System** SHALL 追踪 pending tx、gas usage、failed tx
2. **WHEN** 监控业务层，**THE System** SHALL 追踪入金/出金速率、TVL、借贷利用率
3. **WHEN** 监控 ML 层，**THE System** SHALL 追踪模型延迟、训练失败率、概念漂移
4. **WHEN** 指标异常，**THE System** SHALL 触发告警并通知相关人员
5. **WHEN** 生成报表，**THE System** SHALL 提供日/周/月的指标趋势图

**优先级**: MUST

**监控指标**:

**合约层**:
- Pending transactions
- Gas usage
- Failed transactions
- Oracle staleness

**业务层**:
- 入金/出金速率
- LP TVL
- 借贷 utilization
- Delinquency rate（逾期率）

**ML 层**:
- 模型延迟
- 训练失败率
- 概念漂移率
- 预测准确率

---

### 需求 36: 告警系统

**用户故事**: 作为运维团队，我需要在关键事件发生时收到及时告警，以便快速响应。

#### 验收标准

1. **WHEN** Oracle 数据异常，**THE System** SHALL 发送高优先级告警
2. **WHEN** 发生清算风暴，**THE System** SHALL 通知风控团队
3. **WHEN** 检测到私钥泄露风险，**THE System** SHALL 立即触发紧急响应流程
4. **WHEN** 租金大幅下降，**THE System** SHALL 通知资产管理团队
5. **WHEN** 发送告警，**THE System** SHALL 通过 Slack、PagerDuty、邮件和站内通知

**优先级**: MUST

**告警级别**:
- **P0 (Critical)**: Oracle 异常、清算风暴、安全事件
- **P1 (High)**: 租金逾期、模型性能下降
- **P2 (Medium)**: 系统性能问题、数据质量问题
- **P3 (Low)**: 一般性通知

**通知渠道**:
- Slack
- PagerDuty
- Email
- 站内通知

---

### 需求 37: 灾难恢复

**用户故事**: 作为系统管理员，我需要确保系统能够在灾难发生后快速恢复，以便保护用户资产。

#### 验收标准

1. **WHEN** 备份数据库，**THE System** SHALL 在多个地理区域保存副本
2. **WHEN** 备份 IPFS 数据，**THE System** SHALL 在多个节点 pin 文件
3. **WHEN** 管理私钥，**THE System** SHALL 使用冷钱包备份并分散存储
4. **WHEN** 测试恢复，**THE System** SHALL 每季度执行灾难恢复演练
5. **WHEN** 发生灾难，**THE System** SHALL 在 4 小时内恢复核心服务

**优先级**: MUST

**备份策略**:
- 数据库: 每日全量备份 + 实时增量备份
- IPFS: 多节点 pin（至少 3 个节点）
- 私钥: 冷钱包 + 多签分散存储
- 配置: Git 版本控制

**恢复目标**:
- RTO (Recovery Time Objective): 4 小时
- RPO (Recovery Point Objective): 1 小时

---

## 八、测试与质量保证

### 需求 38: 自动化测试

**用户故事**: 作为开发团队，我需要全面的自动化测试覆盖，以便确保代码质量和功能正确性。

#### 验收标准

1. **WHEN** 运行单元测试，**THE System** SHALL 达到 >90% 的代码覆盖率
2. **WHEN** 运行集成测试，**THE System** SHALL 模拟完整的用户流程（KYC → mint → transfer → dividend → redeem）
3. **WHEN** 运行 Fuzz 测试，**THE System** SHALL 测试边界条件和异常输入
4. **WHEN** 运行性能测试，**THE System** SHALL 验证系统能处理预期负载
5. **WHEN** 测试失败，**THE System** SHALL 阻止代码合并并通知开发者

**优先级**: MUST

**测试类型**:
- 单元测试（>90% 覆盖率）
- 集成测试（端到端流程）
- Fuzz 测试（边界条件）
- 性能测试（负载测试）
- 安全测试（漏洞扫描）

---

### 需求 39: 红队演习

**用户故事**: 作为安全团队，我需要定期进行红队演习，以便测试系统在极端情况下的表现。

#### 验收标准

1. **WHEN** 模拟 Oracle 操纵，**THE System** SHALL 触发断路器并暂停相关操作
2. **WHEN** 模拟清算潮，**THE System** SHALL 正确处理大量并发清算请求
3. **WHEN** 模拟连锁破产，**THE System** SHALL 隔离风险并保护其他用户
4. **WHEN** 模拟 DDoS 攻击，**THE System** SHALL 启用限流和防护机制
5. **WHEN** 演习结束，**THE System** SHALL 生成报告并制定改进计划

**优先级**: HIGH

**演习场景**:
- Oracle 价格操纵
- 清算风暴
- 连锁破产
- DDoS 攻击
- 私钥泄露
- 智能合约漏洞利用

---

### 需求 40: 合规流程测试

**用户故事**: 作为合规团队，我需要演练法律流程，以便确保在真实情况下能够正确响应。

#### 验收标准

1. **WHEN** 模拟投资者索赔，**THE System** SHALL 提供完整的交易记录和证明
2. **WHEN** 模拟数据访问请求，**THE System** SHALL 在法定时间内提供用户数据
3. **WHEN** 模拟法院传票，**THE System** SHALL 按法律程序响应并保留记录
4. **WHEN** 模拟监管审查，**THE System** SHALL 提供所有合规文档和审计日志
5. **WHEN** 演练结束，**THE System** SHALL 更新合规手册和响应流程

**优先级**: MUST

**演练场景**:
- 投资者索赔
- GDPR 数据访问请求
- 法院传票响应
- 监管机构审查
- AML 调查配合

---

## 九、第三方集成

### 需求 41: 托管服务集成

**用户故事**: 作为系统，我需要集成专业的托管服务，以便安全地管理用户资产。

#### 验收标准

1. **WHEN** 集成 Fireblocks，**THE System** SHALL 使用 MPC 技术管理私钥
2. **WHEN** 执行交易，**THE System** SHALL 通过托管 API 签名并广播
3. **WHEN** 管理密钥，**THE System** SHALL 实施密钥轮换和访问控制
4. **WHEN** 审计密钥使用，**THE System** SHALL 记录所有签名操作
5. **WHEN** 灾难恢复，**THE System** SHALL 使用托管服务的备份机制

**优先级**: MUST

**托管选项**:
- Fireblocks（MPC 托管）
- BitGo（多签托管）
- 银行托管（传统金融机构）

---

### 需求 42: KYC 供应商集成

**用户故事**: 作为系统，我需要集成第三方 KYC 服务，以便自动化身份验证流程。

#### 验收标准

1. **WHEN** 启动 KYC，**THE System** SHALL 调用 KYC 供应商 API 创建会话
2. **WHEN** 用户完成 KYC，**THE System** SHALL 接收 webhook 回调并更新状态
3. **WHEN** 存储结果，**THE System** SHALL 仅保存哈希，不存储 PII 明文
4. **WHEN** 查询状态，**THE System** SHALL 调用供应商 API 获取最新状态
5. **WHEN** 导出报告，**THE System** SHALL 生成合规报告供审计使用

**优先级**: MUST

**KYC 供应商**:
- Onfido
- Persona
- Sumsub

**集成功能**:
- 身份验证
- 文档验证
- 活体检测
- AML 筛查
- Webhook 回调

---

### 需求 43: Oracle 服务集成

**用户故事**: 作为系统，我需要集成可靠的 Oracle 服务，以便获取链下数据。

#### 验收标准

1. **WHEN** 集成 Chainlink，**THE System** SHALL 订阅价格 feed 和 PoR feed
2. **WHEN** 集成企业 Oracle，**THE System** SHALL 接收银行对账和租金确认
3. **WHEN** 验证数据，**THE System** SHALL 检查签名和数据新鲜度
4. **WHEN** 数据不一致，**THE System** SHALL 使用多源聚合算法
5. **WHEN** Oracle 故障，**THE System** SHALL 切换到备用数据源

**优先级**: MUST

**Oracle 类型**:
- Chainlink（价格 feed、PoR）
- 企业 Oracle（银行对账、租金确认）
- 备用 Oracle（故障转移）

---

### 需求 44: 支付网关集成

**用户故事**: 作为用户，我需要使用多种支付方式入金，以便灵活地投资。

#### 验收标准

1. **WHEN** 集成 Stripe，**THE System** SHALL 支持信用卡和借记卡支付
2. **WHEN** 集成银行 API，**THE System** SHALL 支持 ACH 和 Wire Transfer
3. **WHEN** 集成稳定币桥，**THE System** SHALL 支持 USDC 链上 mint
4. **WHEN** 处理支付，**THE System** SHALL 验证 KYC 状态并记录交易
5. **WHEN** 支付失败，**THE System** SHALL 通知用户并提供重试选项

**优先级**: MUST

**支付方式**:
- 信用卡/借记卡（Stripe）
- ACH 转账
- Wire Transfer
- USDC/USDT（链上）
- Circle USDC mint

---

### 需求 45: 审计与会计服务集成

**用户故事**: 作为平台，我需要与专业审计公司合作，以便确保财务透明和合规。

#### 验收标准

1. **WHEN** 季度审计，**THE System** SHALL 提供所有财务数据和交易记录
2. **WHEN** 年度审计，**THE System** SHALL 配合审计师完成完整审计流程
3. **WHEN** 生成报告，**THE System** SHALL 发布审计报告并上传到 IPFS
4. **WHEN** 发现问题，**THE System** SHALL 制定整改计划并跟踪执行
5. **WHEN** 更新流程，**THE System** SHALL 根据审计建议优化内部控制

**优先级**: MUST

**审计类型**:
- 季度财务审计
- 年度完整审计
- 智能合约审计
- 安全审计

**审计公司**:
- Big 4 会计师事务所
- 区块链专业审计公司

---

## 十、增值与高级特性

### 需求 46: 自动化法律合约生成（NLP）

**用户故事**: 作为法务团队，我希望使用 NLP 技术自动生成和审核法律文档，以便提高效率。

#### 验收标准

1. **WHEN** 生成租约摘要，**THE System** SHALL 使用 NLP 提取关键条款
2. **WHEN** 审计标注，**THE System** SHALL 自动标记需要人工审核的条款
3. **WHEN** 生成投资协议，**THE System** SHALL 基于模板和参数自动填充
4. **WHEN** 验证合规性，**THE System** SHALL 检查文档是否符合司法区要求
5. **WHEN** 存储文档，**THE System** SHALL 生成哈希并上链存证

**优先级**: MEDIUM

**NLP 功能**:
- 租约摘要生成
- 关键条款提取
- 合规性检查
- 文档模板填充
- 审计标注

---

### 需求 47: 分布式治理（半权限化）

**用户故事**: 作为代币持有者，我希望能够参与平台治理投票，以便影响非核心决策。

#### 验收标准

1. **WHEN** 创建提案，**THE System** SHALL 验证提案者持有足够代币
2. **WHEN** 投票，**THE System** SHALL 按持币数量计算投票权重
3. **WHEN** 提案通过，**THE System** SHALL 自动执行或提交给管理员审批
4. **WHEN** 涉及合规事项，**THE System** SHALL 限制投票范围仅限非核心功能
5. **WHEN** 记录投票，**THE System** SHALL 将所有投票记录上链

**优先级**: MEDIUM

**可投票事项**:
- 新资产上线
- 费率调整
- 功能优先级
- 社区提案

**不可投票事项**:
- 合规规则
- KYC/AML 流程
- 核心安全参数

---

### 需求 48: 合成 RWA 指数与 MBS 风格产品

**用户故事**: 作为投资者，我希望能够投资多元化的 RWA 指数产品，以便分散风险。

#### 验收标准

1. **WHEN** 创建指数，**THE System** SHALL 基于多个 SPV 的 NAV 计算指数值
2. **WHEN** 发行指数代币，**THE System** SHALL 按比例持有底层资产
3. **WHEN** 再平衡，**THE System** SHALL 定期调整资产配置
4. **WHEN** 计算收益，**THE System** SHALL 聚合所有底层资产的分红
5. **WHEN** 赎回，**THE System** SHALL 按比例返还底层资产或等值稳定币

**优先级**: LOW

**产品类型**:
- 地理指数（美国、亚洲、欧洲）
- 类型指数（商业、住宅、混合）
- 风险指数（低风险、平衡、高收益）
- MBS 风格（抵押贷款支持证券）

---

### 需求 49: 移动端钱包集成与白标 Portal

**用户故事**: 作为合作伙伴，我希望能够使用白标解决方案快速部署自己的 RWA 平台。

#### 验收标准

1. **WHEN** 集成移动钱包，**THE System** SHALL 支持 WalletConnect 和主流钱包
2. **WHEN** 部署白标 Portal，**THE System** SHALL 允许自定义品牌和域名
3. **WHEN** 配置功能，**THE System** SHALL 允许选择启用的功能模块
4. **WHEN** 管理用户，**THE System** SHALL 提供独立的用户管理系统
5. **WHEN** 结算费用，**THE System** SHALL 按使用量收取平台费用

**优先级**: HIGH

**白标功能**:
- 自定义品牌
- 独立域名
- 功能模块选择
- 用户管理
- 数据隔离

---

### 需求 50: 二级市场流动性保险

**用户故事**: 作为投资者，我希望有流动性保险保护，以便在市场流动性不足时仍能退出。

#### 验收标准

1. **WHEN** 购买保险，**THE System** SHALL 收取保费并记录保单
2. **WHEN** 触发条件满足，**THE System** SHALL 自动执行赔付
3. **WHEN** 保险池不足，**THE System** SHALL 从储备金补充
4. **WHEN** 计算保费，**THE System** SHALL 基于历史流动性数据定价
5. **WHEN** 理赔，**THE System** SHALL 在 24 小时内完成支付

**优先级**: HIGH

**保险类型**:
- 流动性保险（保证最低流动性）
- 价格保险（保护价格波动）
- 参数化保险（基于触发条件自动赔付）

**触发条件**:
- 订单簿深度 < 阈值
- 价格滑点 > 阈值
- 交易量 < 阈值

---

## 十一、总体验收标准

### 安全验收

1. **THE Platform** SHALL 通过至少 2 次第三方安全审计且无高/严重级别漏洞
2. **THE Platform** SHALL 实施多签和 timelock 机制保护所有敏感操作
3. **THE Platform** SHALL 部署漏洞赏金计划并运行至少 3 个月
4. **THE Platform** SHALL 通过渗透测试和红队演习

### 合规验收

1. **THE Platform** SHALL 完成目标司法区的法律顾问评估
2. **THE Platform** SHALL 实施完整的 KYC/AML 流程并通过合规审查
3. **THE Platform** SHALL 签署 SPV 与托管协议
4. **THE Platform** SHALL 建立完整的审计追踪和记录保全机制

### 功能验收

1. **THE Platform** SHALL 支持完整的用户流程：入金 → mint → 查看 NAV → 收到分红 → 发起赎回
2. **THE Platform** SHALL 提供实时 NAV 更新和历史估值查询
3. **THE Platform** SHALL 支持多种 DeFi 功能：Vault、AMM、借贷、Tranche
4. **THE Platform** SHALL 提供 AI 驱动的估值、风控和预测维护

### 数据验收

1. **THE Platform** SHALL 提供历史估值数据和置信区间
2. **THE Platform** SHALL 支持估值模型版本追溯
3. **THE Platform** SHALL 提供完整的交易历史和审计日志
4. **THE Platform** SHALL 实现链上链下数据一致性验证

### 监控验收

1. **THE Platform** SHALL 提供实时监控仪表盘显示关键指标
2. **THE Platform** SHALL 实施多级告警系统并正确路由通知
3. **THE Platform** SHALL 建立灾难恢复机制并定期演练
4. **THE Platform** SHALL 达到 99.9% 的系统可用性

---

## 附录：优先级总结

### MUST（必须实现）- 18 项
1. 多租户 SPV 管理
2. 权限化 Token 发放
3. 链上链下数据一致性
4. KYC/AML 工作流
5. 投资者仪表盘
6. Permissioned Token 合约
7. Vault 策略合约
8. Oracle 集成
9. 管理控制与多签
10. 用户与 KYC 服务
11. 支付与法币入金
12. 编排引擎
13. 会计与税务报表
14. 审计追踪
15. 用户入驻流程
16. 资产详情页
17. 管理员运营面板
18. 数据管道与 AI 特征

### HIGH（高优先级）- 15 项
1. Tranche Factory
2. 权限化 AMM
3. 借贷池
4. 二级市场撮合
5. 流动性 UI
6. 借贷 UI
7. 智能做市机器人
8. 形式化验证
9. 红队演习
10. 托管服务集成
11. KYC 供应商集成
12. Oracle 服务集成
13. 支付网关集成
14. 移动端钱包集成
15. 流动性保险

### MEDIUM（中优先级）- 3 项
1. 预测性维护
2. 自动化法律合约生成
3. 分布式治理

### LOW（低优先级）- 1 项
1. 合成 RWA 指数与 MBS

---

**文档版本**: v1.0  
**创建日期**: 2025-10-27  
**最后更新**: 2025-10-27  
**状态**: 待审核
