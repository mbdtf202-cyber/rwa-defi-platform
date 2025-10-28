import { ethers, upgrades } from 'hardhat';

async function main() {
  console.log('🚀 Deploying TrancheFactory...');

  const [deployer] = await ethers.getSigners();
  console.log('Deploying with account:', deployer.address);

  const balance = await ethers.provider.getBalance(deployer.address);
  console.log('Account balance:', ethers.formatEther(balance), 'ETH');

  // Deploy TrancheFactory
  const TrancheFactory = await ethers.getContractFactory('TrancheFactory');
  const trancheFactory = await upgrades.deployProxy(
    TrancheFactory,
    [deployer.address],
    { initializer: 'initialize', kind: 'uups' }
  );

  await trancheFactory.waitForDeployment();
  const address = await trancheFactory.getAddress();

  console.log('✅ TrancheFactory deployed to:', address);

  // Grant operator role to deployer
  const OPERATOR_ROLE = await trancheFactory.OPERATOR_ROLE();
  await trancheFactory.grantRole(OPERATOR_ROLE, deployer.address);
  console.log('✅ Operator role granted to:', deployer.address);

  // Save deployment info
  const deploymentInfo = {
    network: (await ethers.provider.getNetwork()).name,
    trancheFactory: address,
    deployer: deployer.address,
    timestamp: new Date().toISOString(),
  };

  console.log('\n📝 Deployment Info:', JSON.stringify(deploymentInfo, null, 2));

  return deploymentInfo;
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
