import React from "react";
import forge from "node-forge";
import dayjs from "dayjs";
import AdvancedFormat from "dayjs/plugin/advancedFormat";
import RelativeTime from "dayjs/plugin/relativeTime";
import { Magic } from "magic-sdk";
import { HederaExtension } from "@magic-ext/hedera";
import {
    baseAPIUrl,
    baseDevAPIUrl,
    baseSandboxAPIUrl,
    baseQAAPIUrl,
    SB_USDC_TOKEN_ID,
    DEV_USDC_TOKEN_ID,
    QA_USDC_TOKEN_ID,
    PROD_USDC_TOKEN_ID,
    baseUSDCDevAPIUrl,
    baseDevQrPollingUrl,
    baseDevRPSAPIUrl,
    SUPPORTED_CRYPTO_CURRENCIES,
    SB_DC_TOKEN_ID,
    DEV_DC_TOKEN_ID,
    QA_DC_TOKEN_ID,
    PROD_DC_TOKEN_ID,
    devEnvConst,
    qaEnvConst,
    prodEnvConst,
    sandboxEnvConst,
    SB_DROPP_ACCOUNT_ID,
    DEV_DROPP_ACCOUNT_ID,
    QA_DROPP_ACCOUNT_ID,
    PROD_DROPP_ACCOUNT_ID,
    DEV_DROPP_CIRCLE_ACCOUNT_ID,
    QA_DROPP_CIRCLE_ACCOUNT_ID,
    SB_DROPP_CIRCLE_ACCOUNT_ID,
    PROD_DROPP_CIRCLE_ACCOUNT_ID,
    DEV_USDC_PAYOUT_MEMO,
    QA_USDC_PAYOUT_MEMO,
    SB_USDC_PAYOUT_MEMO,
    PROD_USDC_PAYOUT_MEMO,
    DEV_USDC_GAS_FEE_ACCOUNT_ID,
    QA_USDC_GAS_FEE_ACCOUNT_ID,
    SB_USDC_GAS_FEE_ACCOUNT_ID,
    PROD_USDC_GAS_FEE_ACCOUNT_ID,
    nftStorageBaseUrl,
    DEV_STRIPE_PK,
    QA_STRIPE_PK,
    SB_STRIPE_PK,
    PROD_STRIPE_PK,
    FRAUD_ERROR_CODES,
    DEV_DRAGONGLASS_URL,
    PROD_DRAGONGLASS_URL,
    DEFAULT_DROPP_PIN,
    APP_VERSION
} from "./constants";
import { hexToBytes } from "./p2phelper";

import * as localstorage from "./local-storage";
import { getDroppConfig, resetUserDetails } from "./../api/index";
import {proto} from "@hashgraph/proto";
import { Transaction, PublicKey, SignerSignature } from "@hashgraph/sdk";
import { magicInstance } from "../components/MagicLink/index";
import { MagicProvider } from "../components/MagicLink/MagicProvider";
import { MagicWallet } from "../components/MagicLink/MagicWallet";
import { webStorage, messageBus } from "../services/walletService";

var CryptoJS = require("crypto-js");

dayjs.extend(AdvancedFormat);
dayjs.extend(RelativeTime);

const ed25519 = forge.pki.ed25519;
const { SignaturePair, SignatureMap } = proto;
let magicWalletInstance;

export const isEmpty = obj => {
    return Object.keys(obj).length === 0;
};

export const encodeBase64 = data =>
    forge.util.encode64(forge.util.encodeUtf8(JSON.stringify(data)));

export const decodeBase64 = data => forge.util.decode64(data);

export const sign = (data, priv) => {
    let encoding = "utf8";
    var privateKey = forge.util.hexToBytes(priv);
    let signature = ed25519.sign({
        message: data,
        encoding,
        privateKey,
    });
    return signature;
};

export const hederaAccountToString = function (merchantAccountId) {
    if (!merchantAccountId) {
        return;
    }
    return [merchantAccountId.shard, merchantAccountId.realm, merchantAccountId.accountNumber].join(
        "."
    );
};

