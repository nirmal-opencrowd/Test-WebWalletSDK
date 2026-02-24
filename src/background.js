import { WCConnector } from "./helpers/wcConnector";
import WalletConnectSigner from "./helpers/walletSigner";
import { Buffer } from "buffer";
import { dapps } from "./utils/local-storage";
import moment from "moment";

let responseCallback;
let _popupId;

// chrome: chrome, edge
// safari: safari
// browser: firefox

const finalBrowser = chrome || safari || browser;

const showPopup = async (request) => {
  const popup = await _getPopup();
  const query = queryBuilder(request);

  // Bring focus to finalBrowser popup
  if (popup) {
      finalBrowser.windows.remove(popup.id);
  }

  let reqUrl = request.isLoggedIn ? "index.html#/pay?" : "index.html#/firsttimeflow?";
  console.log("request in showPopup: ", request);
    console.log("in preAuthPayment reqUrl1",(request.maxAmount && request.invoiceType === "PREAUTH"));
  if (request.isLoggedIn) {
      if (request.fundingSuccess) {
          reqUrl = "index.html#/home?";
      } else if (request.infoAccess) {
          reqUrl = "index.html#/infoAccess?";
      } else if (request.walletConnectApproval) {
          reqUrl = "index.html#/wcApproval?";
      } else if (request.signTransaction) {
          reqUrl = "index.html#/wcSignApproval?";
      } else if (request.maxAmount && request.invoiceType === "PREAUTH") {
            console.log("in preAuthPayment reqUrl2",(request.maxAmount && request.invoiceType === "PREAUTH"));
            reqUrl = "index.html#/preAuthPayment?";
      } else if (request.maxAmount || (request.fixAmount && request.frequency)) {
          reqUrl = "index.html#/recurringPayment?";
      }
  }

  // create new notification popup
  const popupWindow = await openWindow({
      url: finalBrowser.runtime.getURL(reqUrl + query),
      type: "popup",
      height: 675,
      width: 350,
      left: 500,
      top: 100,
  });
  _popupId = popupWindow.id;
  finalBrowser.storage.local.set({lastPopupId: _popupId});
};

let walletConnector = new WCConnector(null, showPopup);

function execScript(newUrl) {
    window.location.href= newUrl;
}
const openUrlInTab = (newUrl, tabId) => {
    if (tabId) {
        if (finalBrowser.tabs && finalBrowser.tabs.executeScript) {
            finalBrowser.tabs.executeScript(parseInt(tabId, 10), {
                code: `window.location.href='${newUrl}'`
            });
        } else {
            finalBrowser.scripting.executeScript({
                target: {tabId : parseInt(tabId, 10)},
                func: execScript,
                args: [ newUrl ]
            });
        }
    } else {
        finalBrowser.tabs.create({
            url: newUrl,
        });
    }
    // finalBrowser.tabs.create({
    //     url: newUrl,
    // });
};

const updateDappsInLocal = (session, accountId) => {
    const currentDate = moment().format("YYYY-MM-DD");
    const obj = {
        topic: session.topic,
        metadata: session.peer.metadata,
        currentTime: moment().format("hh:mm A"),
        accountId: accountId
    };
    let res = {};
    res[currentDate] = [obj];
    dapps.setDapps(res);
};


finalBrowser.webRequest.onBeforeRequest.addListener(
    function (details) {
        const [url, queryString] = details.url.split("?");
        const params = Object.fromEntries(new URLSearchParams(queryString).entries());
        if (!(url.startsWith("https://dropp.app.link/p2p") || url.startsWith("https://dropp.test-app.link/p2p") || url.startsWith("https://pay.dropp.cc/ping")) || !((params.url || params.droppSignature || params.fundingSuccess || (params.b2bInvoice && params.invoiceId)) && params.merchantAccount)) {
            return;
        }
        if (details.tabId) {
            params['parentTabId'] = details.tabId;
        }
        finalBrowser.storage.local.get("_decrypted", function (data) {
            let userData = data._decrypted;
            console.log("userData in onBeforeRequest: ", userData);
            if (userData) {
                showPopup({ isLoggedIn: true, ...params });
            } else {
                finalBrowser.storage.local.get("_encrypted", function (data) {
                    data._encrypted ? showPopup({ isLoggedIn: false, isLocked: true, fundingSuccess: params.fundingSuccess, ...params }) : showPopup({ isLoggedIn: false });
                });
            }
        });
    },
    { urls: ["https://dropp.app.link/*", "https://dropp.test-app.link/*", "https://pay.dropp.cc/*"] }
);

