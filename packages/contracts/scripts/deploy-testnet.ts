import { ethers } from 'hardhat';
import { writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';

/**
 * Testnet deployment script
 * This script deploys contracts to testnet (Arbitrum Sepolia) for testing
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
  console.log('🚀 Starting testnet deployment...\n');

  const [deployer] = await ethers.getSigners();
  const network = await ethers.provider.getNetwork();
  
  console.log('Network:', network.name);
  console.log('Chain ID:', network.chainId);
  console.log('Deployer:', deployer.address);
  console.log('Balance:', ethers.formatEther(await ethers.provider.getBalance(deployer.address)), 'ETH\n');

  if (Number(network.chainId) === 1 || Number(network.chainId) === 42161) {
    console.error('❌ This script is for testnet only! Use deploy-production.ts for mainnet.');
    process.exit(1);
  }

  const addresses: Partial<DeploymentAddresses> = {};

  // 1. Deploy Timelock
  console.log('📝 Deploying Timelock...');
  const minDelay = 60 * 60; // 1 hour for testnet
  const Timelock = await ethers.getContractFactory('Timelock');
  const timelock = await Timelock.deploy(
    minDelay,
    [deployer.address],
    [deployer.address],
    deployer.address
  );
  await timelock.waitForDeployment();
  addresses.timelock = await timelock.getAddress();
  console.log('✅ Timelock:', addresses.timelock);

  // 2. Deploy SPVRegistry
  console.log('📝 Deploying SPVRegistry...');
  const SPVRegistry = await ethers.getContractFactory('SPVRegistry');
  const spvRegistry = await SPVRegistry.deploy();
  await spvRegistry.waitForDeployment();
  addresses.spvRegistry = await spvRegistry.getAddress();
  console.log('✅ SPVRegistry:', addresses.spvRegistry);

  // 3. Deploy PermissionedToken
  console.log('📝 Deploying PermissionedToken...');
  const PermissionedToken = await ethers.getContractFactory('PermissionedToken');
  const permissionedToken = await PermissionedToken.deploy(
    'Test RWA Property Token',
    'tRWAP',
    1
  );
  await permissionedToken.waitForDeployment();
  addresses.permissionedToken = await permissionedToken.getAddress();
  console.log('✅ PermissionedToken:', addresses.permissionedToken);

  // 4. Deploy OracleAggregator
  console.log('📝 Deploying OracleAggregator...');
  const OracleAggregator = await ethers.getContractFactory('OracleAggregator');
  const oracleAggregator = await OracleAggregator.deploy();
  await oracleAggregator.waitForDeployment();
  addresses.oracleAggregator = await oracleAggregator.getAddress();
  console.log('✅ OracleAggregator:', addresses.oracleAggregator);

  // 5. Deploy Vault
  console.log('📝 Deploying Vault...');
  const Vault = await ethers.getContractFactory('Vault');
  const vault = await Vault.deploy(
    addresses.permissionedToken!,
    'Test RWA Vault Token',
    'tvRWA'
  );
  await vault.waitForDeployment();
  addresses.vault = await vault.getAddress();
  console.log('✅ Vault:', addresses.vault);

  // 6. Deploy TrancheFactory
  console.log('📝 Deploying TrancheFactory...');
  const TrancheFactory = await ethers.getContractFactory('TrancheFactory');
  const trancheFactory = await TrancheFactory.deploy();
  await trancheFactory.waitForDeployment();
  addresses.trancheFactory = await trancheFactory.getAddress();
  console.log('✅ TrancheFactory:', addresses.trancheFactory);

  // 7. Deploy PermissionedAMM (with mock USDC address for testnet)
  console.log('📝 Deploying PermissionedAMM...');
  const mockUSDC = '0x0000000000000000000000000000000000000001'; // Placeholder
  const PermissionedAMM = await ethers.getContractFactory('PermissionedAMM');
  const permissionedAMM = await PermissionedAMM.deploy(
    addresses.permissionedToken!,
    mockUSDC
  );
  await permissionedAMM.waitForDeployment();
  addresses.permissionedAMM = await permissionedAMM.getAddress();
  console.log('✅ PermissionedAMM:', addresses.permissionedAMM);

  // 8. Deploy LendingPool
  console.log('📝 Deploying LendingPool...');
  const LendingPool = await ethers.getContractFactory('LendingPool');
  const lendingPool = await LendingPool.deploy(
    addresses.oracleAggregator!
  );
  await lendingPool.waitForDeployment();
  addresses.lendingPool = await lendingPool.getAddress();
  console.log('✅ LendingPool:', addresses.lendingPool);

  // 9. Deploy DocumentRegistry
  console.log('📝 Deploying DocumentRegistry...');
  const DocumentRegistry = await ethers.getContractFactory('DocumentRegistry');
  const documentRegistry = await DocumentRegistry.deploy();
  await documentRegistry.waitForDeployment();
  addresses.documentRegistry = await documentRegistry.getAddress();
  console.log('✅ DocumentRegistry:', addresses.documentRegistry);

  // Configure contracts
  console.log('\n⚙️  Configuring contracts...');
  
  // Add collateral to LendingPool
  await lendingPool.addCollateral(
    addresses.permissionedToken!,
    ethers.parseEther('0.75'),
    ethers.parseEther('0.85')
  );
  console.log('✅ Collateral configured');

  // Register SPV
  await spvRegistry.registerSPV(
    'Test Property SPV',
    addresses.permissionedToken!,
    deployer.address
  );
  console.log('✅ SPV registered');

  // Mint some test tokens
  const MINTER_ROLE = await permissionedToken.MINTER_ROLE();
  await permissionedToken.grantRole(MINTER_ROLE, deployer.address);
  await permissionedToken.mint(deployer.address, ethers.parseEther('1000'));
  console.log('✅ Test tokens minted');

  // Save deployment info
  const deploymentInfo = {
    network: network.name,
    chainId: Number(network.chainId),
    deployer: deployer.address,
    timestamp: new Date().toISOString(),
    addresses,
    testnet: true,
  };

  // Create deployments directory if it doesn't exist
  const deploymentsDir = join(__dirname, '../deployments');
  try {
    mkdirSync(deploymentsDir, { recursive: true });
  } catch (error) {
    // Directory already exists
  }

  const outputPath = join(deploymentsDir, `testnet-${network.name}.json`);
  writeFileSync(outputPath, JSON.stringify(deploymentInfo, null, 2));
  console.log('\n📄 Deployment saved to:', outputPath);

  console.log('\n✨ Testnet deployment complete!\n');
  console.log('📋 Contract Addresses:');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  Object.entries(addresses).forEach(([name, address]) => {
    console.log(`${name.padEnd(20)}: ${address}`);
  });
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  console.log('📝 Next steps:');
  console.log('1. Verify contracts on block explorer');
  console.log('2. Update frontend .env with these addresses');
  console.log('3. Update backend .env with these addresses');
  console.log('4. Test all contract interactions\n');
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
