import { ethers } from 'hardhat';

/**
 * Pre-deployment checklist
 * Run this before deploying to production
 */

async function main() {
  console.log('🔍 Running pre-deployment checks...\n');

  const [deployer] = await ethers.getSigners();
  const network = await ethers.provider.getNetwork();
  const balance = await ethers.provider.getBalance(deployer.address);

  let allChecksPassed = true;

  // Check 1: Network
  console.log('1️⃣  Network Check');
  console.log(`   Network: ${network.name}`);
  console.log(`   Chain ID: ${network.chainId}`);
  
  if (Number(network.chainId) === 31337) {
    console.log('   ⚠️  WARNING: Deploying to local network');
  } else if (Number(network.chainId) === 421614) {
    console.log('   ℹ️  Deploying to Arbitrum Sepolia (testnet)');
  } else if (Number(network.chainId) === 42161) {
    console.log('   ⚠️  PRODUCTION: Deploying to Arbitrum One (mainnet)');
  }
  console.log('   ✅ Network check passed\n');

  // Check 2: Deployer account
  console.log('2️⃣  Deployer Account Check');
  console.log(`   Address: ${deployer.address}`);
  console.log(`   Balance: ${ethers.formatEther(balance)} ETH`);
  
  const minBalance = ethers.parseEther('0.1');
  if (balance < minBalance) {
    console.log('   ❌ Insufficient balance for deployment');
    console.log(`   ℹ️  Minimum required: ${ethers.formatEther(minBalance)} ETH`);
    allChecksPassed = false;
  } else {
    console.log('   ✅ Sufficient balance\n');
  }

  // Check 3: Environment variables
  console.log('3️⃣  Environment Variables Check');
  const requiredEnvVars = [
    'PRIVATE_KEY',
    'ARBITRUM_RPC_URL',
  ];
  
  const missingVars: string[] = [];
  for (const envVar of requiredEnvVars) {
    if (!process.env[envVar]) {
      missingVars.push(envVar);
    }
  }
  
  if (missingVars.length > 0) {
    console.log('   ❌ Missing environment variables:');
    missingVars.forEach(v => console.log(`      - ${v}`));
    allChecksPassed = false;
  } else {
    console.log('   ✅ All required environment variables set\n');
  }

  // Check 4: Contract compilation
  console.log('4️⃣  Contract Compilation Check');
  try {
    await ethers.getContractFactory('PermissionedToken');
    await ethers.getContractFactory('SPVRegistry');
    await ethers.getContractFactory('TrancheFactory');
    await ethers.getContractFactory('Vault');
    await ethers.getContractFactory('PermissionedAMM');
    await ethers.getContractFactory('LendingPool');
    await ethers.getContractFactory('OracleAggregator');
    await ethers.getContractFactory('DocumentRegistry');
    await ethers.getContractFactory('Timelock');
    console.log('   ✅ All contracts compiled successfully\n');
  } catch (error) {
    console.log('   ❌ Contract compilation failed');
    console.log(`   Error: ${error}`);
    allChecksPassed = false;
  }

  // Check 5: Gas price
  console.log('5️⃣  Gas Price Check');
  try {
    const feeData = await ethers.provider.getFeeData();
    const gasPrice = feeData.gasPrice || BigInt(0);
    console.log(`   Current gas price: ${ethers.formatUnits(gasPrice, 'gwei')} gwei`);
    
    const maxGasPrice = ethers.parseUnits('50', 'gwei');
    if (gasPrice > maxGasPrice) {
      console.log('   ⚠️  WARNING: Gas price is high');
      console.log('   ℹ️  Consider waiting for lower gas prices');
    } else {
      console.log('   ✅ Gas price is reasonable\n');
    }
  } catch (error) {
    console.log('   ⚠️  Could not fetch gas price\n');
  }

  // Check 6: Deployment directory
  console.log('6️⃣  Deployment Directory Check');
  const { existsSync, mkdirSync } = require('fs');
  const { join } = require('path');
  const deploymentsDir = join(__dirname, '../deployments');
  
  if (!existsSync(deploymentsDir)) {
    try {
      mkdirSync(deploymentsDir, { recursive: true });
      console.log('   ✅ Created deployments directory\n');
    } catch (error) {
      console.log('   ❌ Failed to create deployments directory');
      allChecksPassed = false;
    }
  } else {
    console.log('   ✅ Deployments directory exists\n');
  }

  // Summary
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  if (allChecksPassed) {
    console.log('✅ All pre-deployment checks passed!');
    console.log('\n📝 Ready to deploy. Run:');
    console.log('   npx hardhat run scripts/deploy-testnet.ts --network arbitrumSepolia');
    console.log('   or');
    console.log('   npx hardhat run scripts/deploy-production.ts --network arbitrum');
  } else {
    console.log('❌ Some checks failed. Please fix the issues before deploying.');
    process.exit(1);
  }
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
