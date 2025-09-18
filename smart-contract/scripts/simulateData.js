const { ethers } = require("hardhat");
require("dotenv").config();

// PENTING: Ganti dengan ALAMAT KONTRAK BARU dari Langkah 2
const CONTRACT_ADDRESS = "0x60aC7E3E0e7D498fCa1d7F526BB21F90d1E43D5F"; // 👈 GANTI INI

async function main() {
    const provider = new ethers.JsonRpcProvider("https://rpc-nebulas-testnet.u2u.xyz/");
    const wallet = new ethers.Wallet(process.env.U2U_PRIVATE_KEY, provider);
    
    const AuracleArtifact = require("../artifacts/contracts/Auracle.sol/Auracle.json");
    const contract = new ethers.Contract(CONTRACT_ADDRESS, AuracleArtifact.abi, wallet);

    console.log(`Connected to contract at ${CONTRACT_ADDRESS}`);
    console.log(`Simulator is running using wallet: ${wallet.address}`);

    const mySensors = await contract.getSensorsByOwner(wallet.address);
    if (mySensors.length === 0) {
        console.error("This wallet has no registered sensors. Please register a sensor first using the DApp.");
        return;
    }

    const sensorIdToSimulate = mySensors[0];
    console.log(`Will simulate data for Sensor ID: ${Number(sensorIdToSimulate)}`);

    setInterval(async () => {
        const randomPm25 = Math.floor(Math.random() * 45) + 5;
        try {
            console.log(`Submitting PM2.5 value: ${randomPm25} for Sensor ID: ${Number(sensorIdToSimulate)}...`);
            const tx = await contract.submitData(sensorIdToSimulate, randomPm25);
            await tx.wait();
            console.log(" -> Data submitted successfully!");
        } catch (error) {
            console.error("Error submitting data:", error.message);
        }

    }, 15000);
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
