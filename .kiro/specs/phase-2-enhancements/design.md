# RWA DeFi Platform - Phase 2 Enhancement Design

## Overview

This document provides the technical design for Phase 2 enhancements to the RWA DeFi Platform. Phase 2 focuses on completing critical features that were identified in the comprehensive requirements but not fully implemented in Phase 1.

---

## 1. IPFS Document Storage System

### Architecture

```
User Upload → Backend API → IPFS Node → Generate Hash → Store Hash (DB + Blockchain)
                                                              ↓
                                                        Verification Service
```

### Components

#### 1.1 IPFS Service
```typescript
interface IPFSService {
  uploadFile(file: Buffer, metadata: FileMetadata): Promise<IPFSHash>;
  downloadFile(hash: string): Promise<Buffer>;
  pinFile(hash: string): Promise<void>;
  unpinFile(hash: string): Promise<void>;
  verifyFile(hash: string, file: Buffer): Promise<boolean>;
}

interface FileMetadata {
  filename: string;
  mimeType: string;
  size: number;
  uploadedBy: string;
  spvId?: string;
  documentType: DocumentType;
}

enum DocumentType {
  DEED = 'DEED',
  LEASE = 'LEASE',
  AUDIT = 'AUDIT',
  KYC = 'KYC',
  OTHER = 'OTHER'
}
```

#### 1.2 Document Verification Smart Contract
```solidity
contract DocumentRegistry {
    struct Document {
        bytes32 ipfsHash;
        uint256 timestamp;
        address uploader;
        uint256 spvId;
        DocumentType docType;
        bool verified;
    }
    
    mapping(bytes32 => Document) public documents;
    
    event DocumentStored(
        bytes32 indexed ipfsHash,
        uint256 indexed spvId,
        DocumentType docType,
        address uploader
    );
    
    function storeDocument(
        bytes32 ipfsHash,
        uint256 spvId,
        DocumentType docType
    ) external onlyRole(DOCUMENT_MANAGER_ROLE);
    
    function verifyDocument(bytes32 ipfsHash) external view returns (bool);
}
```

#### 1.3 Database Schema
```prisma
model Document {
  id            String   @id @default(uuid())
  ipfsHash      String   @unique
  filename      String
  mimeType      String
  size          Int
  spvId         String?
  documentType  DocumentType
  uploadedBy    String
  verified      Boolean  @default(false)
  onChainTxHash String?
  createdAt     DateTime @default(now())
  
  spv           SPV?     @relation(fields: [spvId], references: [id])
  uploader      User     @relation(fields: [uploadedBy], references: [id])
}

enum DocumentType {
  DEED
  LEASE
  AUDIT
  KYC
  OTHER
}
```

### Implementation Steps

1. Set up IPFS node (Infura or self-hosted)
2. Create IPFS service module in backend
3. Deploy DocumentRegistry smart contract
4. Implement upload/download API endpoints
5. Add verification UI components
6. Implement automatic pinning service

---

## 2. Secondary Market Order Book

### Architecture

```
Order Placement → Validation → Order Book → Matching Engine → Settlement
                                    ↓
                              WebSocket Updates
```

### Components

#### 2.1 Order Book Data Structure
```typescript
interface Order {
  id: string;
  userId: string;
  spvId: string;
  tokenAddress: string;
  orderType: OrderType;
  side: OrderSide;
  price: number;
  quantity: number;
  filled: number;
  status: OrderStatus;
  createdAt: Date;
  expiresAt?: Date;
}

enum OrderType {
  LIMIT = 'LIMIT',
  MARKET = 'MARKET',
  OTC = 'OTC'
}

enum OrderSide {
  BUY = 'BUY',
  SELL = 'SELL'
}

enum OrderStatus {
  PENDING = 'PENDING',
  PARTIAL = 'PARTIAL',
  FILLED = 'FILLED',
  CANCELLED = 'CANCELLED',
  EXPIRED = 'EXPIRED'
}
```

