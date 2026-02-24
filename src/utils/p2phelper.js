import forge from "node-forge";
import sha256 from "sha256";
import { hederaAccountToString, getLast6Chars } from "./utils";
const ed25519 = forge.pki.ed25519;

export const createTimestampNano = () => {
    let ts = String(Date.now() * 10 ** 6);
    let tsStringSeconds = ts.substr(0, 10);
    // let tsNano = window.performance.now();
    // const tsNanoStr = tsNano ? tsNano.toFixed(8).split(".")[1] : "00000000";
    return parseFloat(tsStringSeconds + "." + "00000000");
};

export const sha256Calc = data => {
    // return sha256.array(data);
    return sha256(data, { asBytes: true });
};

export const longToByteArray = long => {
    // we want to represent the input as a 8-bytes array
    var byteArray = [0, 0, 0, 0, 0, 0, 0, 0];

    for (var index = byteArray.length - 1; index > -1; index--) {
        var byte = long & 0xff;
        byteArray[index] = byte;
        long = (long - byte) / 256;
    }
    return byteArray;
};

export const toHexString = byteArray => {
    return Array.from(byteArray, function (byte) {
        return ("0" + (byte & 0xff).toString(16)).slice(-2);
    }).join("");
};

export const hexToBytes = (hex) => {
    for (var bytes = [], c = 0; c < hex.length; c += 2)
    bytes.push(parseInt(hex.substr(c, 2), 16));
    return bytes;
}

export const bytesToHex = (bytes) => {
    for (var hex = [], i = 0; i < bytes.length; i++) {
        var current = bytes[i] < 0 ? bytes[i] + 256 : bytes[i];
        hex.push((current >>> 4).toString(16));
        hex.push((current & 0xF).toString(16));
    }
    return hex.join("");
};

export const createInvoice = (merchantTxn, paymentAmount, selectedOffer, discountedAmt, userDetails) => {
    let invoice = {
        merchantAccount: merchantTxn.merchantAccount,
        amount: paymentAmount ? parseFloat(paymentAmount) : parseFloat(merchantTxn.amount),
        currency: merchantTxn.currency,
        reference: merchantTxn.reference,
        details: merchantTxn.description,
        userId: userDetails.userId,
        walletAddress: hederaAccountToString(userDetails.hhAccount),
    };
    if (merchantTxn.thumbnail) {
        invoice['thumbnail'] = merchantTxn.thumbnail;
    }
    if (merchantTxn.droppSignature) {
        invoice['successURL'] = merchantTxn.successURL ? merchantTxn.successURL : "";
        invoice['successMessage'] = merchantTxn.successMessage ? merchantTxn.successMessage : "";
        invoice['failureURL'] = merchantTxn.failureURL ? merchantTxn.failureURL : "";
        if (merchantTxn.lowerLimit) {
            invoice['lowerLimit'] = parseFloat(merchantTxn.lowerLimit);
        }
        if (merchantTxn.upperLimit) {
            invoice['upperLimit'] = parseFloat(merchantTxn.upperLimit);
        }
    }
    if (merchantTxn.purchaseExpiration) {
        invoice['purchaseExpiration'] = parseInt(merchantTxn.purchaseExpiration, 10);
    }
    if (merchantTxn.referralFee) {
        invoice['referralFee'] = parseFloat(merchantTxn.referralFee);
    }
    if (merchantTxn.referrer && merchantTxn.referralFee) {
        invoice['referralAccount'] = merchantTxn.referrer;
    }
    if (merchantTxn.distribution) {
        invoice['distribution'] = JSON.parse(merchantTxn.distribution);
    }
    if (selectedOffer && selectedOffer.offerCode) {
        invoice['offerCode'] = selectedOffer.offerCode;
        if (discountedAmt || discountedAmt == 0) {
            invoice['discountedAmount'] = discountedAmt;
        }
    }
    if (merchantTxn.qr_code_uuid || merchantTxn.uuid) {
        invoice['qrCodeUUID'] = merchantTxn.qr_code_uuid || merchantTxn.uuid;
    }
    if (merchantTxn.acceptPaymentDelay) {
        invoice['acceptPaymentDelay'] = merchantTxn.acceptPaymentDelay;
    }
    let invoiceString = JSON.stringify(invoice);
    let invoiceBuffer = new Buffer(invoiceString);
    let invoiceBase64 = invoiceBuffer.toString("base64");
    return invoiceBase64;
};

