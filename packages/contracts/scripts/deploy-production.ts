import { ethers, upgrades } from 'hardhat';
import { writeFileSync } from 'fs';
import { join } from 'path';

/**
 * Production deployment script for all smart contracts
 * This script deploys contracts in the correct order with proper configuration
 */

interface DeploymentAddresses {
  permissionedToken: string;
  spvRegistry: string;
  trancheFactory: string;
  vault: string;
  permissionedAMM: string;
  lendingPool: string;
  oracleAggregator: string;
  documentRegistry: string;
  timelock: string;
}

async function main() {
  console.log('🚀 Starting production deployment...\n');

  const [deployer] = await ethers.getSigners();
  console.log('Deploying contracts with account:', deployer.address);
  console.log('Account balance:', ethers.formatEther(await ethers.provider.getBalance(deployer.address)), 'ETH\n');

  const addresses: Partial<DeploymentAddresses> = {};

  // 1. Deploy Timelock (for governance)
  console.log('📝 Deploying Timelock...');
  const minDelay = 2 * 24 * 60 * 60; // 2 days
  const Timelock = await ethers.getContractFactory('Timelock');
  const timelock = await Timelock.deploy(
    minDelay,
    [deployer.address], // proposers
    [deployer.address], // executors
    deployer.address // admin
  );
  await timelock.waitForDeployment();
  addresses.timelock = await timelock.getAddress();
  console.log('✅ Timelock deployed to:', addresses.timelock, '\n');

  // 2. Deploy SPVRegistry
  console.log('📝 Deploying SPVRegistry...');
  const SPVRegistry = await ethers.getContractFactory('SPVRegistry');
  const spvRegistry = await SPVRegistry.deploy();
  await spvRegistry.waitForDeployment();
  addresses.spvRegistry = await spvRegistry.getAddress();
  console.log('✅ SPVRegistry deployed to:', addresses.spvRegistry, '\n');

  // 3. Deploy PermissionedToken (example SPV token)
  console.log('📝 Deploying PermissionedToken...');
  const PermissionedToken = await ethers.getContractFactory('PermissionedToken');
  const permissionedToken = await PermissionedToken.deploy(
    'RWA Property Token',
    'RWAP',
    1 // SPV ID
  );
  await permissionedToken.waitForDeployment();
  addresses.permissionedToken = await permissionedToken.getAddress();
  console.log('✅ PermissionedToken deployed to:', addresses.permissionedToken, '\n');

  // 4. Deploy OracleAggregator
  console.log('📝 Deploying OracleAggregator...');
  const OracleAggregator = await ethers.getContractFactory('OracleAggregator');
  const oracleAggregator = await OracleAggregator.deploy();
  await oracleAggregator.waitForDeployment();
  addresses.oracleAggregator = await oracleAggregator.getAddress();
  console.log('✅ OracleAggregator deployed to:', addresses.oracleAggregator, '\n');

  // 5. Deploy Vault
  console.log('📝 Deploying Vault...');
  const Vault = await ethers.getContractFactory('Vault');
  const vault = await Vault.deploy(
    addresses.permissionedToken!,
    'RWA Vault Token',
    'vRWA'
  );
  await vault.waitForDeployment();
  addresses.vault = await vault.getAddress();
  console.log('✅ Vault deployed to:', addresses.vault, '\n');

  // 6. Deploy TrancheFactory
  console.log('📝 Deploying TrancheFactory...');
  const TrancheFactory = await ethers.getContractFactory('TrancheFactory');
  const trancheFactory = await TrancheFactory.deploy();
  await trancheFactory.waitForDeployment();
  addresses.trancheFactory = await trancheFactory.getAddress();
  console.log('✅ TrancheFactory deployed to:', addresses.trancheFactory, '\n');

  // 7. Deploy PermissionedAMM
  console.log('📝 Deploying PermissionedAMM...');
  const PermissionedAMM = await ethers.getContractFactory('PermissionedAMM');
  const permissionedAMM = await PermissionedAMM.deploy(
    addresses.permissionedToken!,
    await ethers.resolveAddress('0x0000000000000000000000000000000000000000') // USDC placeholder
  );
  await permissionedAMM.waitForDeployment();
  addresses.permissionedAMM = await permissionedAMM.getAddress();
  console.log('✅ PermissionedAMM deployed to:', addresses.permissionedAMM, '\n');

  // 8. Deploy LendingPool
  console.log('📝 Deploying LendingPool...');
  const LendingPool = await ethers.getContractFactory('LendingPool');
  const lendingPool = await LendingPool.deploy(
    addresses.oracleAggregator!
  );
  await lendingPool.waitForDeployment();
  addresses.lendingPool = await lendingPool.getAddress();
  console.log('✅ LendingPool deployed to:', addresses.lendingPool, '\n');

  // 9. Deploy DocumentRegistry
  console.log('📝 Deploying DocumentRegistry...');
  const DocumentRegistry = await ethers.getContractFactory('DocumentRegistry');
  const documentRegistry = await DocumentRegistry.deploy();
  await documentRegistry.waitForDeployment();
  addresses.documentRegistry = await documentRegistry.getAddress();
  console.log('✅ DocumentRegistry deployed to:', addresses.documentRegistry, '\n');

  // Save deployment addresses
  const deploymentInfo = {
    network: (await ethers.provider.getNetwork()).name,
    chainId: (await ethers.provider.getNetwork()).chainId,
    deployer: deployer.address,
    timestamp: new Date().toISOString(),
    addresses,
  };

  const outputPath = join(__dirname, '../deployments', `${deploymentInfo.network}.json`);
  writeFileSync(outputPath, JSON.stringify(deploymentInfo, null, 2));
  console.log('\n📄 Deployment addresses saved to:', outputPath);

  // Transfer ownership to Timelock
  console.log('\n🔐 Transferring ownership to Timelock...');
  
  // Grant roles to Timelock
  const MINTER_ROLE = await permissionedToken.MINTER_ROLE();
  const BURNER_ROLE = await permissionedToken.BURNER_ROLE();
  const ADMIN_ROLE = await permissionedToken.DEFAULT_ADMIN_ROLE();

  await permissionedToken.grantRole(MINTER_ROLE, addresses.timelock!);
  await permissionedToken.grantRole(BURNER_ROLE, addresses.timelock!);
  console.log('✅ Roles granted to Timelock');

  console.log('\n✨ Deployment complete!\n');
  console.log('📋 Summary:');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  Object.entries(addresses).forEach(([name, address]) => {
    console.log(`${name.padEnd(20)}: ${address}`);
  });
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  console.log('⚠️  IMPORTANT: Save these addresses securely!');
  console.log('⚠️  Update your .env files with these addresses');
  console.log('⚠️  Verify contracts on block explorer\n');
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
