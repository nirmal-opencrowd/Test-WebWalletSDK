import axios from "axios";
import forge from "node-forge";
import * as localstorage from "./../utils/local-storage";
import * as p2phelper from "./../utils/p2phelper.js";
import { getBaseAPIUrl, getDroppUserAgent, getFormattedLocalTime } from "./../utils/utils";

let userData;
let userDetailsDeferred = {};
// let cachedDeviceId = null;
let cachedDeviceId;

/* global chrome */

const extract = response => {
    return response.data;
};

const getBaseUrl = async (type, switchToSandbox) => {
    const url = await getBaseAPIUrl(type, switchToSandbox);
    switch (type) {
        case "payment":
            return `${url}/payment/processRequest`;
        case "countryCurrency":
            return `${url}/countryCurrency/processRequest`;
        case "associateToken":
            return `${url}/payer/updateAccount`;
        case "paymentIntent":
            return `${url}/api/userwallet/v1/wallet/paymentIntent`
        default:
            return `${url}/payer/processRequest`;
    }
};

const axiosTokenInstance = axios.create({
    timeout: 30000
});

axiosTokenInstance.interceptors.request.use(
  config => {
    config.headers['dropp-hash'] = window.ipqsDeviceId ? window.ipqsDeviceId : "";
    config.headers['dropp-user-agent'] = getDroppUserAgent();
    if (userData && userData.magicUser) {
        config.headers['device'] = userData && userData.droppDeviceId ? userData.droppDeviceId : "";
    }
    config.headers['userId'] = userData && userData.userId ? userData.userId : "";
    return config;
  },
  error => {
    return Promise.reject(error);
  }
);

const ed25519 = forge.pki.ed25519;

const durationMapping = {
  "30" : 2592000000,
  "60" : 5184000000,
  "90" : 7776000000
}

// const createSignature = data => {
//     let encoding = "utf8";
//     let privateKey = forge.util.hexToBytes(userData.privateKey);
//     let signature = ed25519.sign({
//         message: data,
//         encoding,
//         privateKey,
//     });
//     return signature;
// };
const createSignature = data => {
    let encoding = "utf8";
    const privateKeyDerHex = userData.privateKey;
    const privateKeyDerBytes = forge.util.hexToBytes(privateKeyDerHex);
    const privateKeySeedBytes = userData && userData.magicUser ? privateKeyDerBytes.slice(privateKeyDerBytes.length - 32) : privateKeyDerBytes;
    let signature = ed25519.sign({
        message: data,
        encoding,
        privateKey: privateKeySeedBytes,
    });

    return signature;
};

const prepareDataForOffers = (data) => {
    let dataByteArr = Buffer.from(JSON.stringify(data), "utf-8");
    let dataHex = p2phelper.toHexString(dataByteArr);
    return {"dataJsonHex": dataHex, "signatureHex": forge.util.bytesToHex(createSignature(dataByteArr))};
};

const prepareDataForUSDC = (data) => {
    let dataByteArr = Buffer.from(JSON.stringify(data), "utf-8");
    let dataHex = p2phelper.toHexString(dataByteArr);
    return {"dataInHex": dataHex, "signatures": {"payer": forge.util.bytesToHex(createSignature(dataByteArr))}};
};

const prepareDataForRPS = (data) => {
    let dataByteArr = Buffer.from(JSON.stringify(data), "utf-8");
    // let dataHex = p2phelper.toHexString(dataByteArr);
    return {"dataInBase64": dataByteArr.toString("base64"), "signatures": {"payer": forge.util.bytesToHex(createSignature(dataByteArr))}};
};

const prepareDataInHex = (data) => {
    let dataByteArr = Buffer.from(JSON.stringify(data), "utf-8");
    let dataHex = p2phelper.toHexString(dataByteArr);
    return {"dataInHex": dataHex, "signatures": {"payer": forge.util.bytesToHex(createSignature(dataByteArr))}};
};

const prepareDataInBase64JsonContent = (data, methodName) => {
    const request_param = forge.util.encode64(forge.util.encodeUtf8(JSON.stringify(data)));
    const signatureHex = forge.util.bytesToHex(createSignature(request_param)) ;
    return {
        base64JsonContent: request_param,
        signature: signatureHex,
        method: methodName,
    };
};

export const resetUserDetails = () => {
    userDetailsDeferred = {};
}

export const fetchUserDetails = async (force) => {
    if (force) {
        resetUserDetails();
    }
    if (!force && userDetailsDeferred.data) {
        return userDetailsDeferred.data;
    } else if (userDetailsDeferred.promise) {
        return userDetailsDeferred.promise;
    } else {
        userDetailsDeferred.data = null;
        userData = await localstorage.decrypted.get();
        if (userData) {
            let tsmili = String(Date.now())
            let data = { userId: userData.userId, timeStamp: parseFloat(tsmili.slice(0,10) + "." + tsmili.slice(10))};
            let request_param = forge.util.encode64(forge.util.encodeUtf8(JSON.stringify(data)));
            let signatureHex = forge.util.bytesToHex(createSignature(request_param));
            let postData = {
                base64JsonContent: request_param,
                signature: signatureHex,
                method: "getUserDetails",
            };
            userDetailsDeferred.promise = axiosTokenInstance.post(await getBaseUrl(), postData).then((response) => {
                userDetailsDeferred.promise = null;
                userDetailsDeferred.data = response.data;
                return userDetailsDeferred.data;
            });
            return userDetailsDeferred.promise;
        } else {
            return userDetailsDeferred.resolve({});
        }
    }
};

export const sendHintToUser = async (data) => {
    userData = data;
    if (userData) {
        let requestData = { userId: userData.userId};
        let requestParam = forge.util.encode64(forge.util.encodeUtf8(JSON.stringify(requestData)));
        let signatureHex = forge.util.bytesToHex(createSignature(requestParam));
        let postData = {
            base64JsonContent: requestParam,
            signature: signatureHex,
            method: "sendHint",
        };
        return axiosTokenInstance.post(await getBaseUrl(), postData).then(extract);
    } else {
        return {};
    }
};

export const fetchPurchaseHistory = async reqData => {
    userData = await localstorage.decrypted.get();
    let tsmili = String(Date.now())
    let data = {
      userId: userData.userId,
      timeStamp:parseFloat(tsmili.slice(0,10) + "." + tsmili.slice(10)),
      ...((reqData.startIndex || reqData.startIndex == 0) && {startIndex: reqData.startIndex}),
      ...((reqData.endIndex || reqData.endIndex == 0) && {endIndex: reqData.endIndex}),
      ...(reqData.duration!="All" && {fromDate : Math.floor((Date.now() - durationMapping[reqData.duration])/1000)}),
      ...(reqData.duration!="All" && {toDate : Math.floor((Date.now())/1000)}),
      ...(reqData.merchantId && {merchantId: reqData.merchantId}),
    };
    let request_param = forge.util.encode64(forge.util.encodeUtf8(JSON.stringify(data)));
    let signatureHex = forge.util.bytesToHex(createSignature(request_param));
    let postData = {
        base64JsonContent: request_param,
        signature: signatureHex,
        method: "getOnlyPurchaseHistory",
    };
    return axiosTokenInstance.post(await getBaseUrl(), postData).then(response => {
        return extract(response);
    });
};

export const fetchOffers = async () => {
    return axiosTokenInstance
        .get("http://18.206.191.75:80/api/accounts/testnet/offers")
        .then(extract);
};

