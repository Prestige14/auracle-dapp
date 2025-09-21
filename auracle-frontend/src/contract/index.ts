import AuracleContract from '../artifacts/contracts/Auracle.sol/Auracle.json?url';

const res = await fetch(AuracleContract);
const abiJson = await res.json();

export const AURACLE_CONTRACT_ADDRESS = import.meta.env.VITE_AURACLE_CONTRACT_ADDRESS;
export const AURACLE_CONTRACT_ABI = abiJson.abi;
