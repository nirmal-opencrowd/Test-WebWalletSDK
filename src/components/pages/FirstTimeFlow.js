import React from "react";
import PreLogin from "./PreLogin";
import Auth from "./Auth";
import Home from "./Home";
import Loader from "./../Loader";
import * as api from "../../api";
import * as utils from "../../utils/utils";
import * as localstorage from "./../../utils/local-storage";
import * as p2phelper from "./../../utils/p2phelper.js";
import forge from "node-forge";
import {proto} from "@hashgraph/proto";
import { MAX_HEDERA_TXN_FEE } from "./../../utils/constants";
import { Buffer } from "buffer";


const ed25519 = forge.pki.ed25519;

/* global chrome */
/* global safari */
/* global browser */

const finalBrowser = chrome || safari || browser
const FirstTimeFlow = () => {
    const [accountSetupDone, setAccountSetupDone] = React.useState(null);
    const [loggedIn, setLoggedIn] = React.useState(null);
    const [isLoading, setIsLoading] = React.useState(true);
    const [value, setValue] = React.useState(0);
    const [renderComponent, setRenderComponent] = React.useState(true);
    const [merchantTxn, setMerchantTxn] = React.useState({});
    const [droppNodeId, setDroppNodeId] = React.useState(0);
    const [signatures, setSignatures] = React.useState({});
    const [localUserData, setLocalUserData] = React.useState(null);
    const [userDetails, setUserDetails] = React.useState(null);
    const {AccountID, Timestamp, TransactionID, Duration, TokenAssociateTransactionBody, TransactionBody, SignaturePair, SignatureMap, Transaction, TokenID} = proto;

    const forceUpdate = (redirectToPay) => {
        async function checkSetup() {
            await isSetup();
        }
        if (Object.keys(merchantTxn).length && redirectToPay) {
            finalBrowser.tabs.query({currentWindow: true, active: true}, function (tab) {
                delete merchantTxn['isLocked'];
                merchantTxn['isLoggedIn'] = true;
                setRenderComponent(false);
                if (merchantTxn) {
                    if (merchantTxn.fundingSuccess && merchantTxn.fundingSuccess.toString() == "true") {
                        window.location.href = finalBrowser.runtime.getURL("index.html#/home");
                    } else if (merchantTxn.maxAmount || (merchantTxn.fixAmount && merchantTxn.frequency)) {
                        window.location.href = finalBrowser.runtime.getURL("index.html#/recurringPayment?" + utils.queryBuilder(merchantTxn));
                    } else if (merchantTxn.merchantAccount) {
                        window.location.href = finalBrowser.runtime.getURL("index.html#/pay?" + utils.queryBuilder(merchantTxn));
                    } else {
                        window.location.reload();
                    }
                }
                return true;
            });
        } else {
            checkSetup();
            let val = value;
            setValue(val++);
        }
    };

    const updateTxnParams = () => {
        var params = utils.getQueryParams(window.location.href);
        if (params) {
            setMerchantTxn(params);
        }
    };

    const getAssociateTokenTransaction = async () => {
        let tokenId = await utils.getUSDCTokenId();
        const idParts = tokenId.split(".");
        let usdcTokenId = TokenID.create({shardNum: parseInt(idParts[0], 10), realmNum: parseInt(idParts[1], 10), tokenNum: parseInt(idParts[2], 10)});

        let dcTokenId = await utils.getDroppCreditTokenId();
        const tokenIdParts = dcTokenId.split(".");
        let droppCreditTokenId = TokenID.create({shardNum: parseInt(tokenIdParts[0], 10), realmNum: parseInt(tokenIdParts[1], 10), tokenNum: parseInt(tokenIdParts[2], 10)});

        let droppAccId = await utils.getDroppAccountId();
        const droppAccIdParts = droppAccId.split(".");
        let accountIDDropp = AccountID.create({accountNum: parseInt(droppAccIdParts[2], 10)});

        let accountIDSender = AccountID.create({accountNum:userDetails.hhAccount.accountNumber});
        let accountIDNode = AccountID.create({accountNum:droppNodeId});

        let tokenAssociateTransactionBody = TokenAssociateTransactionBody.create({account: accountIDSender});
        tokenAssociateTransactionBody.tokens.push(usdcTokenId);
        tokenAssociateTransactionBody.tokens.push(droppCreditTokenId);
        let timeStampNano = p2phelper.createTimestampNano();
        var timestamp = Timestamp.create({seconds:Math.floor(timeStampNano), nanos: 0});

        var transactionID = TransactionID.create({transactionValidStart:timestamp, accountID:accountIDDropp})
        var duration = Duration.create({seconds:180})

        var transactionBody = TransactionBody.create({
            transactionID:transactionID,
            nodeAccountID:accountIDNode,
            transactionFee : MAX_HEDERA_TXN_FEE,
            transactionValidDuration : duration,
            generateRecord : true,
            // memo : `Dropp: Token associate ${Math.floor(Math.random() * Math.pow(10, 6))}`,
            tokenAssociate : tokenAssociateTransactionBody
        });

        var transactionBodyBytes = TransactionBody.encode(transactionBody).finish();

        return await utils.getEncodedTransactionBytes(transactionBodyBytes, signatures, userDetails);

        // let encoding = "binary";
        // let priv = signatures.privateKey;
        // let privateKey = forge.util.hexToBytes(priv);
        // let signature = ed25519.sign({
        //     message: Buffer.from(transactionBodyBytes),
        //     encoding,
        //     privateKey,
        // });

        // var signaturePair = SignaturePair.create({ed25519: signature });
        // signaturePair.pubKeyPrefix = Buffer.from(p2phelper.hexToBytes(signatures.publicKey));
        // var signatureMap = SignatureMap.create();
        // signatureMap.sigPair.push(signaturePair);

        // var transaction = Transaction.create({
        //     bodyBytes : transactionBodyBytes,
        //     sigMap : signatureMap
        // });

        // var transactionBytes = Transaction.encode(transaction).finish();
        // let encodedTransactionBytes = btoa(String.fromCharCode(...new Uint8Array(transactionBytes)));
        // return encodedTransactionBytes
    };

    React.useEffect(() => {
        utils.updateBadgeText();
        async function checkSetup() {
            await isSetup();
        }
        async function fetchLocalUserData() {
            let userData = await localstorage.decrypted.get();
            if (userData && userData.userId) {
                setLocalUserData(userData);
            }
        }
        fetchLocalUserData();
        checkSetup();
        updateTxnParams();
    }, []);

    React.useEffect(() => {
        async function fetchUserDetails() {
            const details = await api.fetchUserDetails(true);
            if (details && details.responseCode == 0 && details.data) {
                setUserDetails(details.data);
                if(typeof window.Startup !== "undefined") {
                    window.Startup.Store('userID', details.data.id);
                }
            } else if (details && details.responseCode != 0) {
                await utils.resetExpiryForIPQS(details.responseCode);
            }
        }
        if (loggedIn && localUserData && !localUserData.isTokensAssociated && !userDetails) {
            fetchUserDetails();
        }
    }, [localUserData, loggedIn]);

    React.useEffect(() => {
        async function getSignatures() {
            let signatures = await localstorage._get("_decrypted");
            if (signatures && signatures._decrypted) {
                setSignatures(signatures._decrypted);
            }
        }

        async function fetchNodes() {
            let nodeDetails = await api.fetchNodes();
            const nodeArr = nodeDetails.data[0].nodeAccountId.split(".");
            const node = nodeArr[nodeArr.length - 1];
            setDroppNodeId(parseInt(node));
        }
        if (accountSetupDone && loggedIn && localUserData && !localUserData.isTokensAssociated && userDetails && userDetails.hhAccount) {
            Promise.all([
                getSignatures(),
                fetchNodes(),
            ]);
        }
    }, [accountSetupDone, loggedIn, userDetails, localUserData]);

    React.useEffect(() => {}, [isLoading]);

    React.useEffect(() => {
        async function associateToken() {
            let hederaTransaction = await getAssociateTokenTransaction();
            const result = await api.associateDroppCreditToken({hederaTransaction: hederaTransaction});
            if (result && result.responseCode == 0 && result.data) {
                let userData = await localstorage.decrypted.get();
                userData['isTokensAssociated'] = true;
                await localstorage.decrypted.set(userData);
            }
        }

        if (droppNodeId && userDetails && userDetails.hhAccount) {
            associateToken();
        }
    }, [droppNodeId]);

    function isEmpty(obj) {
        return Object.keys(obj).length === 0;
    }

    const isSetup = async () => {
        const resultEncrypted = await localstorage._get("_encrypted");
        const resultDecrypted = await localstorage._get("_decrypted");
        setAccountSetupDone(resultEncrypted && resultEncrypted._encrypted && !isEmpty(resultEncrypted._encrypted));
        setLoggedIn(resultDecrypted && !isEmpty(resultDecrypted) && resultDecrypted._decrypted && resultDecrypted._decrypted.userId  ? true : false);
        setIsLoading(false);
    };

    if (renderComponent) {
        if (!isLoading) {
            if (accountSetupDone && loggedIn) {
                return <Home forceUpdate={forceUpdate} />;
            } else if (accountSetupDone) {
                return <Auth forceUpdate={forceUpdate} merchantTxn={merchantTxn} />;
            } else {
                return <PreLogin merchantTxn={merchantTxn} forceUpdate={forceUpdate} />;
            }
        } else {
            return null;
        }
    } else {
        return null;
    }
};

export default FirstTimeFlow;