export const fetchReplenishHistory = async () => {
    userData = await localstorage.decrypted.get();
    let data = { userId: userData.userId, timeStamp: p2phelper.createTimestampNano() };
    let request_param = forge.util.encode64(forge.util.encodeUtf8(JSON.stringify(data)));
    let signatureHex = forge.util.bytesToHex(createSignature(request_param));
    let postData = {
        base64JsonContent: request_param,
        signature: signatureHex,
        method: "getCompleteCreditHistory",
    };
    return axiosTokenInstance.post(await getBaseUrl(), postData).then(extract);
    //return Promise.resolve(true);
};

export const fetchCreditHistory = async (reqData) => {
    userData = await localstorage.decrypted.get();
    let data = {
        userId: userData.userId,
        timeStamp: p2phelper.createTimestampNano(),
        ...(reqData && reqData.merchantId && {merchantId: reqData.merchantId}),
        ...(reqData.duration!="All" && {fromDate : Math.floor((Date.now() - durationMapping[reqData.duration])/1000)}),
        ...(reqData.duration!="All" && {toDate : Math.floor((Date.now())/1000)}),
     };
    let request_param = forge.util.encode64(forge.util.encodeUtf8(JSON.stringify(data)));
    let signatureHex = forge.util.bytesToHex(createSignature(request_param));
    let postData = {
        base64JsonContent: request_param,
        signature: signatureHex,
        method: "getCreditReferrelsHistory",
    };
    return axiosTokenInstance.post(await getBaseUrl(), postData).then(extract);
    //return Promise.resolve(true);
};


export const fetchMerchantDetails = async (params) => {
    let userDataRaw = await localstorage._get("_decrypted");
    userData = userDataRaw._decrypted;
    let merchantAccIdArr = params.merchantAcctId.split(".");
    let merchantAccIdLast = merchantAccIdArr[2];
    let merchantAccIdInt = parseInt(merchantAccIdLast);

    let accountId = {
        shard: 0,
        realm: 0,
        accountNumber: merchantAccIdInt,
    };
    let tsmili = String(Date.now())

    let data = {
        userId: (userData && userData.userId) ? userData.userId : null,
        timeStamp: parseFloat(tsmili.slice(0,10) + "." + tsmili.slice(10)),
        accountId: accountId,
        walletCurrency: params.walletCurrency
    };

    let request_param = forge.util.encode64(forge.util.encodeUtf8(JSON.stringify(data)));
    if (userData) {
        let signatureHex = forge.util.bytesToHex(createSignature(request_param));
        let postData = {
            base64JsonContent: request_param,
            signature: signatureHex,
            method: "getMerchantDetails",
        };
        return axiosTokenInstance.post(await getBaseUrl(), postData).then(extract);
    }
};

export const submitHelpTicket = async ({reason, contactOption, otherReason, message, itemId, paymentRef}) => {
    userData = await localstorage.decrypted.get();
    let tsmili = String(Date.now())
    let data = {
        userType : "Consumer",
        reason,
        contactPreference: contactOption,
        ...(otherReason && {otherReason}),
        ...(message && {message}),
        ...(itemId && {transactionLabel : itemId}),
        ...(paymentRef && {transactionId: paymentRef}),
        userId: userData.userId,
        timeStamp : parseFloat(tsmili.slice(0,10) + "." + tsmili.slice(10))
    };

    let request_param = forge.util.encode64(forge.util.encodeUtf8(JSON.stringify(data)));
    let signatureHex = forge.util.bytesToHex(createSignature(request_param));
    let postData = {
        base64JsonContent: request_param,
        signature: signatureHex,
        method: "submitHelpTicket",
    };
    return axiosTokenInstance.post(await getBaseUrl(), postData).then(extract);
};


export const updateUserName = async (firstName,lastName) => {
    userData = await localstorage.decrypted.get();
    let tsmili = String(Date.now())
    let data = {
        firstName,
        lastName,
        userId: userData.userId,
        timeStamp : parseFloat(tsmili.slice(0,10) + "." + tsmili.slice(10))
    };

    let request_param = forge.util.encode64(forge.util.encodeUtf8(JSON.stringify(data)));

    let signatureHex = forge.util.bytesToHex(createSignature(request_param));
    let postData = {
        base64JsonContent: request_param,
        signature: signatureHex,
        method: "updateUserName",
    };
    return axiosTokenInstance.post(await getBaseUrl(), postData).then(extract);
};

export const updateNotificationPreference = async ({lowBalanceNotification, purchaseNotification, replenishedNotification, contactOption}) => {
    userData = await localstorage.decrypted.get();
    let tsmili = String(Date.now())
    let data = {
        lowbalanceNotification : lowBalanceNotification,
        largePurchaseNotification: purchaseNotification,
        replenishNotification : replenishedNotification,
        notificationPreference : contactOption,
        userId: userData.userId,
        timeStamp : parseFloat(tsmili.slice(0,10) + "." + tsmili.slice(10))
    };

    let request_param = forge.util.encode64(forge.util.encodeUtf8(JSON.stringify(data)));
    let signatureHex = forge.util.bytesToHex(createSignature(request_param));
    let postData = {
        base64JsonContent: request_param,
        signature: signatureHex,
        method: "setNotificationPreferences",
    };
    return axiosTokenInstance.post(await getBaseUrl(), postData).then(extract);
};

export const replenishUserCard = async (replenishAmt, lastFourDigits) => {
    userData = await localstorage.decrypted.get();
    let tsmili = String(Date.now())
    let amount = parseFloat(replenishAmt);
    let data = {
        userId: userData.userId,
        amount,
        lastFourDigitsOfCC: lastFourDigits,
        timeStamp : parseFloat(tsmili.slice(0,10) + "." + tsmili.slice(10))
    };

    let request_param = forge.util.encode64(forge.util.encodeUtf8(JSON.stringify(data)));

    let signatureHex = forge.util.bytesToHex(createSignature(request_param));
    let postData = {
        base64JsonContent: request_param,
        signature: signatureHex,
        method: "replenishActWithSavedCC",
    };
    return axiosTokenInstance.post(await getBaseUrl(), postData).then(extract);
};

export const getClientSecret3DSecureForSavedCard = async (replenishAmt, lastFourDigits, {payOnDemandFunding, payOnDemand}) => {
    userData = await localstorage.decrypted.get();
    let tsmili = String(Date.now())
    let amount = parseFloat(replenishAmt);
    let data = {
        userId: userData.userId,
        amount,
        payOnDemandFunding: payOnDemandFunding ? payOnDemandFunding : false,
        payOnDemand : payOnDemand ? payOnDemand : null,
        lastFourDigitsOfCC: lastFourDigits,
        timeStamp : parseFloat(tsmili.slice(0,10) + "." + tsmili.slice(10))
    };

    let request_param = forge.util.encode64(forge.util.encodeUtf8(JSON.stringify(data)));

    let signatureHex = forge.util.bytesToHex(createSignature(request_param));
    let postData = {
        base64JsonContent: request_param,
        signature: signatureHex,
        method: "getClientSecret3DSecureForSavedCard",
    };
    return axiosTokenInstance.post(await getBaseUrl(), postData).then(extract);
};

export const confirm3DSecurePayment = async (data) => {
    userData = await localstorage.decrypted.get();
    let tsmili = String(Date.now());
    let reqData = {
        ...data,
        userId: userData.userId,
        timeStamp : parseFloat(tsmili.slice(0,10) + "." + tsmili.slice(10))
    };

    let request_param = forge.util.encode64(forge.util.encodeUtf8(JSON.stringify(reqData)));

    let signatureHex = forge.util.bytesToHex(createSignature(request_param));
    let postData = {
        base64JsonContent: request_param,
        signature: signatureHex,
        method: "confirm3DSecurePayment",
    };
    return axiosTokenInstance.post(await getBaseUrl(), postData).then(extract);
};

