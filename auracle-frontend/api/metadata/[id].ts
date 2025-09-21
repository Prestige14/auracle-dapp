// File: /api/metadata/[id].ts

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { ethers } from 'ethers';
import { AURACLE_CONTRACT_ABI, AURACLE_CONTRACT_ADDRESS } from '../../src/contract/index.js';

const RPC_URL = "https://rpc-nebulas-testnet.u2u.xyz/";

// Gunakan tipe data dari @vercel/node untuk req dan res
export default async function handler(req: VercelRequest, res: VercelResponse) {
    try {
        // 1. Dapatkan ID dari URL (misal: /api/metadata/0 -> id = '0')
        const { id } = req.query;

        if (typeof id !== 'string') {
            return res.status(400).json({ error: "Token ID is missing or invalid." });
        }

        // 2. Hubungkan ke blockchain
        const provider = new ethers.JsonRpcProvider(RPC_URL);
        const contract = new ethers.Contract(AURACLE_CONTRACT_ADDRESS, AURACLE_CONTRACT_ABI, provider);

        // 3. Panggil fungsi dari smart contract
        // Pastikan token ada dengan memeriksa owner-nya. ownerOf akan error jika token tidak ada.
        const owner = await contract.ownerOf(id);
        const data = await contract.sensorData(id);

        // 4. Buat objek metadata sesuai standar
        const metadata = {
            name: `Auracle Sensor #${id}`,
            description: "A dynamic NFT representing a real-world air quality sensor in the Auracle network.",
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
                    "value": Number(data.reputationScore),
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
                    "value": Number(data.lastUpdated)
                }
            ]
        };

        // 5. Kirim metadata sebagai response JSON
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate');
        res.status(200).json(metadata);

    } catch (error: any) {
        console.error(`Error fetching metadata for token ${req.query.id}:`, error);
        // Jika error karena token tidak ditemukan, kirim 404
        if (error.code === 'CALL_EXCEPTION') {
             return res.status(404).json({ error: "Token not found" });
        }
        res.status(500).json({ error: "Internal Server Error" });
    }
}