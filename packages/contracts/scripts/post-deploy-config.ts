import { ethers } from 'hardhat';
import { readFileSync } from 'fs';
import { join } from 'path';

/**
 * Post-deployment configuration script
 * This script configures multisig and transfers ownership after deployment
 */

async function main() {
  console.log('⚙️  Running post-deployment configuration...\n');

  const [deployer] = await ethers.getSigners();
  const network = await ethers.provider.getNetwork();

  // Load deployment addresses
  const deploymentPath = join(__dirname, '../deployments', `${network.name}.json`);
  let deploymentInfo;
  
  try {
    deploymentInfo = JSON.parse(readFileSync(deploymentPath, 'utf-8'));
  } catch (error) {
    console.error('❌ Deployment file not found:', deploymentPath);
    process.exit(1);
  }

  const { addresses } = deploymentInfo;

  // Multisig address (should be set in environment or hardcoded for production)
  const multisigAddress = process.env.MULTISIG_ADDRESS || deployer.address;
  
  if (multisigAddress === deployer.address) {
    console.log('⚠️  WARNING: No multisig address configured, using deployer address');
    console.log('⚠️  This is NOT recommended for production!\n');
  }

  console.log('Multisig Address:', multisigAddress);
  console.log('Timelock Address:', addresses.timelock);
  console.log('\n');

  // Get contract instances
  const permissionedToken = await ethers.getContractAt('PermissionedToken', addresses.permissionedToken);
  const spvRegistry = await ethers.getContractAt('SPVRegistry', addresses.spvRegistry);
  const vault = await ethers.getContractAt('Vault', addresses.vault);
  const lendingPool = await ethers.getContractAt('LendingPool', addresses.lendingPool);
  const permissionedAMM = await ethers.getContractAt('PermissionedAMM', addresses.permissionedAMM);
  const trancheFactory = await ethers.getContractAt('TrancheFactory', addresses.trancheFactory);
  const oracleAggregator = await ethers.getContractAt('OracleAggregator', addresses.oracleAggregator);
  const documentRegistry = await ethers.getContractAt('DocumentRegistry', addresses.documentRegistry);

  // Define roles
  const ADMIN_ROLE = await permissionedToken.DEFAULT_ADMIN_ROLE();
  const MINTER_ROLE = await permissionedToken.MINTER_ROLE();
  const BURNER_ROLE = await permissionedToken.BURNER_ROLE();
  const PAUSER_ROLE = await permissionedToken.PAUSER_ROLE();

  console.log('1️⃣  Configuring PermissionedToken roles...');
  
  // Grant roles to Timelock
  if (!(await permissionedToken.hasRole(MINTER_ROLE, addresses.timelock))) {
    await permissionedToken.grantRole(MINTER_ROLE, addresses.timelock);
    console.log('   ✅ Granted MINTER_ROLE to Timelock');
  }
  
  if (!(await permissionedToken.hasRole(BURNER_ROLE, addresses.timelock))) {
    await permissionedToken.grantRole(BURNER_ROLE, addresses.timelock);
    console.log('   ✅ Granted BURNER_ROLE to Timelock');
  }
  
  if (!(await permissionedToken.hasRole(PAUSER_ROLE, addresses.timelock))) {
    await permissionedToken.grantRole(PAUSER_ROLE, addresses.timelock);
    console.log('   ✅ Granted PAUSER_ROLE to Timelock');
  }

  // Grant roles to Multisig
  if (multisigAddress !== deployer.address) {
    if (!(await permissionedToken.hasRole(ADMIN_ROLE, multisigAddress))) {
      await permissionedToken.grantRole(ADMIN_ROLE, multisigAddress);
      console.log('   ✅ Granted ADMIN_ROLE to Multisig');
    }
  }

  console.log('\n2️⃣  Configuring SPVRegistry...');
  // Transfer ownership to Timelock
  const spvOwner = await spvRegistry.owner();
  if (spvOwner !== addresses.timelock) {
    await spvRegistry.transferOwnership(addresses.timelock);
    console.log('   ✅ Transferred ownership to Timelock');
  } else {
    console.log('   ℹ️  Already owned by Timelock');
  }

  console.log('\n3️⃣  Configuring Vault...');
  // Grant roles to Timelock
  const vaultAdminRole = await vault.DEFAULT_ADMIN_ROLE();
  if (!(await vault.hasRole(vaultAdminRole, addresses.timelock))) {
    await vault.grantRole(vaultAdminRole, addresses.timelock);
    console.log('   ✅ Granted admin role to Timelock');
  }

  console.log('\n4️⃣  Configuring LendingPool...');
  const poolOwner = await lendingPool.owner();
  if (poolOwner !== addresses.timelock) {
    await lendingPool.transferOwnership(addresses.timelock);
    console.log('   ✅ Transferred ownership to Timelock');
  } else {
    console.log('   ℹ️  Already owned by Timelock');
  }

  console.log('\n5️⃣  Configuring PermissionedAMM...');
  const ammOwner = await permissionedAMM.owner();
  if (ammOwner !== addresses.timelock) {
    await permissionedAMM.transferOwnership(addresses.timelock);
    console.log('   ✅ Transferred ownership to Timelock');
  } else {
    console.log('   ℹ️  Already owned by Timelock');
  }

  console.log('\n6️⃣  Configuring TrancheFactory...');
  const factoryOwner = await trancheFactory.owner();
  if (factoryOwner !== addresses.timelock) {
    await trancheFactory.transferOwnership(addresses.timelock);
    console.log('   ✅ Transferred ownership to Timelock');
  } else {
    console.log('   ℹ️  Already owned by Timelock');
  }

  console.log('\n7️⃣  Configuring OracleAggregator...');
  const oracleOwner = await oracleAggregator.owner();
  if (oracleOwner !== addresses.timelock) {
    await oracleAggregator.transferOwnership(addresses.timelock);
    console.log('   ✅ Transferred ownership to Timelock');
  } else {
    console.log('   ℹ️  Already owned by Timelock');
  }

  console.log('\n8️⃣  Configuring DocumentRegistry...');
  const registryOwner = await documentRegistry.owner();
  if (registryOwner !== addresses.timelock) {
    await documentRegistry.transferOwnership(addresses.timelock);
    console.log('   ✅ Transferred ownership to Timelock');
  } else {
    console.log('   ℹ️  Already owned by Timelock');
  }

  // Revoke deployer roles (optional, for production)
  if (multisigAddress !== deployer.address && process.env.REVOKE_DEPLOYER_ROLES === 'true') {
    console.log('\n9️⃣  Revoking deployer roles...');
    
    if (await permissionedToken.hasRole(ADMIN_ROLE, deployer.address)) {
      await permissionedToken.revokeRole(ADMIN_ROLE, deployer.address);
      console.log('   ✅ Revoked deployer ADMIN_ROLE');
    }
    
    if (await permissionedToken.hasRole(MINTER_ROLE, deployer.address)) {
      await permissionedToken.revokeRole(MINTER_ROLE, deployer.address);
      console.log('   ✅ Revoked deployer MINTER_ROLE');
    }
    
    if (await permissionedToken.hasRole(BURNER_ROLE, deployer.address)) {
      await permissionedToken.revokeRole(BURNER_ROLE, deployer.address);
      console.log('   ✅ Revoked deployer BURNER_ROLE');
    }
  }

  console.log('\n✨ Post-deployment configuration complete!\n');
  console.log('📋 Summary:');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('Timelock:', addresses.timelock);
  console.log('Multisig:', multisigAddress);
  console.log('All contracts configured with proper access control');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  console.log('⚠️  IMPORTANT NEXT STEPS:');
  console.log('1. Verify all role assignments');
  console.log('2. Test Timelock operations');
  console.log('3. Configure multisig signers');
  console.log('4. Document all addresses and roles');
  console.log('5. Set up monitoring and alerts\n');
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
