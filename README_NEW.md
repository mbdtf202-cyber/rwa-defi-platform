# 🏢 RWA DeFi Platform

> Enterprise-grade Real World Asset tokenization platform with integrated DeFi capabilities and AI-powered analytics

[![CI/CD](https://github.com/mbdtf202-cyber/rwa-defi-platform/workflows/CI/CD%20Pipeline/badge.svg)](https://github.com/mbdtf202-cyber/rwa-defi-platform/actions)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Node Version](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen)](package.json)

## 📋 Overview

The RWA DeFi Platform enables institutional-grade tokenization of real estate assets with integrated DeFi capabilities, AI-powered valuations, and comprehensive compliance features.

### 🌟 Key Features

- 🏠 **Real Estate Tokenization**: Convert properties into tradeable ERC-20 securities
- 🔐 **KYC/AML Compliance**: Multi-provider verification (Onfido, Persona, Sumsub)
- 🤖 **AI Valuations**: ML-powered property appraisal and risk assessment
- 💰 **DeFi Integration**: Lending pools, AMM, and yield strategies
- 📊 **SPV Management**: Complete lifecycle management for Special Purpose Vehicles
- 🔗 **Blockchain**: Ethereum smart contracts with upgradeable architecture
- 💳 **Payments**: Fiat (Stripe) and cryptocurrency support
- 📈 **Oracle System**: Multi-source data aggregation for accurate pricing
- 🔍 **Audit Trail**: Comprehensive logging and compliance reporting

## 📊 Project Status

| Component | Status | Progress |
|-----------|--------|----------|
| Smart Contracts | ✅ Complete | 100% (7/7) |
| Backend Services | ✅ Complete | 100% (8/8) |
| Frontend | ✅ Complete | 100% |
| ML Services | ✅ Complete | 85% |
| Infrastructure | 🔄 In Progress | 50% |

See [PROJECT_STATUS.md](PROJECT_STATUS.md) for detailed information.

## 🏗️ Architecture

### Monorepo Structure

```
rwa-defi-platform/
├── packages/
│   ├── contracts/          # Smart Contracts (Solidity + Hardhat)
│   │   ├── PermissionedToken.sol
│   │   ├── TrancheFactory.sol
│   │   ├── Vault.sol
│   │   ├── PermissionedAMM.sol
│   │   ├── LendingPool.sol
│   │   ├── OracleAggregator.sol
│   │   └── SPVRegistry.sol
│   │
│   ├── backend/            # Backend API (NestJS + Prisma)
│   │   ├── auth/          # Authentication & JWT
│   │   ├── user/          # User management
│   │   ├── kyc/           # KYC verification
│   │   ├── spv/           # SPV management
│   │   ├── token/         # Token operations
│   │   ├── payment/       # Payment processing
│   │   ├── oracle/        # Oracle integration
│   │   └── audit/         # Audit logging
│   │
│   └── ml-services/        # AI/ML Services (FastAPI + scikit-learn)
│       ├── AVM model      # Automated Valuation Model
│       ├── Risk scoring   # Risk assessment
│       └── Predictions    # Predictive analytics
│
├── rwa-defi-platform/      # Frontend (React + TypeScript + Tailwind)
│   ├── Dashboard
│   ├── Property Market
│   ├── DeFi Vaults
│   └── AI Insights
│
├── k8s/                    # Kubernetes manifests
├── scripts/                # Utility scripts
└── .github/workflows/      # CI/CD pipelines
```

### Technology Stack

**Smart Contracts**
- Solidity 0.8.20
- Hardhat
- OpenZeppelin (Upgradeable)
- Ethers.js

**Backend**
- NestJS
- Prisma ORM
- PostgreSQL
- JWT Authentication
- Stripe API

**ML Services**
- FastAPI
- scikit-learn
- pandas, numpy
- joblib

**Frontend**
- React 18
- TypeScript
- Tailwind CSS
- Vite
- Framer Motion

**Infrastructure**
- Docker & Docker Compose
- Kubernetes
- Prometheus & Grafana
- GitHub Actions

## 🚀 Quick Start

### Option 1: Automated Setup (Recommended)

```bash
# Clone the repository
git clone https://github.com/mbdtf202-cyber/rwa-defi-platform.git
cd rwa-defi-platform

# Run quick start script
./scripts/quick-start.sh
```

### Option 2: Manual Setup

#### Prerequisites

- Node.js >= 18.0.0
- Python >= 3.11
- PostgreSQL >= 15
- Docker & Docker Compose
- Git

#### Installation Steps

1. **Install dependencies**
```bash
npm install
```

2. **Setup environment variables**
```bash
cp .env.example packages/backend/.env
cp .env.example packages/ml-services/.env
cp .env.example rwa-defi-platform/.env

# Edit each .env file with your configuration
```

3. **Setup database**
```bash
cd packages/backend
npx prisma generate
npx prisma migrate deploy
cd ../..
```

4. **Compile smart contracts**
```bash
cd packages/contracts
npm install
npm run compile
cd ../..
```

5. **Start services**
```bash
# Using Docker Compose (recommended)
docker-compose up -d

# Or start individually:
# Backend
cd packages/backend && npm run dev

# ML Services
cd packages/ml-services && python main.py

# Frontend
cd rwa-defi-platform && npm run dev
```

6. **Access the platform**
- Frontend: http://localhost:5173
- Backend API: http://localhost:3000
- API Docs: http://localhost:3000/api
- ML Services: http://localhost:8000
- ML Docs: http://localhost:8000/docs

## 📚 Documentation

- [Project Status](PROJECT_STATUS.md) - Current progress and metrics
- [Deployment Guide](DEPLOYMENT.md) - Production deployment instructions
- [Requirements](. kiro/specs/rwa-defi-full-platform/requirements.md) - 50 detailed requirements
- [Design Document](.kiro/specs/rwa-defi-full-platform/design.md) - Technical architecture
- [Task List](.kiro/specs/rwa-defi-full-platform/tasks.md) - Implementation tasks

## 🧪 Testing

### Run All Tests

```bash
./scripts/test-all.sh
```

### Run Individual Test Suites

```bash
# Smart contracts
cd packages/contracts && npm run test

# Backend
cd packages/backend && npm run test
cd packages/backend && npm run test:e2e

# ML Services
cd packages/ml-services && pytest

# Frontend
cd rwa-defi-platform && npm run test
```

## 🚢 Deployment

### Deploy to Testnet

```bash
# Deploy smart contracts
cd packages/contracts
npm run deploy:testnet

# Deploy backend and ML services
kubectl apply -f k8s/

# Deploy frontend
cd rwa-defi-platform
vercel --prod
```

See [DEPLOYMENT.md](DEPLOYMENT.md) for detailed deployment instructions.

## 🔐 Security

- Smart contracts use OpenZeppelin's audited libraries
- All contracts are upgradeable using UUPS proxy pattern
- Role-based access control (RBAC) throughout
- JWT authentication with refresh tokens
- KYC/AML verification before token transfers
- Comprehensive audit logging
- Rate limiting and DDoS protection

**Security Audits**: Pending (contracts ready for audit)

## 📈 Key Metrics

- **Total Files**: 100+
- **Lines of Code**: ~20,000
- **Smart Contracts**: 7 (fully tested)
- **Backend Modules**: 8 (complete)
- **API Endpoints**: 50+
- **Test Coverage**: In progress

## 🤝 Contributing

We welcome contributions! Please see our contributing guidelines.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👥 Team

- Smart Contract Engineers
- Backend Engineers
- ML Engineers
- Frontend Engineers
- DevOps Engineers
- Product Managers

## 🔗 Links

- **GitHub**: https://github.com/mbdtf202-cyber/rwa-defi-platform
- **Documentation**: Coming soon
- **Website**: Coming soon
- **Discord**: Coming soon

## 📞 Support

For questions or issues:
- Open a GitHub issue
- Check the documentation
- Contact the team

## 🙏 Acknowledgments

- OpenZeppelin for secure smart contract libraries
- NestJS for the excellent backend framework
- FastAPI for the ML services framework
- The Ethereum community

---

**Built with ❤️ for the future of Real World Asset tokenization**
