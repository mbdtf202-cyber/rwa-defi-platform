# Phase 2 Quick Start Guide

快速开始使用 Phase 2 增强功能。

---

## 🚀 已实现的功能

### 1. 二级市场交易 (Secondary Market)

**启动市场服务**:
```bash
cd packages/backend
npm run start:dev
```

**创建订单**:
```bash
curl -X POST http://localhost:3000/api/v1/marketplace/order \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "tokenAddress": "0x...",
    "type": "BUY",
    "price": 100.50,
    "amount": 10
  }'
```

**查看订单簿**:
```bash
curl http://localhost:3000/api/v1/marketplace/orderbook?tokenAddress=0x...
```

---

### 2. 税务报告 (Tax Reporting)

**生成年度报告**:
```bash
curl http://localhost:3000/api/v1/accounting/USER_ID/yearly-report?year=2025&jurisdiction=US \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**查看资本利得**:
```bash
curl http://localhost:3000/api/v1/accounting/USER_ID/capital-gains?year=2025
```

**查看股息收入**:
```bash
curl http://localhost:3000/api/v1/accounting/USER_ID/dividends?year=2025
```

---

### 3. Tranche 分层证券

**编译合约**:
```bash
cd packages/contracts
npm run compile
```

**运行测试**:
```bash
npm run test -- --grep "TrancheFactory"
```

**部署到本地网络**:
```bash
npx hardhat node  # 在另一个终端
npx hardhat run scripts/deploy-tranche.ts --network localhost
```

**创建 Tranche**:
```javascript
const configs = [
  {
    name: 'Senior Tranche',
    symbol: 'SENIOR',
    priority: 0,
    targetYield: 500,  // 5%
    allocation: 6000   // 60%
  },
  {
    name: 'Junior Tranche',
    symbol: 'JUNIOR',
    priority: 1,
    targetYield: 1000, // 10%
    allocation: 4000   // 40%
  }
];

await trancheFactory.createTranche(spvId, configs);
```

---

### 4. 监控系统 (Monitoring)

**查看系统指标**:
```bash
curl http://localhost:3000/api/v1/monitoring/metrics \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**健康检查**:
```bash
curl http://localhost:3000/api/v1/monitoring/health
```

---

### 5. 事件监听 (Event Orchestration)

**启动区块链监听器**:
```bash
cd packages/backend
npm run start:dev
# 监听器会自动启动并处理链上事件
```

**查看处理的事件**:
```bash
curl http://localhost:3000/api/v1/audit/logs?action=BLOCKCHAIN_EVENT
```

---

## 📦 安装依赖

### Backend 额外依赖
```bash
cd packages/backend
npm install @bull-board/api @bull-board/nestjs bull
npm install pdfkit
npm install socket.io @nestjs/websockets @nestjs/platform-socket.io
```

### ML Service 额外依赖
```bash
cd packages/ml-services
pip install opencv-python pillow transformers torch
```

---

## 🧪 测试

### 运行所有测试
```bash
./scripts/run-tests.sh
```

### 只测试合约
```bash
cd packages/contracts
npm run test
```

### 只测试后端
```bash
cd packages/backend
npm run test:e2e
```

---

## 🔧 配置

### 环境变量

在 `.env` 中添加:

```bash
# IPFS (待实现)
IPFS_API_URL=https://ipfs.infura.io:5001
IPFS_API_KEY=your_key
IPFS_API_SECRET=your_secret

# Bull Queue (事件处理)
REDIS_HOST=localhost
REDIS_PORT=6379

# Monitoring
PROMETHEUS_PORT=9090
GRAFANA_PORT=3001

# WebSocket
WEBSOCKET_PORT=3002
```

---

## 📊 监控面板

### Prometheus
```bash
# 启动 Prometheus
docker run -p 9090:9090 -v ./k8s/monitoring/prometheus.yml:/etc/prometheus/prometheus.yml prom/prometheus
```

访问: http://localhost:9090

### Grafana
```bash
# 启动 Grafana
docker run -p 3001:3000 grafana/grafana
```

访问: http://localhost:3001 (admin/admin)

---

## 🚧 待完成功能

### 高优先级
1. **IPFS 集成** - 需要配置 Infura/Pinata
2. **WebSocket 实时更新** - 订单簿实时推送
3. **PDF 报告生成** - 税务报告 PDF 导出
4. **Bull Queue** - 事件重试机制

### 中优先级
5. **流动性保险合约** - 新智能合约
6. **形式化验证** - Certora 设置
7. **预测性维护** - ML 模型训练
8. **法律合同 NLP** - NLP 管道

### 低优先级
9. **合成指数产品** - 指数代币
10. **移动钱包集成** - WalletConnect

---

## 💡 使用示例

### 完整交易流程

1. **用户注册并 KYC**:
```bash
# 注册
curl -X POST http://localhost:3000/api/v1/auth/register \
  -d '{"email":"user@example.com","password":"pass123"}'

# 启动 KYC
curl -X POST http://localhost:3000/api/v1/kyc/initiate \
  -H "Authorization: Bearer TOKEN" \
  -d '{"provider":"ONFIDO","firstName":"John","lastName":"Doe"}'
```

2. **创建卖单**:
```bash
curl -X POST http://localhost:3000/api/v1/marketplace/order \
  -H "Authorization: Bearer TOKEN" \
  -d '{"tokenAddress":"0x...","type":"SELL","price":100,"amount":10}'
```

3. **创建买单 (自动匹配)**:
```bash
curl -X POST http://localhost:3000/api/v1/marketplace/order \
  -H "Authorization: Bearer TOKEN" \
  -d '{"tokenAddress":"0x...","type":"BUY","price":100,"amount":5}'
```

4. **查看交易历史**:
```bash
curl http://localhost:3000/api/v1/marketplace/trades?tokenAddress=0x...
```

5. **年底生成税务报告**:
```bash
curl http://localhost:3000/api/v1/accounting/USER_ID/yearly-report?year=2025
```

---

## 🐛 故障排除

### 订单不匹配
- 检查 KYC 状态: `GET /kyc/status`
- 检查代币锁定期: `GET /user/holdings`
- 检查价格是否匹配

### 事件未处理
- 检查 Redis 连接
- 查看 Bull 队列状态
- 检查区块链连接

### 测试失败
- 确保 Hardhat 节点运行
- 确保数据库已迁移
- 检查环境变量

---

## 📚 相关文档

- [Phase 2 Requirements](.kiro/specs/phase-2-enhancements/requirements.md)
- [Phase 2 Tasks](.kiro/specs/phase-2-enhancements/tasks.md)
- [Phase 2 Progress](PHASE2_PROGRESS.md)
- [API Documentation](API_DOCUMENTATION.md)
- [Deployment Guide](DEPLOYMENT.md)

---

**更新时间**: 2025-10-28  
**状态**: Phase 2A 40% 完成