#### 2.2 Matching Engine
```typescript
class MatchingEngine {
  private orderBook: Map<string, OrderBook>;
  
  async matchOrder(order: Order): Promise<Trade[]> {
    const book = this.getOrderBook(order.tokenAddress);
    const matches = book.findMatches(order);
    const trades: Trade[] = [];
    
    for (const match of matches) {
      const trade = await this.executeTrade(order, match);
      trades.push(trade);
      
      if (order.filled >= order.quantity) break;
    }
    
    return trades;
  }
  
  private async executeTrade(
    takerOrder: Order,
    makerOrder: Order
  ): Promise<Trade> {
    // 1. Verify KYC status
    // 2. Check token lockup
    // 3. Execute on-chain transfer
    // 4. Update order status
    // 5. Record trade
    // 6. Trigger AML scan
  }
}
```

#### 2.3 Database Schema
```prisma
model Order {
  id           String      @id @default(uuid())
  userId       String
  spvId        String
  tokenAddress String
  orderType    OrderType
  side         OrderSide
  price        Decimal
  quantity     Decimal
  filled       Decimal     @default(0)
  status       OrderStatus @default(PENDING)
  createdAt    DateTime    @default(now())
  expiresAt    DateTime?
  
  user         User        @relation(fields: [userId], references: [id])
  spv          SPV         @relation(fields: [spvId], references: [id])
  trades       Trade[]
}

model Trade {
  id              String   @id @default(uuid())
  buyOrderId      String
  sellOrderId     String
  price           Decimal
  quantity        Decimal
  txHash          String
  executedAt      DateTime @default(now())
  
  buyOrder        Order    @relation("BuyTrades", fields: [buyOrderId], references: [id])
  sellOrder       Order    @relation("SellTrades", fields: [sellOrderId], references: [id])
}
```

### Implementation Steps

1. Create Order and Trade models
2. Implement order validation service
3. Build matching engine
4. Implement WebSocket for real-time updates
5. Create order book UI
6. Add trade history tracking

---

## 3. Tax Reporting Service

### Architecture

```
User Request → Tax Calculator → Report Generator → PDF/CSV Export → Email Delivery
                    ↓
              Transaction History
              Dividend Records
              Cost Basis Tracker
```

### Components

#### 3.1 Tax Calculator
```typescript
interface TaxCalculator {
  calculateCapitalGains(
    userId: string,
    year: number,
    method: CostBasisMethod
  ): Promise<CapitalGains>;
  
  calculateDividendIncome(
    userId: string,
    year: number
  ): Promise<DividendIncome>;
  
  generateTaxReport(
    userId: string,
    year: number,
    jurisdiction: string
  ): Promise<TaxReport>;
}

enum CostBasisMethod {
  FIFO = 'FIFO',
  LIFO = 'LIFO',
  AVERAGE = 'AVERAGE',
  SPECIFIC = 'SPECIFIC'
}

interface CapitalGains {
  shortTerm: Transaction[];
  longTerm: Transaction[];
  totalGain: number;
  totalLoss: number;
  netGain: number;
}

interface DividendIncome {
  qualified: Dividend[];
  ordinary: Dividend[];
  totalQualified: number;
  totalOrdinary: number;
}
```

#### 3.2 Report Templates
```typescript
interface TaxReportTemplate {
  jurisdiction: string;
  formType: string;
  fields: TaxField[];
  
  generate(data: TaxData): Promise<Buffer>;
}

// US Form 1099
class Form1099Template implements TaxReportTemplate {
  jurisdiction = 'US';
  formType = '1099-DIV';
  
  async generate(data: TaxData): Promise<Buffer> {
    // Generate PDF using template
  }
}

// Singapore IR8A
class IR8ATemplate implements TaxReportTemplate {
  jurisdiction = 'SG';
  formType = 'IR8A';
  
  async generate(data: TaxData): Promise<Buffer> {
    // Generate PDF using template
  }
}
```

#### 3.3 Database Schema
```prisma
model TaxReport {
  id            String   @id @default(uuid())
  userId        String
  year          Int
  jurisdiction  String
  formType      String
  fileUrl       String
  generatedAt   DateTime @default(now())
  
  user          User     @relation(fields: [userId], references: [id])
}

model CostBasis {
  id            String   @id @default(uuid())
  userId        String
  tokenAddress  String
  quantity      Decimal
  costPerToken  Decimal
  acquiredAt    DateTime
  disposedAt    DateTime?
  method        CostBasisMethod
  
  user          User     @relation(fields: [userId], references: [id])
}
```

