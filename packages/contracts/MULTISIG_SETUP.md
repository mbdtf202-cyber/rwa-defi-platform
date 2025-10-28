# Multisig Wallet Setup Guide (Gnosis Safe)

This guide explains how to set up and configure a Gnosis Safe multisig wallet for managing the RWA DeFi Platform contracts.

## Why Multisig?

A multisig wallet requires multiple signatures to execute transactions, providing:
- **Enhanced Security**: No single point of failure
- **Decentralized Control**: Distributed decision-making
- **Transparency**: All signers can see proposed transactions
- **Compliance**: Meets regulatory requirements for institutional custody

## Recommended Configuration

### Production (Mainnet)
- **Signers**: 5 addresses
- **Threshold**: 3 of 5 (60%)
- **Timelock Delay**: 48 hours

### Testnet
- **Signers**: 3 addresses
- **Threshold**: 2 of 3 (67%)
- **Timelock Delay**: 1 hour

## Setup Steps

### Step 1: Create Gnosis Safe

1. Visit https://app.safe.global/
2. Connect your wallet
3. Select network (Arbitrum One or Arbitrum Sepolia)
4. Click "Create new Safe"

### Step 2: Configure Signers

Add signer addresses:

**Example Production Signers:**
```
Signer 1 (CEO):           0x1111111111111111111111111111111111111111
Signer 2 (CTO):           0x2222222222222222222222222222222222222222
Signer 3 (CFO):           0x3333333333333333333333333333333333333333
Signer 4 (Legal):         0x4444444444444444444444444444444444444444
Signer 5 (Operations):    0x5555555555555555555555555555555555555555
```

**Threshold:** 3 of 5

### Step 3: Deploy Safe

1. Review configuration
2. Pay deployment fee
3. Wait for confirmation
4. Save Safe address

Example Safe Address: `0xSafe1234567890123456789012345678901234567`

### Step 4: Configure Timelock

The Timelock contract acts as an additional security layer:

```typescript
// Timelock configuration
const timelockAddress = '<TIMELOCK_ADDRESS>';
const minDelay = 48 * 60 * 60; // 48 hours

// Roles
const PROPOSER_ROLE = await timelock.PROPOSER_ROLE();
const EXECUTOR_ROLE = await timelock.EXECUTOR_ROLE();
const ADMIN_ROLE = await timelock.TIMELOCK_ADMIN_ROLE();
```

### Step 5: Grant Roles to Safe

Grant Timelock roles to the Gnosis Safe:

```bash
npx hardhat console --network arbitrum
```

```javascript
const timelock = await ethers.getContractAt('Timelock', '<TIMELOCK_ADDRESS>');
const safeAddress = '<SAFE_ADDRESS>';

// Grant proposer role to Safe
const PROPOSER_ROLE = await timelock.PROPOSER_ROLE();
await timelock.grantRole(PROPOSER_ROLE, safeAddress);

// Grant executor role to Safe
const EXECUTOR_ROLE = await timelock.EXECUTOR_ROLE();
await timelock.grantRole(EXECUTOR_ROLE, safeAddress);

console.log('Roles granted to Safe');
```

### Step 6: Transfer Contract Ownership

Transfer ownership of all contracts to Timelock:

```bash
npm run post-deploy:config -- --network arbitrum
```

Or manually:

```javascript
// Transfer PermissionedToken admin role
const token = await ethers.getContractAt('PermissionedToken', '<TOKEN_ADDRESS>');
const ADMIN_ROLE = await token.DEFAULT_ADMIN_ROLE();
await token.grantRole(ADMIN_ROLE, '<TIMELOCK_ADDRESS>');

// Transfer SPVRegistry ownership
const registry = await ethers.getContractAt('SPVRegistry', '<REGISTRY_ADDRESS>');
await registry.transferOwnership('<TIMELOCK_ADDRESS>');

// Repeat for all contracts...
```

### Step 7: Revoke Deployer Access

After transferring ownership, revoke deployer roles:

```javascript
// Revoke deployer admin role
await token.revokeRole(ADMIN_ROLE, deployerAddress);

// Verify deployer no longer has admin
const hasAdmin = await token.hasRole(ADMIN_ROLE, deployerAddress);
console.log('Deployer has admin:', hasAdmin); // Should be false
```

## Using the Multisig

### Proposing a Transaction

1. Go to https://app.safe.global/
2. Select your Safe
3. Click "New Transaction"
4. Choose transaction type:
   - **Contract Interaction**: Call contract functions
   - **Send Assets**: Transfer tokens
   - **Add/Remove Owners**: Modify signers

### Example: Mint Tokens

