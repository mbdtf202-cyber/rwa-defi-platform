# Testnet Deployment Guide (Arbitrum Sepolia)

This document provides step-by-step instructions for deploying to Arbitrum Sepolia testnet.

## Prerequisites

### 1. Get Testnet ETH

You need Sepolia ETH to deploy on Arbitrum Sepolia:

1. Get Sepolia ETH from faucet:
   - https://sepoliafaucet.com/
   - https://www.alchemy.com/faucets/ethereum-sepolia

2. Bridge to Arbitrum Sepolia:
   - Visit: https://bridge.arbitrum.io/
   - Connect wallet
   - Select "Sepolia" → "Arbitrum Sepolia"
   - Bridge at least 0.1 ETH

### 2. Configure Environment

Create `.env` file:

```bash
PRIVATE_KEY=your_private_key_without_0x
ARBITRUM_SEPOLIA_RPC_URL=https://sepolia-rollup.arbitrum.io/rpc
ARBISCAN_API_KEY=your_arbiscan_api_key
```

## Deployment Steps

### Step 1: Pre-Deployment Check

```bash
npm run pre-deploy:check -- --network arbitrumSepolia
```

Expected output:
```
✅ Network check passed
✅ Sufficient balance
✅ All required environment variables set
✅ All contracts compiled successfully
✅ Gas price is reasonable
✅ Deployments directory exists
```

### Step 2: Deploy Contracts

```bash
npm run deploy:testnet
```

This will deploy all 9 contracts in the correct order:

1. Timelock (1 hour delay for testnet)
2. SPVRegistry
3. PermissionedToken
4. OracleAggregator
5. Vault
6. TrancheFactory
7. PermissionedAMM
8. LendingPool
9. DocumentRegistry

Expected deployment time: 5-10 minutes

### Step 3: Verify Deployment

```bash
npm run verify:deployment -- --network arbitrumSepolia
```

This will verify:
- All contracts are deployed
- Contract states are correct
- Roles are properly configured

### Step 4: Verify on Arbiscan

Verify each contract on Arbiscan Sepolia:

```bash
# Example for PermissionedToken
npx hardhat verify --network arbitrumSepolia \
  <TOKEN_ADDRESS> \
  "Test RWA Property Token" \
  "tRWAP" \
  1
```

Repeat for all contracts with their respective constructor arguments.

### Step 5: Test Contract Interactions

#### Test 1: Mint Tokens

```bash
npx hardhat console --network arbitrumSepolia
```

```javascript
const token = await ethers.getContractAt('PermissionedToken', '<TOKEN_ADDRESS>');
const [signer] = await ethers.getSigners();

// Grant minter role
const MINTER_ROLE = await token.MINTER_ROLE();
await token.grantRole(MINTER_ROLE, signer.address);

// Mint tokens
await token.mint(signer.address, ethers.parseEther('100'));
console.log('Balance:', await token.balanceOf(signer.address));
```

#### Test 2: Register SPV

```javascript
const registry = await ethers.getContractAt('SPVRegistry', '<REGISTRY_ADDRESS>');
await registry.registerSPV('Test SPV', '<TOKEN_ADDRESS>', signer.address);
console.log('SPV Count:', await registry.spvCount());
```

#### Test 3: Deposit to Vault

```javascript
const vault = await ethers.getContractAt('Vault', '<VAULT_ADDRESS>');
const token = await ethers.getContractAt('PermissionedToken', '<TOKEN_ADDRESS>');

// Approve vault
await token.approve(vault.address, ethers.parseEther('10'));

// Deposit
await vault.deposit(ethers.parseEther('10'), signer.address);
console.log('Vault Balance:', await vault.balanceOf(signer.address));
```

#### Test 4: Add Liquidity to AMM

```javascript
const amm = await ethers.getContractAt('PermissionedAMM', '<AMM_ADDRESS>');
const token = await ethers.getContractAt('PermissionedToken', '<TOKEN_ADDRESS>');

// Approve AMM
await token.approve(amm.address, ethers.parseEther('10'));

// Add liquidity (requires USDC or mock token)
// await amm.addLiquidity(...);
```

#### Test 5: Borrow from LendingPool

