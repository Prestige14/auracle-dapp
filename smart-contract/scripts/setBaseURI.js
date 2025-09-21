// scripts/setBaseURI.js
import { ethers } from "ethers";
import dotenv from "dotenv";
import fs from "fs";

dotenv.config();

const CONTRACT_ADDRESS = "0x4367d2D2282fa8441649EC9B1c7e4810CBA1606c";

const artifactPath = "./artifacts/contracts/Auracle.sol/Auracle.json";

if (!fs.existsSync(artifactPath)) {
  console.error(`❌ ABI artifact not found at ${artifactPath}. Run 'npx hardhat compile' first.`);
  process.exit(1);
}

const artifact = JSON.parse(fs.readFileSync(artifactPath, "utf8"));

async function main() {
  // RPC yang sama seperti di script simulasi
  const provider = new ethers.JsonRpcProvider("https://rpc-nebulas-testnet.u2u.xyz/");
  if (!process.env.U2U_PRIVATE_KEY) {
    console.error("❌ U2U_PRIVATE_KEY belum diset di .env");
    process.exit(1);
  }
  const wallet = new ethers.Wallet(process.env.U2U_PRIVATE_KEY, provider);
  const contract = new ethers.Contract(CONTRACT_ADDRESS, artifact.abi, wallet);

  console.log(`✅ Connected to contract at ${CONTRACT_ADDRESS}`);
  console.log(`🔑 Using wallet: ${wallet.address}`);

  // optional: cek owner() agar tidak gagal karena onlyOwner
  try {
    const owner = await contract.owner();
    if (owner && owner.toLowerCase() !== wallet.address.toLowerCase()) {
      console.error(
        `❌ Wallet ini bukan owner kontrak. Owner kontrak = ${owner}. Hanya owner yang boleh panggil setBaseURI.`
      );
      process.exit(1);
    }
  } catch (err) {
    console.warn("⚠️ Tidak dapat memanggil owner() — lanjutkan (fungsi owner ada di OpenZeppelin Ownable).");
  }

  const baseURI = "https://auracle-dapp.vercel.app/api/metadata/";
  console.log("⚙️ Setting baseURI to:", baseURI);

  try {
    const tx = await contract.setBaseURI(baseURI);
    console.log("📤 Tx sent. Hash:", tx.hash ?? tx);
    const receipt = await tx.wait();
    console.log("⛓️ Transaction mined in block:", receipt.blockNumber ?? receipt.blockNumber);
    console.log("✅ Base URI has been set successfully!");
  } catch (err) {
    // tampilkan pesan error lengkap agar gampang debug
    console.error("❌ Error saat memanggil setBaseURI:", err);
    process.exit(1);
  }
}

main().catch((err) => {
  console.error("❌ Fatal error:", err);
  process.exit(1);
});
