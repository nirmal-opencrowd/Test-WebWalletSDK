import {
  MAINNET,
  WEB_TESTNET,
  WEB_PREVIEWNET,
} from "./ClientConstants.js";

export const Network = {
  fromName(name) {
      switch (name) {
          case "mainnet":
              return Network.MAINNET;

          case "testnet":
              return Network.TESTNET;

          case "previewnet":
              return Network.PREVIEWNET;

          default:
              throw new Error(`unknown network name: ${name}`);
      }
  },

  MAINNET: MAINNET,
  TESTNET: WEB_TESTNET,
  PREVIEWNET: WEB_PREVIEWNET,
};