export const replenishUserACH = async (data) => {
    userData = await localstorage.decrypted.get();
    let tsmili = String(Date.now())

    let reqObj = {
        ...data,
        userId: userData.userId,
        timeStamp:parseFloat(tsmili.slice(0,10) + "." + tsmili.slice(10)),
    };
    let request_param = forge.util.encode64(forge.util.encodeUtf8(JSON.stringify(reqObj)));

    let signatureHex = forge.util.bytesToHex(createSignature(request_param));
    let postData = {
        base64JsonContent: request_param,
        signature: signatureHex,
        method: "replenishUserAmountWithSavedACHAcct",
    };
    return axiosTokenInstance.post(await getBaseUrl(), postData).then(extract);
};


export const fetchFeeDetails = async () => {
    userData = await localstorage.decrypted.get();
    let tsmili = String(Date.now())
    let data = {
        userId: userData.userId,
        timeStamp : parseFloat(tsmili.slice(0,10) + "." + tsmili.slice(10))
    };

    let request_param = forge.util.encode64(forge.util.encodeUtf8(JSON.stringify(data)));

    let signatureHex = forge.util.bytesToHex(createSignature(request_param));
    let postData = {
        base64JsonContent: request_param,
        signature: signatureHex,
        method: "getFeeDetails",
    };
    return axiosTokenInstance.post(await getBaseUrl(), postData).then(extract);
};

export const fetchNodes = async () => {
    userData = await localstorage.decrypted.get();
    let tsmili = String(Date.now())
    let data = {
        userId: userData.userId,
        timeStamp : parseFloat(tsmili.slice(0,10) + "." + tsmili.slice(10))
    };

    let request_param = forge.util.encode64(forge.util.encodeUtf8(JSON.stringify(data)));

    let signatureHex = forge.util.bytesToHex(createSignature(request_param));
    let postData = {
        base64JsonContent: request_param,
        signature: signatureHex,
        method: "getHHAddressBook",
    };
    return axiosTokenInstance.post(await getBaseUrl(), postData).then(extract);
};

export const fetchExchangeRate = async (fiatCurrency, cryptoCurrency) => {
    // return axios.get(`${await getBaseAPIUrl()}/info/fiatExchangeRate?fiatCurrency=${fiatCurrency}`).then(extract);
    let url = `${await getBaseAPIUrl()}/info/exchangeRate?fiatCurrency=${fiatCurrency}`;
    if (cryptoCurrency) {
        url += `&cryptoCurrency=${cryptoCurrency}`;
    }
    return axios.get(url).then(extract);
};

export const processSignedPayment = async (p2p) => {
    if (p2p) {
        const postData = {
            paymentData: p2p,
            methodName: "payMerchant",
        };
        return axios.post(await getBaseUrl("payment"), postData).then(extract);
    } else {
        return {};
    }
};

export const fetchCountryCurrencyList = async () => {
    return axiosTokenInstance.post(await getBaseUrl("countryCurrency"), { methodName: "getCountryCurrencyMap" }).then(extract);
};

export const fetchUserWalletList = async () => {
    let tsmili = String(Date.now())
    let userData = await localstorage.decrypted.get();
    let reqData = { userId: userData.userId, timeStamp: parseFloat(tsmili.slice(0,10) + "." + tsmili.slice(10))};
    let request_param = forge.util.encode64(forge.util.encodeUtf8(JSON.stringify(reqData)));
    let signatureHex = forge.util.bytesToHex(createSignature(request_param));
    let postData = {
        base64JsonContent: request_param,
        signature: signatureHex,
        method: "getUserWalletList",
    };
    return axiosTokenInstance.post(await getBaseUrl(), postData).then(extract);
};

export const saveCurrencyWallet = async (data) => {
    let tsmili = String(Date.now())
    let userData = await localstorage.decrypted.get();
    let reqData = { userId: userData.userId, timeStamp: parseFloat(tsmili.slice(0,10) + "." + tsmili.slice(10)), ...data};
    let request_param = forge.util.encode64(forge.util.encodeUtf8(JSON.stringify(reqData)));
    let signatureHex = forge.util.bytesToHex(createSignature(request_param));
    let postData = {
        base64JsonContent: request_param,
        signature: signatureHex,
        method: "addNewCurrencyWallet",
    };
    return axiosTokenInstance.post(await getBaseUrl(), postData).then(extract);
};

export const setWalletAsDefault = async (data) => {
    let tsmili = String(Date.now())
    let userData = await localstorage.decrypted.get();
    let reqData = { userId: userData.userId, timeStamp: parseFloat(tsmili.slice(0,10) + "." + tsmili.slice(10)), ...data};
    let request_param = forge.util.encode64(forge.util.encodeUtf8(JSON.stringify(reqData)));
    let signatureHex = forge.util.bytesToHex(createSignature(request_param));
    let postData = {
        base64JsonContent: request_param,
        signature: signatureHex,
        method: "setActiveCurrencyWallet",
    };
    return axiosTokenInstance.post(await getBaseUrl(), postData).then(extract);
};

export const fetchGeoInfo = async () => {
    return axios.get("https://get.geojs.io/v1/ip/country.json").then(extract);
};

export const redeemNow = async (data) => {
    let tsmili = String(Date.now())
    let userData = await localstorage.decrypted.get();
    let reqData = { userId: userData.userId, timeStamp: parseFloat(tsmili.slice(0,10) + "." + tsmili.slice(10)), ...data};
    let request_param = forge.util.encode64(forge.util.encodeUtf8(JSON.stringify(reqData)));
    let signatureHex = forge.util.bytesToHex(createSignature(request_param));
    let postData = {
        base64JsonContent: request_param,
        signature: signatureHex,
        method: "redeemNow",
    };
    return axiosTokenInstance.post(await getBaseUrl(), postData).then(extract);
};

export const fetchExchangeRateForCurrencyPair = async (data) => {
    return axiosTokenInstance.post(await getBaseUrl("countryCurrency"), { methodName: "getCurrencyExchangePairForPayment", requestData: JSON.stringify(data) }).then(extract);
};

export const getOperatorFundingOptions = async (data) => {
    return axiosTokenInstance.post(await getBaseUrl("countryCurrency"), { methodName: "getOperatorFundingOptions", requestData: JSON.stringify(data) }).then(extract);
};

export const getUnionPayForm = async (data) => {
    let userData = await localstorage.decrypted.get();
    return axiosTokenInstance.get(`${await getBaseAPIUrl()}/api/v1/aleta/users/${userData.userId}/cardNumbers/${data.ccNumber}/${data.amount}`).then(extract);
};

export const getUnionPayFormUrl = async (data) => {
    let userData = await localstorage.decrypted.get();
    return `${await getBaseAPIUrl()}/api/v1/aleta/users/${userData.userId}/cardNumbers/${data.ccNumber}/${data.amount}`;
};

// Offers APIs
export const getCustomerOffers = async (data) => {
    // let url = `${await getBaseAPIUrl()}/api/v1/offers/customers/${data.userAccount}/${data.currency}/${data.country}?`;
    // let params = []
    // if (data.merchantId) {
    //     params.push(`merchantId=${data.merchantId}`);
    // }
    // if (data.status) {
    //     params.push(`status=${data.status}`);
    // }
    // return axiosTokenInstance.get(`${url}${params.join('&')}`).then(extract);

    userData = await localstorage.decrypted.get();
    return axiosTokenInstance.patch(`${await getBaseAPIUrl()}/api/v1/offers/users/getOffersBasedOnStatus`, prepareDataForOffers(data)).then(extract);
};

export const checkForNewOffers = async (data) => {
    userData = await localstorage.decrypted.get();
    return axiosTokenInstance.patch(`${await getBaseAPIUrl()}/api/v1/offers/users/checkForNewOffers`, prepareDataForOffers(data)).then(extract);
};

