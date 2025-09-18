import { useState, useEffect, useCallback, useRef } from 'react';
import { ethers } from 'ethers';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from 'react-leaflet';
import './App.css';
import { AURACLE_CONTRACT_ABI, AURACLE_CONTRACT_ADDRESS } from './contract';

// <<< PERUBAHAN 1: Tambahkan URL WebSocket (WSS) untuk event real-time
const TARGET_NETWORK = {
    chainId: "0x9b4",
    chainName: "U2U Network Nebulas",
    nativeCurrency: { name: "U2U", symbol: "U2U", decimals: 18 },
    rpcUrls: ["https://rpc-nebulas-testnet.u2u.xyz/"],
    wsUrls: ["wss://ws-nebulas-testnet.u2u.xyz/"], // Tambahkan URL WSS
    blockExplorerUrls: ["https://testnet.u2uscan.xyz"],
};

interface Sensor {
    id: number;
    owner: string;
    latitude: string;
    longitude: string;
    lastPm25Value: number;
    lastUpdated: number;
}

function MapClickHandler({ onClick }: { onClick: (e: any) => void }) {
    useMapEvents({ click: onClick });
    return null;
}

function App() {
    const [account, setAccount] = useState<string | null>(null);
    const [sensors, setSensors] = useState<Sensor[]>([]);
    const [isRegistering, setIsRegistering] = useState<boolean>(false);
    
    const providerRef = useRef<ethers.BrowserProvider | null>(null);
    // Ref ini sekarang akan diinisialisasi dengan WebSocketProvider
    const readOnlyContractRef = useRef<ethers.Contract | null>(null);

    // useEffect utama untuk inisialisasi provider dan koneksi wallet
    useEffect(() => {
        // <<< PERUBAHAN 2: Gunakan WebSocketProvider untuk koneksi yang persisten
        // Ini adalah kunci utama untuk mendapatkan event secara instan.
        const wsProvider = new ethers.WebSocketProvider(TARGET_NETWORK.wsUrls[0]);
        readOnlyContractRef.current = new ethers.Contract(AURACLE_CONTRACT_ADDRESS, AURACLE_CONTRACT_ABI, wsProvider);

        // Fungsi untuk mengambil data awal saat load
        const fetchInitialSensors = async () => {
            if (!readOnlyContractRef.current) return;
            console.log("Fetching initial sensor data...");
            try {
                const sensorData = await readOnlyContractRef.current.getAllSensors();
                const formattedSensors = sensorData.map((s: any) => ({
                    id: Number(s.id),
                    owner: s.owner,
                    latitude: s.latitude,
                    longitude: s.longitude,
                    lastPm25Value: Number(s.lastPm25Value),
                    lastUpdated: Number(s.lastUpdated)
                }));
                setSensors(formattedSensors);
                console.log("Sensor data successfully fetched.");
            } catch (error) {
                console.error("Gagal mengambil data sensor awal:", error);
            }
        };

        fetchInitialSensors();

        // Inisialisasi provider wallet (MetaMask)
        if (window.ethereum) {
            providerRef.current = new ethers.BrowserProvider(window.ethereum);
            
            providerRef.current.send("eth_accounts", []).then((accounts) => {
                if (accounts.length > 0) setAccount(accounts[0]);
            }).catch(err => console.error("Could not get accounts:", err));

            window.ethereum.on('accountsChanged', (accounts: string[]) => {
                setAccount(accounts.length > 0 ? accounts[0] : null);
            });
            window.ethereum.on('chainChanged', () => window.location.reload());
        }
    }, []);

    // <<< PERUBAHAN 3: useEffect terpisah khusus untuk menangani event listener
    // Ini adalah pola yang lebih bersih dan aman di React.
    useEffect(() => {
        const contract = readOnlyContractRef.current;
        if (!contract) return;

        console.log("Setting up event listener...");

        const handleDataSubmitted = (sensorId: bigint, pm25Value: bigint) => {
            const id = Number(sensorId);
            const value = Number(pm25Value);
            console.log(`✅ Event received! Sensor ID: ${id}, New PM2.5: ${value}`);
            
            // Gunakan functional update untuk memastikan state selalu yang terbaru
            setSensors(currentSensors =>
                currentSensors.map(sensor =>
                    sensor.id === id ? { ...sensor, lastPm25Value: value, lastUpdated: Date.now() / 1000 } : sensor
                )
            );
        };

        contract.on("DataSubmitted", handleDataSubmitted);

        // Fungsi cleanup: listener akan dihapus saat komponen dibongkar (unmount)
        // Ini sangat penting untuk mencegah memory leak dan listener duplikat
        return () => {
            console.log("Removing event listener...");
            contract.off("DataSubmitted", handleDataSubmitted);
        };
    }, []); // Dependency array kosong `[]` memastikan efek ini hanya berjalan sekali

    const connectWallet = async () => {
        if (!providerRef.current) {
            alert("MetaMask tidak ditemukan. Harap install MetaMask.");
            return;
        }
        try {
            const accounts = await providerRef.current.send("eth_requestAccounts", []);
            setAccount(accounts[0]);
        } catch (error) {
            console.error("Gagal menghubungkan wallet:", error);
        }
    };
    
    const handleMapClick = async (e: any) => {
        if (!isRegistering || !providerRef.current || !account) return;
        const { lat, lng } = e.latlng;
        try {
            const signer = await providerRef.current.getSigner();
            const contractWithSigner = new ethers.Contract(AURACLE_CONTRACT_ADDRESS, AURACLE_CONTRACT_ABI, signer);
            const tx = await contractWithSigner.registerSensor(lat.toString(), lng.toString());
            
            alert("Transaksi pendaftaran dikirim... Mohon tunggu konfirmasi.");
            await tx.wait();
            alert("Sensor berhasil didaftarkan!");
            // Refresh data setelah berhasil daftar
            const freshData = await readOnlyContractRef.current!.getAllSensors();
            const formattedSensors = freshData.map((s: any) => ({
                 id: Number(s.id), owner: s.owner, latitude: s.latitude, longitude: s.longitude,
                 lastPm25Value: Number(s.lastPm25Value), lastUpdated: Number(s.lastUpdated)
            }));
            setSensors(formattedSensors);
        } catch (error) {
            console.error("Gagal mendaftarkan sensor:", error);
            alert("Terjadi kesalahan saat pendaftaran. Cek konsol untuk detail.");
        } finally {
            setIsRegistering(false);
        }
    };

    // ... sisa JSX tidak berubah ...
    return (
        <div className="app-container">
            <header className="header">
                <div className="logo">Auracle 🗺️</div>
                <button onClick={connectWallet} className="connect-button" disabled={!!account}>
                    {account ? `${account.substring(0, 6)}...${account.substring(account.length - 4)}` : "Hubungkan Wallet"}
                </button>
            </header>
            <main className="main-content">
                <div className="dashboard">
                    <h2>Dasbor Sensor</h2>
                    <button
                        onClick={() => setIsRegistering(true)}
                        disabled={!account || isRegistering}
                        title={!account ? "Hubungkan wallet Anda untuk mendaftar" : ""}
                    >
                        + Daftarkan Sensor Baru
                    </button>
                    {isRegistering && (
                        <div className="instruction-box">
                            <p>Klik pada peta untuk menempatkan sensor baru Anda.</p>
                            <button onClick={() => setIsRegistering(false)} className="cancel-button">Batal</button>
                        </div>
                    )}
                </div>
                <div className="map-area">
                    <MapContainer center={[-6.2088, 106.8456]} zoom={11} scrollWheelZoom={true} style={{ height: "100%", width: "100%" }}>
                        <MapClickHandler onClick={handleMapClick} />
                        <TileLayer
                            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                        />
                        {sensors.map(sensor => (
                            <Marker key={sensor.id} position={[parseFloat(sensor.latitude), parseFloat(sensor.longitude)]}>
                                <Popup>
                                    <b>Sensor ID: {sensor.id}</b><br/>
                                    PM2.5: {sensor.lastPm25Value}<br/>
                                    Pemilik: {`${sensor.owner.substring(0, 6)}...`}
                                </Popup>
                            </Marker>
                        ))}
                    </MapContainer>
                </div>
            </main>
        </div>
    );
}

export default App;