import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const CONTRACT_ADDRESS = "0x4367d2D2282fa8441649EC9B1c7e4810CBA1606c";
const BASE_URI = "https://auracle-dapp.vercel.app/api/metadata/";

const SetBaseUriModule = buildModule("SetBaseUriModule", (m) => {
  // Attach ke kontrak existing
  const auracle = m.contractAt("Auracle", CONTRACT_ADDRESS);

  // Jalankan transaksi untuk setBaseURI
  m.call(auracle, "setBaseURI", [BASE_URI]);

  return { auracle };
});

export default SetBaseUriModule;
