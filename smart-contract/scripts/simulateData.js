import { ethers } from "ethers";
import dotenv from "dotenv";
import fs from "fs";

dotenv.config();

const CONTRACT_ADDRESS = "0x4367d2D2282fa8441649EC9B1c7e4810CBA1606c";

const artifact = JSON.parse(
  fs.readFileSync("./artifacts/contracts/Auracle.sol/Auracle.json", "utf8")
);

async function main() {
  const provider = new ethers.JsonRpcProvider("https://rpc-nebulas-testnet.u2u.xyz/");
  const wallet = new ethers.Wallet(process.env.U2U_PRIVATE_KEY, provider);
  const contract = new ethers.Contract(CONTRACT_ADDRESS, artifact.abi, wallet);

  console.log(`✅ Connected to contract at ${CONTRACT_ADDRESS}`);
  console.log(`🔑 Using wallet: ${wallet.address}`);

  // Cari sensor milik wallet dengan scan totalSupply
  const supply = await contract.totalSupply();
  let mySensors = [];
  for (let i = 0; i < supply; i++) {
    try {
      const owner = await contract.ownerOf(i);
      if (owner.toLowerCase() === wallet.address.toLowerCase()) {
        mySensors.push(i);
      }
    } catch (err) {
      // kalau token belum pernah minted, abaikan
    }
  }

  if (mySensors.length === 0) {
    console.error("⚠️ Wallet belum punya sensor. Daftarkan sensor dulu lewat DApp.");
    return;
  }

  const sensorIdToSimulate = mySensors[0];
  console.log(`📡 Simulating data for Sensor ID: ${sensorIdToSimulate}`);

  setInterval(async () => {
    const randomPm25 = Math.floor(Math.random() * 45) + 5;
    try {
      console.log(`➡️ Submitting PM2.5 value: ${randomPm25} for Sensor ID: ${sensorIdToSimulate}...`);
      const tx = await contract.submitData(sensorIdToSimulate, randomPm25);
      await tx.wait();
      console.log("✅ Data submitted successfully!");
    } catch (error) {
      console.error("❌ Error submitting data:", error.message);
    }
  }, 15000);
}

main().catch((err) => {
  console.error("❌ Fatal error:", err);
  process.exit(1);
});