### Implementation Steps

1. Create tax calculator service
2. Implement cost basis tracking
3. Build report templates for each jurisdiction
4. Create PDF generation service
5. Implement email delivery
6. Add tax report UI

---

## 4. Event Orchestration Engine

### Architecture

```
Blockchain Events → Event Listener → Event Queue → Event Processor → Business Logic
                                          ↓
                                    Dead Letter Queue
                                          ↓
                                    Retry Service
```

### Components

#### 4.1 Event Listener
```typescript
class BlockchainEventListener {
  private contracts: Map<string, Contract>;
  private eventHandlers: Map<string, EventHandler>;
  
  async start() {
    for (const [name, contract] of this.contracts) {
      contract.on('*', async (event) => {
        await this.handleEvent(event);
      });
    }
  }
  
  private async handleEvent(event: Event) {
    const handler = this.eventHandlers.get(event.event);
    if (!handler) return;
    
    try {
      await this.enqueueEvent(event);
    } catch (error) {
      logger.error('Failed to enqueue event', { event, error });
    }
  }
}
```

#### 4.2 Event Processor
```typescript
interface EventProcessor {
  process(event: BlockchainEvent): Promise<void>;
}

class DividendEventProcessor implements EventProcessor {
  async process(event: BlockchainEvent) {
    // 1. Validate event data
    // 2. Check idempotency
    // 3. Execute business logic
    // 4. Update database
    // 5. Send notifications
    // 6. Mark as processed
  }
}

class TransferEventProcessor implements EventProcessor {
  async process(event: BlockchainEvent) {
    // 1. Validate transfer
    // 2. Update user balances
    // 3. Trigger AML scan
    // 4. Record transaction
  }
}
```

#### 4.3 Retry Mechanism
```typescript
class RetryService {
  private maxRetries = 3;
  private retryDelay = [1000, 5000, 15000]; // ms
  
  async processWithRetry(
    event: BlockchainEvent,
    processor: EventProcessor
  ): Promise<void> {
    let attempt = 0;
    
    while (attempt < this.maxRetries) {
      try {
        await processor.process(event);
        return;
      } catch (error) {
        attempt++;
        if (attempt >= this.maxRetries) {
          await this.moveToDeadLetterQueue(event, error);
          throw error;
        }
        await this.delay(this.retryDelay[attempt - 1]);
      }
    }
  }
}
```

#### 4.4 Database Schema
```prisma
model BlockchainEvent {
  id            String   @id @default(uuid())
  eventName     String
  contractAddress String
  blockNumber   Int
  transactionHash String
  eventData     Json
  processed     Boolean  @default(false)
  processedAt   DateTime?
  retryCount    Int      @default(0)
  error         String?
  createdAt     DateTime @default(now())
  
  @@index([processed, createdAt])
  @@index([transactionHash])
}
```

### Implementation Steps

1. Create event listener service
2. Implement event queue (Bull/BullMQ)
3. Build event processors for each event type
4. Implement retry mechanism
5. Add dead letter queue handling
6. Create monitoring dashboard

---

## 5. Monitoring and Alerting System

### Architecture

```
Metrics Collection → Time Series DB → Alert Rules → Notification Service
                          ↓
                    Grafana Dashboard
```

### Components

#### 5.1 Metrics Collection
```typescript
interface MetricsCollector {
  collectContractMetrics(): Promise<ContractMetrics>;
  collectBusinessMetrics(): Promise<BusinessMetrics>;
  collectMLMetrics(): Promise<MLMetrics>;
}

interface ContractMetrics {
  pendingTransactions: number;
  gasUsage: number;
  failedTransactions: number;
  oracleStaleness: number;
}

interface BusinessMetrics {
  depositRate: number;
  withdrawalRate: number;
  tvl: number;
  lendingUtilization: number;
  delinquencyRate: number;
}

interface MLMetrics {
  modelLatency: number;
  trainingFailureRate: number;
  conceptDriftScore: number;
  predictionAccuracy: number;
}
```

