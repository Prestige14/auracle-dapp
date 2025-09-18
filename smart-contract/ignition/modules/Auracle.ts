// ignition/modules/Auracle.ts

import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const AuracleModule = buildModule("AuracleModule", (m) => {
  const auracleContract = m.contract("Auracle");

  return { auracleContract };
});

export default AuracleModule;