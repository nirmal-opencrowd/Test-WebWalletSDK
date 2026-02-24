import { AccountId, LedgerId, PrivateKey } from "@hashgraph/sdk";
import { Client, AccountBalanceQuery, AddressBookQuery, AccountInfoQuery } from "@hashgraph/sdk";
import { Network } from "./Network.js";
import { isTestnetUser } from "./Common.js";
import { getMagicWallet } from "../utils/utils.js"
import { magicInstance } from "../components/MagicLink/index.js";
// For webapp, use window.localStorage instead of extension storage
const getDecrypted = () => {
  try {
    return JSON.parse(window.localStorage.getItem('_decrypted'));
  } catch {
    return null;
  }
};
const getEncrypted = () => {
  try {
    return JSON.parse(window.localStorage.getItem('_encrypted'));
  } catch {
    return null;
  }
};
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
      const localData = getDecrypted();
        let balance = {};
        if (localData && localData.magicUser) {
          const magic = await magicInstance();
          const isLoggedIn = await magic.user.isLoggedIn();
          if (!isLoggedIn) {
            // Handle not logged in case
          }
          const magicWallet = await getMagicWallet();
          balance = await magicWallet.getAccountBalance();
        } else  if (localData && localData.privateKey) {
          const isTestnet = await isTestnetUser();
          const client = isTestnet ? Client.forTestnet() : Client.forMainnet();
          client.setOperator(accountId, PrivateKey.fromString(localData.privateKey));
          const query = new AccountBalanceQuery()
            .setAccountId(accountId);
          balance = await query.execute(client);
        }
        resolve(balance);
      });
    });
  }

  async getAccountInfo() {
    const accountId = this.getAccountId();
    return new Promise(async (resolve, reject) => {
      const localData = getDecrypted();
        let accInfo = {};
        if (localData && localData.magicUser) {
          const magic = await magicInstance();
          const isLoggedIn = await magic.user.isLoggedIn();
          if (!isLoggedIn) {
            // Handle not logged in case
          }
          const magicWallet = await getMagicWallet();
          accInfo = await magicWallet.getAccountInfo();
        } else if (localData && localData.privateKey) {
          const isTestnet = await isTestnetUser();
          const client = isTestnet ? Client.forTestnet() : Client.forMainnet();
          client.setOperator(accountId, PrivateKey.fromString(localData.privateKey));
          const query = new AccountInfoQuery()
            .setAccountId(accountId);
          accInfo = await query.execute(client);
          resolve(accInfo);
        }
        resolve(accInfo);
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
      const request = {signTransaction: true, transaction: JSON.stringify(transaction), metaData: JSON.stringify(metaData)};
      let userData = getDecrypted();
      if (userData) {
        showPopup({ isLoggedIn: true, ...request});
      } else {
        let encrypted = getEncrypted();
        encrypted ? showPopup({ isLoggedIn: false, isLocked: true, ...request }) : showPopup({ isLoggedIn: false });
      }

      // Listen for sign approval/rejection via messageBus
      const onReject = (data) => {
        messageBus.off("wcSignReject", onReject);
        messageBus.off("wcSignApproved", onApprove);
        resolve({...data.request});
      };

      const onApprove = async (data) => {
        messageBus.off("wcSignReject", onReject);
        messageBus.off("wcSignApproved", onApprove);
        const localData = getDecrypted();
        try {
          let signedTransaction;
          if (localData && localData.magicUser) {
            const magic = await magicInstance();
            const isLoggedIn = await magic.user.isLoggedIn();
            if (!isLoggedIn) {
              // Handle not logged in case
            }
            const magicWallet = await getMagicWallet();
            signedTransaction = await transaction.signWithSigner(magicWallet);
            resolve(signedTransaction);
          } else {
            const isTestnet = await isTestnetUser();
            const client = isTestnet ? Client.forTestnet() : Client.forMainnet();
            client.setOperator(AccountId.fromString(data.request.accountId), PrivateKey.fromString(localData.privateKey));
            signedTransaction = await transaction.signWithOperator(client);
            resolve(signedTransaction);
          }
        } catch (error) {
          reject(error);
        }
      };

      messageBus.on("wcSignReject", onReject);
      messageBus.on("wcSignApproved", onApprove);
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
                let transactionId;
                if (localData && localData.magicUser) {
                  const magic = await magicInstance();
                  const isLoggedIn = await magic.user.isLoggedIn();
                  if (!isLoggedIn) {
                    // Handle not logged in case
                  }
                  const magicWallet = await getMagicWallet();
                  transactionId = await magicWallet.call(userSignedTransaction);
                } else {
                  transactionId = await userSignedTransaction.execute(client);
                }
                resolve(transactionId);
              } catch (error) {
                resolve({error: error});
              }
            }
          } else {
            // Execute query and signed transaction
            try {
              let transactionId;
              if (localData && localData.magicUser) {
                const magic = await magicInstance();
                const isLoggedIn = await magic.user.isLoggedIn();
                if (!isLoggedIn) {
                  // Handle not logged in case
                }
                const magicWallet = await getMagicWallet();
                transactionId = await magicWallet.call(signedTransaction);
              } else {
                transactionId = await signedTransaction.execute(client);
              }
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
