// scripts/deployAuracle.ts
import hre from "hardhat";

async function main() {
  const contract_name = "Auracle";

  console.log(`Deploying ${contract_name}...`);

  // Gunakan hre.viem untuk mengakses viem client
  const auracle = await hre.viem.deployContract(contract_name);

  console.log(`${contract_name} deployed to: ${auracle.address}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});