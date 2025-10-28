import { ethers } from 'hardhat';
import { readFileSync } from 'fs';
import { join } from 'path';

/**
 * Verify deployment script
 * This script verifies that all contracts are deployed correctly
 */

async function main() {
  console.log('🔍 Verifying deployment...\n');

  const network = await ethers.provider.getNetwork();
  const deploymentPath = join(__dirname, '../deployments', `${network.name}.json`);
  
  let deploymentInfo;
  try {
    deploymentInfo = JSON.parse(readFileSync(deploymentPath, 'utf-8'));
  } catch (error) {
    console.error('❌ Deployment file not found:', deploymentPath);
    process.exit(1);
  }

  const { addresses } = deploymentInfo;
  let allValid = true;

  // Verify each contract
  console.log('📋 Verifying contracts...\n');

  // 1. Verify Timelock
  try {
    const timelock = await ethers.getContractAt('Timelock', addresses.timelock);
    const minDelay = await timelock.getMinDelay();
    console.log(`✅ Timelock: ${addresses.timelock}`);
    console.log(`   Min Delay: ${minDelay} seconds (${Number(minDelay) / 86400} days)`);
  } catch (error) {
    console.log(`❌ Timelock verification failed: ${addresses.timelock}`);
    allValid = false;
  }

  // 2. Verify SPVRegistry
  try {
    const spvRegistry = await ethers.getContractAt('SPVRegistry', addresses.spvRegistry);
    const spvCount = await spvRegistry.spvCount();
    console.log(`✅ SPVRegistry: ${addresses.spvRegistry}`);
    console.log(`   SPV Count: ${spvCount}`);
  } catch (error) {
    console.log(`❌ SPVRegistry verification failed: ${addresses.spvRegistry}`);
    allValid = false;
  }

  // 3. Verify PermissionedToken
  try {
    const token = await ethers.getContractAt('PermissionedToken', addresses.permissionedToken);
    const name = await token.name();
    const symbol = await token.symbol();
    const totalSupply = await token.totalSupply();
    console.log(`✅ PermissionedToken: ${addresses.permissionedToken}`);
    console.log(`   Name: ${name}`);
    console.log(`   Symbol: ${symbol}`);
    console.log(`   Total Supply: ${ethers.formatEther(totalSupply)}`);
  } catch (error) {
    console.log(`❌ PermissionedToken verification failed: ${addresses.permissionedToken}`);
    allValid = false;
  }

  // 4. Verify OracleAggregator
  try {
    const oracle = await ethers.getContractAt('OracleAggregator', addresses.oracleAggregator);
    console.log(`✅ OracleAggregator: ${addresses.oracleAggregator}`);
  } catch (error) {
    console.log(`❌ OracleAggregator verification failed: ${addresses.oracleAggregator}`);
    allValid = false;
  }

  // 5. Verify Vault
  try {
    const vault = await ethers.getContractAt('Vault', addresses.vault);
    const asset = await vault.asset();
    const name = await vault.name();
    const symbol = await vault.symbol();
    console.log(`✅ Vault: ${addresses.vault}`);
    console.log(`   Name: ${name}`);
    console.log(`   Symbol: ${symbol}`);
    console.log(`   Asset: ${asset}`);
  } catch (error) {
    console.log(`❌ Vault verification failed: ${addresses.vault}`);
    allValid = false;
  }

  // 6. Verify TrancheFactory
  try {
    const factory = await ethers.getContractAt('TrancheFactory', addresses.trancheFactory);
    console.log(`✅ TrancheFactory: ${addresses.trancheFactory}`);
  } catch (error) {
    console.log(`❌ TrancheFactory verification failed: ${addresses.trancheFactory}`);
    allValid = false;
  }

  // 7. Verify PermissionedAMM
  try {
    const amm = await ethers.getContractAt('PermissionedAMM', addresses.permissionedAMM);
    const token0 = await amm.token0();
    const token1 = await amm.token1();
    console.log(`✅ PermissionedAMM: ${addresses.permissionedAMM}`);
    console.log(`   Token0: ${token0}`);
    console.log(`   Token1: ${token1}`);
  } catch (error) {
    console.log(`❌ PermissionedAMM verification failed: ${addresses.permissionedAMM}`);
    allValid = false;
  }

  // 8. Verify LendingPool
  try {
    const pool = await ethers.getContractAt('LendingPool', addresses.lendingPool);
    const oracle = await pool.oracle();
    console.log(`✅ LendingPool: ${addresses.lendingPool}`);
    console.log(`   Oracle: ${oracle}`);
  } catch (error) {
    console.log(`❌ LendingPool verification failed: ${addresses.lendingPool}`);
    allValid = false;
  }

  // 9. Verify DocumentRegistry
  try {
    const registry = await ethers.getContractAt('DocumentRegistry', addresses.documentRegistry);
    console.log(`✅ DocumentRegistry: ${addresses.documentRegistry}`);
  } catch (error) {
    console.log(`❌ DocumentRegistry verification failed: ${addresses.documentRegistry}`);
    allValid = false;
  }

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  if (allValid) {
    console.log('✅ All contracts verified successfully!');
  } else {
    console.log('❌ Some contracts failed verification');
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
