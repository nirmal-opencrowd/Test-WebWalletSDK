import React, { useEffect } from "react";
import { Checkbox, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, FormControlLabel, Grid, makeStyles, Link } from "@material-ui/core";
import * as localstorage from "./../utils/local-storage";
import * as api from "./../api";
import * as utils from "./../utils/utils.js";
// import * as p2phelper from "./../utils/p2phelper.js";
import * as p2phelper from "../utils/p2phelper.js"
import forge, { util } from "node-forge";
import { getQueryParams, isPaymentLinkSupported, updateBadgeText } from "../utils/utils";
import moment from "moment";
import {proto} from "@hashgraph/proto";
import { SUPPORTED_CRYPTO_CURRENCIES, MAX_HEDERA_TXN_FEE} from "./../utils/constants";
import CircularProgress from "@material-ui/core/CircularProgress";
import TestModeText from "./TestModeText";
import styles from "./../styles/common.module.scss";
import Box from "@material-ui/core/Box";
import { Buffer } from "buffer";
import { renderCurrency } from "../utils/currency";
import classNames from "classnames";
import commonStyles from "./../styles/common.module.scss";
import { Button } from "semantic-ui-react";
import PaymentMessage from "./pages/PaymentMessage";

const ed25519 = forge.pki.ed25519;

const useStyles = makeStyles((theme) => ({
    mainContainer: {
        padding: "1em",
    },
    paymentLinkSupported:{
        margin: "10px 0px",
        color: "red",
        fontSize: "1em",
    },
}));

/* global chrome */

