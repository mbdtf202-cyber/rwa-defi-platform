# 🚀 快速开始：审计准备

## 立即可执行的步骤

本指南提供了立即可以执行的命令和步骤，帮助你快速推进项目到审计阶段。

---

## ⚡ 第一步：运行预部署检查（5分钟）

验证项目是否准备好部署：

```bash
# 运行完整的预部署检查
./scripts/pre-deployment-check.sh
```

这将检查：
- ✅ 代码质量
- ✅ 测试覆盖率
- ✅ 安全扫描
- ✅ 文档完整性
- ✅ 配置文件

**预期结果**：大部分检查通过，少量警告

---

## 🧪 第二步：运行本地测试（10分钟）

确保所有测试通过：

```bash
# 1. 智能合约测试
cd packages/contracts
npm install
npm run test
npm run test:coverage

# 2. 后端测试
cd ../backend
npm install
npm run test

# 3. 返回根目录
cd ../..
```

**预期结果**：所有测试通过，覆盖率 > 90%

---

## 🌐 第三步：准备测试网部署（15分钟）

### 3.1 获取测试网ETH

访问以下任一水龙头获取Sepolia ETH：

1. **Alchemy Faucet**（推荐）
   - https://sepoliafaucet.com/
   - 需要Alchemy账号
   - 每天0.5 ETH

2. **QuickNode Faucet**
   - https://faucet.quicknode.com/ethereum/sepolia
   - 需要Twitter账号
   - 每天0.1 ETH

3. **Infura Faucet**
   - https://www.infura.io/faucet/sepolia
   - 需要Infura账号
   - 每天0.5 ETH

### 3.2 配置环境变量

```bash
# 1. 复制环境变量模板
cp packages/contracts/.env.production.example packages/contracts/.env.sepolia

# 2. 编辑文件
nano packages/contracts/.env.sepolia
# 或使用你喜欢的编辑器
```

填入以下信息：

```bash
# Sepolia Testnet Configuration
NETWORK=sepolia

# RPC URL - 从以下服务获取：
# Alchemy: https://dashboard.alchemy.com/
# Infura: https://infura.io/
SEPOLIA_RPC_URL=https://eth-sepolia.g.alchemy.com/v2/YOUR_API_KEY

# 部署者私钥（测试钱包，不要使用真实资金的钱包！）
DEPLOYER_PRIVATE_KEY=your_test_wallet_private_key

# Etherscan API Key - 用于合约验证
# 获取：https://etherscan.io/myapikey
ETHERSCAN_API_KEY=your_etherscan_api_key

# 合约配置
TOKEN_NAME=RWA Property Token (Testnet)
TOKEN_SYMBOL=tRWAP
INITIAL_SPV_ID=1

# Timelock配置（测试网使用较短时间）
TIMELOCK_MIN_DELAY=3600  # 1小时

# Oracle配置（Sepolia地址）
CHAINLINK_ETH_USD=0x694AA1769357215DE4FAC081bf1f309aDC325306
CHAINLINK_USDC_USD=0xA2F78ab2355fe2f984D808B5CeE7FD0A93D5270E

# Multisig配置
MULTISIG_OWNERS=0xYourAddress1,0xYourAddress2,0xYourAddress3
MULTISIG_THRESHOLD=2

# Gas配置
GAS_PRICE_GWEI=20
GAS_LIMIT=8000000
```

### 3.3 验证配置

```bash
cd packages/contracts

# 检查配置是否正确
npx hardhat verify-config --network sepolia

# 检查账户余额
npx hardhat run scripts/check-balance.ts --network sepolia
```

---

## 🚀 第四步：执行测试网部署（20分钟）

### 方式1：自动化部署（推荐）

```bash
# 从项目根目录运行
npm run deploy:testnet
```

这将自动执行：
1. 安装依赖
2. 编译合约
3. 运行测试
4. 部署到Sepolia
5. 验证合约
6. 生成部署报告

### 方式2：手动部署

```bash
cd packages/contracts

# 1. 编译
npm run compile

# 2. 部署
npx hardhat run scripts/deploy-production.ts --network sepolia

# 3. 验证（等待10秒让Etherscan索引）
sleep 10
npx hardhat run scripts/verify-contracts.ts --network sepolia

# 4. 初始化
npx hardhat run scripts/initialize-mainnet.ts --network sepolia
```

### 验证部署

```bash
# 检查部署地址
cat deployments/sepolia.json

# 在Etherscan上查看
# https://sepolia.etherscan.io/address/YOUR_CONTRACT_ADDRESS
```

---

## 🧪 第五步：运行集成测试（30分钟）

### 5.1 智能合约集成测试

```bash
cd packages/contracts

# 运行集成测试
npm run test:integration

# 如果测试失败，查看详细日志
npm run test:integration -- --verbose
```

### 5.2 后端E2E测试

```bash
cd packages/backend

# 启动测试数据库
docker-compose up -d postgres redis

# 运行E2E测试
npm run test:e2e

# 清理
docker-compose down
```

### 5.3 生成测试报告

```bash
cd ../..

# 生成完整测试报告
npm run test:report

# 报告位置：
# - packages/contracts/coverage/
# - packages/backend/coverage/
# - test-reports/
```

---

## 📊 第六步：性能测试（可选，30分钟）

### 6.1 Gas分析

```bash
cd packages/contracts

# 运行Gas报告
REPORT_GAS=true npm run test

# 查看报告
cat gas-report.txt
```

### 6.2 API性能测试

```bash
# 确保后端正在运行
cd packages/backend
npm run start:dev &
BACKEND_PID=$!

# 在另一个终端运行性能测试
cd ../..
npm run test:performance

# 停止后端
kill $BACKEND_PID
```

