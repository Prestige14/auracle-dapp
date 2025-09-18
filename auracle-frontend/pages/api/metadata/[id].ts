// pages/api/metadata/[id].js

import { ethers } from 'ethers';

// Impor ABI dan Alamat Kontrak Anda.
// Pastikan path-nya sesuai dengan struktur proyek Anda.
import { AURACLE_CONTRACT_ABI, AURACLE_CONTRACT_ADDRESS } from '../../../src/contract'; 

// URL RPC untuk koneksi read-only
const RPC_URL = "https://rpc-nebulas-testnet.u2u.xyz/";

export default async function handler(req, res) {
    try {
        // 1. Dapatkan ID token dari URL (misal: /api/metadata/0 -> id = '0')
        const { id } = req.query;

        // 2. Hubungkan ke blockchain U2U
        const provider = new ethers.JsonRpcProvider(RPC_URL);
        const contract = new ethers.Contract(AURACLE_CONTRACT_ADDRESS, AURACLE_CONTRACT_ABI, provider);

        // 3. Panggil fungsi 'sensorData' dari smart contract untuk mendapatkan data on-chain
        const data = await contract.sensorData(id);
        const owner = await contract.ownerOf(id); // Dapatkan alamat pemilik

        // Pastikan data ada sebelum melanjutkan
        if (!owner) {
            return res.status(404).json({ error: "Token not found" });
        }
        
        // 4. Buat objek metadata sesuai standar OpenSea
        const metadata = {
            name: `Auracle Sensor #${id}`,
            description: "A dynamic NFT representing a real-world air quality sensor in the Auracle network.",
            // Anda bisa membuat gambar dinamis (misal: dengan SVG) atau gunakan gambar statis
            image: "https://i.imgur.com/your-default-image.png", // Ganti dengan URL gambar Anda
            owner: owner,
            attributes: [
                {
                    "trait_type": "Latitude",
                    "value": data.latitude
                },
                {
                    "trait_type": "Longitude",
                    "value": data.longitude
                },
                {
                    "trait_type": "Reputation",
                    "value": Number(data.reputationScore), // Konversi BigInt ke Number
                    "max_value": 100
                },
                {
                    "trait_type": "Uptime Score",
                    "value": Number(data.uptimeScore),
                    "max_value": 100
                },
                {
                    "display_type": "number",
                    "trait_type": "Last PM2.5 Value",
                    "value": Number(data.lastPm25Value)
                },
                {
                    "display_type": "date",
                    "trait_type": "Last Updated",
                    "value": Number(data.lastUpdated) // Waktu dalam format UNIX timestamp
                }
            ]
        };

        // 5. Kirim metadata sebagai response JSON
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate'); // Cache selama 60 detik
        res.status(200).json(metadata);

    } catch (error) {
        console.error(`Error fetching metadata for token ${req.query.id}:`, error);
        res.status(500).json({ error: "Internal Server Error" });
    }
}