export const getDiscountedAmt = async (data) => {
    userData = await localstorage.decrypted.get();
    return axiosTokenInstance.patch(`${await getBaseAPIUrl()}/api/v1/offers/users/discount`, prepareDataForOffers(data)).then(extract);
};

export const getGeneratedOffers = async (data) => {
    userData = await localstorage.decrypted.get();
    return axiosTokenInstance.patch(`${await getBaseAPIUrl()}/api/v1/offers/users/generate`, prepareDataForOffers(data)).then(extract);
};

export const activateOffer = async (data) => {
    userData = await localstorage.decrypted.get();
    return axiosTokenInstance.post(`${await getBaseAPIUrl()}/api/v1/offers/users/activate`, prepareDataForOffers(data)).then(extract);
};

export const fetchActiveRecurringPayments = async (data) => {
    userData = await localstorage.decrypted.get();
    return axiosTokenInstance.post(`${await getBaseAPIUrl("rps")}/api/rps/v1/payments/search`, prepareDataForRPS(data)).then(extract);
};

export const hasCryptoRecurringPayment = async () => {
    userData = await localstorage.decrypted.get();
    let data = {userId: userData.userId};
    return axiosTokenInstance.post(`${await getBaseAPIUrl("rps")}/api/rps/v1/payments/hasCrypto`, prepareDataInHex(data)).then(extract);
};

export const hasRecurringPayment = async () => {
    userData = await localstorage.decrypted.get();
    let data = {userId: userData.userId};
    return axiosTokenInstance.post(`${await getBaseAPIUrl("rps")}/api/rps/v1/payments/hasDroppSignature`, prepareDataInHex(data)).then(extract);
};

export const cancelRecurringPayment = async (data) => {
    userData = await localstorage.decrypted.get();
    return axiosTokenInstance.patch(`${await getBaseAPIUrl("rps")}/api/rps/v1/payments`, prepareDataForRPS(data)).then(extract);
};

export const fetchDroppPublicKey = async () => {
    return axios.get(`${await getBaseAPIUrl()}/info/publicKey`).then(extract);
};

export const fetchGroupedPurchaseHistory = async reqData => {
    userData = await localstorage.decrypted.get();
    let tsmili = String(Date.now())
    let data = {
      userId: userData.userId,
      timeStamp:parseFloat(tsmili.slice(0,10) + "." + tsmili.slice(10)),
      ...((reqData.startIndex || reqData.startIndex == 0) && {startIndex: reqData.startIndex}),
      ...((reqData.endIndex || reqData.endIndex == 0) && {endIndex: reqData.endIndex}),
      ...(reqData.duration!="All" && {fromDate : Math.floor((Date.now() - durationMapping[reqData.duration])/1000)}),
      ...(reqData.duration!="All" && {toDate : Math.floor((Date.now())/1000)}),
    };
    let request_param = forge.util.encode64(forge.util.encodeUtf8(JSON.stringify(data)));
    let signatureHex = forge.util.bytesToHex(createSignature(request_param));
    let postData = {
        base64JsonContent: request_param,
        signature: signatureHex,
        method: "getGroupedPurchaseHistory"
    };
    return axiosTokenInstance.post(await getBaseUrl(), postData).then(response => {
        return extract(response);
    });
};

export const fetchGroupedCreditHistory = async (reqData) => {
    userData = await localstorage.decrypted.get();
    let data = { userId: userData.userId,
                 timeStamp: p2phelper.createTimestampNano(),
                 ...(reqData.duration!="All" && {fromDate : Math.floor((Date.now() - durationMapping[reqData.duration])/1000)}),
                 ...(reqData.duration!="All" && {toDate : Math.floor((Date.now())/1000)}), };
    let request_param = forge.util.encode64(forge.util.encodeUtf8(JSON.stringify(data)));
    let signatureHex = forge.util.bytesToHex(createSignature(request_param));
    let postData = {
        base64JsonContent: request_param,
        signature: signatureHex,
        method: "getGroupedCreditReferralHistory",
    };
    return axiosTokenInstance.post(await getBaseUrl(), postData).then(extract);
};

export const removeDroppAsCosigner = async (reqData) => {
    userData = await localstorage.decrypted.get();
    let data = { userId: userData.userId, timeStamp: p2phelper.createTimestampNano(), ...reqData };
    let request_param = forge.util.encode64(forge.util.encodeUtf8(JSON.stringify(data)));
    let signatureHex = forge.util.bytesToHex(createSignature(request_param));
    let postData = {
        base64JsonContent: request_param,
        signature: signatureHex,
        method: "removeDroppAsCosigner",
    };
    return axiosTokenInstance.post(await getBaseUrl(), postData).then(extract);
};

export const getHbarBalance = async (data) => {
    let tsmili = String(Date.now())
    let reqData = { timeStamp: parseFloat(tsmili.slice(0,10) + "." + tsmili.slice(10)), ...data};
    let request_param = forge.util.encode64(forge.util.encodeUtf8(JSON.stringify(reqData)));
    let signatureHex = forge.util.bytesToHex(createSignature(request_param));
    let postData = {
        base64JsonContent: request_param,
        signature: signatureHex,
        method: "getCryptoBalance",
    };
    return axiosTokenInstance.post(await getBaseUrl(), postData).then(extract);
};

export const getCryptoBalance = async (data) => {
    let tsmili = String(Date.now())
    userData = await localstorage.decrypted.get();
    let reqData = { timeStamp: parseFloat(tsmili.slice(0,10) + "." + tsmili.slice(10)), ...data};
    let request_param = forge.util.encode64(forge.util.encodeUtf8(JSON.stringify(reqData)));
    let signatureHex = forge.util.bytesToHex(createSignature(request_param));
    let postData = {
        base64JsonContent: request_param,
        signature: signatureHex,
        method: "getCryptoBalance",
    };
    return axiosTokenInstance.post(await getBaseUrl(), postData).then(extract);
};

export const getMaxCryptoTransferFee = async () => {
    return axios.get(`${await getBaseAPIUrl()}/info/maxCryptoTransferFee`).then(extract);
};

export const transferHBAR = async (data) => {
    let tsmili = String(Date.now());
    userData = await localstorage.decrypted.get();
    let reqData = { userId: userData.userId, timeStamp: parseFloat(tsmili.slice(0,10) + "." + tsmili.slice(10)), ...data};
    let request_param = forge.util.encode64(forge.util.encodeUtf8(JSON.stringify(reqData)));
    let signatureHex = forge.util.bytesToHex(createSignature(request_param));
    let postData = {
        base64JsonContent: request_param,
        signature: signatureHex,
        method: "transferHBAR",
    };
    return axiosTokenInstance.post(await getBaseUrl(), postData).then(extract);
};

export const removeACH = async (data) => {
    let tsmili = String(Date.now());
    userData = await localstorage.decrypted.get();
    let reqData = { userId: userData.userId, timeStamp: parseFloat(tsmili.slice(0,10) + "." + tsmili.slice(10)), ...data};
    let request_param = forge.util.encode64(forge.util.encodeUtf8(JSON.stringify(reqData)));
    let signatureHex = forge.util.bytesToHex(createSignature(request_param));
    let postData = {
        base64JsonContent: request_param,
        signature: signatureHex,
        method: "cancelACHAccount",
    };
    return axiosTokenInstance.post(await getBaseUrl(), postData).then(extract);
};

export const removeCC = async (data) => {
    let tsmili = String(Date.now());
    userData = await localstorage.decrypted.get();
    let reqData = { userId: userData.userId, timeStamp: parseFloat(tsmili.slice(0,10) + "." + tsmili.slice(10)), ...data};
    let request_param = forge.util.encode64(forge.util.encodeUtf8(JSON.stringify(reqData)));
    let signatureHex = forge.util.bytesToHex(createSignature(request_param));
    let postData = {
        base64JsonContent: request_param,
        signature: signatureHex,
        method: "cancelCreditCard",
    };
    return axiosTokenInstance.post(await getBaseUrl(), postData).then(extract);
};

