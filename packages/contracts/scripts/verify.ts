import { run } from "hardhat";
import * as fs from "fs";
import * as path from "path";

async function main() {
  console.log("🔍 Starting contract verification...\n");

  // Read latest deployment
  const deploymentsDir = path.join(__dirname, "../deployments");
  const files = fs.readdirSync(deploymentsDir);
  const latestFile = files.sort().reverse()[0];
  
  if (!latestFile) {
    console.error("❌ No deployment file found!");
    process.exit(1);
  }

  const deploymentInfo = JSON.parse(
    fs.readFileSync(path.join(deploymentsDir, latestFile), "utf-8")
  );

  console.log(`📄 Using deployment: ${latestFile}`);
  console.log(`🌐 Network: ${deploymentInfo.network}`);
  console.log("");

  const contracts = deploymentInfo.contracts;

  // Verify each contract
  for (const [name, address] of Object.entries(contracts)) {
    console.log(`🔍 Verifying ${name} at ${address}...`);
    
    try {
      await run("verify:verify", {
        address: address,
        constructorArguments: [],
      });
      console.log(`✅ ${name} verified successfully`);
    } catch (error: any) {
      if (error.message.includes("Already Verified")) {
        console.log(`✅ ${name} already verified`);
      } else {
        console.error(`❌ Error verifying ${name}:`, error.message);
      }
    }
    console.log("");
  }

  console.log("🎉 Verification complete!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