finalBrowser.runtime.onMessage.addListener(async function (request, sender, sendResponse) {
    if (request.type === "wcDisconnect") {
        // try {
        //     await walletConnector.client.disconnect({topic: request.request.topic, reason: {code: 401, message: "User disconnected from Dropp wallet"}});
        // } catch(error) {
        // }
        try {
            walletConnector.disconnect();
        } catch(error) {
            console.log("error in disconnect", error);
        }
        walletConnector.client = null;
        walletConnector.session = null;
        walletConnector.signers = [];
        await dapps.clear();
        sendResponse({disconnected: true});
    }
    if (request.type === "getCurrentTopic") {
        sendResponse((walletConnector && walletConnector.session) ? walletConnector.session.topic : "");
    }
    if (request.type === "link") {
        finalBrowser.storage.local.set({ _encrypted: request._encrypted, _decrypted: request._decrypted, env: request.env }, function (data) {
        });
    }
    if (request.type === "askForApproval") {
        finalBrowser.storage.local.get("_decrypted", function (data) {
            let userData = data._decrypted;
            if (userData) {
                showPopup({ isLoggedIn: true, ...request.request });
            } else {
                finalBrowser.storage.local.get("_encrypted", function (data) {
                    data._encrypted ? showPopup({ isLoggedIn: false, isLocked: true, ...request.request }) : showPopup({ isLoggedIn: false });
                });
            }
        });
    }
    if (request.type === "askForWCApproval") {
        async function walletConnection () {
          try {
            const ProposalCallback = (res) => {
              if (res && res.params && res.params.proposer) {
                finalBrowser.storage.local.get("_decrypted", function (data) {
                    const request = {walletConnectApproval: true, withoutUrl: true, proposerId: res.id, proposal: JSON.stringify(res), proposerDetails: JSON.stringify(res.params.proposer), requiredNamespaces: JSON.stringify(res.params.requiredNamespaces) };
                    let userData = data._decrypted;
                    if (userData) {
                        showPopup({ isLoggedIn: true, ...request});
                    } else {
                        finalBrowser.storage.local.get("_encrypted", function (data) {
                            data._encrypted ? showPopup({ isLoggedIn: false, isLocked: true, ...request }) : showPopup({ isLoggedIn: false });
                        });
                    }
                });
              }
            };
            try {
              await walletConnector.init(ProposalCallback);
            } catch(error) {
              console.log("error in walletConnector.init", error);
            }
            try {
              const pairingResult = await walletConnector.client.pair({uri : request.request.uri});
            } catch(error) {
              console.log("error in walletConnector.client.pair ", error);
            }
          } catch (error) {
            console.log("error in wallet section ", error);
          }
        }
        walletConnection();
    }
    if (request.type === "askForSignApproval") {
        finalBrowser.storage.local.get("_decrypted", function (data) {
            let userData = data._decrypted;
            if (userData) {
                showPopup({ isLoggedIn: true, ...request.request });
            } else {
                finalBrowser.storage.local.get("_encrypted", function (data) {
                    data._encrypted ? showPopup({ isLoggedIn: false, isLocked: true, ...request.request }) : showPopup({ isLoggedIn: false });
                });
            }
        });
    }

    if (request.type === "WCApprovalResponse") {
          if (request.request.id && request.request.reason) {
            try {
              // await walletConnector.init();
              await walletConnector.client.rejectSession({...request.request});
            } catch (error) {
              console.log("error in Rejection is ", error);
            }
          } else {
            const proposerId = parseInt(request.request.proposerId, 10);
            let requiredNamespaces = JSON.parse(request.request.requiredNamespaces);

            const proposerDetails = JSON.parse(request.request.proposerDetails);
            const proposal = JSON.parse(request.request.proposal);
            let optionalNamespaces = JSON.parse(JSON.stringify(proposal.params.optionalNamespaces));
            
            // Check if requiredNamespaces is blank/empty
            if (!requiredNamespaces || Object.keys(requiredNamespaces).length === 0) {
              // Check if optionalNamespaces is valid and has content
              if (optionalNamespaces && Object.keys(optionalNamespaces).length > 0) {
                // Copy optionalNamespaces to requiredNamespaces
                requiredNamespaces = optionalNamespaces;
              }
            }

            const accountId = request.request.accountId;
            const publicKey = request.request.publicKey;
            const connect = async function (proposerId, requiredNamespaces, accountId, publicKey, proposal, proposerDetails) {
            try {
                // walletConnector.metaData = proposerDetails;
                walletConnector.setMetaData(proposerDetails);
                // await walletConnector.init();
                const signer = new WalletConnectSigner({
                  accountId: accountId,
                  publicKey: publicKey,
                  walletConnector: walletConnector,
                  approvalPopup: showPopup});

                const connectionApproval = await walletConnector.client.buildAndApproveSession([`${requiredNamespaces.hedera.chains[0]}:${accountId}`], proposal);
                // const connectionApproval = await walletConnector.approveSessionProposal({
                //   id: proposerId,
                //   namespaces: {hedera: {...requiredNamespaces.hedera, accounts: [`${requiredNamespaces.hedera.chains[0]}:${accountId}`]}}
                // }, [
                //   signer
                // ]);
                // const approvalInitialised = await walletConnector.init(connectionApproval);
                // if (walletConnector && walletConnector.client) {
                //   walletConnector.client.off("session_request");
                // }
                // walletConnector.subscribeToEvents();
                const sessions = await walletConnector.client.getActiveSessions();
                const keys = sessions && Object.keys(sessions).length ? Object.keys(sessions) : [];
                if (keys.length) {
                  updateDappsInLocal(sessions[keys[0]], accountId);
                }
              } catch (error) {
                console.log("error in approval is ", error);
              }
            }
            connect(proposerId, requiredNamespaces, accountId, publicKey, proposal, proposerDetails);
          }

    }
    // if (request.type === "WCSignApprovalResponse") {
    //     console.log("WCApprovalResponse in background: ", {name: "wcSignApproved", appoved: request.request.appoved});
    //     finalBrowser.tabs.query({active: true}, function (tabs){
    //         finalBrowser.tabs.sendMessage(tabs[0].id, {name: "wcSignApproved", request: {...request.request}});
    //     });
    // }
    if (request.type === "approveAccess") {
        if (request.ptp.url) {
            var newUrl = ""
            request.ptp.url = decodeURIComponent(request.ptp.url);
            if(request.ptp.url.indexOf("?") == -1) {
                newUrl = `${request.ptp.url}?hederaAccount=${request.ptp.hederaAccount}`;
            } else {
                if(request.ptp.url.charAt(request.ptp.url.length - 1) == "?"){
                    newUrl = `${request.ptp.url}hederaAccount=${request.ptp.hederaAccount}`;
                }
                else{
                    newUrl = `${request.ptp.url}&hederaAccount=${request.ptp.hederaAccount}`;
                }
            }
            openUrlInTab(newUrl);
        } else {
            // finalBrowser.runtime.sendMessage({
            //     type: "accessApproved",
            //     accountInfo: {...request.ptp},
            // });
            // window.postMessage({name: "accessApproved", accountInfo: {...request.ptp}}, "*");

            finalBrowser.tabs.query({active: true}, function (tabs){
                finalBrowser.tabs.sendMessage(tabs[0].id, {name: "accessApproved", accountInfo: {...request.ptp}});
            });
        }
    }
    if (request.type === "makePayment") {
        if ("url" in request.request) {
            var newUrl = ""
            request.request.url = decodeURIComponent(request.request.url);
            if(request.request.url.indexOf("?") == -1){
              newUrl = `${request.request.url}?p2p=${encodeURIComponent(JSON.stringify(request.ptp))}`
            } else {
              if(request.request.url.charAt(request.request.url.length - 1) == "?"){
                  newUrl = `${request.request.url}p2p=${encodeURIComponent(JSON.stringify(request.ptp))}`
              }
              else{
                  newUrl = `${request.request.url}&p2p=${encodeURIComponent(JSON.stringify(request.ptp))}`
              }

            }
            if (request.request.referrer) {
                newUrl += `&referrer=${request.request.referrer}`;
            }
            openUrlInTab(newUrl, (request.request && request.request.parentTabId) ? request.request.parentTabId : null);
        } else {
            let respObj = { p2p: encodeURIComponent(JSON.stringify(request.ptp))};
            if (request.request && request.request.referrer) {
                respObj['referrer'] = request.request.referrer;
            }
            responseCallback(respObj);
        }
    } else if (request.type === "paymentSuccess" && ("successURL" in request.request)) {
        openUrlInTab(decodeURIComponent(request.request.successURL), (request.request && request.request.parentTabId) ? request.request.parentTabId : null);
    } else if (request.type === "paymentFailure" && ("failureURL" in request.request)) {
        openUrlInTab(decodeURIComponent(request.request.failureURL), (request.request && request.request.parentTabId) ? request.request.parentTabId : null);
    } else if (request.type === "openInNewTab") {
        openUrlInTab(request.request.url, null);
    } else if (request.type === "addRecurringPayment") {
        if ("url" in request.request) {
            var newUrl = ""
            request.request.url = decodeURIComponent(request.request.url);
            if(request.request.url.indexOf("?") == -1){
              newUrl = `${request.request.url}?RecurringData=${encodeURIComponent(JSON.stringify(request.ptp))}`
            } else {
              if(request.request.url.charAt(request.request.url.length - 1) == "?"){
                  newUrl = `${request.request.url}RecurringData=${encodeURIComponent(JSON.stringify(request.ptp))}`
              }
              else{
                  newUrl = `${request.request.url}&RecurringData=${encodeURIComponent(JSON.stringify(request.ptp))}`
              }
            }
            openUrlInTab(newUrl, (request.request && request.request.parentTabId) ? request.request.parentTabId : null);
        } else {
            let respObj = { RecurringData: encodeURIComponent(JSON.stringify(request.ptp))};
            responseCallback(respObj);
        }
    } else if (request.type === "cancelPayment" && ("cancelURL" in request.request)) {
        openUrlInTab(decodeURIComponent(request.request.cancelURL), (request.request && request.request.parentTabId) ? request.request.parentTabId : null);
    }
    sendResponse({status: 'ok'});
});

