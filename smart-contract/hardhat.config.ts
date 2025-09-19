import type { HardhatUserConfig } from "hardhat/config";
import "./tasks/set-base-uri.js";
import hardhatToolboxViemPlugin from "@nomicfoundation/hardhat-toolbox-viem";
import { configVariable } from "hardhat/config";
import "dotenv/config";
import "@nomicfoundation/hardhat-ethers";

const config: HardhatUserConfig = {
  plugins: [hardhatToolboxViemPlugin],
  solidity: {
    profiles: {
      default: {
        version: "0.8.28",
      },
      production: {
        version: "0.8.28",
        settings: {
          optimizer: {
            enabled: true,
            runs: 200,
          },
        },
      },
    },
  },
  networks: {
    hardhatMainnet: {
      type: "edr-simulated",
      chainType: "l1",
    },
    hardhatOp: {
      type: "edr-simulated",
      chainType: "op",
    },
    nebulas_testnet: {
      type: "http",
      chainId: 2484,
      url: "https://rpc-nebulas-testnet.u2u.xyz/",
      accounts: process.env.U2U_PRIVATE_KEY ? [process.env.U2U_PRIVATE_KEY] : [],
    },
  },
};

export default config;