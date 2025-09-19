import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const CONTRACT_ADDRESS = "0x5FbDB2315678afecb367f032d93F642f64180aa3";
const BASE_URI = "https://auracle-dapp.vercel.app/api/metadata/";

const SetBaseUriModule = buildModule("SetBaseUriModule", (m) => {
  // Attach ke kontrak existing
  const auracle = m.contractAt("Auracle", CONTRACT_ADDRESS);

  // Jalankan transaksi untuk setBaseURI
  m.call(auracle, "setBaseURI", [BASE_URI]);

  return { auracle };
});

export default SetBaseUriModule;
