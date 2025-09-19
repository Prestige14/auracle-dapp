import { useState, useEffect, useRef } from 'react';
import { ethers } from 'ethers';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from 'react-leaflet';
import './App.css';
import { AURACLE_CONTRACT_ABI, AURACLE_CONTRACT_ADDRESS } from './contract';

const TARGET_NETWORK = {
    chainId: "0x9b4",
    chainName: "U2U Network Nebulas",
    nativeCurrency: { name: "U2U", symbol: "U2U", decimals: 18 },
    rpcUrls: ["https://rpc-nebulas-testnet.u2u.xyz/"],
    wsUrls: ["wss://ws-nebulas-testnet.u2u.xyz/"], // Menggunakan URL WSS Anda yang sudah benar
    blockExplorerUrls: ["https://testnet.u2uscan.xyz"],
};

interface Sensor {
    id: number; // Ini adalah tokenId
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
    const readOnlyContractRef = useRef<ethers.Contract | null>(null);

    // <<< FUNGSI FETCH DATA YANG SUDAH DIPERBAIKI >>>
    const fetchAllSensors = async () => {
        const contract = readOnlyContractRef.current;
        if (!contract) return;
        console.log("Fetching all sensor data using NFT contract logic...");
        try {
            const total = await contract.totalSupply();
            const totalSupply = Number(total);

            const sensorPromises = [];
            for (let i = 0; i < totalSupply; i++) {
                // Mengambil data sensor dan pemiliknya secara bersamaan
                sensorPromises.push(Promise.all([
                    contract.sensorData(i),
                    contract.ownerOf(i)
                ]));
            }

            const results = await Promise.all(sensorPromises);
            
            const formattedSensors = results.map((result, index) => {
                const [sensorData, owner] = result;
                return {
                    id: index,
                    owner: owner,
                    latitude: sensorData.latitude,
                    longitude: sensorData.longitude,
                    lastPm25Value: Number(sensorData.lastPm25Value),
                    lastUpdated: Number(sensorData.lastUpdated)
                };
            });

            setSensors(formattedSensors);
            console.log(`✅ Successfully fetched ${formattedSensors.length} sensors.`);
        } catch (error) {
            console.error("Failed to fetch all sensor data:", error);
        }
    };

    // useEffect untuk inisialisasi & fetch data awal
    useEffect(() => {
        const wsProvider = new ethers.WebSocketProvider(TARGET_NETWORK.wsUrls[0]);
        readOnlyContractRef.current = new ethers.Contract(AURACLE_CONTRACT_ADDRESS, AURACLE_CONTRACT_ABI, wsProvider);

        fetchAllSensors(); // Panggil fungsi fetch yang sudah benar

        if (window.ethereum) {
            providerRef.current = new ethers.BrowserProvider(window.ethereum);
            
            providerRef.current.send("eth_accounts", []).then((accounts) => {
                if (accounts.length > 0) setAccount(accounts[0]);
            });

            window.ethereum.on('accountsChanged', (accounts: string[]) => {
                setAccount(accounts.length > 0 ? accounts[0] : null);
            });
            window.ethereum.on('chainChanged', () => window.location.reload());
        }
    }, []);

    // useEffect terpisah HANYA untuk event 'DataSubmitted'
    useEffect(() => {
        const contract = readOnlyContractRef.current;
        if (!contract) return;

        console.log("Setting up event listener for DataSubmitted...");

        const handleDataSubmitted = (sensorId: bigint, pm25Value: bigint) => {
            const id = Number(sensorId);
            const value = Number(pm25Value);
            console.log(`✅ Event [DataSubmitted]! Sensor ID: ${id}, New PM2.5: ${value}`);
            
            setSensors(currentSensors =>
                currentSensors.map(sensor =>
                    sensor.id === id ? { ...sensor, lastPm25Value: value, lastUpdated: Math.floor(Date.now() / 1000) } : sensor
                )
            );
        };

        contract.on("DataSubmitted", handleDataSubmitted);

        return () => {
            console.log("Removing DataSubmitted event listener...");
            contract.off("DataSubmitted", handleDataSubmitted);
        };
    }, []);

    const connectWallet = async () => {
        if (!providerRef.current) return;
        try {
            const accounts = await providerRef.current.send("eth_requestAccounts", []);
            setAccount(accounts[0]);
        } catch (error) {
            console.error("Gagal menghubungkan wallet:", error);
        }
    };
    
    // <<< FUNGSI HANDLE CLICK DIPERBAIKI UNTUK REFETCH DATA >>>
    const handleMapClick = async (e: any) => {
        if (!isRegistering || !providerRef.current || !account) return;
        const { lat, lng } = e.latlng;
        try {
            const signer = await providerRef.current.getSigner();
            const contractWithSigner = new ethers.Contract(AURACLE_CONTRACT_ADDRESS, AURACLE_CONTRACT_ABI, signer);
            const tx = await contractWithSigner.registerSensor(lat.toString(), lng.toString());
            
            alert("Transaksi pendaftaran dikirim... Mohon tunggu konfirmasi.");
            await tx.wait();
            alert("Sensor berhasil didaftarkan! Memuat ulang data peta...");
            
            // Panggil kembali fetchAllSensors untuk me-refresh data di peta.
            // Ini cara paling andal untuk menampilkan sensor baru.
            await fetchAllSensors();

        } catch (error) {
            console.error("Gagal mendaftarkan sensor:", error);
            alert("Terjadi kesalahan saat pendaftaran. Cek konsol untuk detail.");
        } finally {
            setIsRegistering(false);
        }
    };

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
                                    Pemilik: {`${sensor.owner.substring(0, 6)}...${sensor.owner.substring(sensor.owner.length - 4)}`}
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