export const stringToHederaAccount = function (merchantAccountId) {
    if (!merchantAccountId) {
        return;
    }
    const parts = merchantAccountId.split(".");
    return {shard: parts[0], realm: parts[1], accountNumber: parts[2]};
};

export const casualTimeFromPurchase = function (seconds) {
    const now = dayjs();
    let purchased = now.subtract(seconds, "second");
    purchased = now.from(purchased, true);
    return `Purchased ${purchased} ago`;
};

export const casualTimeToExpiration = function (seconds) {
    const now = dayjs();
    let expires = now.add(seconds, "second");
    expires = now.to(expires, true);
    return `Access to this purchase expires after ${expires}`;
};

export const getQueryParams = function (url, force) {
    const regex = /[?&]([^=#]+)=([&#]*)/g;
    url = decodeURI(url);
    let params = {};
    let match;
    while ((match = regex.exec(url))) {
        if (match[2] == "true") {
            params[match[1]] = true;
        } else if (match[2] == "false") {
            params[match[1]] = false;
        } else {
            params[match[1]] = match[2];
        }
    }
    return params;
};

export const queryBuilder = function(request) {
    let query = "";
    for (let i = 0; i < Object.keys(request).length; i++) {
        query = query + Object.keys(request)[i] + "=" + request[Object.keys(request)[i]] + "&";
    }
    return query;
}

export const getBaseAPIUrl = async (type, switchToSandbox) => {
    const data = await localstorage._get("env");
    if (data.env == "sandbox") {
        return baseSandboxAPIUrl;
    } else if (data.env == "testnet") {
        return baseQAAPIUrl;
    } else if (data.env == "qa") {
        return switchToSandbox ? baseSandboxAPIUrl : baseQAAPIUrl;
    } else if (switchToSandbox) {
        return baseSandboxAPIUrl;
    }
    return baseAPIUrl;
};

export const getENV = async () => {
    const data = await localstorage._get("env");
    return data;
};

export const getReactAppEnv = (env) => {
    if (env == "sandbox") {
        return sandboxEnvConst;
    } else if (env == "testnet") {
        return devEnvConst;
    } else if (env == "qa") {
        return qaEnvConst;
    }
    return prodEnvConst;
};

export const getUSDCTokenId = async () => {
    const data = await localstorage._get("env");
    let configData = await localstorage.decrypted.get();
    if (configData && configData.configInfo) {
        if (data.env == "sandbox" || data.env == "testnet" || data.env == "qa") {
            return configData.configInfo.config.usdcTokenIdTest;
        }
        return configData.configInfo.config.usdcTokenIdLive;
    }
    return "";
};

export const getCARATTokenId = async () => {
    const data = await localstorage._get("env");
    let configData = await localstorage.decrypted.get();
    if (configData && configData.configInfo) {
        if (data.env == "sandbox" || data.env == "testnet" || data.env == "qa") {
            return configData.configInfo.config.caratTokenIdTest;
        }
        return configData.configInfo.config.caratTokenIdLive;
    }
    return "";
};

export const getDroppCreditTokenId = async () => {
    const data = await localstorage._get("env");
    let configData = await localstorage.decrypted.get();
    if (configData && configData.configInfo) {
        if (data.env == "sandbox" || data.env == "testnet" || data.env == "qa") {
            return configData.configInfo.config.dctTokenIdTest;
        }
        return configData.configInfo.config.dctTokenIdLive;
    }
    return "";
};

export const getDroppAccountId = async () => {
    const data = await localstorage._get("env");
    let configData = await localstorage.decrypted.get();
    if (configData && configData.configInfo) {
        if (data.env == "sandbox" || data.env == "testnet" || data.env == "qa") {
            return configData.configInfo.config.droppPayerIdTest;
        }
        return configData.configInfo.config.droppPayerIdLive;
    }
    return "";
};

export const getDroppCircleAccountId = async () => {
    const data = await localstorage._get("env");
    let configData = await localstorage.decrypted.get();
    if (configData && configData.configInfo) {
        if (data.env == "sandbox" || data.env == "testnet" || data.env == "qa") {
            return configData.configInfo.config.droppCirclePayoutIdTest;
        }
        return configData.configInfo.config.droppCirclePayoutIdLive;
    }
    return "";
};

export const getEthCircleAccountID = async () => {
    const data = await localstorage._get("env");
    let configData = await localstorage.decrypted.get();
    if (configData && configData.configInfo) {
        if (data.env == "sandbox" || data.env == "testnet" || data.env == "qa") {
            return configData.configInfo.config.usdcUserTransferOutCustodianIdTest;
        }
        return configData.configInfo.config.usdcUserTransferOutCustodianIdLive;
    }
    return "";
}

export const getUSDCPayoutMemo = async () => {
    const data = await localstorage._get("env");
    let configData = await localstorage.decrypted.get();
    if (configData && configData.configInfo) {
        if (data.env == "sandbox" || data.env == "testnet" || data.env == "qa") {
            return configData.configInfo.config.droppCircleUsdcMemoTest;
        }
        return configData.configInfo.config.droppCircleUsdcMemoLive;
    }
    return "";
};

export const getUSDCGasFeeAccountId = async () => {
    const data = await localstorage._get("env");
    let configData = await localstorage.decrypted.get();
    if (configData && configData.configInfo) {
        if (data.env == "sandbox" || data.env == "testnet" || data.env == "qa") {
            return configData.configInfo.config.droppCircleGasFeeIdTest;
        }
        return configData.configInfo.config.droppCircleGasFeeIdLive;
    }
    return "";
};

export const getStripePK = async () => {
    const data = await localstorage._get("env");
    if (data.env == "sandbox") {
        return SB_STRIPE_PK;
    } else if (data.env == "testnet") {
        return DEV_STRIPE_PK;
    } else if (data.env == "qa") {
        return QA_STRIPE_PK;
    }
    return PROD_STRIPE_PK;
};

export const getDGEndPoint = async () => {
    const data = await localstorage._get("env");
    if (data.env == "sandbox" || data.env == "testnet" || data.env == "qa") {
        return DEV_DRAGONGLASS_URL;
    }
    return PROD_DRAGONGLASS_URL;
};

export const getCurrencyDecimal = (currency) => {
    if (currency == "HBAR") {
        return Math.pow(10, 8);
    } else if (currency == "USDC") {
        return Math.pow(10, 6);
    } else if (currency == "DCT") {
        return Math.pow(10, 4);
    } else if (currency == "CARAT") {
        return Math.pow(10, 2);
    }
    return 1;
};

export const getCurrencyDecimalPlaces = (currency) => {
    if(currency) {
        return 4;
    }
    return;
}

export const getActiveWallet = (userWalletList) => {
    let activeWallet = {};
    for (let i = 0; i < userWalletList.length; i++) {
        if (userWalletList[i].active) {
            activeWallet = userWalletList[i];
            break;
        }
    }
    return activeWallet;
};

export const formatAmount = (amt, maxDecimalPlaces) => {
    let amtStr = amt.toFixed((maxDecimalPlaces || 4));
    let amtParts = amtStr.split(".");
    let main = amtParts[0];
    let fractionPart = amtParts[1];
    let decimalPoints = "";
    const minDecimalPlaces = 2;
    if (fractionPart && fractionPart.length > 0) {
        for (let i = 0; i < fractionPart.length; i++) {
            if (i < minDecimalPlaces) {
                decimalPoints += fractionPart[i];
            } else if (fractionPart[i] != 0 || (fractionPart[i] == 0 && i < (fractionPart.length -1) && fractionPart[i+1] != 0)) {
                decimalPoints += fractionPart[i];
            }
        }
    }

    return main + ((!decimalPoints || decimalPoints == "00") ? "" : `.${decimalPoints}`) ;
};

export const displayAmount = (amt, decimalPlaces, allowTrailingZeroes) => {
    let amtStr;
    if(!amt || amt == 0) {
    return 0;
    }
    amtStr = amt + "";
    let amtParts = amtStr.split(".");
    let main = amtParts[0] || 0;
    let fractionPart = amtParts[1] || "";
    if(!decimalPlaces) {
        decimalPlaces = 4;
    }
    if (fractionPart.length >= decimalPlaces) {
    fractionPart = fractionPart.substring(0, decimalPlaces);
    } else {
    let diff = decimalPlaces - fractionPart.length;
    for (let i = 0; i < diff; i++) {
        fractionPart += "0";
    }
    }
    if (allowTrailingZeroes) {
        return main + "." + fractionPart;
    }

    let minDecimalPlaces = decimalPlaces;
    let decimalPoints = ""
    if (fractionPart && fractionPart.length > 0) {
        for (let i = 0; i < fractionPart.length; i++) {
            if (i < minDecimalPlaces) {
                decimalPoints += fractionPart[i];
            } else if (fractionPart[i] != 0 || (fractionPart[i] == 0 && i < (fractionPart.length -1) && fractionPart[i+1] != 0)) {
                decimalPoints += fractionPart[i];
            }
        }
    }

    return main + ((!decimalPoints || decimalPoints == "00" || decimalPoints == "0000" ) ? "" : `.${decimalPoints}`) ;
};

export const getAmountWithDecimals = (amt, minDecimals) => {
    let amtStr = amt + "";
    let amtParts = amtStr.split(".");
    let main = amtParts[0];
    let fractionPart = amtParts[1];
    let decimalPoints = "";
    const minDecimalPlaces = minDecimals ? minDecimals : 2;
    if (fractionPart && fractionPart.length > 0) {
        for (let i = 0; i < fractionPart.length; i++) {
            if (i < minDecimalPlaces) {
                decimalPoints += fractionPart[i];
            }
        }
    }

    return parseFloat(main + ((!decimalPoints || decimalPoints == "00") ? "" : `.${decimalPoints}`));
};

export const removeTrailingZeroes = (number) => {
    const numberStr = number.toString();
    const trimmedNumberStr = numberStr.replace(/(\.\d*?[1-9])0+$/, "$1");
    return parseFloat(trimmedNumberStr);
};

export const isSafari = () => {
    return ((navigator.userAgent.indexOf("Safari") != -1) && (navigator.userAgent.indexOf("Chrome") == -1));
};

export const isFirefox = () => {
    return ((navigator.userAgent.indexOf("Firefox") != -1) || (navigator.userAgent.indexOf("firefox") != -1));
};

export const getBrowserDetail = () => {
    let browserAgent = navigator.userAgent;
    let browserName = navigator.appName;
    let browserVersion = '' + parseFloat(navigator.appVersion);
    let Offset, OffsetVersion, ix;

    // For Chrome
    if ((OffsetVersion = browserAgent.indexOf("Chrome")) != -1 && browserAgent.indexOf("Edg") == -1 ) {
        browserName = "Chrome";
        browserVersion = browserAgent.substring(OffsetVersion + 7);
    }

    // For Microsoft internet explorer
    else if ((OffsetVersion = browserAgent.indexOf("Edg")) != -1) {
        browserName = "Microsoft Internet Explorer";
        browserVersion = browserAgent.substring(OffsetVersion + 4);
    }

    // For Firefox
    else if ((OffsetVersion = browserAgent.indexOf("Firefox")) != -1) {
        browserName = "Firefox";
    }

    // For Safari
    else if ((OffsetVersion = browserAgent.indexOf("Safari")) != -1) {
        browserName = "Safari";
        browserVersion = browserAgent.substring(OffsetVersion + 7);
        if ((OffsetVersion = browserAgent.indexOf("Version")) != -1)
            browserVersion = browserAgent.substring(OffsetVersion + 8);
    }

    // For other browser "name/version" is at the end of userAgent
    else if ((Offset = browserAgent.lastIndexOf(' ') + 1) <
        (OffsetVersion = browserAgent.lastIndexOf('/'))) {
        browserName = browserAgent.substring(Offset, OffsetVersion);
        browserVersion = browserAgent.substring(OffsetVersion + 1);
        if (browserName.toLowerCase() == browserName.toUpperCase()) {
            browserName = navigator.appName;
        }
    }

    // Trimming the fullVersion string at
    // semicolon/space if present
    if ((ix = browserVersion.indexOf(";")) != -1)
        browserVersion = browserVersion.substring(0, ix);
    if ((ix = browserVersion.indexOf(" ")) != -1)
        browserVersion = browserVersion.substring(0, ix);


    return { browserName: browserName, browserVersion: `Version ${browserVersion}`};
}

export const droppVersion = () => {
    // In webapp: use APP_VERSION constant instead of chrome.runtime.getManifest()
    const version = APP_VERSION || '1.0.0';
    return `v${version}`;
}

export const isCrypto = (currency) => {
    return (SUPPORTED_CRYPTO_CURRENCIES.indexOf(currency) != -1);
};

export const isPaymentLinkSupported = (invoiceCurrency, walletCurrency) => {
    if (SUPPORTED_CRYPTO_CURRENCIES.indexOf(invoiceCurrency) != -1) {
        return invoiceCurrency == walletCurrency;
    }
    return true;
};

export const getCleanNFTUrl = (url) => {
    if (!url) {
        return "";
    } else if (!(url.indexOf("https://ipfs.io/ipfs/") != -1 || url.indexOf("ipfs://") != -1)) {
        return url;
    } else {
        const path = url.replace("https://ipfs.io/ipfs/", "").replace("ipfs://", "");
        return `${nftStorageBaseUrl}/${path}`;
    }
};

export const getDroppUserAgent = () => {
    const detail = getBrowserDetail();
    return `DroppWebApp/(${droppVersion()}) (${detail.browserName} / ${detail.browserVersion})`;
};

const getPlatform = () => {
  if (typeof navigator === "undefined") return "unknown";
  return "web";
};

export const getDeviceId = () => {
    return `${droppVersion()}_${getPlatform()}_${Math.floor(Date.now() / 1000)}`;
};

export const resetExpiryForIPQS = async(responseCode) => {
    if (FRAUD_ERROR_CODES.indexOf(responseCode) != -1) {
        let localUserData = await localstorage.decrypted.get();
        if (localUserData && localUserData.deviceInfo) {
            localUserData.deviceInfo['expiry'] = new Date().getTime();
            await localstorage.decrypted.set(localUserData);
        }
    }
}

export const droppConfig = async () => {
    let configData = await localstorage.decrypted.get();
    if (configData && configData.userId) {
        let currTime = new Date().getTime();
        if (!configData || !(configData && configData.configInfo) || configData && configData.configInfo && configData.configInfo.expiry <  currTime) {
            const res = await getDroppConfig();
            if (res.responseCode == 0) {
                let currDate = new Date();
                configData['configInfo'] = {
                    config: res.data,
                    expiry: currDate.setSeconds(1 * 60 * 60)
                }
                localstorage.decrypted.set(configData);
            }
        }
    }
};

export const toStandardCase = (word) => {
    if (!word) {
      return word;
    }

    const lowerCaseWord = word.toLowerCase();
    const firstLetter = lowerCaseWord.charAt(0).toUpperCase();
    const restOfWord = lowerCaseWord.slice(1);

    return firstLetter + restOfWord;
}

export const resetLocalData = async (cb) => {
    webStorage.remove("_encrypted");
    webStorage.remove("_decrypted");
    // Clear all webapp localStorage keys
    try {
        window.localStorage.clear();
    } catch (e) {
        console.error("Error clearing localStorage:", e);
    }
    resetUserDetails(); // reset local user details
    if (cb) {
        cb();
    }
};

export const addStripeLib = async (cb) => {
    return new Promise((resolve, reject) => {
        // In webapp: load Stripe from a relative path or CDN instead of chrome.runtime.getURL
        const url = "/vendor/stripe.js";
        const existingScript = document.querySelectorAll(`script[src*="${url}"]`);
        if (existingScript && existingScript.length == 0) {
            let scriptElem = document.createElement("script");
            scriptElem.src = url;
            document.body.appendChild(scriptElem);
        }

        const intervalId = setInterval(() => {
            if (window.Stripe) {
                if (intervalId) {
                    clearInterval(intervalId);
                }
                if (cb) {
                    cb(true);
                }
                resolve(window.Stripe);
            }
        }, 100);
    });
};

export const addPlaidLib = async () => {
    return new Promise((resolve, reject) => {
        // In webapp: load Plaid from a relative path or CDN instead of chrome.runtime.getURL
        const url = "/vendor/plaid/link-initialize.js";
        const existingScript = document.querySelectorAll(`script[src*="${url}"]`);
        if (existingScript && existingScript.length == 0) {
            let scriptElem = document.createElement("script");
            scriptElem.src = url;
            document.body.appendChild(scriptElem);
        }

        const intervalId = setInterval(() => {
            if (window.Plaid) {
                if (intervalId) {
                    clearInterval(intervalId);
                }
                resolve(window.Plaid);
            }
        }, 100);
    });
};

export const updateBadgeText = (text) => {
    // Badge text is a browser extension concept — no-op in webapp
    // Could be replaced with document.title or favicon badge if needed
};

export const roundUpAmtToTwoDecimals = (amt) => {
    return Math.ceil(amt * 100) / 100;
};

export const sendMessage = async (encryptedData, cb, env) => {
    let decrypted = "";
    if (encryptedData) {
        try {
            decrypted = JSON.parse(
                CryptoJS.AES.decrypt(encryptedData, DEFAULT_DROPP_PIN).toString(CryptoJS.enc.Utf8)
            );
        } catch(err) {
            decrypted = "";
        }
    }

    try {
        const localEnv = await getENV();
        // In webapp: use messageBus instead of chrome.runtime.sendMessage
        messageBus.emit("link", {
            _encrypted: encryptedData,
            _decrypted: decrypted,
            env: env ? env : localEnv && localEnv.env
        });
        cb?.(); // eslint-disable-line
    } catch (e) {
        cb?.(); // eslint-disable-line
    }
};

export const getLast6Chars = (publicKey) => {
    if (!publicKey) {
        return "";
    }
    return publicKey.slice(-6);
};

const getParsedTransaction = async (transactionBodyBytes) => {
    try {
        let protoTxn = proto.Transaction.create({
          bodyBytes: Buffer.from(transactionBodyBytes),
        });
        let encodedTxnBytes = proto.Transaction.encode(protoTxn).finish();
        return Transaction.fromBytes(encodedTxnBytes);

    } catch (err) {
      console.error("Error in signing transaction: ", err);
      throw new Error(err.message || "Unable to parse the transaction");
    }
};

export const getMagicWallet = async () => {
  try {
    const magic = await magicInstance();
    if (magicWalletInstance) {
      return magicWalletInstance;
    }
    let userInfo = JSON.parse(localStorage.getItem("uInfo") || "{}");
    if (!(userInfo && userInfo.publicAddress)) {
      userInfo = await magic.user.getInfo();
      localStorage.setItem("uInfo", JSON.stringify(userInfo));
    }
    const hederaAccountId = userInfo.publicAddress;
    let publicKeyDer = localStorage.getItem("pKey");
    if (!publicKeyDer) {
      const res = await magic.hedera.getPublicKey();
      publicKeyDer = res.publicKeyDer;
      localStorage.setItem("pKey", publicKeyDer);
    }
    const magicSign = (message) => magic.hedera.sign(message);
    const envData = await getENV();
    const magicWallet = new MagicWallet(
      hederaAccountId,
      new MagicProvider(envData.env === "mainnet" ? "mainnet" : "testnet"),
      publicKeyDer,
      magicSign
    );
    magicWalletInstance = magicWallet;
    return magicWallet;
  } catch (err) {
    throw new Error("Error in getting magic wallet", err)
  }
};

const signHederaTxn = async (hederaTxn) => {
  try {
    const magicWallet = await getMagicWallet();
    let transaction = await hederaTxn.freezeWithSigner(magicWallet);
    transaction = await transaction.signWithSigner(magicWallet);
    return transaction;
  } catch (err) {
    console.log(err);
    throw new Error("Error in siging the transaction", err)
  }
};

const uint8ArrayToBase64 = (bytes) => {
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return window.btoa(binary);
};

const signerSignaturesToSignatureMap = (signerSignatures) => {
    const signatureMap = proto.SignatureMap.create({
        sigPair: signerSignatures.map((s) => {
          return s.publicKey._toProtobufSignature(s.signature);
        }),
    });
    return signatureMap;
}

const signatureMapToBase64String = (signatureMap) => {
    const encoded = proto.SignatureMap.encode(signatureMap).finish();
    return uint8ArrayToBase64(encoded);
};

const prefixMessageToSign = (message) => {
    return '\x19Hedera Signed Message:\n' + message.length + message;
};

export const getEncodedTransactionBytes = async (transactionBodyBytes, signatures, userDetails, onlySignatures) => {
    let encoding = "binary";
    let signatureMap;
    const magic = await magicInstance();
    const userData = await localstorage.decrypted.get();
    if (userData && userData.magicUser) {
        const isLoggedIn = await magic.user.isLoggedIn();
        if (!isLoggedIn) {
            await magic.auth.loginWithSMS({ phoneNumber: userDetails.mobileNumber });
        }
        const hederaTxn = await getParsedTransaction(transactionBodyBytes);
        const signedTxn = await signHederaTxn(hederaTxn);
        if (onlySignatures) {
            const flatSignatures = signedTxn.getSignatures().getFlatSignatureList();
            let signaturesArray = [];
            for (let i = 0; i < flatSignatures.length; i++) {
                const signatureMap = flatSignatures[i];
                const publicKey = signatureMap._map.keys().next().value;
                const signatureBytes = signatureMap._map.get(publicKey);
                signaturesArray.push(
                    new SignerSignature({
                        publicKey: PublicKey.fromString(publicKey),
                        signature: signatureBytes,
                        accountId: signedTxn.transactionId.accountId,
                    })
                );
            }
            signatureMap = signerSignaturesToSignatureMap(signaturesArray);
            return signatureMap;
        } else {
            return uint8ArrayToBase64(signedTxn.toBytes())
        }
    } else if (signatures.privateKey ) {
        let privateKey = forge.util.hexToBytes(signatures.privateKey);
        let signature = ed25519.sign({
            message: Buffer.from(transactionBodyBytes),
            encoding,
            privateKey,
        });
        let publicKeyBytes = forge.util.hexToBytes(signatures.publicKey);
        const signerSignature = new SignerSignature({
            publicKey: PublicKey.fromBytesED25519(publicKeyBytes),
            signature: signature,
            accountId: signatures.accountId,
        });
        signatureMap = signerSignaturesToSignatureMap([signerSignature]);
        if (onlySignatures) {
            return signatureMap;
        }
    }
    if (!signatureMap) {
        throw new Error("No signature map available");
    }
    let protoTxn = proto.Transaction.create({
        bodyBytes: Buffer.from(transactionBodyBytes),
        sigMap: signatureMap,
    });
    let encodedTxnBytes = proto.Transaction.encode(protoTxn).finish();
    return uint8ArrayToBase64(encodedTxnBytes);
};

export const signMessageWithMagic = async (message, userDetails) => {
    const magic = await magicInstance();
    const userData = await localstorage.decrypted.get();
    if (userData && userData.magicUser) {
        const isLoggedIn = await magic.user.isLoggedIn();
        if (!isLoggedIn) {
            await magic.auth.loginWithSMS({ phoneNumber: userDetails.mobileNumber });
        }
        const prefixedMessage = prefixMessageToSign(message);
        const magicWallet = await getMagicWallet();
        const signatureBytes = await magicWallet.sign([Buffer.from(prefixedMessage)]);
        const base64Signature = uint8ArrayToBase64(signatureBytes[0]);
        return base64Signature;
    }
    return null;
};

export const toLocalTimezone = (utcTime) => {
  const pad = n => String(n).padStart(2, "0");
  const d = new Date(utcTime);
  const yyyy = d.getFullYear();
  const MM   = pad(d.getMonth() + 1);
  const dd   = pad(d.getDate());
  const hh   = pad(d.getHours());
  const mm   = pad(d.getMinutes());
  const ss   = pad(d.getSeconds());
  return \
`${yyyy}-${MM}-${dd}T${hh}:${mm}:${ss}`;
};