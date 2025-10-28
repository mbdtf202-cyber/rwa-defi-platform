# Contract Deployments

This directory contains deployment information for all networks.

## File Structure

- `testnet-arbitrumSepolia.json` - Arbitrum Sepolia testnet deployment
- `arbitrum.json` - Arbitrum One mainnet deployment
- `*.json` - Other network deployments

## Deployment File Format

Each deployment file contains:

```json
{
  "network": "Network name",
  "chainId": 421614,
  "deployer": "0x...",
  "timestamp": "ISO 8601 timestamp",
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

## Usage

### Load Deployment Addresses

```typescript
import deployment from './deployments/arbitrum.json';

const tokenAddress = deployment.addresses.permissionedToken;
```

### Verify Deployment

```bash
npm run verify:deployment -- --network arbitrumSepolia
```

## Security

⚠️ **IMPORTANT**: 
- Keep deployment files secure
- Do not commit private keys
- Verify all addresses before use
- Back up deployment files

## Networks

### Testnet
- **Arbitrum Sepolia**: Chain ID 421614
- **RPC**: https://sepolia-rollup.arbitrum.io/rpc
- **Explorer**: https://sepolia.arbiscan.io

### Mainnet
- **Arbitrum One**: Chain ID 42161
- **RPC**: https://arb1.arbitrum.io/rpc
- **Explorer**: https://arbiscan.io
