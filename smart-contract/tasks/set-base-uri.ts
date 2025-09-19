import { task } from "hardhat/config";
import { HardhatRuntimeEnvironment } from "hardhat/types";

const CONTRACT_ADDRESS = "0xEd08fbd0C19cF2e1828C1353137727E8688386a8";

task("set-base-uri", "Sets the base URI for the Auracle contract")
  .setAction(async (taskArgs: {}, hre: HardhatRuntimeEnvironment) => {
    const { viem, artifacts } = hre;

    console.log("Getting Viem clients...");
    const [walletClient] = await viem.getWalletClients();
    const publicClient = await viem.getPublicClient();

    const auracleArtifact = await artifacts.readArtifact("Auracle");

    console.log(`Working with contract at address: ${CONTRACT_ADDRESS}`);

    const baseURI = "https://auracle-dapp.vercel.app/api/metadata/";

    console.log(`Setting base URI to: ${baseURI}`);

    const hash = await walletClient.writeContract({
      address: CONTRACT_ADDRESS,
      abi: auracleArtifact.abi,
      functionName: 'setBaseURI',
      args: [baseURI],
      account: walletClient.account
    });

    console.log(`Transaction sent with hash: ${hash}`);
    console.log("Waiting for transaction to be mined...");

    const receipt = await publicClient.waitForTransactionReceipt({ hash });

    if (receipt.status === 'success') {
      console.log("\n✅ Base URI has been set successfully!");
    } else {
      console.error("\n❌ Transaction failed!");
      console.error("Receipt:", receipt);
    }
  });