const PreAuthPayment = ({ setCurrentScreen, responseCallback, merchantTxnBody = {} }) => {
    const [merchantDetails, setMerchantDetails] = React.useState({});
    const [merchantTxn, setMerchantTxn] = React.useState({});
    const [signatures, setSignatures] = React.useState({});
    const [showMerchantDetails, setShowMerchantDetails] = React.useState(false);
    const [currency, setCurrency] = React.useState();
    const [userDetails, setUserDetails] = React.useState({});
    const [paymentNotAllowed, setPaymentNotAllowed] = React.useState(false);
    const [crossCurrencyPayment, setCrossCurrencyPayment] = React.useState(null);
    const [crossPaymentNotAllowed, setCrossPaymentNotAllowed] = React.useState(false);
    const [approveDropp, setApproveDropp] = React.useState(null);
    const [droppKey, setDroppKey] = React.useState(null);
    const [droppNodeId, setDroppNodeId] = React.useState(null);
    const [useDroppCredit, setUseDroppCredit] = React.useState(false);
    const [paymentLinkSupported, setPaymentLinkSupported] = React.useState(true);
    const [userSuspendedErr, setUserSuspendedErr] = React.useState(null);
    const [testModeActive, setTestModeActive] = React.useState(false);
    const [authorizeHold, setAuthorizeHold] = React.useState(false);
    const [showBalanceError, setShowBalanceError] = React.useState(false);
    const [paymentError, setPaymentError] = React.useState({error: false, msg: ""});
    const [showSuccessMsg, setShowSuccessMsg] = React.useState(false);
    const {AccountID, Timestamp, TransactionID, Duration, TransactionBody, SignaturePair, SignatureMap, Transaction, Key, KeyList, ThresholdKey, CryptoUpdateTransactionBody } = proto;

    const HBAR = "HBAR";
    const classes = useStyles();

    useEffect(() => {
        console.log("PreAuthPayment mounted");
    }, []);

    async function fetchNodes() {
        let nodeDetails = await api.fetchNodes();
        const nodeArr = nodeDetails.data[0].nodeAccountId.split(".");
        const node = nodeArr[nodeArr.length - 1];
        setDroppNodeId(parseInt(node));
    }

    React.useState(() => {
        async function fetchTestMode() {
            let userData = await localstorage.decrypted.get();
            if (userData && userData.activeNetwork === "test") {
            setTestModeActive(true);
            }
        }
        fetchTestMode();
    }, [])


    React.useEffect(() => {
      utils.droppConfig();
      async function fetchUserDetails() {
          let userDetailsLocal = await api.fetchUserDetails(true);
          if (userDetailsLocal && userDetailsLocal.data) {
              setUserDetails(userDetailsLocal.data);
              if(typeof window.Startup !== "undefined" && !window.droppUserId) {
                window.droppUserId = userDetailsLocal.data.userId;
                window.Startup.Store('userID', userDetailsLocal.data.userId);
              }
              setCurrency(userDetailsLocal.data.currency);
              if (userDetailsLocal.data.currency != "USD") {
                fetchNodes();
              }
          } else if (userDetailsLocal.responseCode != 0) {
            setUserSuspendedErr((userDetailsLocal.errors && userDetailsLocal.errors.length) ? userDetailsLocal.errors[0] : "Something went wrong!!");
            await utils.resetExpiryForIPQS(userDetailsLocal.responseCode);
          }
      }
      fetchUserDetails();

      async function getMerchantDetails(merchantId) {
          let merchantDetails = await api.fetchMerchantDetails({merchantAcctId: merchantId, walletCurrency: userDetails.currency});
          if (merchantDetails && merchantDetails.data) {
              return {
                  validMerchant: true,
                  ...JSON.parse(forge.util.decode64(merchantDetails.data.merchantDetailsBytes)),
              };
          }
          return { validMerchant: false };
      }

      async function getSignatures() {
          let signatures = await localstorage._get("_decrypted");
          return signatures._decrypted;
      }

      let merchantAccount;
      let merchantTx = getQueryParams(window.location.href);

      if (merchantTx) {
          updateMerchantTxn(merchantTx);

          if (merchantTx.merchantAccount) {
              merchantAccount = merchantTx.merchantAccount;
          }
      } else {
          merchantTx = merchantTxnBody;
          if (merchantTxnBody.merchantAccount) {
              merchantAccount = merchantTxnBody.merchantAccount;
          }
      }
      if (merchantAccount) {
          Promise.all([getMerchantDetails(merchantAccount)])
              .then(([merchantDetails]) => {
                  setMerchantDetails(merchantDetails);

                  getSignatures()
                      .then(signatures => {
                          setSignatures(signatures);
                      })
                      .catch(console.error);
              })
              .catch("ERROR :: ",console.error);
      } else {
          setMerchantDetails({ validMerchant: false });
      }
    }, []);

    React.useEffect(() => {
        if (useDroppCredit && !(droppNodeId || droppNodeId == 0)) {
            fetchNodes();
        }
    }, [useDroppCredit]);

    async function fetchExchangeRateForCurrencyPair() {
        const sourceCurrencyType = utils.isCrypto(userDetails.currency) ? "CRYPTO" : "FIAT";
        const targetCurrencyType = utils.isCrypto(merchantTxn.currency) ? "CRYPTO" : "FIAT";
        let currencyExchange = await api.fetchExchangeRateForCurrencyPair({merchantAccountId: merchantTxn.merchantAccount, sourceCurrency: userDetails.currency, targetCurrency: merchantTxn.currency, sourceCurrencyType: sourceCurrencyType, targetCurrencyType: targetCurrencyType});
        if (!(currencyExchange && currencyExchange.data)) {
            setCrossPaymentNotAllowed(true);
        }
    }

    async function fetchDroppKey() {
        let key = await api.fetchDroppPublicKey();
        if (key) {
            setDroppKey(key);
        }
    }

    React.useEffect(()=> {
        if (userDetails && (utils.isCrypto(userDetails.currency) || userDetails.droppCredit > 0)) {
          fetchDroppKey();
        }
    }, [userDetails]);

    React.useEffect(()=> {
        if (Object.keys(userDetails).length && Object.keys(merchantDetails).length && (!merchantDetails.walletCurrencyList || (merchantDetails.walletCurrencyList.length > 0 && merchantDetails.walletCurrencyList.indexOf(userDetails.currency) == -1))) {
            setCrossPaymentNotAllowed(true);
        }
    }, [userDetails, merchantDetails]);

    React.useEffect(()=> {
        if (userDetails && userDetails.currency && merchantTxn && merchantTxn.currency) {
            setPaymentLinkSupported(isPaymentLinkSupported(merchantTxn.currency, userDetails.currency));
            if (userDetails.currency != merchantTxn.currency) {
                setCrossCurrencyPayment(true);
                if (SUPPORTED_CRYPTO_CURRENCIES.indexOf(userDetails.currency) == -1) {
                    fetchExchangeRateForCurrencyPair();
                }
            }
        }
    }, [userDetails, merchantTxn]);

    const getCheckboxIcon = () => {
        if (approveDropp) {
            return "./dropp-icon-checkbox-checked.png";
        }
        return "./dropp-icon-checkbox-empty.png";
    };

    const getDroppCreditCheckboxIcon = () => {
        if (useDroppCredit) {
            return "./dropp-icon-checkbox-checked.png";
        }
        return "./dropp-icon-checkbox-empty.png";
    };

    const updateMerchantTxn = (txn) => {
        const urls = ["url", "successURL", "failureURL", "purchaseURL", "shareURL", "confirmURL", "cancelURL"];
        for (let i = 0; i < urls.length; i++) {
            if (txn[urls[i]]) {
                txn[urls[i]] = decodeURIComponent(txn[urls[i]]);
            }
        }
        setMerchantTxn(txn);
    };

    const createSignature = (createdOn, encodedHHUpdateAccount) => {
        let recurringData = p2phelper.createRecurringData(merchantTxn, utils.hederaAccountToString(userDetails.hhAccount), createdOn, encodedHHUpdateAccount, userDetails.currency, useDroppCredit);
        let recurringDataStr = JSON.stringify(recurringData);
        let rDataBuffer = Buffer.from(recurringDataStr, "utf-8");
        let encoding = "binary";
        let priv = signatures.privateKey;
        let privateKey = forge.util.hexToBytes(priv);
        let signature = ed25519.sign({
            message: rDataBuffer,
            encoding,
            privateKey,
        });
        return forge.util.bytesToHex(signature);
    };

    const createEncodedUpdateAccount = async() => {
      var accountIDSender = AccountID.create({accountNum:userDetails.hhAccount.accountNumber})
      var accountIDNode = AccountID.create({accountNum:droppNodeId})
      var userAccountKey = Key.create({ed25519: p2phelper.hexToBytes(signatures.publicKey)});
      var droppAccountKey = Key.create({ed25519: p2phelper.hexToBytes(droppKey)});

      var keyList = KeyList.create();
      keyList.keys.push(userAccountKey);
      keyList.keys.push(droppAccountKey);

      var thresholdKey = ThresholdKey.create({keys: keyList, threshold: 1});

      var finalKey = Key.create({thresholdKey: thresholdKey});

      var cryptoUpdateTransactionBody = CryptoUpdateTransactionBody.create({key: finalKey, accountIDToUpdate:accountIDSender});

      let timeStampNano = p2phelper.createTimestampNano();
      var timestamp = Timestamp.create({seconds:Math.floor(timeStampNano), nanos: 0})

      var transactionID = TransactionID.create({transactionValidStart:timestamp, accountID:accountIDSender})
      var duration = Duration.create({seconds:180})

      var transactionBody = TransactionBody.create({
        transactionID:transactionID,
        nodeAccountID:accountIDNode,
        transactionFee : MAX_HEDERA_TXN_FEE,
        transactionValidDuration : duration,
        generateRecord : true,
        // memo : "Update Account via Dropp",
        cryptoUpdateAccount : cryptoUpdateTransactionBody
      })

      var transactionBodyBytes = TransactionBody.encode(transactionBody).finish()

      return await utils.getEncodedTransactionBytes(transactionBodyBytes, signatures, userDetails);
    //   let encoding = "binary";
    //   let priv = signatures.privateKey;
    //   let privateKey = forge.util.hexToBytes(priv);
    //   let signature = ed25519.sign({
    //       message: Buffer.from(transactionBodyBytes),
    //       encoding,
    //       privateKey,
    //   });

    //   var signaturePair = SignaturePair.create({ed25519: signature });
    //   signaturePair.pubKeyPrefix = Buffer.from(p2phelper.hexToBytes(signatures.publicKey));
    //   var signatureMap = SignatureMap.create();
    //   signatureMap.sigPair.push(signaturePair);

    //   var transaction = Transaction.create({
    //     bodyBytes : transactionBodyBytes,
    //     sigMap : signatureMap
    //   })

    //   var transactionBytes = Transaction.encode(transaction).finish();
    //   let encodedTransactionBytes = btoa(String.fromCharCode(...new Uint8Array(transactionBytes)));

    //   //var encodedTransactionBytes = forge.util.encode64(transactionBytes)

    //   return encodedTransactionBytes
    };

    const createRecurringPaymentData = async () => {
        let createdOn = (new Date()).toISOString();
        let encodedHHUpdateAccount = (utils.isCrypto(userDetails.currency) || (userDetails && userDetails.droppCredit > 0 && useDroppCredit)) ? await createEncodedUpdateAccount() : "";
        let recurringData = p2phelper.createRecurringData(merchantTxn, utils.hederaAccountToString(userDetails.hhAccount), createdOn, encodedHHUpdateAccount, userDetails.currency, useDroppCredit);
        let recurringDataStr = JSON.stringify(recurringData);
        let rDataBuffer = Buffer.from(recurringDataStr, "utf-8");
        let rDataBase64 = rDataBuffer.toString("base64");
        let ptp = {
          "data": rDataBase64,
          "signatures": {
              payer: createSignature(createdOn, encodedHHUpdateAccount),
          },
        };
        return ptp;
    };

    const processPostPayment = async (p2p) => {
        if (merchantTxn.url) {
            const response = await api.submitP2PToMerchant(merchantTxn.url, p2p);
            if (response && response.responseCode === 0) {
                updateMerchantTxn({successMessage: "Pre-auth approved!", ...merchantTxn});
                setShowSuccessMsg(true);
            } else {
                let errMsg = "Pre-auth failed. Please contact us at support@dropp.cc"
                if (response && response.responseCode === 27 && response.errors.length) {
                    errMsg = response.errors[0];
                }
                setPaymentError({error: true, msg: errMsg});
            }
        }
    };

    const approve = async () => {
        let ptp = await createRecurringPaymentData();
        if (merchantTxn.submitToCallBack && merchantTxn.submitToCallBack.toLowerCase() === "post") {
            processPostPayment(ptp);
        } else {
            let views = chrome.extension.getViews({ type: "popup" });
            if (views && views.length === 0) {
                chrome.runtime.sendMessage({
                    type: "addRecurringPayment",
                    request: merchantTxn,
                    ptp: ptp,
                });
                updateBadgeText();
                window.close();
            } else {
                updateBadgeText();
                responseCallback({ ptp, referrer: merchantTxn.referrer });
                window.close();
            }
        }
    };

    const cancel = () => {
        let views = chrome.extension.getViews({ type: "popup" });
        if (views && views.length === 0) {
            window.close();
            updateBadgeText();
        } else {
            setCurrentScreen("dashboard");
            updateBadgeText();
        }
    };

    const toggleMerchantDetails = () => {
        setShowMerchantDetails(!showMerchantDetails);
    };

    const toggleApproveDropp = () => {
        setApproveDropp(!approveDropp);
    };

    const toggleUseDroppCredit = () => {
        setUseDroppCredit(!useDroppCredit);
    };

    const setUSDAsActiveWallet = async () => {
        let walletList = await api.fetchUserWalletList();
        if (walletList && walletList.data && walletList.data.length) {
            let userWallets = walletList.data;
            userWallets = userWallets.filter((wallet) => wallet.walletId.currencyCode === "USD");
            const usdWallet = (userWallets && userWallets.length > 0) ? userWallets[0].walletId : {countryCode: "USA", currencyCode: "USD", operatorId: 1};
            let result = await api.setWalletAsDefault({countryCode: usdWallet.countryCode, currencyCode: usdWallet.currencyCode, operatorId: usdWallet.operatorId});
            if (result && result.responseCode == 0) {
            window.location.reload();
            }
        }
    };

    const renderGetConfirmation = () => {
        return (
            <React.Fragment>
                <div style={{maxHeight:"500px", overflow:"scroll"}}>
                    <Grid container direction="column">
                        <Grid container item>
                        <Box m={1} component={Grid} container direction="column" style={{ padding: "0.25em 1em 1em 1em", width: "95%" }}>
                            {(userDetails && userDetails.droppCredit && userDetails.droppCredit > 0) ?
                                <Grid
                                    container
                                    item
                                    direction="row"
                                    style={{
                                        flexWrap: "nowrap",
                                        padding: "1em 0",
                                    }}>
                                    <Grid item >
                                        <span>
                                            <img
                                                alt="getDroppCreditCheckboxIcon"
                                                onClick={toggleUseDroppCredit}
                                                style={{
                                                    height: "20px",
                                                    paddingRight: "8px",
                                                    cursor: "pointer",
                                                }}
                                                src={getDroppCreditCheckboxIcon()}
                                            />
                                        </span>
                                    </Grid>

                                    <Grid item >
                                        <span
                                            style={{
                                                fontSize: ".8em",
                                            }}>
                                            <b>I approve Dropp to withdraw Dropp Credits for pre auth payments.</b>
                                        </span>
                                    </Grid>
                                </Grid>
                            : ""}
                            <Grid container item direction="row"style={{ backgroundColor:"#fff", bottom: 0, left: 10, padding:"10px", position: "fixed", width: "100%" }}>
                                <Grid item >
                                {
                                // (!paymentLinkSupported || paymentNotAllowed || crossPaymentNotAllowed || (utils.isCrypto(userDetails.currency) && !approveDropp))
                                (
                                        !authorizeHold ||
                                        paymentNotAllowed ||
                                        crossPaymentNotAllowed ||
                                        !paymentLinkSupported ||
                                        (utils.isCrypto(userDetails.currency) && !approveDropp))
                                ?
                                            <button
                                                style={{
                                                    marginRight: "5px",
                                                    marginBottom: "5px",
                                                }}
                                                className="button-done button-disabled"
                                                disabled
                                                >
                                                APPROVE
                                            </button>
                                            :
                                            <button
                                                style={{
                                                    marginRight: "5px",
                                                    marginBottom: "5px",
                                                }}
                                                className="button-done"
                                                onClick={() => {
                                                        if (userDetails.balance == 0) {
                                                            setShowBalanceError(true);
                                                            return;
                                                        }
                                                        approve();
                                                    }}
                                                >
                                                APPROVE
                                            </button>
                                        }

                                    </Grid>
                                    <Grid item>
                                        <button  style={{marginLeft:"2px"}}className="button-cancel" onClick={cancel}>
                                            CANCEL
                                        </button>
                                    </Grid>
                                </Grid>
                            </Box>
                        </Grid>
                    </Grid>
                </div>
                <TestModeText testModeActive={testModeActive} />
            </React.Fragment>
        );
    };

    const renderContentDetails = () => {
        let thumbnailUrl;
        if (merchantTxn.thumbnail) {
            thumbnailUrl = decodeURIComponent(merchantTxn.thumbnail);
        }
        const secondsToMinutes = ({ authHoldTimeInSeconds }) => {
            if (!authHoldTimeInSeconds) return 0;
            return Math.floor(authHoldTimeInSeconds / 60);
        };

        return (
            <Grid
                container
                direction="column"
                style={{
                    padding: "1em 1em 0.25em 1em",
                }}>
                <Grid item>
                    <p
                        style={{
                            textAlign: "left",
                            fontWeight: "bold",
                            fontSize: "1.5em",
                            lineHeight: "1.5em",
                            marginBottom: "10px",
                            marginTop:"10px",
                            textAlign:"center",
                            alignItems:"center"

                        }}>
                        {"PRE AUTH PAYMENT"}
                    </p>
                </Grid>
                      <div
                            className={classNames([classes.mainContainer])}
                        >
                            <p title={merchantTxn.description} className={styles.ellipsisAfterThreeLines} >
                            Merchant {merchantDetails.organizationName} is requesting a hold for  {renderCurrency(
                                    parseFloat(merchantTxn.maxAmount),
                                    merchantTxn.currency || "USD",
                                    "12px"
                                )} dollars on your {userDetails.currency || "USD"} account. Do you approve?
                            </p>
                     </div>
                    <Box
                        m={1}
                        component={Grid}
                        container
                        className={styles.greyListContainer}
                        direction="column"
                        style={{ padding: "1em", width: "95%" }}
                        >
                        <Grid
                            item
                            style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "0.75em",
                            }}
                        >
                            {merchantDetails.logoUrl && (
                            <img
                                src={merchantDetails.logoUrl}
                                alt="Merchant Logo"
                                style={{
                                width: "40px",
                                height: "40px",
                                borderRadius: "100%"
                                }}
                            />
                            )}

                            <p
                            style={{
                                margin: 0,
                                textAlign: "left",
                                fontWeight: "bold",
                                fontSize: "1.5em",
                                lineHeight: "1.5em",
                            }}
                            >
                            {merchantDetails.organizationName}
                            </p>
                        </Grid>
                    </Box>
                <Box m={1} component={Grid} container className={`${styles.greyListContainer}`} direction="column" style={{ padding: "1em", width: "95%" }}>
                    {thumbnailUrl && (
                        <Grid item>
                            <div style={{overflow:"auto", width: "315px", height: "162px", display: "flex", marginBottom: "10px"}}>
                                <div style={{backgroundImage: `url(${thumbnailUrl})`, width: "100%", height: "100%", backgroundSize: "contain", backgroundRepeat: "no-repeat", backgroundPosition: "top left"}}></div>
                            </div>
                        </Grid>
                    )}

                    <Grid item style={{marginTop: "5px", fontSize: "14px"}}>
                        {(merchantTxn.frequency && merchantTxn.frequency != "NONE") ? <p style={{lineHeight: "20px"}}><span style={{fontWeight: 600}}>Payment Interval:</span> {merchantTxn.frequency}</p> : ''}
                        {merchantTxn.expiry ? <p style={{lineHeight: "20px"}}><span style={{fontWeight: 600}}>Expiry:</span> {moment(merchantTxn.expiry).format("MMM DD, YYYY")}</p> : ''}
                        {merchantTxn.maxAmount ? <p style={{lineHeight: "20px"}}><span style={{fontWeight: 600}}>Max Amount:</span> {renderCurrency(parseFloat(merchantTxn.maxAmount), merchantTxn.currency, "12px")}</p> : ''}
                        {merchantTxn.fixAmount ? <p style={{lineHeight: "20px"}}><span style={{fontWeight: 600}}>Invoice Amount:</span> {renderCurrency(parseFloat(merchantTxn.fixAmount), merchantTxn.currency, "12px")}</p> : ''}
                    </Grid>

                    <Grid item>
                        <p style={{ lineHeight: "2.1em", fontWeight: "300" }}>
                            {merchantTxn.description}
                        </p>
                    </Grid>
                </Box>
                {!paymentNotAllowed && (crossCurrencyPayment != null && crossCurrencyPayment) ?
                    <Box m={1} component={Grid} container className={`${styles.greyListContainer}`} direction="column" style={{ padding: "1em", width: "95%" }}>
                        <Grid item>
                            <p className={classes.paymentLinkSupported}>
                                Crypto wallet not supported
                            </p>
                        </Grid>
                        <Grid container item>
                            <Grid container item direction="row">
                                <Grid item>
                                    <Link
                                        className={`${styles.blueBoldLink} ${styles.upperCase} ${classes.linkMarginRightBottom}`}
                                        onClick={setUSDAsActiveWallet}
                                        >
                                        Switch to USD currency account
                                    </Link>
                                </Grid>
                            </Grid>
                        </Grid>
                    </Box>
                :
                    <>
                        <div className={classNames([classes.mainContainer])}>
                            <Grid
                                container
                                item
                                direction="row"
                                alignItems="flex-start"
                                style={{ paddingTop: "1em" }}
                                >
                                <FormControlLabel
                                    control={
                                    <Checkbox
                                        color="primary"
                                        checked={authorizeHold}
                                        onChange={(e) => setAuthorizeHold(e.target.checked)}
                                    />
                                    }
                                    label={
                                    <span style={{ fontSize: "0.9em", lineHeight: "1.4em" }}>
                                        I authorize a temporary hold of{" "}
                                        {renderCurrency(
                                            parseFloat(((userDetails && userDetails.balance >= merchantTxn.maxAmount) ? merchantTxn.maxAmount : userDetails.balance)),
                                            "USD",
                                            "12px"
                                        )}
                                        {" "}
                                        by {merchantDetails.organizationName} {" "}on my{" "}
                                        {"USD"} balance
                                    </span>
                                    }
                                />
                            </Grid>
                        </div>
                        <hr className={commonStyles.horizontalLine} />
                        <div className={classNames([classes.mainContainer])}>
                            <p title={merchantTxn.description} className={styles.ellipsisAfterThreeLines} >
                                Hold will be expire in {secondsToMinutes({authHoldTimeInSeconds: merchantTxn.authHoldTimeInSeconds  })} minutes
                                </p>
                        </div>
                    </>
                }

                 <Dialog
                    open={showBalanceError}
                    onClose={() => setShowBalanceError(false)}
                    >
                    <DialogTitle>Error</DialogTitle>

                    <DialogContent>
                        <DialogContentText>
                            You don't have sufficient balance to approve this authorization.
                        </DialogContentText>
                    </DialogContent>

                    <DialogActions>
                        <Button
                            onClick={() => setShowBalanceError(false)}
                            color="primary"
                        >
                            OK
                        </Button>
                    </DialogActions>
                    </Dialog>
            </Grid>

        );
    };

    const renderErrorText = text => {
        return (
            <h3
                style={{
                    marginLeft: "70px",
                    fontWeight: "bold",
                    color: "#18C2EE",
                    fontSize: "26px",
                }}>
                {text}
            </h3>
        );
    };

    const renderPaymentScreen = () => {
        // Show loader while calling APIs details
        if (Object.keys(merchantDetails).length === 0) {
            return (
                <Grid container direction="column" className="App">
                    <div className="loader">
                        <CircularProgress color="inherit" />
                    </div>
                </Grid>
            );
        }

        // If MPS has no details on the merchant
        if (!merchantDetails.validMerchant) {
            return renderErrorText("INVALID MERCHANT");
        }
    };


    return (
        <>
            {userSuspendedErr ?
                <Grid container justifyContent={"center"} alignItems={"center"}>
                    <Grid item style={{marginTop: "50%", padding: "1em"}}>
                        {userSuspendedErr}
                    </Grid>
                </Grid>
            :
                <>
                    {showSuccessMsg ? <PaymentMessage color="#42ba96" message={merchantTxn.successMessage} cancel={cancel} /> :
                        <>
                            {(paymentError && paymentError.error) ? <PaymentMessage color="#F32013" message={paymentError.msg} cancel={cancel} /> :
                                <>
                                    {renderPaymentScreen() ||
                                        <Grid
                                            container
                                            item
                                            direction="column"
                                            style={{
                                                textAlign: "left",
                                                justifyContent: "end",
                                        }}>
                                            {renderContentDetails()}
                                            {Object.keys(userDetails).length > 0 ?
                                                <>
                                                    {renderGetConfirmation()}
                                                </>
                                                : ''
                                            }
                                        </Grid>
                                    }
                                </>
                            }
                        </>
                    }
                </>
            }
        </>
    );
};

export default PreAuthPayment;