```javascript
const pool = await ethers.getContractAt('LendingPool', '<POOL_ADDRESS>');
const token = await ethers.getContractAt('PermissionedToken', '<TOKEN_ADDRESS>');

// Approve collateral
await token.approve(pool.address, ethers.parseEther('10'));

// Supply collateral
await pool.supply(token.address, ethers.parseEther('10'));

// Borrow (requires liquidity in pool)
// await pool.borrow(...);
```

### Step 6: Configure Frontend

Update `rwa-defi-platform/.env`:

```bash
VITE_CHAIN_ID=421614
VITE_RPC_URL=https://sepolia-rollup.arbitrum.io/rpc

# Contract Addresses
VITE_TIMELOCK_ADDRESS=0x...
VITE_SPV_REGISTRY_ADDRESS=0x...
VITE_PERMISSIONED_TOKEN_ADDRESS=0x...
VITE_ORACLE_AGGREGATOR_ADDRESS=0x...
VITE_VAULT_ADDRESS=0x...
VITE_TRANCHE_FACTORY_ADDRESS=0x...
VITE_PERMISSIONED_AMM_ADDRESS=0x...
VITE_LENDING_POOL_ADDRESS=0x...
VITE_DOCUMENT_REGISTRY_ADDRESS=0x...
```

### Step 7: Configure Backend

Update `packages/backend/.env`:

```bash
BLOCKCHAIN_NETWORK=arbitrumSepolia
BLOCKCHAIN_RPC_URL=https://sepolia-rollup.arbitrum.io/rpc
CHAIN_ID=421614

# Contract Addresses (same as frontend)
TIMELOCK_ADDRESS=0x...
SPV_REGISTRY_ADDRESS=0x...
# ... etc
```

## Troubleshooting

### Deployment Fails

**Error: Insufficient funds**
- Solution: Get more testnet ETH from faucet

**Error: Nonce too high**
- Solution: Reset account in MetaMask or wait for pending transactions

**Error: Transaction underpriced**
- Solution: Increase gas price in hardhat.config.ts

### Verification Fails

**Error: Already verified**
- Solution: Contract is already verified, skip this step

**Error: Invalid constructor arguments**
- Solution: Check constructor arguments match deployment

**Error: API key invalid**
- Solution: Verify ARBISCAN_API_KEY in .env

### Contract Interaction Fails

**Error: Execution reverted**
- Solution: Check if you have required roles/permissions

**Error: Insufficient allowance**
- Solution: Approve contract before transfer

## Deployment Checklist

- [ ] Testnet ETH obtained and bridged
- [ ] Environment variables configured
- [ ] Pre-deployment check passed
- [ ] All contracts deployed successfully
- [ ] Deployment addresses saved
- [ ] All contracts verified on Arbiscan
- [ ] Token minting tested
- [ ] SPV registration tested
- [ ] Vault deposit tested
- [ ] AMM liquidity tested (if applicable)
- [ ] Lending pool tested (if applicable)
- [ ] Frontend configured with addresses
- [ ] Backend configured with addresses
- [ ] End-to-end user flow tested

## Expected Deployment Addresses

After deployment, you should have 9 contract addresses:

```json
{
  "network": "arbitrumSepolia",
  "chainId": 421614,
  "addresses": {
    "timelock": "0x...",
    "spvRegistry": "0x...",
    "permissionedToken": "0x...",
    "oracleAggregator": "0x...",
    "vault": "0x...",
    "trancheFactory": "0x...",
    "permissionedAMM": "0x...",
    "lendingPool": "0x...",
    "documentRegistry": "0x..."
  }
}
```

## Next Steps

After successful testnet deployment:

1. **Test all features** thoroughly
2. **Document any issues** found
3. **Fix bugs** and redeploy if needed
4. **Prepare for mainnet** deployment
5. **Schedule security audit**

## Resources

- Arbitrum Sepolia Explorer: https://sepolia.arbiscan.io/
- Arbitrum Sepolia Faucet: https://faucet.quicknode.com/arbitrum/sepolia
- Arbitrum Bridge: https://bridge.arbitrum.io/
- Hardhat Documentation: https://hardhat.org/docs
