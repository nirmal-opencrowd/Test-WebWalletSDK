import { AccountId, LedgerId, PrivateKey } from "@hashgraph/sdk";
import { Client, AccountBalanceQuery, AddressBookQuery, AccountInfoQuery } from "@hashgraph/sdk";
import { Network } from "./Network.js";
import { isTestnetUser } from "./Common.js";
// chrome: chrome, edge
// safari: safari
// browser: firefox
const finalBrowser = chrome || safari || browser;
class WalletConnectSigner {
  accountId;
  publicKey;
  connector;
  approvalPopup;

  constructor(data) {
    this.accountId = data.accountId;
    this.publicKey = data.publicKey;
    this.connector = data.walletConnector;
    this.approvalPopup = data.approvalPopup;
  }

  getAccountId() {
    return AccountId.fromString(this.accountId);
  }

  async getAccountBalance() {
    const accountId = this.getAccountId();
    return new Promise(async (resolve, reject) => {
      finalBrowser.storage.local.get("_decrypted", async function (data) {
        const localData = data._decrypted;
        if (localData && localData.privateKey) {
          const isTestnet = await isTestnetUser();
          const client = isTestnet ? Client.forTestnet() : Client.forMainnet();
          client.setOperator(accountId, PrivateKey.fromString(localData.privateKey));
          const query = new AccountBalanceQuery()
            .setAccountId(accountId);
          // Execute the query and retrieve the account balance
          const balance = await query.execute(client);
          resolve(balance);
        } else {
          resolve({});
        }
      });
    });
  }

  async getAccountInfo() {
    const accountId = this.getAccountId();
    return new Promise(async (resolve, reject) => {
      finalBrowser.storage.local.get("_decrypted", async function (data) {
        const localData = data._decrypted;
        if (localData && localData.privateKey) {
          const isTestnet = await isTestnetUser();
          const client = isTestnet ? Client.forTestnet() : Client.forMainnet();
          client.setOperator(accountId, PrivateKey.fromString(localData.privateKey));
          const query = new AccountInfoQuery()
            .setAccountId(accountId);
          // Execute the query and retrieve the account balance
          const accInfo = await query.execute(client);
          resolve(accInfo);
        } else {
          resolve({});
        }
      });
    });
  }

  async populateTransaction(transaction) {
    return transaction;
  }

  getPublicKey() {
    return this.publicKey;
  }

  signTransaction(transaction, showPopup, metaData) {
    showPopup = showPopup ? showPopup : this.approvalPopup;
    metaData = metaData ? metaData : this.connector.metadata;
    return new Promise(async (resolve, reject) => {
      finalBrowser.storage.local.get("_decrypted", function (data) {
        const request = {signTransaction: true, transaction: JSON.stringify(transaction), metaData: JSON.stringify(metaData)};
        let userData = data._decrypted;
        if (userData) {
          showPopup({ isLoggedIn: true, ...request});
        } else {
            finalBrowser.storage.local.get("_encrypted", function (data) {
                data._encrypted ? showPopup({ isLoggedIn: false, isLocked: true, ...request }) : showPopup({ isLoggedIn: false });
            });
        }
      });
      // finalBrowser.runtime.sendMessage(finalBrowser.runtime.id, {
      //     type: "askForSignApproval",
      //     request: {signTransaction: true, transaction: JSON.stringify(transaction)},
      // });
      function messageListener(request, sender, sendResponse) {
        if (request.type === "wcSignReject") {
          resolve({...request.request});
          // throw new Error("User rejected the transaction");
          // resolve({rejectReason: request.request.reason.message});
        }
        if (request.type === "wcSignApproved") {
          finalBrowser.storage.local.get("_decrypted", async function (data) {
            const localData = data._decrypted;
            async function resolveSignedTransaction() {
              const isTestnet = await isTestnetUser();
              const client = isTestnet ? Client.forTestnet() : Client.forMainnet();
              client.setOperator(AccountId.fromString(request.request.accountId), PrivateKey.fromString(localData.privateKey)); // Set your account ID and private key
              const signedTransaction = await transaction.signWithOperator(client);
              resolve(signedTransaction);
            }
            resolveSignedTransaction();
          });
        }
        sendResponse({status: 'ok'});
      }
      finalBrowser.runtime.onMessage.removeListener(messageListener);
      finalBrowser.runtime.onMessage.addListener(messageListener);
      // finalBrowser.runtime.onMessage.addListener(function (request, sender, sendResponse) {
      //     if (request.type === "wcSignReject") {
      //       resolve({...request.request});
      //       // throw new Error("User rejected the transaction");
      //       // resolve({rejectReason: request.request.reason.message});
      //     }
      //     if (request.type === "wcSignApproved") {
      //       finalBrowser.storage.local.get("_decrypted", async function (data) {
      //         const localData = data._decrypted;
      //         async function resolveSignedTransaction() {
      //           const isTestnet = await isTestnetUser();
      //           const client = isTestnet ? Client.forTestnet() : Client.forMainnet();
      //           client.setOperator(AccountId.fromString(request.request.accountId), PrivateKey.fromString(localData.privateKey)); // Set your account ID and private key
      //           const signedTransaction = await transaction.signWithOperator(client);
      //           resolve(signedTransaction);
      //         }
      //         resolveSignedTransaction();
      //       });
      //     }
      //     sendResponse({status: 'ok'});
      // });
    });
  }

  getNetwork() {
    return new Promise(async (resolve, reject) => {
      const isTestnet = await isTestnetUser();
      resolve(Network.fromName(isTestnet ? "testnet" : "mainnet"));
    });
  }

  async sign(message) {
    // Implement your signing logic here using the Wallet Connect session
    // Use the session to request a signature for the provided message
    // Return the digital signature
  }

  async call(signedTransaction, isTransaction) {
    return new Promise(async (resolve, reject) => {
      const isTestnet = await isTestnetUser();
      const client = isTestnet ? Client.forTestnet() : Client.forMainnet();
      const accountId = this.getAccountId();
      const showPopup = this.approvalPopup;
      const metaData = this.connector.metadata;
      const signTxn = this.signTransaction;
      // const localData = await finalBrowser.storage.local.get("_decrypted");
      finalBrowser.storage.local.get("_decrypted", async function (data) {
        const localData = data._decrypted;
        if (localData && localData.privateKey) {
          client.setOperator(accountId, PrivateKey.fromString(localData.privateKey));
          if (isTransaction && (signedTransaction._signerPublicKeys.size == 0 || !signedTransaction._signerPublicKeys.has(localData.publicKey))) {
            // Ask for approval
            const userSignedTransaction = await signTxn(signedTransaction, showPopup, metaData);
            if (userSignedTransaction && userSignedTransaction.reason) {
              resolve(userSignedTransaction);
            } else {
              try {
                const transactionId = await userSignedTransaction.execute(client);
                resolve(transactionId);
              } catch (error) {
                resolve({error: error});
              }
            }
          } else {
            // Execute query and signed transaction
            try {
              const transactionId = await signedTransaction.execute(client);
              resolve(transactionId);
            } catch (error) {
              resolve({error: error});
            }
          }
        } else {
          resolve({});
        }
      });
    });
  }
}

export default WalletConnectSigner;
