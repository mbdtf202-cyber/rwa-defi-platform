# RWA DeFi Platform - Deployment Guide

## 📋 Prerequisites

### Required Tools
- Docker & Docker Compose
- Kubernetes cluster (GKE, EKS, or AKS)
- kubectl CLI
- Node.js 18+
- Python 3.11+
- PostgreSQL 15+

### Required Accounts
- Infura (for Ethereum RPC)
- Etherscan (for contract verification)
- Docker Hub (for container registry)
- Vercel (for frontend hosting)
- AWS/GCP/Azure (for infrastructure)

## 🔐 Environment Variables

### Backend (.env)
```bash
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/rwa_defi

# JWT
JWT_SECRET=your-super-secret-jwt-key
JWT_EXPIRATION=1d
REFRESH_TOKEN_EXPIRATION=7d

# Blockchain
ETHEREUM_RPC_URL=https://mainnet.infura.io/v3/YOUR_KEY
PRIVATE_KEY=your-deployer-private-key
CONTRACT_ADDRESS_TOKEN=0x...
CONTRACT_ADDRESS_VAULT=0x...

# KYC Providers
ONFIDO_API_KEY=your-onfido-key
PERSONA_API_KEY=your-persona-key
SUMSUB_API_KEY=your-sumsub-key

# Payment
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...

# External Services
ML_SERVICE_URL=http://ml-services:8000
ORACLE_API_KEY=your-oracle-key
```

### ML Services (.env)
```bash
MODEL_PATH=/app/models
LOG_LEVEL=INFO
WORKERS=4
```

### Frontend (.env)
```bash
VITE_API_URL=https://api.rwa-defi.com
VITE_CHAIN_ID=1
VITE_INFURA_KEY=your-infura-key
```

## 🚀 Deployment Steps

### 1. Deploy Smart Contracts

```bash
cd packages/contracts

# Install dependencies
npm install

# Compile contracts
npm run compile

# Deploy to testnet (Sepolia)
npm run deploy:testnet

# Deploy to mainnet
npm run deploy:mainnet

# Verify contracts on Etherscan
npm run verify
```

### 2. Setup Database

```bash
cd packages/backend

# Generate Prisma client
npx prisma generate

# Run migrations
npx prisma migrate deploy

# Seed initial data (optional)
npx prisma db seed
```

### 3. Build Docker Images

```bash
# Build backend
docker build -t rwa-defi/backend:latest ./packages/backend

# Build ML services
docker build -t rwa-defi/ml-services:latest ./packages/ml-services

# Push to registry
docker push rwa-defi/backend:latest
docker push rwa-defi/ml-services:latest
```

### 4. Deploy to Kubernetes

```bash
# Create namespace
kubectl create namespace rwa-defi

# Create secrets
kubectl create secret generic rwa-secrets \
  --from-env-file=.env \
  -n rwa-defi

# Apply configurations
kubectl apply -f k8s/configmap.yaml
kubectl apply -f k8s/postgres-deployment.yaml
kubectl apply -f k8s/backend-deployment.yaml
kubectl apply -f k8s/ml-deployment.yaml
kubectl apply -f k8s/ingress.yaml

# Check deployment status
kubectl get pods -n rwa-defi
kubectl get services -n rwa-defi
```

### 5. Deploy Frontend

```bash
cd rwa-defi-platform

# Install dependencies
npm install

# Build for production
npm run build

# Deploy to Vercel
vercel --prod

# Or deploy to S3/CloudFront
aws s3 sync dist/ s3://your-bucket-name
aws cloudfront create-invalidation --distribution-id YOUR_ID --paths "/*"
```

## 🔍 Verification

### Check Backend Health
```bash
curl https://api.rwa-defi.com/health
```

### Check ML Services Health
```bash
curl https://ml.rwa-defi.com/health
```

### Check Smart Contracts
```bash
# Verify on Etherscan
https://etherscan.io/address/YOUR_CONTRACT_ADDRESS

# Check contract state
npx hardhat console --network mainnet
```

## 📊 Monitoring

### Setup Prometheus & Grafana

```bash
# Install Prometheus
helm install prometheus prometheus-community/prometheus -n monitoring

# Install Grafana
helm install grafana grafana/grafana -n monitoring

# Access Grafana
kubectl port-forward -n monitoring svc/grafana 3000:80
```

### Key Metrics to Monitor
- API response times
- Database connection pool
- Smart contract gas usage
- ML model inference time
- Error rates
- User activity

## 🔄 CI/CD Pipeline

### GitHub Actions Workflows

1. **CI Pipeline** (`.github/workflows/ci.yml`)
   - Runs on every push/PR
   - Tests all components
   - Security scanning
   - Code quality checks

2. **Deploy Pipeline** (`.github/workflows/deploy.yml`)
   - Triggered on version tags
   - Builds Docker images
   - Deploys to Kubernetes
   - Runs database migrations

### Manual Deployment

```bash
# Tag a new version
git tag -a v1.0.0 -m "Release v1.0.0"
git push origin v1.0.0

# This triggers the deployment workflow
```

## 🔧 Troubleshooting

### Backend Issues

```bash
# Check logs
kubectl logs -f deployment/backend -n rwa-defi

# Check database connection
kubectl exec -it deployment/backend -n rwa-defi -- npx prisma db pull

# Restart deployment
kubectl rollout restart deployment/backend -n rwa-defi
```

### ML Services Issues

```bash
# Check logs
kubectl logs -f deployment/ml-services -n rwa-defi

# Check model files
kubectl exec -it deployment/ml-services -n rwa-defi -- ls -la /app/models

# Restart service
kubectl rollout restart deployment/ml-services -n rwa-defi
```

### Smart Contract Issues

```bash
# Check transaction status
npx hardhat verify --network mainnet CONTRACT_ADDRESS

# Interact with contract
npx hardhat console --network mainnet
```

## 🔐 Security Checklist

- [ ] All secrets stored in secure vault (AWS Secrets Manager, etc.)
- [ ] SSL/TLS certificates configured
- [ ] Rate limiting enabled
- [ ] CORS properly configured
- [ ] Database backups automated
- [ ] Smart contracts audited
- [ ] API authentication enforced
- [ ] Monitoring and alerting setup
- [ ] Incident response plan documented
- [ ] Regular security updates scheduled

## 📈 Scaling

### Horizontal Scaling

```bash
# Scale backend
kubectl scale deployment/backend --replicas=5 -n rwa-defi

# Scale ML services
kubectl scale deployment/ml-services --replicas=3 -n rwa-defi

# Enable autoscaling
kubectl autoscale deployment/backend \
  --cpu-percent=70 \
  --min=2 \
  --max=10 \
  -n rwa-defi
```

### Database Scaling

```bash
# Enable read replicas
# Configure connection pooling
# Implement caching (Redis)
```

## 🔄 Rollback

```bash
# Rollback to previous version
kubectl rollout undo deployment/backend -n rwa-defi

# Rollback to specific revision
kubectl rollout undo deployment/backend --to-revision=2 -n rwa-defi

# Check rollout history
kubectl rollout history deployment/backend -n rwa-defi
```

## 📞 Support

For deployment issues:
- Check logs first
- Review monitoring dashboards
- Consult troubleshooting section
- Contact DevOps team

## 🔗 Useful Links

- [Kubernetes Dashboard](https://dashboard.k8s.rwa-defi.com)
- [Grafana Monitoring](https://grafana.rwa-defi.com)
- [API Documentation](https://api.rwa-defi.com/docs)
- [Smart Contracts on Etherscan](https://etherscan.io/address/...)
