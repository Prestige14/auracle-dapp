import { ethers } from "ethers";
import dotenv from "dotenv";
import fs from "fs";

dotenv.config();

// <<< PENTING: Ganti dengan ALAMAT KONTRAK BARU Anda setelah deploy ulang
const CONTRACT_ADDRESS = "0x5b640Ed4C86da0113e649ea86b1bdE01e52ABfe8";

// Helper function untuk jeda
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function main() {
  if (CONTRACT_ADDRESS === "0x5b640Ed4C86da0113e649ea86b1bdE01e52ABfe8") {
    console.error("❌ Kesalahan: Harap ganti 'CONTRACT_ADDRESS' di dalam skrip simulateData.js dengan alamat kontrak Anda yang sudah di-deploy.");
    return;
  }

  const artifact = JSON.parse(
    fs.readFileSync("./artifacts/contracts/Auracle.sol/Auracle.json", "utf8")
  );

  const provider = new ethers.JsonRpcProvider("https://rpc-nebulas-testnet.u2u.xyz/");
  const wallet = new ethers.Wallet(process.env.U2U_PRIVATE_KEY, provider);
  const contract = new ethers.Contract(CONTRACT_ADDRESS, artifact.abi, wallet);

  console.log(`✅ Terhubung ke kontrak di ${CONTRACT_ADDRESS}`);
  console.log(`🔑 Menggunakan wallet: ${wallet.address}\n`);

  // --- Mencari semua sensor milik wallet ---
  console.log("🔍 Mencari sensor yang dimiliki oleh wallet...");
  const supply = await contract.totalSupply();
  let mySensors = [];
  for (let i = 0; i < supply; i++) {
    try {
      const owner = await contract.ownerOf(i);
      if (owner.toLowerCase() === wallet.address.toLowerCase()) {
        mySensors.push(i);
      }
    } catch (err) {
      // Abaikan token yang tidak ada (jika ada yang di-burn)
    }
  }

  if (mySensors.length === 0) {
    console.error("⚠️ Wallet ini tidak memiliki sensor terdaftar. Silakan daftarkan setidaknya 2-3 sensor di lokasi berdekatan menggunakan DApp.");
    return;
  }

  console.log(`👍 Ditemukan ${mySensors.length} sensor: [${mySensors.join(', ')}]\n`);
  
  // --- Logika Simulasi Cerdas ---
  console.log("🚀 Memulai simulasi data cerdas...\n" + "-".repeat(40));

  // Kita akan membuat sensor terakhir menjadi anomali jika ada lebih dari satu sensor
  const anomalousSensorId = mySensors.length > 1 ? mySensors[mySensors.length - 1] : -1;
  if (anomalousSensorId !== -1) {
      console.log(`❗️ Sensor ID ${anomalousSensorId} akan mengirim data anomali.`);
  }

  // Loop utama simulasi
  setInterval(async () => {
    // Tentukan nilai PM2.5 dasar untuk iterasi ini, agar data konsisten
    const basePm25 = Math.floor(Math.random() * 30) + 10; // Nilai dasar antara 10-40
    console.log(`\n\n--- Tick Baru | Nilai PM2.5 Dasar: ${basePm25} ---\n`);

    for (const sensorId of mySensors) {
      try {
        // 1. Ambil data reputasi saat ini
        const sensorDataBefore = await contract.sensorData(sensorId);
        const reputationBefore = Number(sensorDataBefore.reputationScore);
        
        let pm25ToSubmit;

        // 2. Tentukan nilai PM2.5 yang akan dikirim
        if (sensorId === anomalousSensorId) {
          // Sensor ini mengirim data anomali
          pm25ToSubmit = basePm25 + 50; // Jauh di luar toleransi
          console.log(`📡 Mengirim data ANOMALI untuk Sensor ID: ${sensorId}`);
        } else {
          // Sensor ini mengirim data normal/konsisten
          const variation = Math.floor(Math.random() * 7) - 3; // Variasi kecil (-3 s/d +3)
          pm25ToSubmit = basePm25 + variation;
          console.log(`📡 Mengirim data KONSISTEN untuk Sensor ID: ${sensorId}`);
        }
        
        console.log(`   Reputasi Saat Ini: ${reputationBefore}, Mengirim Nilai PM2.5: ${pm25ToSubmit}`);

        // 3. Kirim transaksi
        const tx = await contract.submitData(sensorId, pm25ToSubmit);
        await tx.wait();

        // 4. Ambil dan tampilkan data reputasi baru
        const sensorDataAfter = await contract.sensorData(sensorId);
        const reputationAfter = Number(sensorDataAfter.reputationScore);

        if(reputationAfter > reputationBefore) {
            console.log(`   ✅ Berhasil! Reputasi NAIK menjadi: ${reputationAfter} (+${reputationAfter - reputationBefore})\n`);
        } else if (reputationAfter < reputationBefore) {
            console.log(`   ✅ Berhasil! Reputasi TURUN menjadi: ${reputationAfter} (${reputationAfter - reputationBefore})\n`);
        } else {
            console.log(`   ✅ Berhasil! Reputasi TETAP: ${reputationAfter}\n`);
        }
        
        // Beri jeda 1 detik antar transaksi untuk menghindari masalah nonce
        await sleep(1000);

      } catch (error) {
        console.error(`❌ Gagal mengirim data untuk Sensor ID ${sensorId}:`, error.message);
      }
    }
  }, 30000); // Jalankan seluruh siklus setiap 30 detik
}

main().catch((err) => {
  console.error("❌ Fatal error:", err);
  process.exit(1);
});