function queryBuilder(request) {
    let query = "";
    for (let i = 0; i < Object.keys(request).length; i++) {
        if (["url", "successURL", "failureURL", "purchaseURL", "shareURL", "confirmURL", "cancelURL"].indexOf(Object.keys(request)[i]) != -1) {
            query = query + Object.keys(request)[i] + "=" + encodeURIComponent(request[Object.keys(request)[i]]) + "&";
        } else if (Object.keys(request)[i] !== "message") {
            query = query + Object.keys(request)[i] + "=" + encodeURI(request[Object.keys(request)[i]]) + "&";
        }
    }
    return query;
}

/**
 * Checks all open MetaMask windows, and returns the first one it finds that is a notification window (i.e. has the
 * type 'popup')
 *
 * @private
 * @param {Function} cb - A node style callback that to whcih the found notification window will be passed.
 *
 */
async function _getPopup() {
    const windows = await getAllWindows();
    const data = await finalBrowser.storage.local.get("lastPopupId");
    return data && data.lastPopupId ? _getPopupIn(windows, data.lastPopupId) : _getPopupIn(windows);
}

/**
 * Given an array of windows, returns the 'popup' that has been opened by MetaMask, or null if no such window exists.
 *
 * @private
 * @param {array} windows - An array of objects containing data about the open MetaMask extension windows.
 *
 */
