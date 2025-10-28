# Backend Production Deployment Guide

## Prerequisites

- Docker and Docker Compose installed
- Kubernetes cluster access (for K8s deployment)
- PostgreSQL database
- Redis instance
- Environment variables configured

## Deployment Options

### Option 1: Docker Compose (Simple)

```bash
cd packages/backend
docker-compose -f docker-compose.prod.yml up -d
```

### Option 2: Kubernetes (Recommended for Production)

```bash
kubectl apply -f k8s/production/backend-deployment.yaml
```

### Option 3: Manual Deployment

## Step-by-Step Deployment

### 1. Database Setup

```bash
# Create production database
createdb rwa_platform_prod

# Run migrations
npm run prisma:migrate:deploy

# Seed initial data (optional)
npm run prisma:seed
```

### 2. Build Application

```bash
npm run build
```

### 3. Configure Environment

Copy and configure production environment:

```bash
cp .env.production.example .env.production
# Edit .env.production with actual values
```

### 4. Start Application

```bash
npm run start:prod
```

## Health Checks

```bash
# Check application health
curl http://localhost:3000/health

# Check database connection
curl http://localhost:3000/health/db

# Check Redis connection
curl http://localhost:3000/health/redis
```

## Monitoring

- Logs: Check `/var/log/rwa-backend/`
- Metrics: Prometheus endpoint at `/metrics`
- Health: `/health` endpoint

## Troubleshooting

### Database Connection Issues

```bash
# Test database connection
psql $DATABASE_URL

# Check migrations
npm run prisma:migrate:status
```

### Redis Connection Issues

```bash
# Test Redis connection
redis-cli -u $REDIS_URL ping
```

## Rollback Procedure

```bash
# Rollback to previous version
kubectl rollout undo deployment/rwa-backend

# Or with Docker
docker-compose down
docker-compose up -d --build
```
