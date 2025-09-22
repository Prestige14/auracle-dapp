import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const AuracleModule = buildModule("AuracleModule", (m) => {
  const auracleContract = m.contract("Auracle", [], {
    id: "Auracle_deployment_4",
  });

  return { auracleContract };
});

export default AuracleModule;