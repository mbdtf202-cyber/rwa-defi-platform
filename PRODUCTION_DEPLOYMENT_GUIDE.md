# RWA DeFi Platform - Production Deployment Guide

This guide provides step-by-step instructions for deploying the RWA DeFi Platform to production.

## Table of Contents

1. [Pre-Deployment Checklist](#pre-deployment-checklist)
2. [Infrastructure Setup](#infrastructure-setup)
3. [Smart Contract Deployment](#smart-contract-deployment)
4. [Backend Services Deployment](#backend-services-deployment)
5. [ML Services Deployment](#ml-services-deployment)
6. [Frontend Deployment](#frontend-deployment)
7. [Post-Deployment Verification](#post-deployment-verification)
8. [Monitoring and Alerts](#monitoring-and-alerts)
9. [Rollback Procedures](#rollback-procedures)

---

## Pre-Deployment Checklist

### Security Audit
- [ ] Smart contracts audited by reputable firm (OpenZeppelin, Trail of Bits, Consensys Diligence)
- [ ] All critical and high severity issues resolved
- [ ] Audit report published
- [ ] Backend penetration testing completed
- [ ] Security best practices implemented

### Testing
- [ ] All unit tests passing (>90% coverage)
- [ ] Integration tests passing
- [ ] E2E tests passing
- [ ] Load testing completed
- [ ] Stress testing completed
- [ ] Disaster recovery tested

### Configuration
- [ ] Production environment variables configured
- [ ] API keys and secrets secured in vault
- [ ] Database backups configured
- [ ] Monitoring and alerting configured
- [ ] Rate limiting configured
- [ ] CORS policies configured

### Legal & Compliance
- [ ] Terms of Service finalized
- [ ] Privacy Policy finalized
- [ ] KYC/AML procedures documented
- [ ] Regulatory compliance verified
- [ ] Insurance policies in place

### Team Readiness
- [ ] On-call rotation established
- [ ] Incident response plan documented
- [ ] Runbooks created
- [ ] Team trained on deployment procedures

---

## Infrastructure Setup

### 1. Kubernetes Cluster

```bash
# Create production cluster (example using GKE)
gcloud container clusters create rwa-platform-prod \
  --zone us-central1-a \
  --num-nodes 5 \
  --machine-type n1-standard-4 \
  --enable-autoscaling \
  --min-nodes 3 \
  --max-nodes 10 \
  --enable-autorepair \
  --enable-autoupgrade

# Configure kubectl
gcloud container clusters get-credentials rwa-platform-prod --zone us-central1-a
```

### 2. Database Setup

```bash
# Create PostgreSQL instance
gcloud sql instances create rwa-platform-db \
  --database-version=POSTGRES_15 \
  --tier=db-n1-standard-4 \
  --region=us-central1 \
  --backup \
  --backup-start-time=03:00 \
  --maintenance-window-day=SUN \
  --maintenance-window-hour=04

# Create database
gcloud sql databases create rwa_platform --instance=rwa-platform-db

# Create user
gcloud sql users create rwa_user --instance=rwa-platform-db --password=<secure-password>
```

### 3. Redis Setup

```bash
# Create Redis instance
gcloud redis instances create rwa-platform-cache \
  --size=5 \
  --region=us-central1 \
  --redis-version=redis_7_0 \
  --tier=standard
```

### 4. Storage Setup

```bash
# Create GCS bucket for documents
gsutil mb -l us-central1 gs://rwa-platform-documents

# Set lifecycle policy
gsutil lifecycle set storage-lifecycle.json gs://rwa-platform-documents
```

---

## Smart Contract Deployment

### 1. Prepare Environment

```bash
cd packages/contracts

# Copy and configure production environment
cp .env.production.example .env.production
# Edit .env.production with actual values

# Install dependencies
npm install

# Compile contracts
npm run compile
```

### 2. Deploy to Testnet (Sepolia)

```bash
# Deploy to testnet first
npx hardhat run scripts/deploy-production.ts --network sepolia

# Verify contracts
npx hardhat run scripts/verify-contracts.ts --network sepolia

# Test on testnet
npm run test:integration -- --network sepolia
```

### 3. Deploy to Mainnet

```bash
# IMPORTANT: Double-check all configurations
# Ensure deployer wallet has sufficient ETH for gas

# Deploy to mainnet
npx hardhat run scripts/deploy-production.ts --network mainnet

# Verify contracts on Etherscan
npx hardhat run scripts/verify-contracts.ts --network mainnet

# Save deployment addresses
cp deployments/mainnet.json ../backend/config/contracts.json
cp deployments/mainnet.json ../../rwa-defi-platform/src/config/contracts.json
```

### 4. Configure Governance

```bash
# Transfer ownership to Gnosis Safe multisig
# This should be done through the Timelock contract

# Example: Transfer admin role
npx hardhat run scripts/transfer-ownership.ts --network mainnet
```

---

## Backend Services Deployment

### 1. Build Docker Image

```bash
cd packages/backend

# Build production image
docker build -t rwa-platform/backend:1.0.0 -f Dockerfile.prod .

# Push to container registry
docker tag rwa-platform/backend:1.0.0 gcr.io/your-project/rwa-backend:1.0.0
docker push gcr.io/your-project/rwa-backend:1.0.0
```

### 2. Database Migration

```bash
# Run migrations
npm run prisma:migrate:deploy

# Seed initial data (if needed)
npm run prisma:seed
```

### 3. Deploy to Kubernetes

```bash
# Create namespace
kubectl create namespace rwa-platform-prod

# Create secrets
kubectl create secret generic backend-secrets \
  --from-env-file=.env.production \
  --namespace=rwa-platform-prod

# Deploy backend
kubectl apply -f ../../k8s/production/backend-deployment.yaml

# Check deployment status
kubectl rollout status deployment/rwa-backend -n rwa-platform-prod

# Check pods
kubectl get pods -n rwa-platform-prod
```

### 4. Configure Ingress

```bash
# Deploy ingress controller
kubectl apply -f ../../k8s/production/ingress.yaml

# Configure SSL/TLS
kubectl apply -f ../../k8s/production/certificate.yaml
```

---

## ML Services Deployment

### 1. Build Docker Image

```bash
cd packages/ml-services

# Build production image
docker build -t rwa-platform/ml-services:1.0.0 .

# Push to container registry
docker tag rwa-platform/ml-services:1.0.0 gcr.io/your-project/rwa-ml:1.0.0
docker push gcr.io/your-project/rwa-ml:1.0.0
```

### 2. Deploy Models

```bash
# Upload trained models to persistent storage
gsutil cp -r models/* gs://rwa-platform-ml-models/

# Create PVC for models
kubectl apply -f ../../k8s/production/ml-pvc.yaml
```

### 3. Deploy to Kubernetes

```bash
# Deploy ML services
kubectl apply -f ../../k8s/production/ml-services-deployment.yaml

# Check deployment
kubectl rollout status deployment/rwa-ml-services -n rwa-platform-prod
```

---

## Frontend Deployment

### 1. Build Production Bundle

```bash
cd rwa-defi-platform

# Install dependencies
npm install

# Build for production
npm run build

# Test production build locally
npm run preview
```

### 2. Deploy to CDN (Vercel/Cloudflare)

#### Option A: Vercel

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod
```

#### Option B: Cloudflare Pages

```bash
# Install Wrangler CLI
npm i -g wrangler

# Deploy
wrangler pages publish dist
```

#### Option C: AWS S3 + CloudFront

```bash
# Upload to S3
aws s3 sync dist/ s3://rwa-platform-frontend --delete

# Invalidate CloudFront cache
aws cloudfront create-invalidation \
  --distribution-id YOUR_DISTRIBUTION_ID \
  --paths "/*"
```

### 3. Configure DNS

```bash
# Point your domain to the CDN
# Example DNS records:
# A     @     <CDN_IP>
# CNAME www   <CDN_DOMAIN>
```

---

## Post-Deployment Verification

### 1. Health Checks

```bash
# Check backend health
curl https://api.rwa-platform.com/health

# Check ML services health
curl https://ml.rwa-platform.com/health

# Check frontend
curl https://rwa-platform.com
```

### 2. Smoke Tests

```bash
# Run smoke tests
cd packages/backend
npm run test:smoke -- --env=production
```

### 3. Contract Verification

```bash
# Verify contract deployment
npx hardhat verify --network mainnet <CONTRACT_ADDRESS> <CONSTRUCTOR_ARGS>

# Check contract on Etherscan
open https://etherscan.io/address/<CONTRACT_ADDRESS>
```

---

## Monitoring and Alerts

### 1. Prometheus & Grafana

```bash
# Deploy monitoring stack
kubectl apply -f k8s/production/monitoring/

# Access Grafana
kubectl port-forward svc/grafana 3000:80 -n monitoring
open http://localhost:3000
```

### 2. Configure Alerts

```yaml
# Example alert rules
groups:
  - name: rwa-platform
    rules:
      - alert: HighErrorRate
        expr: rate(http_requests_total{status=~"5.."}[5m]) > 0.05
        for: 5m
        labels:
          severity: critical
        annotations:
          summary: "High error rate detected"
```

### 3. Log Aggregation

```bash
# Deploy ELK stack (if not using managed service)
kubectl apply -f k8s/production/logging/

# Or configure cloud logging
# GCP: Stackdriver
# AWS: CloudWatch
# Azure: Monitor
```

---

## Rollback Procedures

### 1. Backend Rollback

```bash
# Rollback to previous version
kubectl rollout undo deployment/rwa-backend -n rwa-platform-prod

# Rollback to specific revision
kubectl rollout undo deployment/rwa-backend --to-revision=2 -n rwa-platform-prod
```

### 2. Frontend Rollback

```bash
# Vercel
vercel rollback

# Cloudflare
wrangler pages deployment list
wrangler pages deployment rollback <DEPLOYMENT_ID>

# S3/CloudFront
aws s3 sync s3://rwa-platform-frontend-backup/ s3://rwa-platform-frontend/
```

### 3. Database Rollback

```bash
# Restore from backup
gcloud sql backups restore <BACKUP_ID> --backup-instance=rwa-platform-db

# Or use point-in-time recovery
gcloud sql instances restore-backup rwa-platform-db --backup-id=<BACKUP_ID>
```

---

## Emergency Procedures

### Circuit Breaker

```bash
# Pause all smart contracts
npx hardhat run scripts/emergency-pause.ts --network mainnet

# Scale down services
kubectl scale deployment/rwa-backend --replicas=0 -n rwa-platform-prod
```

### Incident Response

1. **Detect**: Monitor alerts and user reports
2. **Assess**: Determine severity and impact
3. **Communicate**: Notify stakeholders
4. **Mitigate**: Execute rollback or hotfix
5. **Resolve**: Verify fix and resume operations
6. **Post-mortem**: Document and learn

---

## Support Contacts

- **On-Call Engineer**: +1-XXX-XXX-XXXX
- **Security Team**: security@rwa-platform.com
- **DevOps Team**: devops@rwa-platform.com
- **Audit Firm**: audit@firm.com

---

## Additional Resources

- [API Documentation](https://docs.rwa-platform.com/api)
- [Smart Contract Documentation](https://docs.rwa-platform.com/contracts)
- [Runbooks](https://wiki.rwa-platform.com/runbooks)
- [Architecture Diagrams](https://wiki.rwa-platform.com/architecture)

---

**Last Updated**: 2025-10-28  
**Version**: 1.0.0  
**Maintained By**: DevOps Team