// USDC APIs
export const getUsdcBalance = async (data) => {
    let url = `${await getBaseAPIUrl("USDC")}/api/userwallet/v1/tokens/${data.hhAccountID}/balance`;
    return axiosTokenInstance.get(url).then(extract);
};

export const getEthereumAddress = async () => {
    let tsmili = String(Date.now());
    userData = await localstorage.decrypted.get();
    let reqData = { userId: userData.userId, timeStamp: parseFloat(tsmili.slice(0,10) + "." + tsmili.slice(10))};
    return axiosTokenInstance.patch(`${await getBaseAPIUrl("USDC")}/api/userwallet/v1/depositAddress`, prepareDataForUSDC(reqData)).then(extract);
};

export const generateEthereumAddress = async () => {
    let tsmili = String(Date.now());
    userData = await localstorage.decrypted.get();
    let reqData = { userId: userData.userId, timeStamp: parseFloat(tsmili.slice(0,10) + "." + tsmili.slice(10))};
    return axiosTokenInstance.post(`${await getBaseAPIUrl("USDC")}/api/userwallet/v1/depositAddress`, prepareDataForUSDC(reqData)).then(extract);
};

export const checkUSDCTokenAssociation = async (data) => {
    let url = `${await getBaseAPIUrl("USDC")}/api/userwallet/v1/tokens/associations/check`;
    let tsmili = String(Date.now());
    userData = await localstorage.decrypted.get();
    let reqData = { userId: userData.userId, timeStamp: parseFloat(tsmili.slice(0,10) + "." + tsmili.slice(10)), ...data};
    return axiosTokenInstance.post(url, prepareDataForUSDC(reqData)).then(extract);
};

export const getLastTransferDetails = async () => {
    let tsmili = String(Date.now());
    userData = await localstorage.decrypted.get();
    let reqData = { userId: userData.userId, timeStamp: parseFloat(tsmili.slice(0,10) + "." + tsmili.slice(10))};
    return axiosTokenInstance.patch(`${await getBaseAPIUrl("USDC")}/api/userwallet/v1/wallet/transfer/status`, prepareDataForUSDC(reqData)).then(extract);
};

export const getTransferHistory = async (data) => {
    let tsmili = String(Date.now());
    userData = await localstorage.decrypted.get();
    let reqData = { userId: userData.userId, timeStamp: parseFloat(tsmili.slice(0,10) + "." + tsmili.slice(10)), ...data};
    return axiosTokenInstance.patch(`${await getBaseAPIUrl("USDC")}/api/userwallet/v1/wallet/transfer`, prepareDataForUSDC(reqData)).then(extract);
};

export const transferETH = async (data) => {
    const tsmili = Date.now();
    const date = new Date(tsmili);
    const requestTime = date.toISOString().replace(/\.\d+/, "." + tsmili % 1000).replace("Z", "Z");
    userData = await localstorage.decrypted.get();
    let reqData = { userId: userData.userId, requestTime: requestTime, ...data};
    // return axiosTokenInstance.post(`${await getBaseAPIUrl("USDC")}/api/userwallet/v1/payout`, prepareDataForUSDC(reqData)).then(extract);
    return axiosTokenInstance.post(`${await getBaseAPIUrl("USDC")}/api/userwallet/v1/transferOut/user`, prepareDataForUSDC(reqData)).then(extract);
};

export const getUSDCTransferFee = async () => {
    let tsmili = String(Date.now());
    userData = await localstorage.decrypted.get();
    let reqData = { userId: userData.userId, timeStamp: parseFloat(tsmili.slice(0,10) + "." + tsmili.slice(10))};
    return axiosTokenInstance.post(`${await getBaseAPIUrl("USDC")}/api/userwallet/v1/payout/fee`, prepareDataForUSDC(reqData)).then(extract);
};

export const confirmDepositAmt = async (data) => {
    let tsmili = String(Date.now())
    userData = await localstorage.decrypted.get();
    let reqData = { userId: userData.userId, timeStamp: parseFloat(tsmili.slice(0,10) + "." + tsmili.slice(10)), ...data};
    return axiosTokenInstance.put(`${await getBaseAPIUrl("USDC")}/api/userwallet/v1/wallet/transfer`, prepareDataForUSDC(reqData)).then(extract);
};

export const checkIfACHRequiredForRedemption = async() => {
    let tsmili = String(Date.now())
    userData = await localstorage.decrypted.get();
    let reqData = { userId: userData.userId, timeStamp: parseFloat(tsmili.slice(0,10) + "." + tsmili.slice(10))};
    let request_param = forge.util.encode64(forge.util.encodeUtf8(JSON.stringify(reqData)));
    let signatureHex = forge.util.bytesToHex(createSignature(request_param));
    let postData = {
        base64JsonContent: request_param,
        signature: signatureHex,
        // method: "checkIfACHRequiredForRedemption",
        method: "checkIfACHReqAndCreditsApprovedForRedemption",
    };
    return axiosTokenInstance.post(await getBaseUrl(), postData).then(extract);
};

export const fetchMerchantList = async () => {
    userData = await localstorage.decrypted.get();
    let tsmili = String(Date.now())
    let data = {
      userId: userData.userId,
      timeStamp:parseFloat(tsmili.slice(0,10) + "." + tsmili.slice(10)),
    };
    let request_param = forge.util.encode64(forge.util.encodeUtf8(JSON.stringify(data)));
    let signatureHex = forge.util.bytesToHex(createSignature(request_param));
    let postData = {
        base64JsonContent: request_param,
        signature: signatureHex,
        method: "getMerchantList",
    };
    return axiosTokenInstance.post(await getBaseUrl(), postData).then(response => {
        return extract(response);
    });
}

export const getQrCode = async (qrDataReq, switchToSandbox) => {
    const baseUrl = await getBaseAPIUrl("qrPolling", switchToSandbox);
    return axiosTokenInstance.patch(`${baseUrl}/api/walletext/v1/qrcode`, qrDataReq).then(extract);
};

export const associateDroppCreditToken = async (data) => {
    userData = await localstorage.decrypted.get();
    if (userData) {
        let tsmili = String(Date.now())
        let reqData = { ...data, userId: userData.userId, timeStamp: parseFloat(tsmili.slice(0,10) + "." + tsmili.slice(10))};
        let requestParam = forge.util.encode64(forge.util.encodeUtf8(JSON.stringify(reqData)));
        let signatureHex = forge.util.bytesToHex(createSignature(requestParam));
        let postData = {
            data: requestParam,
            signature: signatureHex,
            methodName: "associateDroppCreditToken",
        };
        return axiosTokenInstance.post(await getBaseUrl("associateToken"), postData).then(extract);
    } else {
        return {};
    }
};

export const associateToken = async (data) => {
    userData = await localstorage.decrypted.get();
    if (userData) {
        let tsmili = String(Date.now())
        let reqData = { ...data, userId: userData.userId, timeStamp: parseFloat(tsmili.slice(0,10) + "." + tsmili.slice(10))};
        let requestParam = forge.util.encode64(forge.util.encodeUtf8(JSON.stringify(reqData)));
        let signatureHex = forge.util.bytesToHex(createSignature(requestParam));
        let postData = {
            data: requestParam,
            signature: signatureHex,
            methodName: "associateToken",
        };
        return axiosTokenInstance.post(await getBaseUrl("associateToken"), postData).then(extract);
    } else {
        return {};
    }
};

