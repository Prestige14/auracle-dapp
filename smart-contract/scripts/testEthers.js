import hre from "hardhat";

async function main() {
  console.log("hre.viem:", hre.viem);
  if (hre.viem) {
    console.log("✅ viem plugin aktif!");
  } else {
    console.log("❌ viem masih undefined");
  }
}

main();
