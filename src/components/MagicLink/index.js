import { Magic } from "magic-sdk";
import { HederaExtension } from "@magic-ext/hedera";
import { getENV } from "./../../utils/utils";

export const magicInstance = async () => {
  const data = await getENV();
  return new Magic((data.env == "mainnet" ? "pk_live_7C3B8A69BA43CC96" : "pk_live_02C6C7264D60F60D"), {
    extensions: [
      new HederaExtension({
        network: data.env == "mainnet" ? "mainnet" : "testnet",
      }),
    ],
  });
};