export const getAssociatedTokenCount = async () => {
    userData = await localstorage.decrypted.get();
    if (userData) {
        let tsmili = String(Date.now())
        let reqData = { userId: userData.userId, timeStamp: parseFloat(tsmili.slice(0,10) + "." + tsmili.slice(10))};
        return axiosTokenInstance.post(await getBaseUrl(), prepareDataInBase64JsonContent(reqData, "getAutomaticTokenAssociationCount")).then(extract);
    }
};

export const disAssociateToken = async (data) => {
    userData = await localstorage.decrypted.get();
    if (userData) {
        let tsmili = String(Date.now());
        let reqData = { ...data, userId: userData.userId, timeStamp: parseFloat(tsmili.slice(0,10) + "." + tsmili.slice(10))};
        let requestParam = forge.util.encode64(forge.util.encodeUtf8(JSON.stringify(reqData)));
        let signatureHex = forge.util.bytesToHex(createSignature(requestParam));
        let postData = {
            data: requestParam,
            signature: signatureHex,
            methodName: "disAssociateToken",
        };
        return axiosTokenInstance.post(await getBaseUrl("associateToken"), postData).then(extract);
    }
};

export const updateUserToRemoveAssociateTokenAutomatically = async (data) => {
    userData = await localstorage.decrypted.get();
    if (userData) {
        let tsmili = String(Date.now())
        let reqData = {...data, userId: userData.userId, timeStamp: parseFloat(tsmili.slice(0,10) + "." + tsmili.slice(10))};
        let requestParam = forge.util.encode64(forge.util.encodeUtf8(JSON.stringify(reqData)));
        let signatureHex = forge.util.bytesToHex(createSignature(requestParam));
        let postData = {
            data: requestParam,
            signature: signatureHex,
            methodName: "updateUserToRemoveAssociateTokenAutomatically",
        };
        return axiosTokenInstance.post(await getBaseUrl("associateToken"), postData).then(extract);
    }
};

// NFTs
export const fetchNFTs = async (data) => {
    userData = await localstorage.decrypted.get();
    if (userData) {
        let reqData = { ...data, userId: userData.userId, requestTime: (new Date()).toISOString()};
        return axiosTokenInstance.post(`${await getBaseAPIUrl()}/api/userwallet/v1/DG/nfts`, prepareDataForUSDC(reqData)).then(extract);
    } else {
        return {};
    }
}

export const getNFTFees = async (data) => {
    userData = await localstorage.decrypted.get();
    if (userData) {
        let tsmili = String(Date.now())
        let reqData = {
            userId: userData.userId,
            timeStamp: parseFloat(tsmili.slice(0, 10) + "." + tsmili.slice(10)),
            ...data
        };
        return axiosTokenInstance.post(await getBaseUrl(), prepareDataInBase64JsonContent(reqData, "getNFTDetailsAndFee"));
    }
};

export const getFeeDetails = async (data) => {
    userData = await localstorage.decrypted.get();
    if (userData) {
        let tsmili = String(Date.now());
        let reqData = {
            userId: userData.userId,
            timeStamp: parseFloat(tsmili.slice(0, 10) + "." + tsmili.slice(10)),
            ...data
        };
        return axiosTokenInstance.post(await getBaseUrl(), prepareDataInBase64JsonContent(reqData, "getFeeDetails"));
    }
};

export const getAccountBalanceAndTokenInfo = async (data) => {
    userData = await localstorage.decrypted.get();
    if (userData) {
        let tsmili = String(Date.now());
        let reqData = {
            userId: userData.userId,
            timeStamp : parseFloat(tsmili.slice(0, 10) + "." + tsmili.slice(10)),
            ...data
        };
        return axiosTokenInstance.post(await getBaseUrl(), prepareDataInBase64JsonContent(reqData, "getAccountBalanceAndTokenInfo"))
    }
};

export const createScheduleTxForNFTTrade = async (data) => {
    userData = await localstorage.decrypted.get();
    if(userData){
        let tsmili = String(Date.now());
        let reqData = {
            userId: userData.userId,
            timeStamp : parseFloat(tsmili.slice(0,10) + "." + tsmili.slice(10)),
            ...data
        };
        return axiosTokenInstance.post(await getBaseUrl(), prepareDataInBase64JsonContent(reqData, "createScheduleTxForNFTTrade"));
    }
};

export const getScheduleTxnInfo = async (data) => {
    userData = await localstorage.decrypted.get();
    if (userData) {
        let tsmili = String(Date.now());
        let reqData = { ...data, userId: userData.userId, timeStamp : parseFloat(tsmili.slice(0,10) + "." + tsmili.slice(10))};
        return axiosTokenInstance.post(await getBaseUrl(), prepareDataInBase64JsonContent(reqData, "getScheduleInfo"));
    } else {
        return {};
    }
}

export const signScheduleTxForNFTTrade = async (data) => {
    userData = await localstorage.decrypted.get();
    if (userData) {
        let tsmili = String(Date.now());
        let reqData = { ...data, userId: userData.userId, timeStamp : parseFloat(tsmili.slice(0,10) + "." + tsmili.slice(10))};
        return axiosTokenInstance.post(await getBaseUrl(), prepareDataInBase64JsonContent(reqData, "signScheduleTxForNFTTrade"));
    } else {
        return {};
    }
}

export const getNFTInfo = async (data) => {
    userData = await localstorage.decrypted.get();
    if (userData) {
        let tsmili = String(Date.now());
        let reqData = { ...data, userId: userData.userId, timeStamp : parseFloat(tsmili.slice(0,10) + "." + tsmili.slice(10))};
        return axiosTokenInstance.post(await getBaseUrl(), prepareDataInBase64JsonContent(reqData, "getNFTInfo"));
    } else {
        return {};
    }
}

export const getPayerNFTHistory = async reqData => {
    userData = await localstorage.decrypted.get();
    let tsmili = String(Date.now())
    let data = {
      userId: userData.userId,
      timeStamp:parseFloat(tsmili.slice(0,10) + "." + tsmili.slice(10)),
      ...((reqData.startIndex || reqData.startIndex == 0) && {startIndex: reqData.startIndex}),
      ...((reqData.endIndex || reqData.endIndex == 0) && {endIndex: reqData.endIndex}),
    };
    return axiosTokenInstance.post(await getBaseUrl(), prepareDataInBase64JsonContent(data,"getPayerNFTHistory")).then(extract);
};

export const getPayerNFTTokens = async () => {
    userData = await localstorage.decrypted.get();
    let tsmili = String(Date.now())
    let data = {
        userId: userData.userId,
        timeStamp:parseFloat(tsmili.slice(0,10) + "." + tsmili.slice(10))
    }
    return axiosTokenInstance.post(await getBaseUrl(), prepareDataInBase64JsonContent(data, "getPayerNFTTokens"));
}

export const getAllTransactionsHistory = async (reqData) => {
    userData = await localstorage.decrypted.get();
    let tsmili = String(Date.now())
    let data = {
      userId: userData.userId,
      timeStamp:parseFloat(tsmili.slice(0,10) + "." + tsmili.slice(10)),
      ...((reqData.startIndex || reqData.startIndex == 0) && {startIndex: reqData.startIndex}),
      ...((reqData.endIndex || reqData.endIndex == 0) && {endIndex: reqData.endIndex}),
      ...(reqData.duration!="All" && {fromDate : Math.floor((Date.now() - durationMapping[reqData.duration])/1000)}),
      ...(reqData.duration!="All" && {toDate : Math.floor((Date.now())/1000)}),
      ...(reqData.merchantId && {merchantId: reqData.merchantId}),
    };
    return axiosTokenInstance.post(await getBaseUrl(), prepareDataInBase64JsonContent(data, "getAllTransactionsHistory"));
}

