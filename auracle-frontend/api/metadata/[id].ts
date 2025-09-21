// File: /api/metadata/[id].ts

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { ethers } from 'ethers';
// <<< PERUBAHAN 1: Impor modul 'fs' dan 'path' dari Node.js
import * as fs from 'fs';
import * as path from 'path';

// <<< PERUBAHAN 2: Sekarang kita hanya impor ALAMAT, bukan ABI
import { AURACLE_CONTRACT_ADDRESS } from '../../src/contract/index.js';

const RPC_URL = "https://rpc-nebulas-testnet.u2u.xyz/";

export default async function handler(req: VercelRequest, res: VercelResponse) {
    try {
        const { id } = req.query;
        if (typeof id !== 'string') {
            return res.status(400).json({ error: "Token ID is missing or invalid." });
        }

        // <<< PERUBAHAN 3: Baca dan parse file ABI secara manual
        // 1. Tentukan path ke file JSON
        const abiPath = path.join(process.cwd(), 'src', 'artifacts', 'Auracle.json');
        // 2. Baca file sebagai teks
        const abiFile = fs.readFileSync(abiPath, 'utf-8');
        // 3. Parse teks menjadi objek JSON dan ambil array 'abi'-nya
        const contractABI = JSON.parse(abiFile).abi;

        // Hubungkan ke blockchain menggunakan ABI yang sudah dibaca
        const provider = new ethers.JsonRpcProvider(RPC_URL);
        // Gunakan contractABI dari file yang dibaca, bukan dari import
        const contract = new ethers.Contract(AURACLE_CONTRACT_ADDRESS, contractABI, provider);

        // Sisa kode tidak berubah...
        const owner = await contract.ownerOf(id);
        const data = await contract.sensorData(id);

        const metadata = {
            name: `Auracle Sensor #${id}`,
            description: "A dynamic NFT representing a real-world air quality sensor in the Auracle network.",
            image: "https://i.imgur.com/your-default-image.png", // Ganti dengan URL gambar Anda
            owner: owner,
            attributes: [
                { "trait_type": "Latitude", "value": data.latitude },
                { "trait_type": "Longitude", "value": data.longitude },
                { "trait_type": "Reputation", "value": Number(data.reputationScore), "max_value": 100 },
                { "trait_type": "Uptime Score", "value": Number(data.uptimeScore), "max_value": 100 },
                { "display_type": "number", "trait_type": "Last PM2.5 Value", "value": Number(data.lastPm25Value) },
                { "display_type": "date", "trait_type": "Last Updated", "value": Number(data.lastUpdated) }
            ]
        };

        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate');
        res.status(200).json(metadata);

    } catch (error: any) {
        console.error(`Error fetching metadata for token ${req.query.id}:`, error);
        if (error.code === 'CALL_EXCEPTION') {
             return res.status(404).json({ error: "Token not found" });
        }
        res.status(500).json({ error: "Internal Server Error" });
    }
}