#### 5.2 Alert Rules
```typescript
interface AlertRule {
  name: string;
  condition: (metrics: Metrics) => boolean;
  severity: AlertSeverity;
  channels: NotificationChannel[];
}

enum AlertSeverity {
  P0_CRITICAL = 'P0_CRITICAL',
  P1_HIGH = 'P1_HIGH',
  P2_MEDIUM = 'P2_MEDIUM',
  P3_LOW = 'P3_LOW'
}

const alertRules: AlertRule[] = [
  {
    name: 'Oracle Data Stale',
    condition: (m) => m.contract.oracleStaleness > 3600,
    severity: AlertSeverity.P0_CRITICAL,
    channels: ['slack', 'pagerduty', 'email']
  },
  {
    name: 'High Delinquency Rate',
    condition: (m) => m.business.delinquencyRate > 0.1,
    severity: AlertSeverity.P1_HIGH,
    channels: ['slack', 'email']
  }
];
```

#### 5.3 Notification Service
```typescript
interface NotificationService {
  sendSlack(message: string, channel: string): Promise<void>;
  sendPagerDuty(alert: Alert): Promise<void>;
  sendEmail(to: string[], subject: string, body: string): Promise<void>;
  sendInApp(userId: string, notification: Notification): Promise<void>;
}
```

### Implementation Steps

1. Set up Prometheus for metrics collection
2. Configure Grafana dashboards
3. Implement metrics collectors
4. Define alert rules
5. Set up notification channels
6. Create alert management UI

---

## Technology Stack

### New Technologies for Phase 2

- **IPFS**: Infura IPFS or self-hosted node
- **Message Queue**: Bull/BullMQ with Redis
- **Monitoring**: Prometheus + Grafana
- **PDF Generation**: PDFKit or Puppeteer
- **WebSocket**: Socket.io
- **Time Series DB**: InfluxDB or Prometheus

### Integration Points

- Existing smart contracts
- Existing backend services
- Existing database (PostgreSQL)
- Existing ML services

---

## Security Considerations

### IPFS Security
- Encrypt sensitive documents before upload
- Use private IPFS network for sensitive data
- Implement access control for document downloads
- Regular backup of pinned files

### Order Book Security
- Rate limiting on order placement
- Front-running protection
- KYC verification before trading
- AML scanning on all trades

### Event Processing Security
- Signature verification for all events
- Idempotency checks
- Transaction replay protection
- Secure retry mechanism

### Monitoring Security
- Secure metrics endpoints
- Role-based access to dashboards
- Encrypted alert channels
- Audit logging for all alerts

---

## Performance Considerations

### IPFS Performance
- Use CDN for frequently accessed documents
- Implement caching layer
- Parallel uploads for multiple files
- Optimize file sizes

### Order Book Performance
- In-memory order book for fast matching
- WebSocket for real-time updates
- Database indexing for queries
- Horizontal scaling for matching engine

### Event Processing Performance
- Parallel event processing
- Batch database updates
- Efficient retry mechanism
- Queue monitoring and scaling

### Monitoring Performance
- Efficient metrics collection
- Data retention policies
- Query optimization
- Dashboard caching

---

## Testing Strategy

### Unit Tests
- IPFS service functions
- Order matching logic
- Tax calculations
- Event processors
- Alert rule evaluation

### Integration Tests
- End-to-end document upload flow
- Order placement and matching
- Tax report generation
- Event processing pipeline
- Alert notification delivery

### Performance Tests
- IPFS upload/download speed
- Order book throughput
- Event processing latency
- Metrics collection overhead

### Security Tests
- Document access control
- Order validation
- Event signature verification
- Alert channel security

---

## Deployment Strategy

### Phase 2A Deployment
1. Deploy IPFS infrastructure
2. Deploy DocumentRegistry contract
3. Deploy order book services
4. Deploy tax reporting service
5. Deploy event orchestration
6. Deploy monitoring stack

### Rollback Plan
- Database migration rollback scripts
- Contract upgrade rollback
- Service version rollback
- Data backup and restore

### Monitoring
- Service health checks
- Performance metrics
- Error rates
- User feedback

---

**Document Version**: v1.0  
**Created**: October 28, 2025  
**Status**: Ready for Implementation
