# Fireblocks Custody Integration Guide

Complete guide for integrating Fireblocks custody solution into the RWA DeFi Platform.

## Table of Contents

1. [Overview](#overview)
2. [Prerequisites](#prerequisites)
3. [Setup](#setup)
4. [Configuration](#configuration)
5. [API Usage](#api-usage)
6. [Webhook Integration](#webhook-integration)
7. [Security Best Practices](#security-best-practices)
8. [Testing](#testing)
9. [Troubleshooting](#troubleshooting)

---

## Overview

Fireblocks provides institutional-grade custody and treasury management for digital assets. This integration enables:

- Secure key management with MPC technology
- Multi-signature transaction approval
- Automated transaction signing
- Comprehensive audit trails
- Insurance coverage for digital assets

### Architecture

```
┌─────────────┐
│   Backend   │
│   Service   │
└──────┬──────┘
       │
       ▼
┌─────────────┐
│  Fireblocks │
│     SDK     │
└──────┬──────┘
       │
       ▼
┌─────────────┐
│  Fireblocks │
│     API     │
└──────┬──────┘
       │
       ▼
┌─────────────┐
│  Blockchain │
│   Network   │
└─────────────┘
```

---

## Prerequisites

### Fireblocks Account

1. Sign up for Fireblocks account at https://www.fireblocks.com/
2. Complete KYB (Know Your Business) verification
3. Set up workspace and vault accounts

### API Credentials

1. Generate API key in Fireblocks Console
2. Download API secret key (RSA private key)
3. Configure IP whitelist for API access

### System Requirements

- Node.js >= 18.0.0
- OpenSSL for key management
- Secure storage for API secrets

---

## Setup

### 1. Install Dependencies

```bash
cd packages/backend
npm install fireblocks-sdk
npm install @types/node --save-dev
```

### 2. Generate API Secret Key

If you haven't received one from Fireblocks:

```bash
# Generate RSA key pair
openssl genrsa -out fireblocks_secret.key 4096

# Extract public key
openssl rsa -in fireblocks_secret.key -pubout -out fireblocks_public.key

# Upload public key to Fireblocks Console
```

### 3. Store API Credentials Securely

```bash
# Create secrets directory
mkdir -p /secure/fireblocks

# Move secret key
mv fireblocks_secret.key /secure/fireblocks/

# Set proper permissions
chmod 600 /secure/fireblocks/fireblocks_secret.key
```

### 4. Create Vault Account

In Fireblocks Console:
1. Navigate to **Vault** > **Accounts**
2. Click **Create Vault Account**
3. Name: "RWA Platform Main Vault"
4. Note the Vault Account ID

---

## Configuration

### Environment Variables

Add to `.env`:

```bash
# Fireblocks Configuration
FIREBLOCKS_API_KEY=your-api-key-here
FIREBLOCKS_API_SECRET_PATH=/secure/fireblocks/fireblocks_secret.key
FIREBLOCKS_VAULT_ACCOUNT_ID=0

# Fireblocks Webhook
FIREBLOCKS_WEBHOOK_PUBLIC_KEY_PATH=/secure/fireblocks/webhook_public.key
```

### Kubernetes Secrets

```bash
# Create secret for API key
kubectl create secret generic fireblocks-credentials \
  --from-literal=api-key=your-api-key \
  --from-file=api-secret=/secure/fireblocks/fireblocks_secret.key \
  -n rwa-platform-prod

# Update deployment to mount secret
kubectl patch deployment rwa-backend \
  -n rwa-platform-prod \
  --patch '
spec:
  template:
    spec:
      volumes:
      - name: fireblocks-secret
        secret:
          secretName: fireblocks-credentials
      containers:
      - name: backend
        volumeMounts:
        - name: fireblocks-secret
          mountPath: /secure/fireblocks
          readOnly: true
'
```

### Module Registration

Update `app.module.ts`:

```typescript
import { CustodyModule } from './modules/custody/custody.module';

@Module({
  imports: [
    // ... other modules
    CustodyModule,
  ],
})
export class AppModule {}
```

---

## API Usage

### Create Transaction

```typescript
POST /api/v1/custody/transactions
Authorization: Bearer <jwt-token>

{
  "assetId": "ETH",
  "amount": "1.5",
  "destination": "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb",
  "note": "Token mint transaction"
}

Response:
{
  "id": "txn-123-456",
  "status": "SUBMITTED",
  "txHash": null
}
```

### Get Transaction Status

```typescript
GET /api/v1/custody/transactions/:id
Authorization: Bearer <jwt-token>

Response:
{
  "id": "txn-123-456",
  "status": "COMPLETED",
  "txHash": "0xabc123...",
  "createdAt": "2025-10-28T10:00:00Z",
  "lastUpdated": "2025-10-28T10:05:00Z"
}
```

### Get Vault Balance

```typescript
GET /api/v1/custody/balance?assetId=ETH
Authorization: Bearer <jwt-token>

Response:
{
  "assetId": "ETH",
  "balance": "100.5",
  "available": "95.3"
}
```

### Estimate Transaction Fee

```typescript
POST /api/v1/custody/estimate-fee
Authorization: Bearer <jwt-token>

{
  "assetId": "ETH",
  "amount": "1.0",
  "destination": "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb"
}

Response:
{
  "low": "0.001",
  "medium": "0.002",
  "high": "0.003"
}
```

### Integration Example

```typescript
// In token.service.ts
import { CustodyService } from '../custody/custody.service';

@Injectable()
export class TokenService {
  constructor(
    private custodyService: CustodyService,
  ) {}

  async mintTokens(to: string, amount: string) {
    // Create transaction via Fireblocks
    const transaction = await this.custodyService.createTransaction({
      assetId: 'ETH',
      amount: '0', // Gas only
      destination: to,
      note: `Mint ${amount} tokens to ${to}`,
    });

    // Wait for transaction confirmation
    let status = transaction.status;
    while (status !== 'COMPLETED' && status !== 'FAILED') {
      await new Promise(resolve => setTimeout(resolve, 5000));
      const updated = await this.custodyService.getTransactionStatus(transaction.id);
      status = updated.status;
    }

    if (status === 'FAILED') {
      throw new Error('Transaction failed');
    }

    return {
      txHash: transaction.txHash,
      status: 'SUCCESS',
    };
  }
}
```

---

## Webhook Integration

### Configure Webhook in Fireblocks

1. Go to **Settings** > **Webhooks**
2. Add webhook URL: `https://api.rwa-platform.com/api/v1/custody/webhook`
3. Select events:
   - TRANSACTION_CREATED
   - TRANSACTION_STATUS_UPDATED
   - TRANSACTION_APPROVAL_STATUS_UPDATED
4. Download webhook public key

### Verify Webhook Signature

```typescript
import * as crypto from 'crypto';

function verifyWebhookSignature(
  payload: string,
  signature: string,
  publicKey: string,
): boolean {
  const verifier = crypto.createVerify('RSA-SHA512');
  verifier.update(payload);
  return verifier.verify(publicKey, signature, 'base64');
}

// In controller
@Post('webhook')
async handleWebhook(
  @Body() payload: any,
  @Headers('fireblocks-signature') signature: string,
) {
  const publicKey = fs.readFileSync(
    process.env.FIREBLOCKS_WEBHOOK_PUBLIC_KEY_PATH,
    'utf8',
  );

  const isValid = verifyWebhookSignature(
    JSON.stringify(payload),
    signature,
    publicKey,
  );

  if (!isValid) {
    throw new UnauthorizedException('Invalid webhook signature');
  }

  return this.custodyService.handleWebhook(payload);
}
```

---

## Security Best Practices

### API Secret Management

1. **Never commit secrets to version control**
   ```bash
   # Add to .gitignore
   fireblocks_secret.key
   fireblocks_public.key
   ```

2. **Use environment-specific secrets**
   - Development: Sandbox API keys
   - Production: Production API keys with IP whitelist

3. **Rotate keys regularly**
   - Generate new API key every 90 days
   - Update all services with new credentials

### Access Control

1. **Implement role-based access**
   ```typescript
   @Roles('ADMIN') // Only admins can create transactions
   async createTransaction() {}
   ```

2. **Enable multi-signature approval**
   - Configure in Fireblocks Console
   - Require 2-of-3 approvals for large transactions

3. **Set transaction limits**
   - Daily transaction limits
   - Per-transaction amount limits
   - Velocity controls

### Audit Logging

```typescript
// Log all custody operations
this.logger.log({
  action: 'CREATE_TRANSACTION',
  user: userId,
  amount,
  destination,
  timestamp: new Date(),
});
```

---

## Testing

### Sandbox Environment

```bash
# Use Fireblocks Sandbox for testing
FIREBLOCKS_API_KEY=sandbox-api-key
FIREBLOCKS_BASE_URL=https://sandbox-api.fireblocks.io
```

### Unit Tests

```typescript
describe('CustodyService', () => {
  it('should create transaction', async () => {
    const result = await custodyService.createTransaction({
      assetId: 'ETH_TEST',
      amount: '0.1',
      destination: '0x123...',
    });

    expect(result.id).toBeDefined();
    expect(result.status).toBe('SUBMITTED');
  });

  it('should get vault balance', async () => {
    const balance = await custodyService.getVaultBalance('ETH_TEST');

    expect(balance.assetId).toBe('ETH_TEST');
    expect(balance.balance).toBeDefined();
  });
});
```

### Integration Tests

```bash
# Run integration tests
npm run test:integration -- custody.service.spec.ts
```

---

## Troubleshooting

### Common Issues

#### 1. Authentication Failed

```
Error: Authentication failed
```

**Solution**:
- Verify API key is correct
- Check API secret file path
- Ensure IP is whitelisted in Fireblocks Console

#### 2. Transaction Stuck in Pending

```
Status: PENDING_AUTHORIZATION
```

**Solution**:
- Check if multi-sig approval is required
- Approve transaction in Fireblocks Console
- Verify sufficient balance for gas fees

#### 3. Webhook Not Receiving Events

```
No webhook events received
```

**Solution**:
- Verify webhook URL is accessible
- Check firewall rules
- Test webhook endpoint manually
- Verify webhook signature validation

### Debug Mode

```typescript
// Enable debug logging
const fireblocks = new FireblocksSDK(apiSecret, apiKey, undefined, {
  logLevel: 'debug',
});
```

### Support

- **Fireblocks Support**: support@fireblocks.com
- **Documentation**: https://docs.fireblocks.com/
- **Status Page**: https://status.fireblocks.com/

---

## Monitoring

### Key Metrics

- Transaction success rate
- Average transaction time
- Failed transaction count
- Vault balance changes
- API error rate

### Alerts

```yaml
# Prometheus alert rules
groups:
  - name: fireblocks
    rules:
      - alert: HighTransactionFailureRate
        expr: rate(fireblocks_transactions_failed[5m]) > 0.1
        annotations:
          summary: "High Fireblocks transaction failure rate"
      
      - alert: LowVaultBalance
        expr: fireblocks_vault_balance{asset="ETH"} < 1
        annotations:
          summary: "Low ETH balance in Fireblocks vault"
```

---

## Cost Optimization

### Transaction Batching

```typescript
// Batch multiple operations into single transaction
async batchMint(recipients: string[], amounts: string[]) {
  // Combine into single contract call
  // Reduces Fireblocks transaction fees
}
```

### Gas Price Optimization

```typescript
// Use medium fee tier for non-urgent transactions
const estimate = await custodyService.estimateFee({
  assetId: 'ETH',
  amount: '1.0',
  destination: '0x123...',
});

// Use medium fee
const feeLevel = 'MEDIUM';
```

---

**Document Version**: 1.0  
**Last Updated**: 2025-10-28  
**Maintained By**: Backend Team
