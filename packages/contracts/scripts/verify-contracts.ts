import { run } from 'hardhat';
import { readFileSync } from 'fs';
import { join } from 'path';

/**
 * Script to verify all deployed contracts on block explorer
 * Usage: npx hardhat run scripts/verify-contracts.ts --network <network>
 */

async function main() {
  const network = process.env.HARDHAT_NETWORK || 'localhost';
  console.log(`🔍 Verifying contracts on ${network}...\n`);

  // Load deployment addresses
  const deploymentPath = join(__dirname, '../deployments', `${network}.json`);
  let deployment;
  
  try {
    deployment = JSON.parse(readFileSync(deploymentPath, 'utf-8'));
  } catch (error) {
    console.error(`❌ Could not load deployment file: ${deploymentPath}`);
    console.error('Please deploy contracts first');
    process.exit(1);
  }

  const { addresses } = deployment;

  // Verify Timelock
  console.log('📝 Verifying Timelock...');
  try {
    await run('verify:verify', {
      address: addresses.timelock,
      constructorArguments: [
        2 * 24 * 60 * 60, // minDelay
        [deployment.deployer],
        [deployment.deployer],
        deployment.deployer,
      ],
    });
    console.log('✅ Timelock verified\n');
  } catch (error: any) {
    if (error.message.includes('Already Verified')) {
      console.log('✅ Timelock already verified\n');
    } else {
      console.error('❌ Error verifying Timelock:', error.message, '\n');
    }
  }

  // Verify SPVRegistry
  console.log('📝 Verifying SPVRegistry...');
  try {
    await run('verify:verify', {
      address: addresses.spvRegistry,
      constructorArguments: [],
    });
    console.log('✅ SPVRegistry verified\n');
  } catch (error: any) {
    if (error.message.includes('Already Verified')) {
      console.log('✅ SPVRegistry already verified\n');
    } else {
      console.error('❌ Error verifying SPVRegistry:', error.message, '\n');
    }
  }

  // Verify PermissionedToken
  console.log('📝 Verifying PermissionedToken...');
  try {
    await run('verify:verify', {
      address: addresses.permissionedToken,
      constructorArguments: ['RWA Property Token', 'RWAP', 1],
    });
    console.log('✅ PermissionedToken verified\n');
  } catch (error: any) {
    if (error.message.includes('Already Verified')) {
      console.log('✅ PermissionedToken already verified\n');
    } else {
      console.error('❌ Error verifying PermissionedToken:', error.message, '\n');
    }
  }

  // Verify OracleAggregator
  console.log('📝 Verifying OracleAggregator...');
  try {
    await run('verify:verify', {
      address: addresses.oracleAggregator,
      constructorArguments: [],
    });
    console.log('✅ OracleAggregator verified\n');
  } catch (error: any) {
    if (error.message.includes('Already Verified')) {
      console.log('✅ OracleAggregator already verified\n');
    } else {
      console.error('❌ Error verifying OracleAggregator:', error.message, '\n');
    }
  }

  // Verify Vault
  console.log('📝 Verifying Vault...');
  try {
    await run('verify:verify', {
      address: addresses.vault,
      constructorArguments: [addresses.permissionedToken, 'RWA Vault Token', 'vRWA'],
    });
    console.log('✅ Vault verified\n');
  } catch (error: any) {
    if (error.message.includes('Already Verified')) {
      console.log('✅ Vault already verified\n');
    } else {
      console.error('❌ Error verifying Vault:', error.message, '\n');
    }
  }

  // Verify TrancheFactory
  console.log('📝 Verifying TrancheFactory...');
  try {
    await run('verify:verify', {
      address: addresses.trancheFactory,
      constructorArguments: [],
    });
    console.log('✅ TrancheFactory verified\n');
  } catch (error: any) {
    if (error.message.includes('Already Verified')) {
      console.log('✅ TrancheFactory already verified\n');
    } else {
      console.error('❌ Error verifying TrancheFactory:', error.message, '\n');
    }
  }

  // Verify PermissionedAMM
  console.log('📝 Verifying PermissionedAMM...');
  try {
    await run('verify:verify', {
      address: addresses.permissionedAMM,
      constructorArguments: [
        addresses.permissionedToken,
        '0x0000000000000000000000000000000000000000',
      ],
    });
    console.log('✅ PermissionedAMM verified\n');
  } catch (error: any) {
    if (error.message.includes('Already Verified')) {
      console.log('✅ PermissionedAMM already verified\n');
    } else {
      console.error('❌ Error verifying PermissionedAMM:', error.message, '\n');
    }
  }

  // Verify LendingPool
  console.log('📝 Verifying LendingPool...');
  try {
    await run('verify:verify', {
      address: addresses.lendingPool,
      constructorArguments: [addresses.oracleAggregator],
    });
    console.log('✅ LendingPool verified\n');
  } catch (error: any) {
    if (error.message.includes('Already Verified')) {
      console.log('✅ LendingPool already verified\n');
    } else {
      console.error('❌ Error verifying LendingPool:', error.message, '\n');
    }
  }

  // Verify DocumentRegistry
  console.log('📝 Verifying DocumentRegistry...');
  try {
    await run('verify:verify', {
      address: addresses.documentRegistry,
      constructorArguments: [],
    });
    console.log('✅ DocumentRegistry verified\n');
  } catch (error: any) {
    if (error.message.includes('Already Verified')) {
      console.log('✅ DocumentRegistry already verified\n');
    } else {
      console.error('❌ Error verifying DocumentRegistry:', error.message, '\n');
    }
  }

  console.log('\n✨ Verification complete!\n');
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