export const createPaymentIntent = async ({chain}) => {
    userData = await localstorage.decrypted.get();
    let tsmili = String(Date.now());
    let data = {
        timeStamp: parseFloat(tsmili.slice(0,10) + "." + tsmili.slice(10)),
        userId : userData.userId,
        chain : chain
    };
    return axiosTokenInstance.post(await getBaseUrl("paymentIntent"), prepareDataForUSDC(data)).then(extract);
    // return axiosTokenInstance.patch(`${await getBaseAPIUrl("USDC")}/api/userwallet/v1/wallet/paymentIntent/depositAddress`, postData).then(extract);
}


export const fetchDepositeAddress = async ({chain}) => {
    userData = await localstorage.decrypted.get();
    let tsmili = String(Date.now());
    let data = {
        timeStamp: parseFloat(tsmili.slice(0,10) + "." + tsmili.slice(10)),
        userId : userData.userId,
        chain : chain
    };
    return axiosTokenInstance.patch(`${await getBaseUrl("paymentIntent")}/depositAddress`, prepareDataForUSDC(data)).then(extract);
}

export const activePaymentIntents = async () => {
    userData = await localstorage.decrypted.get();
    let tsmili = String(Date.now());
    let data = {
        timeStamp: parseFloat(tsmili.slice(0,10) + "." + tsmili.slice(10)),
        userId: userData.userId
    }
    return axiosTokenInstance.patch(`${await getBaseUrl("paymentIntent")}/active`, prepareDataForUSDC(data)).then(extract);
}

export const cancelPaymentIntents = async ({chain}) => {
    userData = await localstorage.decrypted.get();
    let tsmili = String(Date.now());
    let data = {
        timeStamp: parseFloat(tsmili.slice(0,10) + "." + tsmili.slice(10)),
        userId: userData.userId,
        chain: chain
    }
    return axiosTokenInstance.patch(`${await getBaseUrl("paymentIntent")}/cancel`, prepareDataForUSDC(data)).then(extract);
}


export const transferOut = async (data) => {
    let url = `${await getBaseAPIUrl("USDC")}/api/userwallet/v1/transferOut/user`;
    userData = await localstorage.decrypted.get();
    let tsmili = String(Date.now());
    let reqData = {
        timeStamp: parseFloat(tsmili.slice(0,10) + "." + tsmili.slice(10)),
        userId: userData.userId,
        destinationChain:"ETH",
        ...data
    }

    return axiosTokenInstance.post(url, prepareDataForUSDC(reqData)).then(extract)
}

export const getUSDCFees = async (data) => {
    userData = await localstorage.decrypted.get();
    let tsmili = String(Date.now());
    let reqData = {
        userId: userData.userId,
        timeStamp: parseFloat(tsmili.slice(0,10) + "." + tsmili.slice(10)),
        type: data.type,
        chain: data.chain,
        amount: data.amount,
    }
    let url = `${await getBaseAPIUrl("USDC")}/api/userwallet/v1/payout/totalFee`;

    return axiosTokenInstance.post(url, prepareDataForUSDC(reqData)).then(extract);
}

export const getNetworkChains = async () => {
    userData = await localstorage.decrypted.get();
    let tsmili = String(Date.now());
    let reqData = {
        userId: userData.userId,
        timeStamp: parseFloat(tsmili.slice(0,10) + "." + tsmili.slice(10)),
    }
    let url = `${await getBaseAPIUrl("USDC")}/api/userwallet/v1/payout/networkChains`;

    return axiosTokenInstance.patch(url, prepareDataForUSDC(reqData)).then(extract);
}

export const enableSavedCCForPayOnDemand = async (data) => {
    userData = await localstorage.decrypted.get();
    let tsmili = String(Date.now());
    let reqData = {
        userId: userData.userId,
        timeStamp: parseFloat(tsmili.slice(0,10) + "." + tsmili.slice(10)),
        ...data
    }
    return axiosTokenInstance.post(await getBaseUrl(), prepareDataInBase64JsonContent(reqData, "enableSavedCCForPayOnDemand")).then(extract);
}
//added

export const enableSavedACHForPayOnDemand = async (data) => {
    userData = await localstorage.decrypted.get();
    let tsmili = String(Date.now());
    let reqData = {
        userId: userData.userId,
        timeStamp: parseFloat(tsmili.slice(0,10) + "." + tsmili.slice(10)),
        ...data
    }
    return axiosTokenInstance.post(await getBaseUrl(), prepareDataInBase64JsonContent(reqData, "enableSavedACHForPayOnDemand")).then(extract);
}

export const getClientSecretFor3DSecure = async (replenishAmt, data, payOnDemand) => {
    userData = await localstorage.decrypted.get();
    let tsmili = String(Date.now());
    let amount = parseFloat(replenishAmt);
    let reqData = {
        userId: userData.userId,
        amount,
        timeStamp: parseFloat(tsmili.slice(0,10) + "." + tsmili.slice(10)),
        ...data,
        saveCard: payOnDemand,
        payOnDemand,
        withPaymentMethod: true
    }

    return axiosTokenInstance.post(await getBaseUrl(), prepareDataInBase64JsonContent(reqData, "getClientSecretFor3DSecure")).then(extract);
}



// Public APIs

export const fetchNFTDetails = async (url) => axiosTokenInstance.get(url);

export const getDroppConfig = async () => {
    userData = await localstorage.decrypted.get();
    if(userData){
        let data = {
            userId: userData.userId,
            timeStamp : (new Date()).toISOString()
        };
        return axiosTokenInstance.post(await getBaseUrl(), prepareDataInBase64JsonContent(data,"getDroppConfig" )).then(extract);
    }
}

export const checkIfValidUser = async () => {
    const userLocal = await localstorage.decrypted.get();
    if (userLocal && userLocal.testnet) {
        userData = userLocal.testnet;
        let tsmili = String(Date.now())
        let data = { userId: userData.userId, timeStamp: parseFloat(tsmili.slice(0,10) + "." + tsmili.slice(10))};
        let request_param = forge.util.encode64(forge.util.encodeUtf8(JSON.stringify(data)));
        let signatureHex = forge.util.bytesToHex(createSignature(request_param));
        let postData = {
            base64JsonContent: request_param,
            signature: signatureHex,
            method: "checkIfValidAccount",
        };
        return axiosTokenInstance.post(await getBaseUrl("", true), postData).then(extract);
    } else {
        return;
    }
};

export const createLinkToken = async (data) => {
    userData = await localstorage.decrypted.get();
    let tsmili = String(Date.now());
    let reqData = {
        userId: userData.userId,
        timeStamp: parseFloat(tsmili.slice(0,10) + "." + tsmili.slice(10)),
        ...data
    }

    return axiosTokenInstance.post(await getBaseUrl(), prepareDataInBase64JsonContent(reqData, "createLinkToken")).then(extract);
}

export const linkUserBankAccount = async (data) => {
    userData = await localstorage.decrypted.get();
    let tsmili = String(Date.now());
    let reqData = {
        userId: userData.userId,
        timeStamp: parseFloat(tsmili.slice(0,10) + "." + tsmili.slice(10)),
        ...data
    }

    return axiosTokenInstance.post(await getBaseUrl(), prepareDataInBase64JsonContent(reqData, "linkUserBankAccount")).then(extract);
}

export const validateUserBalance = async (data) => {
    userData = await localstorage.decrypted.get();
    let tsmili = String(Date.now());
    let reqData = {
        userId: userData.userId,
        timeStamp: parseFloat(tsmili.slice(0,10) + "." + tsmili.slice(10)),
        ...data
    }

    return axiosTokenInstance.post(await getBaseUrl(), prepareDataInBase64JsonContent(reqData, "validateBalance")).then(extract);
};

