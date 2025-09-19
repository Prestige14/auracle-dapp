import hre from "hardhat";

const CONTRACT_ADDRESS = "0xEd08fbd0C19cF2e1828C1353137727E8688386a8";

async function main() {
  console.log("🚀 Start script with viem...");

  try {
    // Verify Viem is available
    if (!hre.viem) {
      throw new Error("Hardhat-Viem plugin is not initialized. Check your Hardhat config and plugin installation.");
    }

    // Get wallet client (signer)
    const walletClients = await hre.viem.getWalletClients();
    if (!walletClients || walletClients.length === 0) {
      throw new Error("No wallet clients available. Ensure U2U_PRIVATE_KEY is set in .env.");
    }
    const [deployer] = walletClients;
    console.log("Using deployer:", deployer.account.address);

    // Attach to contract
    const auracle = await hre.viem.getContractAt("Auracle", CONTRACT_ADDRESS);
    console.log("Attached to contract:", auracle.address);

    // Set base URI
    const baseURI = "https://auracle-dapp.vercel.app/api/metadata/";
    console.log("Setting base URI to:", baseURI);

    const txHash = await auracle.write.setBaseURI(baseURI); // Remove array brackets if setBaseURI expects a single string
    console.log("Transaction sent:", txHash);

    const receipt = await hre.viem.waitForTransactionReceipt({ hash: txHash });
    console.log("Transaction mined in block:", receipt.blockNumber);

    console.log("\n✅ Base URI has been set successfully!");
  } catch (error) {
    console.error("❌ Error:", error.message);
    process.exitCode = 1;
  }
}

main();