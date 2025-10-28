# Smart Contract Deployment Guide

This guide covers the deployment process for all RWA DeFi Platform smart contracts.

## Prerequisites

1. **Node.js and npm** installed
2. **Private key** with sufficient ETH for gas fees
3. **RPC endpoints** for target networks
4. **API keys** for contract verification (Etherscan/Arbiscan)

## Environment Setup

Create a `.env` file in the `packages/contracts` directory:

```bash
# Private key (without 0x prefix)
PRIVATE_KEY=your_private_key_here

# RPC URLs
ARBITRUM_SEPOLIA_RPC_URL=https://sepolia-rollup.arbitrum.io/rpc
ARBITRUM_RPC_URL=https://arb1.arbitrum.io/rpc

# API Keys for verification
ARBISCAN_API_KEY=your_arbiscan_api_key
ETHERSCAN_API_KEY=your_etherscan_api_key

# Optional
COINMARKETCAP_API_KEY=your_cmc_api_key
REPORT_GAS=true
```

## Deployment Steps

### 1. Pre-Deployment Checks

Run the pre-deployment checklist:

```bash
cd packages/contracts
npx hardhat run scripts/pre-deploy-check.ts --network arbitrumSepolia
```

This will verify:
- Network configuration
- Account balance
- Environment variables
- Contract compilation
- Gas prices

### 2. Testnet Deployment (Arbitrum Sepolia)

Deploy to testnet first for testing:

```bash
npx hardhat run scripts/deploy-testnet.ts --network arbitrumSepolia
```

This will:
- Deploy all 9 contracts
- Configure initial settings
- Mint test tokens
- Save deployment addresses to `deployments/testnet-arbitrumSepolia.json`

### 3. Verify Deployment

Verify that all contracts are deployed correctly:

```bash
npx hardhat run scripts/verify-deployment.ts --network arbitrumSepolia
```

### 4. Verify Contracts on Block Explorer

Verify each contract on Arbiscan:

```bash
npx hardhat verify --network arbitrumSepolia <CONTRACT_ADDRESS> <CONSTRUCTOR_ARGS>
```

Example:
```bash
npx hardhat verify --network arbitrumSepolia 0x123... "Test RWA Property Token" "tRWAP" 1
```

### 5. Test Contract Interactions

Test all contract functions:
- Mint tokens
- Transfer tokens
- Add liquidity to AMM
- Deposit to Vault
- Borrow from LendingPool

### 6. Production Deployment (Arbitrum One)

⚠️ **IMPORTANT**: Only proceed after thorough testing on testnet!

```bash
npx hardhat run scripts/deploy-production.ts --network arbitrum
```

This will:
- Deploy all contracts to mainnet
- Configure with production settings
- Transfer ownership to Timelock
- Save deployment addresses to `deployments/arbitrum.json`

### 7. Post-Deployment

1. **Verify contracts** on Arbiscan
2. **Update frontend** `.env` with contract addresses
3. **Update backend** `.env` with contract addresses
4. **Configure multisig** wallet (Gnosis Safe)
5. **Transfer admin roles** to multisig
6. **Announce deployment** to community

## Deployed Contracts

### Testnet (Arbitrum Sepolia)

Deployment addresses will be saved in `deployments/testnet-arbitrumSepolia.json`

### Mainnet (Arbitrum One)

Deployment addresses will be saved in `deployments/arbitrum.json`

## Contract Addresses Structure

```json
{
  "network": "arbitrumSepolia",
  "chainId": 421614,
  "deployer": "0x...",
  "timestamp": "2025-10-28T...",
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

## Troubleshooting

### Insufficient Balance

If you see "insufficient funds for gas":
- Check your account balance
- Ensure you have at least 0.1 ETH for deployment

### RPC Connection Issues

If deployment fails with RPC errors:
- Verify RPC URL is correct
- Try alternative RPC endpoints
- Check network connectivity

### Contract Verification Fails

If verification fails:
- Ensure API key is correct
- Wait a few minutes and retry
- Verify constructor arguments match deployment

### Gas Price Too High

If gas prices are too high:
- Wait for lower gas prices
- Use gas price monitoring tools
- Consider deploying during off-peak hours

## Security Checklist

Before mainnet deployment:

- [ ] All contracts audited by reputable firm
- [ ] Test coverage > 90%
- [ ] All tests passing
- [ ] Testnet deployment tested thoroughly
- [ ] Multisig wallet configured
- [ ] Timelock delay configured (48 hours recommended)
- [ ] Emergency pause mechanism tested
- [ ] Access control roles verified
- [ ] Upgrade mechanisms tested (if applicable)
- [ ] Documentation complete

## Emergency Procedures

### Pause Contracts

If critical issue discovered:

```solidity
// Call pause function on affected contracts
await contract.pause();
```

### Upgrade Contracts

If using upgradeable contracts:

1. Deploy new implementation
2. Create upgrade proposal in Timelock
3. Wait for timelock delay
4. Execute upgrade

### Revoke Roles

If compromised account detected:

```solidity
await contract.revokeRole(ROLE, compromisedAddress);
```

## Support

For deployment issues:
- Check documentation
- Review deployment logs
- Contact development team
- Open GitHub issue

## References

- [Hardhat Documentation](https://hardhat.org/docs)
- [OpenZeppelin Contracts](https://docs.openzeppelin.com/contracts)
- [Arbitrum Documentation](https://docs.arbitrum.io/)
- [Arbiscan](https://arbiscan.io/)