---

## 📧 第七步：联系审计公司（1小时）

### 7.1 准备审计材料包

```bash
# 创建审计包目录
mkdir -p audit-package

# 复制合约代码
cp -r packages/contracts/contracts audit-package/

# 复制测试
cp -r packages/contracts/test audit-package/

# 复制文档
cp SECURITY_AUDIT_PREP.md audit-package/
cp AUDIT_EXECUTION_PLAN.md audit-package/
cp packages/contracts/README.md audit-package/

# 生成依赖清单
cd packages/contracts
npm list --all > ../../audit-package/dependencies.txt

# 生成测试报告
npm run test:coverage > ../../audit-package/test-coverage.txt

# 打包
cd ../../audit-package
tar -czf rwa-defi-audit-package-$(date +%Y%m%d).tar.gz *

echo "审计包已创建：rwa-defi-audit-package-$(date +%Y%m%d).tar.gz"
```

### 7.2 发送审计请求

使用 `AUDIT_CONTACT_TEMPLATE.md` 中的邮件模板，发送给：

**优先级1：OpenZeppelin**
```
收件人：audits@openzeppelin.com
主题：Security Audit Request - RWA DeFi Platform
附件：审计包 + 项目概述
```

**优先级2：Trail of Bits**
```
收件人：info@trailofbits.com
主题：Smart Contract Audit Inquiry - RWA DeFi Platform
附件：审计包 + 技术白皮书
```

**优先级3：Consensys Diligence**
```
收件人：diligence@consensys.net
主题：Audit Request - Real Estate Tokenization Platform
附件：审计包 + 架构文档
```

### 7.3 跟进时间表

| 天数 | 行动 |
|------|------|
| Day 0 | 发送初始邮件 |
| Day 3 | 如未回复，发送跟进邮件 |
| Day 7 | 尝试其他联系方式（LinkedIn, Telegram） |
| Day 10 | 考虑备选审计公司 |

---

## 📋 检查清单

在联系审计公司前，确保完成：

### 代码准备
- [ ] 所有测试通过
- [ ] 测试覆盖率 > 90%
- [ ] 代码已冻结（不再修改）
- [ ] 测试网部署成功
- [ ] 合约已验证

### 文档准备
- [ ] README完整
- [ ] 安全审计准备文档完成
- [ ] API文档完整
- [ ] 架构图清晰
- [ ] 已知问题列表

### 材料准备
- [ ] 审计包已打包
- [ ] 测试报告已生成
- [ ] 依赖清单已导出
- [ ] 部署地址已记录
- [ ] 联系信息已准备

---

## 🎯 预期时间线

| 阶段 | 时间 | 状态 |
|------|------|------|
| 预部署检查 | 5分钟 | ⏳ |
| 本地测试 | 10分钟 | ⏳ |
| 环境配置 | 15分钟 | ⏳ |
| 测试网部署 | 20分钟 | ⏳ |
| 集成测试 | 30分钟 | ⏳ |
| 性能测试 | 30分钟 | ⏳ |
| 准备审计材料 | 1小时 | ⏳ |
| **总计** | **~3小时** | |

---

## 🆘 故障排除

### 问题1：测试失败

```bash
# 清理并重新安装
rm -rf node_modules package-lock.json
npm install

# 重新编译
cd packages/contracts
npm run compile

# 运行单个测试文件
npm run test test/PermissionedToken.test.ts
```

### 问题2：部署失败

```bash
# 检查余额
npx hardhat run scripts/check-balance.ts --network sepolia

# 检查Gas价格
npx hardhat run scripts/check-gas-price.ts --network sepolia

# 增加Gas限制
# 编辑 hardhat.config.ts，增加 gas 和 gasPrice
```

### 问题3：验证失败

```bash
# 手动验证单个合约
npx hardhat verify --network sepolia CONTRACT_ADDRESS "Constructor Arg1" "Constructor Arg2"

# 查看验证状态
npx hardhat verify-status --network sepolia
```

### 问题4：RPC限制

如果遇到速率限制：

```bash
# 使用不同的RPC提供商
# 在 .env.sepolia 中更换 SEPOLIA_RPC_URL

# 或添加延迟
# 在部署脚本中添加 await sleep(1000)
```

---

## 📞 获取帮助

### 文档资源

- [完整部署指南](./DEPLOYMENT.md)
- [安全审计准备](./SECURITY_AUDIT_PREP.md)
- [系统测试计划](./SYSTEM_TESTING_PLAN.md)
- [审计执行计划](./AUDIT_EXECUTION_PLAN.md)

### 社区支持

- **GitHub Issues**：报告问题和bug
- **Discord**：实时讨论和支持
- **Telegram**：快速问答

### 紧急联系

如遇到严重问题：
- 📧 tech-support@rwa-platform.com
- 💬 Telegram: @rwa_support

---

## ✅ 完成后

当你完成所有步骤后：

1. ✅ 测试网部署成功
2. ✅ 所有测试通过
3. ✅ 审计材料已准备
4. ✅ 审计公司已联系

**下一步**：等待审计公司回复（通常3-7天）

在等待期间，你可以：
- 📝 完善文档
- 🧪 进行更多测试
- 🎨 优化前端UI
- 📊 准备营销材料

---

## 🎉 恭喜！

你已经完成了审计准备的所有关键步骤！

**项目状态**：✅ 准备就绪  
**下一里程碑**：安全审计  
**预计时间**：4-6周

---

**文档版本**：1.0  
**最后更新**：2025-10-28  
**维护者**：技术团队

**祝你好运！** 🚀

