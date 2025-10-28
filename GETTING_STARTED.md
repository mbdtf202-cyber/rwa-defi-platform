# 🚀 Getting Started with RWA DeFi Platform

Welcome to the RWA DeFi Platform! This guide will help you get the platform up and running in minutes.

## 📋 Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** >= 18.0.0 ([Download](https://nodejs.org/))
- **Python** >= 3.11 ([Download](https://www.python.org/))
- **PostgreSQL** >= 15 ([Download](https://www.postgresql.org/))
- **Docker** & **Docker Compose** ([Download](https://www.docker.com/))
- **Git** ([Download](https://git-scm.com/))

## 🎯 Quick Start (5 Minutes)

### Option 1: Automated Setup (Recommended)

```bash
# 1. Clone the repository
git clone https://github.com/mbdtf202-cyber/rwa-defi-platform.git
cd rwa-defi-platform

# 2. Run the quick start script
./scripts/quick-start.sh

# 3. Access the platform
# Frontend: http://localhost:5173
# Backend API: http://localhost:3000
# ML Services: http://localhost:8000
```

That's it! The platform is now running with Docker Compose.

### Option 2: Manual Setup

If you prefer to set up each component manually:

#### Step 1: Install Dependencies

```bash
# Install all dependencies
npm install
```

#### Step 2: Setup Environment Variables

```bash
# Backend
cp .env.example packages/backend/.env

# Edit packages/backend/.env and set:
# - DATABASE_URL
# - JWT_SECRET
# - Other API keys as needed

# ML Services
cp .env.example packages/ml-services/.env

# Frontend
cp .env.example rwa-defi-platform/.env
```

#### Step 3: Setup Database

```bash
# Start PostgreSQL (if not already running)
docker run -d \
  --name rwa-postgres \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=rwa_defi \
  -p 5432:5432 \
  postgres:15

# Run migrations
cd packages/backend
npx prisma generate
npx prisma migrate deploy

# Seed test data
npm run prisma:seed

cd ../..
```

#### Step 4: Compile Smart Contracts

```bash
cd packages/contracts
npm install
npm run compile
cd ../..
```

#### Step 5: Start Services

Open 3 terminal windows:

**Terminal 1 - Backend:**
```bash
cd packages/backend
npm run dev
```

**Terminal 2 - ML Services:**
```bash
cd packages/ml-services
pip install -r requirements.txt
python main.py
```

**Terminal 3 - Frontend:**
```bash
cd rwa-defi-platform
npm install
npm run dev
```

## 🔐 Test Credentials

After seeding the database, you can use these credentials:

**Admin Account:**
- Email: `admin@rwa-defi.com`
- Password: `Admin123!@#`

**Investor Account:**
- Email: `investor@example.com`
- Password: `Investor123!@#`

## 📍 Access Points

Once everything is running:

| Service | URL | Description |
|---------|-----|-------------|
| Frontend | http://localhost:5173 | Main web application |
| Backend API | http://localhost:3000/api/v1 | REST API |
| API Docs | http://localhost:3000/api | Swagger documentation |
| ML Services | http://localhost:8000 | ML API |
| ML Docs | http://localhost:8000/docs | ML API documentation |
| Health Check | http://localhost:3000/health | Service health status |

## 🧪 Running Tests

### All Tests

```bash
./scripts/test-all.sh
```

### Individual Test Suites

```bash
# Smart contracts
cd packages/contracts
npm run test

# Backend
cd packages/backend
npm run test
npm run test:e2e

# ML Services
cd packages/ml-services
pytest

# Frontend
cd rwa-defi-platform
npm run test
```

## 🔗 Deploy Smart Contracts

### Local Network (Hardhat)

```bash
# Terminal 1: Start local node
cd packages/contracts
npx hardhat node

# Terminal 2: Deploy contracts
npm run deploy:local
```

### Testnet (Sepolia)

```bash
# 1. Get testnet ETH from faucet
# https://sepoliafaucet.com/

# 2. Set environment variables
export PRIVATE_KEY="your-private-key"
export INFURA_API_KEY="your-infura-key"

# 3. Deploy
cd packages/contracts
npm run deploy:testnet

# 4. Verify contracts
npm run verify
```

## 📚 Next Steps

### 1. Explore the Platform

- **Dashboard**: View your portfolio and investments
- **Property Market**: Browse available properties
- **DeFi Vaults**: Explore yield strategies
- **AI Insights**: See ML-powered valuations

### 2. API Integration

Check out the API documentation at http://localhost:3000/api

Example API call:
```bash
# Register a new user
curl -X POST http://localhost:3000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "newuser@example.com",
    "password": "Password123!",
    "firstName": "John",
    "lastName": "Doe"
  }'
```

### 3. Smart Contract Interaction

```javascript
// Using ethers.js
const { ethers } = require("ethers");

const provider = new ethers.JsonRpcProvider("http://localhost:8545");
const tokenAddress = "YOUR_TOKEN_ADDRESS";
const tokenABI = [...]; // From artifacts

const token = new ethers.Contract(tokenAddress, tokenABI, provider);
const balance = await token.balanceOf("0x...");
```

### 4. ML Model Training

```bash
# Train the AVM model
curl -X POST http://localhost:8000/api/v1/models/train \
  -H "Content-Type: application/json" \
  -d '{
    "features": [[5000, 40.7128, -74.0060, 1, 0.95, 50000, 5000000, 1200, 0.05]],
    "targets": [5500000],
    "model_type": "avm"
  }'
```

## 🛠️ Development Workflow

### 1. Create a New Feature

```bash
# Create a new branch
git checkout -b feature/my-new-feature

# Make your changes
# ...

# Run tests
./scripts/test-all.sh

# Commit and push
git add .
git commit -m "feat: Add my new feature"
git push origin feature/my-new-feature
```

### 2. Database Changes

```bash
# Create a new migration
cd packages/backend
npx prisma migrate dev --name add_new_field

# Apply migration
npx prisma migrate deploy

# Update seed data if needed
# Edit prisma/seed.ts
npm run prisma:seed
```

### 3. Smart Contract Updates

```bash
# Make changes to contracts
# ...

# Compile
cd packages/contracts
npm run compile

# Test
npm run test

# Deploy to local network
npm run deploy:local
```

## 🐛 Troubleshooting

### Port Already in Use

```bash
# Find and kill process using port 3000
lsof -ti:3000 | xargs kill -9

# Or use different ports
PORT=3001 npm run dev
```

### Database Connection Issues

```bash
# Check if PostgreSQL is running
pg_isready -h localhost -p 5432

# Restart PostgreSQL
docker restart rwa-postgres

# Reset database
cd packages/backend
npm run db:reset
```

### Smart Contract Deployment Fails

```bash
# Clean and recompile
cd packages/contracts
npm run clean
npm run compile

# Check network connection
npx hardhat node --network localhost
```

### ML Services Not Starting

```bash
# Check Python version
python --version  # Should be 3.11+

# Reinstall dependencies
cd packages/ml-services
pip install --upgrade -r requirements.txt

# Check for port conflicts
lsof -ti:8000 | xargs kill -9
```

## 📖 Additional Resources

- [Project Status](PROJECT_STATUS.md) - Current development status
- [Deployment Guide](DEPLOYMENT.md) - Production deployment
- [Completion Summary](COMPLETION_SUMMARY.md) - Project overview
- [Requirements](.kiro/specs/rwa-defi-full-platform/requirements.md) - Detailed requirements
- [Design Document](.kiro/specs/rwa-defi-full-platform/design.md) - Technical architecture

## 💬 Getting Help

If you encounter any issues:

1. Check the [Troubleshooting](#-troubleshooting) section
2. Review the logs for error messages
3. Check existing GitHub issues
4. Create a new issue with:
   - Description of the problem
   - Steps to reproduce
   - Error messages
   - Environment details

## 🎉 You're Ready!

Congratulations! You now have the RWA DeFi Platform running locally. Start exploring the features and building amazing things!

### Quick Links

- 🏠 [Frontend](http://localhost:5173)
- 📚 [API Docs](http://localhost:3000/api)
- 🤖 [ML Docs](http://localhost:8000/docs)
- ❤️ [Health Check](http://localhost:3000/health)

Happy coding! 🚀
