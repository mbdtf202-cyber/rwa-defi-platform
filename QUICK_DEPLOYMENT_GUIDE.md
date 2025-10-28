# 🚀 快速部署指南

一页纸快速部署 RWA DeFi Platform

---

## 📋 前置条件

```bash
✅ Node.js >= 20.0.0
✅ Python >= 3.11
✅ PostgreSQL >= 15
✅ Redis >= 7
✅ Docker (可选)
✅ 测试网 ETH (Arbitrum Sepolia)
```

---

## ⚡ 5 分钟快速启动

### 1. 克隆和安装
```bash
git clone <repository>
cd rwa-defi-platform
npm install
```

### 2. 配置环境
```bash
# 智能合约
cp packages/contracts/.env.example packages/contracts/.env
# 编辑 packages/contracts/.env

# 后端
cp packages/backend/.env.example packages/backend/.env
# 编辑 packages/backend/.env

# 前端
cp rwa-defi-platform/.env.example rwa-defi-platform/.env
# 编辑 rwa-defi-platform/.env
```

### 3. 数据库设置
```bash
cd packages/backend
npm run prisma:migrate
npm run prisma:seed
```

### 4. 启动服务
```bash
# 终端 1: 后端
cd packages/backend
npm run start:dev

# 终端 2: 前端
cd rwa-defi-platform
npm run dev

# 终端 3: ML 服务
cd packages/ml-services
python main.py
```

### 5. 访问应用
```
前端: http://localhost:5173
后端 API: http://localhost:3000
ML API: http://localhost:8000
```

---

## 🔧 智能合约部署

### 测试网部署（Arbitrum Sepolia）
```bash
cd packages/contracts

# 1. 检查环境
npm run pre-deploy:check -- --network arbitrumSepolia

# 2. 部署合约
npm run deploy:testnet

# 3. 验证部署
npm run verify:deployment -- --network arbitrumSepolia

# 4. 在区块浏览器验证
npx hardhat verify --network arbitrumSepolia <ADDRESS> <ARGS>
```

### 主网部署（Arbitrum One）
```bash
# ⚠️ 仅在审计通过后执行！

# 1. 检查环境
npm run pre-deploy:check -- --network arbitrum

# 2. 部署合约
npm run deploy:production

# 3. 配置多签
npm run post-deploy:config -- --network arbitrum

# 4. 验证部署
npm run verify:deployment -- --network arbitrum
```

---

## 🐳 Docker 部署

### 开发环境
```bash
docker-compose up -d
```

### 生产环境
```bash
docker-compose -f docker-compose.prod.yml up -d
```

---

## ☸️ Kubernetes 部署

### 部署所有服务
```bash
# 后端
kubectl apply -f k8s/production/backend-deployment.yaml

# ML 服务
kubectl apply -f k8s/production/ml-services-deployment.yaml

# ELK Stack
kubectl apply -f k8s/production/logging/
```

### 检查状态
```bash
kubectl get pods
kubectl get services
kubectl logs <pod-name>
```

---

## 🧪 测试

### 智能合约测试
```bash
cd packages/contracts
npm test
npm run test:coverage
```

### 后端测试
```bash
cd packages/backend
npm test
npm run test:e2e
```

### 前端测试
```bash
cd rwa-defi-platform
npm test
```

---

## 📊 监控

### 健康检查
```bash
# 后端
curl http://localhost:3000/health

# ML 服务
curl http://localhost:8000/health
```

### 日志查看
```bash
# Docker
docker logs <container-name>

# Kubernetes
kubectl logs <pod-name>

# Kibana
http://logs.rwa-platform.com
```

### 指标监控
```bash
# Prometheus
http://prometheus.rwa-platform.com

# Grafana
http://grafana.rwa-platform.com
```

---

## 🔒 安全检查清单

### 部署前
- [ ] 所有测试通过
- [ ] 环境变量已配置
- [ ] 私钥安全存储
- [ ] 数据库备份已配置
- [ ] SSL 证书已配置
- [ ] 防火墙规则已设置

### 智能合约
- [ ] 审计报告已获取
- [ ] 测试覆盖率 > 85%
- [ ] 多签钱包已配置
- [ ] Timelock 已设置
- [ ] 紧急暂停已测试

### 应用安全
- [ ] HTTPS 已启用
- [ ] CORS 已配置
- [ ] 速率限制已启用
- [ ] 输入验证已实施
- [ ] 日志记录已启用

---

## 🆘 故障排查

### 合约部署失败
```bash
# 检查余额
npx hardhat console --network arbitrumSepolia
> (await ethers.provider.getBalance(deployer.address))

# 检查 Gas 价格
> (await ethers.provider.getFeeData())

# 重新编译
npm run compile
```

### 后端启动失败
```bash
# 检查数据库连接
npm run prisma:studio

# 检查 Redis 连接
redis-cli ping

# 查看详细日志
npm run start:dev -- --debug
```

### 前端构建失败
```bash
# 清除缓存
rm -rf node_modules .next
npm install

# 检查环境变量
cat .env

# 重新构建
npm run build
```

---

## 📞 获取帮助

### 文档
- 📖 [完整文档](./README.md)
- 🚀 [部署指南](./packages/contracts/DEPLOYMENT_GUIDE.md)
- 🔒 [安全指南](./SECURITY_AUDIT_PREP.md)

### 命令速查
```bash
# 查看所有可用命令
npm run

# 智能合约命令
cd packages/contracts && npm run

# 后端命令
cd packages/backend && npm run

# 前端命令
cd rwa-defi-platform && npm run
```

### 支持渠道
- GitHub Issues: 技术问题
- Discord: 社区支持
- Email: support@rwa-platform.com

---

## ✅ 部署检查清单

### 测试网部署
- [ ] 获取测试网 ETH
- [ ] 配置环境变量
- [ ] 运行部署前检查
- [ ] 部署所有合约
- [ ] 验证合约功能
- [ ] 测试前端集成
- [ ] 测试后端集成
- [ ] 端到端测试

### 主网部署
- [ ] 安全审计通过
- [ ] 漏洞赏金启动
- [ ] 生产环境配置
- [ ] 多签钱包设置
- [ ] 部署所有合约
- [ ] 转移合约所有权
- [ ] 配置监控告警
- [ ] 备份和恢复测试
- [ ] 公开发布

---

**快速参考版本**: v1.0  
**最后更新**: 2025-10-28