export const createRecurringData = (merchantTxn, payerAccount, createdOn, encodedHHUpdateAccount, payerCurrency, useDroppCredit) => {
    let rData = {
        merchantAccount: merchantTxn.merchantAccount,
        currency: merchantTxn.currency,
        reference: merchantTxn.reference,
        payerAccount: payerAccount,
        payerCurrency: payerCurrency
    };
    if (createdOn) {
        rData['createdOn'] = createdOn;
    }
    if (merchantTxn.country) {
        rData['country'] = merchantTxn.country;
    }
    if (merchantTxn.fixAmount) {
        rData['fixAmount'] = parseFloat(merchantTxn.fixAmount);
    }
    if (merchantTxn.maxAmount) {
        rData['maxAmount'] = parseFloat(merchantTxn.maxAmount);
    }
    if (merchantTxn.start) {
        rData['start'] = merchantTxn.start;
    }
    if (merchantTxn.expiry) {
        rData['expiry'] = merchantTxn.expiry;
    }
    if (merchantTxn.frequency) {
        rData['frequency'] = merchantTxn.frequency.toUpperCase();
    }
    if (merchantTxn.thumbnail) {
        rData['thumbnail'] = merchantTxn.thumbnail;
    }
    if (merchantTxn.description) {
        rData['details'] = merchantTxn.description;
    }
    if (encodedHHUpdateAccount) {
        rData['encodedHHUpdateAccount'] = encodedHHUpdateAccount;
    }
    if (useDroppCredit) {
        rData['useDroppCredit'] = useDroppCredit;
    }
    if (merchantTxn.invoiceType) {
        rData['invoiceType'] = merchantTxn.invoiceType;
    }
    if (merchantTxn.authHoldTimeInSeconds) {
        rData['authHoldTimeInSeconds'] = merchantTxn.authHoldTimeInSeconds;
    }
    if (merchantTxn.distribution) {
        rData['distribution'] = JSON.parse(merchantTxn.distribution);
    }
    if (merchantTxn.qr_code_uuid || merchantTxn.uuid) {
        rData['qrCodeUUID'] = merchantTxn.qr_code_uuid || merchantTxn.uuid;
    }

    return rData;
};

export const createSignature = (signatures, merchantTxn, timestamp) => {
    let invoice = createInvoice(merchantTxn);
    let invoiceSha256 = sha256Calc(invoice);

    let timestampArr = String(timestamp).split(".");
    let tsSecondsByteArr = longToByteArray(parseInt(timestampArr[0]));

    let tsNanoSecondsByteArr = longToByteArray(parseInt(timestampArr[1]));

    let signatureByteArr = tsSecondsByteArr.concat(tsNanoSecondsByteArr, invoiceSha256);

    let encoding = "binary";
    let priv = signatures.privateKey;
    var privateKey = forge.util.hexToBytes(priv);
    let signature = ed25519.sign({
        message: Buffer.from(signatureByteArr),
        encoding,
        privateKey,
    });
    return forge.util.bytesToHex(signature);

    //return signatureByteArr;
};

export const createPromiseToPay = (signatures, merchantTxn) => {
    let timestamp = createTimestampNano();
    let ptp = {
        payer: `${signatures.userId}:${getLast6Chars(signatures.publicKey)}`,
        timeStamp: timestamp,
        invoiceBytes: createInvoice(merchantTxn),
        signatures: {
            payer: createSignature(signatures, merchantTxn, timestamp),
        },
    };
    if (merchantTxn.droppSignature) {
        ptp['signatures']['dropp'] = merchantTxn.droppSignature;
    }
    return ptp;
};