1. **Transaction Type**: Contract Interaction
2. **Contract Address**: `<TOKEN_ADDRESS>`
3. **ABI**: Upload PermissionedToken ABI
4. **Function**: `mint`
5. **Parameters**:
   - `to`: Recipient address
   - `amount`: Amount in wei (e.g., `1000000000000000000` for 1 token)
6. **Submit**: Create proposal

### Signing a Transaction

1. Review transaction details
2. Verify parameters are correct
3. Click "Confirm"
4. Sign with your wallet
5. Wait for other signers

### Executing a Transaction

Once threshold is reached (e.g., 3 of 5):
1. Any signer can execute
2. Click "Execute"
3. Pay gas fee
4. Transaction is sent to Timelock
5. Wait for timelock delay (48 hours)
6. Execute from Timelock

## Timelock Operations

### Schedule Operation

```javascript
const timelock = await ethers.getContractAt('Timelock', '<TIMELOCK_ADDRESS>');

// Prepare operation
const target = '<TOKEN_ADDRESS>';
const value = 0;
const data = token.interface.encodeFunctionData('mint', [
  recipientAddress,
  ethers.parseEther('1000')
]);
const predecessor = ethers.ZeroHash;
const salt = ethers.id('unique-operation-id');
const delay = 48 * 60 * 60; // 48 hours

// Schedule
await timelock.schedule(target, value, data, predecessor, salt, delay);
console.log('Operation scheduled');
```

### Execute Operation

After delay period:

```javascript
await timelock.execute(target, value, data, predecessor, salt);
console.log('Operation executed');
```

### Cancel Operation

If needed before execution:

```javascript
const id = await timelock.hashOperation(target, value, data, predecessor, salt);
await timelock.cancel(id);
console.log('Operation cancelled');
```

## Security Best Practices

### Signer Management

1. **Distribute Signers**: Different individuals/entities
2. **Secure Keys**: Hardware wallets (Ledger, Trezor)
3. **Backup**: Secure backup of all signer keys
4. **Regular Review**: Audit signer list quarterly

### Transaction Review

1. **Verify Details**: Double-check all parameters
2. **Test First**: Test on testnet before mainnet
3. **Document**: Record reason for each transaction
4. **Communicate**: Notify all signers before proposing

### Emergency Procedures

1. **Pause Contracts**: If critical issue detected
2. **Revoke Roles**: If signer compromised
3. **Upgrade Contracts**: If vulnerability found
4. **Communication**: Notify community immediately

## Monitoring

### Set Up Alerts

1. **Transaction Proposals**: Email/Slack notification
2. **Execution Events**: Monitor on-chain events
3. **Balance Changes**: Track Safe balance
4. **Role Changes**: Alert on role modifications

### Regular Audits

- **Monthly**: Review all transactions
- **Quarterly**: Audit signer access
- **Annually**: Full security review

## Testing Multisig Operations

### Test on Testnet First

```bash
# Deploy to testnet
npm run deploy:testnet

# Create testnet Safe
# Visit https://app.safe.global/ and select Arbitrum Sepolia

# Test operations
1. Mint tokens
2. Transfer ownership
3. Pause contract
4. Upgrade contract (if applicable)
```

### Verify Operations

```javascript
// Check token balance after mint
const balance = await token.balanceOf(recipientAddress);
console.log('Balance:', ethers.formatEther(balance));

// Check ownership
const owner = await registry.owner();
console.log('Owner:', owner);

// Check roles
const hasRole = await token.hasRole(MINTER_ROLE, address);
console.log('Has minter role:', hasRole);
```

## Troubleshooting

### Transaction Fails

**Error: Execution reverted**
- Check if Safe has required role
- Verify Timelock delay has passed
- Ensure parameters are correct

**Error: Insufficient signers**
- Need more signatures to reach threshold
- Contact other signers

**Error: Timelock not ready**
- Operation still in delay period
- Wait for delay to pass

### Signer Issues

**Signer Lost Access**
- Use remaining signers to remove lost signer
- Add new signer
- Update threshold if needed

**Signer Compromised**
- Immediately revoke signer
- Review recent transactions
- Add new signer

## Resources

- Gnosis Safe App: https://app.safe.global/
- Gnosis Safe Docs: https://docs.safe.global/
- Timelock Contract: OpenZeppelin TimelockController
- Arbitrum Safe: https://safe.arbitrum.io/

## Checklist

- [ ] Gnosis Safe created
- [ ] All signers added
- [ ] Threshold configured
- [ ] Safe address saved securely
- [ ] Timelock roles granted to Safe
- [ ] Contract ownership transferred
- [ ] Deployer roles revoked
- [ ] Test transaction executed
- [ ] Monitoring set up
- [ ] Emergency procedures documented
- [ ] All signers trained
