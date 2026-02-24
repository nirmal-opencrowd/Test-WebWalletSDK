import { Query, Transaction } from "@hashgraph/sdk";
import { formatJsonRpcError, formatJsonRpcResult } from "@json-rpc-tools/utils";
import { getSdkError } from "@walletconnect/utils";
import { SignClient } from "@walletconnect/sign-client";
import { getExtensionMethodsFromSession } from "./Utils.js";
import { Buffer } from "buffer";
import { WalletConnector } from "@hashgraph/hedera-wallet-connect";
export class WCConnector extends WalletConnector {
    upcomingRequests = {};
    constructor(metadata) {
        super(metadata);
    }

    async init(onProposalReceive) {
        this.onProposalReceive = onProposalReceive;
        try {
            this.isInitializing = true;
            this.client = await SignClient.init({
                relayUrl: "wss://relay.walletconnect.com",
                projectId: "964a61a56a078ff975ab16a53b6cd756",
                metadata: this.dAppMetadata
            });
            this.subscribeToEvents();
            await this.checkPersistedState();
        }
        finally {
            this.isInitializing = false;
        }
    }

    subscribeToEvents() {
        if (!this.client) {
            throw new Error("WC is not initialized");
        }
        this.client.on("session_proposal", this.onSessionProposal.bind(this));
        this.client.on("session_request", this.onSessionRequest.bind(this));
        this.client.on("session_delete", this.destroySession.bind(this));
        this.client.on("session_expire", this.destroySession.bind(this));
    }
    async destroySession(event) {
        this.session = null;
    }
    async onSessionRequest(requestEvent) {
        const { id, topic, params } = requestEvent;
        const key = `${topic}_${params.request.method}`;
        if (this.upcomingRequests[key]) {
            const keys = Object.keys(this.upcomingRequests[key]);
            let dupicateReq = false;
            for (let i = 0; i < keys.length; i++) {
                if (this.upcomingRequests[key][keys[i]].id == id) {
                    dupicateReq = true;
                    break;
                }
            }
            if (dupicateReq) {
                return;
            }
        }
        if (this.upcomingRequests[key] && params.request.params.executable && this.upcomingRequests[key][params.request.params.executable]) {
            if (this.upcomingRequests[key][params.request.params.executable].expiry) {
                if (this.upcomingRequests[key][params.request.params.executable].expiry > new Date().getTime()) {
                    if (this.upcomingRequests[key][params.request.params.executable].rejectReason) {
                        const formattedResult = formatJsonRpcError(id, this.upcomingRequests[key][params.request.params.executable].rejectReason);
                        await this.client.respond({
                            topic,
                            response: formattedResult
                        });
                        return;
                    }
                } else {
                    delete this.upcomingRequests[key][params.request.params.executable];
                }
            }
        } else {
            this.upcomingRequests[key] = {};
            this.upcomingRequests[key][params.request.params.executable] = {id: id};
        }
        const { request, chainId } = params;
        const accountId = request.params.accountId;
        const signer = this.signers.find(s => s.getAccountId().toString() === accountId);
        if (!signer) {
            const formattedResult = formatJsonRpcError(id, "Signer is not available anymore");
            await this.client.respond({
                topic,
                response: formattedResult
            });
            return;
        }
        try {
            let formattedResult;
            switch (request.method) {
                case "getLedgerId": {
                    const result = await signer.getLedgerId();
                    formattedResult = formatJsonRpcResult(id, result);
                    break;
                }
                case "getAccountId": {
                    const result = await signer.getAccountId();
                    formattedResult = formatJsonRpcResult(id, result);
                    break;
                }
                case "getAccountKey": {
                    const result = await signer.getAccountKey();
                    formattedResult = formatJsonRpcResult(id, result);
                    break;
                }
                case "getNetwork": {
                    const result = await signer.getNetwork();
                    formattedResult = formatJsonRpcResult(id, result);
                    break;
                }
                case "getMirrorNetwork": {
                    const result = await signer.getMirrorNetwork();
                    formattedResult = formatJsonRpcResult(id, result);
                    break;
                }
                case "sign": {
                    const signatures = await signer.sign(request.params.messages, request.params.signOptions);
                    formattedResult = formatJsonRpcResult(id, signatures);
                    break;
                }
                case "getAccountBalance": {
                    const result = await signer.getAccountBalance();
                    formattedResult = formatJsonRpcResult(id, result);
                    break;
                }
                case "getAccountInfo": {
                    const result = await signer.getAccountInfo();
                    formattedResult = formatJsonRpcResult(id, result);
                    break;
                }
                case "getAccountRecords": {
                    const result = await signer.getAccountRecords();
                    formattedResult = formatJsonRpcResult(id, result);
                    break;
                }
                case "signTransaction": {
                    const transaction = await Transaction.fromBytes(Buffer.from(request.params.executable, "base64"));
                    const signedTransaction = await signer.signTransaction(transaction);
                    if (signedTransaction && signedTransaction.reason) {
                        formattedResult = formatJsonRpcError(id, signedTransaction.reason);
                        this.upcomingRequests[key][params.request.params.executable] = {id: id, expiry: (new Date().getTime() + 5000), rejectReason: signedTransaction.reason};
                    } else {
                        const encodedTransaction = Buffer.from(signedTransaction.toBytes()).toString("base64");
                        formattedResult = formatJsonRpcResult(id, encodedTransaction);
                        delete this.upcomingRequests[key][params.request.params.executable];
                    }
                    break;
                }
                case "checkTransaction": {
                    const transaction = await Transaction.fromBytes(Buffer.from(request.params.executable, "base64"));
                    const checkedTransaction = await signer.checkTransaction(transaction);
                    const encodedTransaction = Buffer.from(checkedTransaction.toBytes()).toString("base64");
                    formattedResult = formatJsonRpcResult(id, encodedTransaction);
                    break;
                }
                case "populateTransaction": {
                    const transaction = await Transaction.fromBytes(Buffer.from(request.params.executable, "base64"));
                    const populatedTransaction = await signer.populateTransaction(transaction);
                    const encodedTransaction = Buffer.from(populatedTransaction.toBytes()).toString("base64");
                    formattedResult = formatJsonRpcResult(id, encodedTransaction);
                    break;
                }
                case "call": {
                    const encodedExecutable = request.params.executable;
                    const isTransaction = request.params.isTransaction;
                    const bytes = Buffer.from(encodedExecutable, "base64");
                    let result;
                    let error;
                    if (isTransaction) {
                        const transaction = Transaction.fromBytes(bytes);
                        const hederaResponse =  await signer.call(transaction, isTransaction);
                        if (hederaResponse && hederaResponse.reason) {
                            error = hederaResponse.reason;
                            this.upcomingRequests[key][params.request.params.executable] = {id: id, expiry: (new Date().getTime() + 5000), rejectReason: hederaResponse.reason};
                        } else if (hederaResponse && hederaResponse.error) {
                            error = {message: hederaResponse.error.message};
                            this.upcomingRequests[key][params.request.params.executable] = {id: id, expiry: (new Date().getTime() + 5000), rejectReason: hederaResponse.error};
                        } else {
                            result = hederaResponse.toJSON();
                        }
                    }
                    else {
                        const query = Query.fromBytes(bytes);
                        const queryResult = await signer.call(query);
                        if (queryResult && queryResult.error) {
                            error = {message: queryResult.error.message};
                        } else {
                            result = Buffer.from(queryResult.toBytes()).toString("base64");
                        }
                    }
                    if (result) {
                        formattedResult = formatJsonRpcResult(id, result);
                    } else if (error) {
                        formattedResult = formatJsonRpcError(id, error);
                    }

                    break;
                }
                default: {
                    const extensionMethods = getExtensionMethodsFromSession(this.session);
                    if (extensionMethods.includes(request.method)) {
                        const result = await signer[request.method](...request.params.args);
                        formattedResult = formatJsonRpcResult(id, result);
                    }
                    else {
                        throw new Error(getSdkError("INVALID_METHOD").message);
                    }
                }
            }
            await this.client.respond({
                topic,
                response: formattedResult
            });
        }
        catch (e) {
            const formattedResult = formatJsonRpcError(id, e);
            await this.client.respond({
                topic,
                response: formattedResult
            });
        }
    }
    async onSessionProposal(proposal) {
        await this.onProposalReceive(proposal);
    }
    async approveSessionProposal(data, signers) {
        const accountConfigs = Object.values(data.namespaces).flatMap(ns => ns.accounts.map(acc => {
            const [network, chainId, accountId] = acc.split(":");
            return { network, chainId, accountId };
        }));
        const signerAccounts = signers.map(signer => signer.getAccountId().toString());
        const hasValidSigners = accountConfigs.every(config => signerAccounts.includes(config.accountId));
        if (!hasValidSigners) {
            throw new Error("Required signers are missing");
        }
        this.signers = signers;
        const { acknowledged } = await this.client.approve(data);
        this.session = await acknowledged();
        return this.session;
    }
    async rejectSessionProposal(data) {
        return this.client.reject(data);
    }
    async sendEvent(name, data) {
        if (!this.session) {
            throw new Error("No connection session exist!");
        }
        const chainId = Object.values(this.session.namespaces)
            .flatMap(ns => ns.accounts.map(acc => acc.split(":").slice(0, 2).join(":")))[0];
        const allowedEvents = Object.values(this.session.namespaces)
            .flatMap(ns => ns.events);
        if (allowedEvents.includes(name)) {
            await this.client.emit({ topic: this.session.topic, chainId, event: { name, data } });
        }
    }
}