function _getPopupIn(windows, lastPopupId) {
    return windows
        ? windows.find(win => {
              // Returns notification popup
              return win && win.type === "popup" && (win.id === _popupId || (lastPopupId && win.id === lastPopupId));
          })
        : null;
}

function openWindow(options) {
    return new Promise((resolve, reject) => {
        finalBrowser.windows.create(options, newWindow => {
            const error = checkForError();
            if (error) {
                return reject(error);
            }
            return resolve(newWindow);
        });
    });
}

function focusWindow(windowId) {
    return new Promise((resolve, reject) => {
        finalBrowser.windows.update(windowId, { focused: true }, () => {
            const error = checkForError();
            if (error) {
                return reject(error);
            }
            return resolve();
        });
    });
}

function getAllWindows() {
    return new Promise((resolve, reject) => {
        finalBrowser.windows.getAll(windows => {
            const error = checkForError();
            if (error) {
                return reject(error);
            }
            return resolve(windows);
        });
    });
}

function checkForError() {
    const lastError = finalBrowser.runtime.lastError;
    if (!lastError) {
        return;
    }
    // if it quacks like an Error, its an Error
    if (lastError.stack && lastError.message) {
        return lastError;
    }
    // repair incomplete error object (eg chromium v77)
    return new Error(lastError.message);
}

if (finalBrowser.browserAction && finalBrowser.browserAction.onClicked) {
    finalBrowser.browserAction.onClicked.addListener(() => {
        showPopup({ isLoggedIn: false });
    });
} else {
    finalBrowser.action.onClicked.addListener(() => {
        showPopup({ isLoggedIn: false });
    });
}