export const processInvoicePayment = async (data) => {
    userData = await localstorage.decrypted.get();
    let tsmili = String(Date.now());
    let reqData = {
        paymentData: {
            b2bInvoice: true,
            timeStamp: parseFloat(tsmili.slice(0,10) + "." + tsmili.slice(10)),
            invoiceBytes: data.invoiceBytes,
            payer: data.payer,
            fundAccount: false,
            paidByBusiness: false,
            actionBy: data.actionBy,
            signatures: data.signatures,
        }
    };

    return axiosTokenInstance.post(await getBaseUrl("payment"), {...reqData, methodName: "payB2B"}).then(extract);
}

export const getMerchantOrgName = async (data) => {
    userData = await localstorage.decrypted.get();
    let tsmili = String(Date.now());
    let reqData = {
        userId: userData.userId,
        // timeStamp: parseFloat(tsmili.slice(0,10) + "." + tsmili.slice(10)),
        ...data
    }
    return axiosTokenInstance.post(`${await getBaseAPIUrl()}/api/walletext/private/v1/qrcode/uuId`, prepareDataForRPS(reqData)).then(extract);
}

// Recovery Options

export const fetchValidateEmailPhone = async({phone})=>{
    try {
        let tsmili = String(Date.now());
        const bodyObj = {
            mobileNumber:phone,
            timeStamp: parseFloat(tsmili.slice(0,10) + "." + tsmili.slice(10))
        }

        const requestBody ={
            method: "validateEmailPhone",
            base64JsonContent:forge.util.encode64(forge.util.encodeUtf8(JSON.stringify(bodyObj))),
            signature:"8D90FDD10991F07AB6C6C104BFCF91DED87333A646469DB8C69F1877CCC029C0A84EA84BAFD6D1CCC1691C8CF0577490966C2D011F66161C87B625E5AB64560E"
        }
         const response = await axiosTokenInstance.post(
        await getBaseUrl(),
        requestBody,
        {headers: { "Content-Type": "application/json" } }
        );
        return response.data

    } catch (error) {
        console.error("API error on fetchValidateEmailPhone:", error);
    throw error;
    }

}

export const fetchRecoveryOptions = async ({
  accountId,
  phone = "",
//   userData,    // Must include privateKey
//   localstorage // For storing decrypted data
}) => {
  try {
    userData = await localstorage.decrypted.get();
    if (!userData || !userData.publicKey) {
    throw new Error("userData or userData.publicKey is missing");
    }
    let tsmili = String(Date.now());
    const bodyObj = {
      accountId,
      phoneNo: phone,
      publicKey: userData.publicKey ? userData.publicKey : "",
      timeStamp: parseFloat(tsmili.slice(0,10) + "." + tsmili.slice(10))
    };
    const { base64JsonContent, signature } = prepareDataInBase64JsonContent(bodyObj, "getRecoveryOptions", userData);

    const requestBody = {
      method: "getRecoveryOptions",
      base64JsonContent,
      signature
    };

    const response = await axiosTokenInstance.post(
     await getBaseUrl(),
      requestBody,
      { headers: { "Content-Type": "application/json" } }
    );

    return response.data;
  } catch (error) {
    console.error("API error on fetchRecoveryOptions:", error);
    throw error;
  }
};

export const resendEmailVerification = async (email, userId) => {
  let tsmili = String(Date.now());
  userData = await localstorage.decrypted.get();
  const bodyObj = {
    newEmail: email,
    userId,
    // ipAddress,  // dynamic, with a default value for convenience
    timeStamp: parseFloat(tsmili.slice(0,10) + "." + tsmili.slice(10))
  };
  const { base64JsonContent, signature } = prepareDataInBase64JsonContent(bodyObj, "resendEmailVerificationRequest");

  const requestBody = {
    method: "resendEmailVerificationRequest",
    base64JsonContent,
    signature,

  };
  try {
    return window.AwsWafIntegration.fetch(await getBaseUrl(),{
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'device': userData && userData.droppDeviceId ? userData.droppDeviceId : '',
            'userId': userId,
            'dropp-user-agent': getDroppUserAgent(),

        },
        body: JSON.stringify(requestBody),
    })
  .then(response => response.json())
  .then(data => {
    return data; // Export the API response for use via await
  })
  .catch(error => console.error('API call failed:', error));
    // const response = await axiosTokenInstance.post(
    //   "https://main.qa.dropp.cc/payer/processRequest",
    //   requestBody,
    //   { headers: { "Content-Type": "application/json" } }
    // );
    // console.log("Resend verification API response:index:==>", response);
    // return response.data;
  } catch (error) {
    console.error("API error on resend:", error);
    throw error;
  }
};

export const verifyEmail = async (verificationCode, userId) => {
    let tsmili = String(Date.now());
    userData = await localstorage.decrypted.get();

    const bodyObj = {
        timeStamp: parseFloat(tsmili.slice(0,10) + "." + tsmili.slice(10)),
        userId,
        verificationCode,
    };

    // Prepare base64 encoding and signature using helper
    const { base64JsonContent, signature } = prepareDataInBase64JsonContent(bodyObj, "verifyEmail");

    const requestBody = {
        method: "verifyEmail",
        base64JsonContent,
        signature,
    };

    try {
        const response = await axiosTokenInstance.post(
            await getBaseUrl(),
            requestBody,
            { headers: {
                "Content-Type": "application/json",
                // 'userId': userId,
             } }
        );
        return response.data; // Export the API response for use via await
    } catch (error) {
        console.error("Verify Email error:", error);
        throw error;
    }
};


export const verifyRecoveryOptions = async ({
  cardLast4Digits,
  bankAcctLast4Digits,
  accountId,
  last4Digits,
  userId,
}) => {
  let tsmili = String(Date.now());
  userData = await localstorage.decrypted.get();
  const bodyObj = {
    timeStamp: parseFloat(tsmili.slice(0,10) + "." + tsmili.slice(10)),
    cardLast4Digits,
    bankAcctLast4Digits,
    accountId,
    userId,
    publicKey: userData.publicKey ? userData.publicKey : "",
    last4Digits
  };
  // Prepare base64-encoded content and signature
  const { base64JsonContent, signature } = prepareDataInBase64JsonContent(bodyObj, "verifyRecoveryOptions");

  const requestBody = {
    method: "verifyRecoveryOptions",
    base64JsonContent,
    signature,
  };

  try {
    const response = await axiosTokenInstance.post(
      await getBaseUrl(),
      requestBody,
      { headers: { "Content-Type": "application/json" } }
    );
    return response.data; // Export for usage via await
  } catch (error) {
    console.error("API error on verify recovery:", error);
    throw error;
  }
};

export const submitP2PToMerchant = async (url, p2p) => {
    return axiosTokenInstance.post(url, p2p).then(extract);
};

export const accountRecovered = async ({
  recoveryMethod,
  device = "web",
  location = "",
}) => {
  userData = await localstorage.decrypted.get();

  if (!userData) return {};

  const now = new Date();
  const tsmili = String(Date.now());

  const payload = {
    time: getFormattedLocalTime(),              // 2026-01-28 10:42:31
    timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    device,
    location,
    recoveryMethod,                           // MagicLink | Advanced
    userId: userData.userId,
    ipAddress: window.ipAddress || "",        // if available
    timeStamp: parseFloat(tsmili.slice(0, 10) + "." + tsmili.slice(10)),
  };

  const { base64JsonContent, signature } =
    prepareDataInBase64JsonContent(payload, "accountRecovered");

  const requestBody = {
    method: "accountRecovered",
    base64JsonContent,
    signature,
  };

  return axiosTokenInstance
    .post(await getBaseUrl(), requestBody)
    .then(extract);
};
