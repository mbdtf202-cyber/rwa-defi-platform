import { ethers, upgrades } from "hardhat";

async function main() {
  console.log("🚀 Starting deployment...\n");

  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with account:", deployer.address);
  console.log("Account balance:", (await ethers.provider.getBalance(deployer.address)).toString());
  console.log("");

  // Deploy PermissionedToken
  console.log("📝 Deploying PermissionedToken...");
  const PermissionedToken = await ethers.getContractFactory("PermissionedToken");
  const token = await upgrades.deployProxy(PermissionedToken, [
    "RWA Property Token",
    "RWAP",
    1,
    deployer.address
  ]);
  await token.waitForDeployment();
  const tokenAddress = await token.getAddress();
  console.log("✅ PermissionedToken deployed to:", tokenAddress);
  console.log("");

  // Deploy TrancheFactory
  console.log("📝 Deploying TrancheFactory...");
  const TrancheFactory = await ethers.getContractFactory("TrancheFactory");
  const trancheFactory = await upgrades.deployProxy(TrancheFactory, [deployer.address]);
  await trancheFactory.waitForDeployment();
  const trancheFactoryAddress = await trancheFactory.getAddress();
  console.log("✅ TrancheFactory deployed to:", trancheFactoryAddress);
  console.log("");

  // Deploy Vault
  console.log("📝 Deploying Vault...");
  const Vault = await ethers.getContractFactory("Vault");
  const vault = await upgrades.deployProxy(Vault, [
    tokenAddress,
    deployer.address,
    "RWA Vault",
    "vRWA"
  ]);
  await vault.waitForDeployment();
  const vaultAddress = await vault.getAddress();
  console.log("✅ Vault deployed to:", vaultAddress);
  console.log("");

  // Deploy PermissionedAMM
  console.log("📝 Deploying PermissionedAMM...");
  const PermissionedAMM = await ethers.getContractFactory("PermissionedAMM");
  const amm = await upgrades.deployProxy(PermissionedAMM, [
    tokenAddress,
    deployer.address
  ]);
  await amm.waitForDeployment();
  const ammAddress = await amm.getAddress();
  console.log("✅ PermissionedAMM deployed to:", ammAddress);
  console.log("");

  // Deploy LendingPool
  console.log("📝 Deploying LendingPool...");
  const LendingPool = await ethers.getContractFactory("LendingPool");
  const lendingPool = await upgrades.deployProxy(LendingPool, [
    tokenAddress,
    deployer.address
  ]);
  await lendingPool.waitForDeployment();
  const lendingPoolAddress = await lendingPool.getAddress();
  console.log("✅ LendingPool deployed to:", lendingPoolAddress);
  console.log("");

  // Deploy OracleAggregator
  console.log("📝 Deploying OracleAggregator...");
  const OracleAggregator = await ethers.getContractFactory("OracleAggregator");
  const oracle = await upgrades.deployProxy(OracleAggregator, [deployer.address]);
  await oracle.waitForDeployment();
  const oracleAddress = await oracle.getAddress();
  console.log("✅ OracleAggregator deployed to:", oracleAddress);
  console.log("");

  // Deploy SPVRegistry
  console.log("📝 Deploying SPVRegistry...");
  const SPVRegistry = await ethers.getContractFactory("SPVRegistry");
  const spvRegistry = await upgrades.deployProxy(SPVRegistry, [deployer.address]);
  await spvRegistry.waitForDeployment();
  const spvRegistryAddress = await spvRegistry.getAddress();
  console.log("✅ SPVRegistry deployed to:", spvRegistryAddress);
  console.log("");

  // Save deployment addresses
  const deploymentInfo = {
    network: (await ethers.provider.getNetwork()).name,
    chainId: (await ethers.provider.getNetwork()).chainId.toString(),
    deployer: deployer.address,
    timestamp: new Date().toISOString(),
    contracts: {
      PermissionedToken: tokenAddress,
      TrancheFactory: trancheFactoryAddress,
      Vault: vaultAddress,
      PermissionedAMM: ammAddress,
      LendingPool: lendingPoolAddress,
      OracleAggregator: oracleAddress,
      SPVRegistry: spvRegistryAddress
    }
  };

  console.log("📄 Deployment Summary:");
  console.log(JSON.stringify(deploymentInfo, null, 2));
  console.log("");

  // Save to file
  const fs = require("fs");
  const path = require("path");
  const deploymentsDir = path.join(__dirname, "../deployments");
  
  if (!fs.existsSync(deploymentsDir)) {
    fs.mkdirSync(deploymentsDir, { recursive: true });
  }

  const filename = `deployment-${Date.now()}.json`;
  fs.writeFileSync(
    path.join(deploymentsDir, filename),
    JSON.stringify(deploymentInfo, null, 2)
  );

  console.log(`✅ Deployment info saved to: deployments/${filename}`);
  console.log("");
  console.log("🎉 Deployment complete!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
