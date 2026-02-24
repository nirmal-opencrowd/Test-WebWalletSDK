import { Query, Transaction } from "@hashgraph/sdk";
import { formatJsonRpcError, formatJsonRpcResult } from "@json-rpc-tools/utils";
import { getSdkError } from "@walletconnect/utils";
import { SignClient } from "@walletconnect/sign-client";
import { getExtensionMethodsFromSession } from "./Utils.js";
import { Buffer } from "buffer";
import {Wallet} from "@hashgraph/hedera-wallet-connect";
import { WALLET_CONNECT_APP_ID } from "./../utils/constants.js";

// chrome: chrome, edge
// safari: safari
// browser: firefox
const finalBrowser = chrome || safari || browser;

export class WCConnector {
    upcomingRequests = {};
    dAppMetadata;
    client;
    metaData;
    showPopup;
    constructor(dAppMetadata, showPopup) {
        this.dAppMetadata = dAppMetadata;
        this.showPopup = showPopup;
    }

    async init(onProposalReceive) {
        this.onProposalReceive = onProposalReceive;
        try {
            this.client = await Wallet.create(WALLET_CONNECT_APP_ID, this.dAppMetadata)
            this.subscribeToEvents();
            // await this.checkPersistedState();
        } catch(err) {}
    }

    setMetaData(data) {
        this.metaData = data;
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

    confirmAndProcessRequest = async (transaction, onlyPrivateKey) => {
        const showPopup = this.showPopup;
        const metaInfo = this.metaData;
        return new Promise(async (resolve, reject) => {
            finalBrowser.storage.local.get("_decrypted", function (data) {
                if (onlyPrivateKey) {
                    const localData = data._decrypted;
                    resolve({grantAccess: true, pKey: localData.privateKey});
                } else {
                    const request = {signTransaction: true, transaction: JSON.stringify(transaction), metaData: JSON.stringify(metaInfo)};
                    let userData = data._decrypted;
                    if (userData) {
                        showPopup({ isLoggedIn: true, ...request});
                    } else {
                        finalBrowser.storage.local.get("_encrypted", function (data) {
                            data._encrypted ? showPopup({ isLoggedIn: false, isLocked: true, ...request }) : showPopup({ isLoggedIn: false });
                        });
                    }
                }
            });
            function messageListener(request, sender, sendResponse) {
              if (request.type === "wcSignReject") {
                resolve({grantAccess: false, ...request.request});
              }
              if (request.type === "wcSignApproved") {
                finalBrowser.storage.local.get("_decrypted", async function (data) {
                  const localData = data._decrypted;
                  resolve({grantAccess: true, pKey: localData.privateKey});
                });
              }
              sendResponse({status: 'ok'});
            }
            finalBrowser.runtime.onMessage.removeListener(messageListener);
            finalBrowser.runtime.onMessage.addListener(messageListener);
          });
    }
    async onSessionRequest(requestEvent) {
        const { chainId, accountId, body } = this.client.parseSessionRequest(requestEvent);
        let userResponse;
        if (body) {
            userResponse = await this.confirmAndProcessRequest(body);
        } else {
            userResponse = await this.confirmAndProcessRequest(body, true);
        }

        if ((userResponse && userResponse.grantAccess) || !body) {
            const signer = this.client.getHederaWallet(
                chainId,
                accountId,
                userResponse.pKey,
            );
            // TODO(Nitesh): Need to return if signer is not present
            try {
                return await this.client.executeSessionRequest(requestEvent, signer);
            } catch(err) {
                this.client.rejectSessionRequest(requestEvent, err);
            }
        } else {
            this.client.rejectSessionRequest(requestEvent, getSdkError('USER_REJECTED_METHODS'));
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

    async pair(uri) {
      this.client.core.pairing.pair({ uri });
    }

    async disconnect(e) {
        e.preventDefault();
        //https://docs.walletconnect.com/web3wallet/wallet-usage#session-disconnect
        for (const session of Object.values(this.client.getActiveSessions())) {
            await this.client.disconnectSession({
                topic: session.topic,
                reason: getSdkError('USER_DISCONNECTED'),
            });
        }
        for (const pairing of this.client.core.pairing.getPairings()) {
            await this.client.disconnectSession({
                topic: pairing.topic,
                reason: getSdkError('USER_DISCONNECTED'),
            });
        }
    }
}