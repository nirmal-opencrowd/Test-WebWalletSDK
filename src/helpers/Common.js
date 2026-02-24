import * as localstorage from "./../utils/local-storage";

export const isTestnetUser = async () => {
    const data = await localstorage._get("env");
    if (data.env == "sandbox" || data.env == "testnet" || data.env == "qa") {
      return true;
    }
  return false;
};
