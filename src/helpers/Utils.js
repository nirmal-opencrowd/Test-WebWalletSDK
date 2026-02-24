import { AccountId, LedgerId, PublicKey, SignerSignature, Transaction } from "@hashgraph/sdk";
import { Buffer } from "buffer";
const chainsMap = new Map();
chainsMap.set(LedgerId.MAINNET.toString(), 295);
chainsMap.set(LedgerId.TESTNET.toString(), 296);
chainsMap.set(LedgerId.PREVIEWNET.toString(), 297);
export var METHODS;
(function (METHODS) {
    METHODS["SIGN_TRANSACTION"] = "signTransaction";
    METHODS["CALL"] = "call";
    METHODS["GET_ACCOUNT_BALANCE"] = "getAccountBalance";
    METHODS["GET_ACCOUNT_INFO"] = "getAccountInfo";
    METHODS["GET_LEDGER_ID"] = "getLedgerId";
    METHODS["GET_ACCOUNT_ID"] = "getAccountId";
    METHODS["GET_ACCOUNT_KEY"] = "getAccountKey";
    METHODS["GET_NETWORK"] = "getNetwork";
    METHODS["GET_MIRROR_NETWORK"] = "getMirrorNetwork";
    METHODS["SIGN"] = "sign";
    METHODS["GET_ACCOUNT_RECORDS"] = "getAccountRecords";
    METHODS["CHECK_TRANSACTION"] = "checkTransaction";
    METHODS["POPULATE_TRANSACTION"] = "populateTransaction";
})(METHODS || (METHODS = {}));
export var EVENTS;
(function (EVENTS) {
    EVENTS["ACCOUNTS_CHANGED"] = "accountsChanged";
})(EVENTS || (EVENTS = {}));
export const getChainByLedgerId = (ledgerId) => {
    return `hedera:${chainsMap.get(ledgerId.toString())}`;
};
export const getLedgerIdByChainId = (chainId) => {
    const ledgerIdsMap = Object.fromEntries(Array.from(chainsMap.entries()).map(a => a.reverse()));
    return ledgerIdsMap[parseInt(chainId)];
};
export const getRequiredNamespaces = (ledgerId) => {
    return {
        hedera: {
            chains: [getChainByLedgerId(ledgerId)],
            methods: Object.values(METHODS),
            events: Object.values(EVENTS),
        }
    };
};
export const getLedgerIDsFromSession = (session) => {
    return Object.values(session?.namespaces || {})
        .flatMap(namespace => namespace.accounts.map(acc => {
        const [network, chainId, account] = acc.split(":");
        return LedgerId.fromString(getLedgerIdByChainId(chainId));
    }));
};
export const getAccountLedgerPairsFromSession = (session) => {
    return Object.values(session?.namespaces || {})
        .flatMap(namespace => namespace.accounts.map(acc => {
        const [network, chainId, account] = acc.split(":");
        return { network: LedgerId.fromString(getLedgerIdByChainId(chainId)), account };
    }));
};
export const getExtensionMethodsFromSession = (session) => {
    return Object.values(session.namespaces)
        .flatMap(ns => ns.methods)
        .filter(method => !Object.values(METHODS).includes(method));
};
export const isEncodable = (obj) => {
    return ("toBytes" in obj) &&
        (typeof obj.toBytes === "function");
};
export const isTransaction = (obj) => {
    if (obj instanceof Transaction) {
        return true;
    }
    else if ("transactionId" in obj && "sign" in obj) {
        return true;
    }
    return false;
};
export const evmAddressFromObject = (data) => {
    try {
        return Buffer.from(Object.values(data?._bytes || [])).toString("hex");
    }
    catch {
        return null;
    }
};
export const publicKeyFromObject = (data) => {
    try {
        return PublicKey.fromBytes(Buffer.from(Object.values(data?._key?._key?._keyData || [])));
    }
    catch {
        return null;
    }
};
export const convertToSignerSignature = (data) => {
    const publicKey = publicKeyFromObject(data.publicKey);
    const { shard, realm, num, aliasKey, aliasEvmAddress } = data.accountId;
    const accountAddress = evmAddressFromObject(aliasEvmAddress) || publicKeyFromObject(aliasKey) || num.low;
    const accountId = AccountId.fromString(`${shard.low}.${realm.low}.${accountAddress.toString()}`);
    const signature = Buffer.from(Object.values(data.signature.data || data.signature));
    return new SignerSignature({ accountId, signature, publicKey });
};
//# sourceMappingURL=Utils.js.map