import React, {useState, useEffect} from "react";
import * as api from "../../api";
import SidebarMenu from "./Sidebar";
import Dashboard from "./../Dashboard";
import ChangePin from "./../ChangePin";
import TxnHistory from "./../TxnHistory";
import Favorites from "./../Favorites";
import Replenishment from "./../Replenishment";
import Offers from "./../Offers";
import Pay from "./../Pay";
import Support from "./Support";
import PurchaseDetails from "./PurchaseDetails";
import PurchasesCredits from "./PurchasesCredits";
import FundingHistory from "./FundingHistory";
import FundAccount from "./FundAccount";
import AccountSettings from "./AccountSettings";
import Notifications from "./Notifications";
import Profile from "./Profile";
import ManageAccounts from "./ManageAccounts";
import AddCurrencyWallet from "./AddCurrencyWallet";
import RedeemNow from "./RedeemNow";
import MyRecurringPayments from "./MyRecurringPayments";
import MerchantTxns from "./MerchantTxns";
import MerchantCredits from "./MerchantCredits";
import HbarDetails from "./HbarDetails";
import FundCrypto from "./FundCrypto";
import RedeemCrypto from "./RedeemCrypto";
import About from "./../About";
import TransferUSDC from "./TransferUSDC";
import Sidebar from "react-sidebar";
import USDCHistory from "./USDCHistory";
import Transactions from "./Transactions";
import MerchantList from "./MerchantList";
import { Grid, CircularProgress, Typography, Button } from "@material-ui/core";
import NFTCollections from "./NFTCollections";
import NFTDetails from "./NFTDetails";
import NFTTrade from "./NFTTrade";
import NFTTransfer from "./NFTTransfer";
import NFTReceiving from "./NFTReceiving";
import NFTAssociate from "./NFTAssociate";
import forge from "node-forge";
import {proto} from "@hashgraph/proto";
import { MAX_HEDERA_TXN_FEE, FRAUD_ERROR_CODES } from "./../../utils/constants";
import * as p2phelper from "../../utils/p2phelper.js";
import * as localstorage from "../../utils/local-storage";
import { getDroppAccountId, getEncodedTransactionBytes, resetExpiryForIPQS, resetLocalData } from "./../../utils/utils";
import NFTTradeSubmitted from "./NFTTradeSubmitted";
import ShareAccForNFT from "./../ShareAccForNFT";
import NFTHistory from "./NFTHistory";
import ConnectWithDapps from "./ConnectWithDapps";
import CreateDepositeAddress from "./CreateDepositeAddress";
import ChainAddress from "./ChainAddress";
import WalletConnect from "./WalletConnect";
import ConnectedDapps from "./ConnectedDapps";
import EnvOptions from "./EnvOptions";
import DeveloperSettings from "./DeveloperSettings";
import GettingStarted from "./GettingStarted";
import SandboxRecovery from "./SandboxRecovery";
import SandboxRecoveryModal from "./SandboxRecoveryModal";
import TestModeText from "../TestModeText";
import FundingAccount from "./FundingAccount";
import MenuIcon from '@material-ui/icons/Menu';
import UITexts from "../../../configurations/dropp.json";
import styles from "../../styles/common.module.scss";

const ed25519 = forge.pki.ed25519;

/* global chrome */

let responseCallback;

const Home = ({ history, forceUpdate }) => {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [currentScreen, setCurrentScreen] = useState("dashboard");
    const [merchantTxnBody, setMerchantTxnBody] = useState({});
    const [mpsDown, setMpsDown] = useState(false);
    const [screenData, setScreenData] = useState(null);
    const [userDetails, setUserDetails] = useState(null);
    const [loading, setLoading] = useState(true);
    const [pageLoading, setPageLoading] = useState(false);
    const [backendErr, setBackendErr] = useState(null);
    const [associatedTokenCount, setAssociatedTokenCount] = useState(null);
    const [droppNodeId, setDroppNodeId] = React.useState(0);
    const [signatures, setSignatures] = React.useState({});
    const [workingEnv, setWorkingEnv] = React.useState("");
    const [footerObj, setFooterObj] = React.useState({});
    const [functionCallOnBack, setFunctionCallOnBack] = React.useState(null);
    const [pageHeading, setPageHeading] = React.useState(null);

    const {AccountID, Timestamp, TransactionID, Duration, TokenAssociateTransactionBody, TransactionBody, SignaturePair, SignatureMap, Transaction, CryptoUpdateTransactionBody} = proto;

    const newScreens = [
        "dashboard",
        "transactions",
        "details",
        "merchantCredits",
        "merchantTxns",
        "fundnow",
        "fundingAccount",
        "redeemnow",
        "fundCrypto",
        "transferUSDC",
        "redeemCrypto",
        "createDepositeAddress",
        "chainAddress",
        "usdcHistory",
        "nftcollections",
        "nftDetails",
        "nftHistory",
        "associateNFT",
        "nftReceiving",
        "nftTrade",
        "nftTransfer",
        "manageaccounts",
        "addcurrencywallet",
        "hbarDetails",
        "profile",
        "accountsettings",
        "changepin",
        "developerSettings",
        "about",
        "favorites",
        "offers",
        "merchantList",
        "connectedDapps",
        "support",
        "txnSupport",
        "nftTradeSubmitted",
        "notifications",
        "magicLinkRecovery",
        "connectWithDapps"
    ];
    const screensWithNoHamburger = [
        "dashboard",
        "merchantTxns",
        "merchantCredits",
        "details",
        "fundnow",
        "fundingAccount",
        "redeemnow",
        "fundCrypto",
        "transferUSDC",
        "redeemCrypto",
        "createDepositeAddress",
        "chainAddress",
        "usdcHistory",
        "nftDetails",
        "nftHistory",
        "associateNFT",
        "nftReceiving",
        "nftTrade",
        "nftTransfer",
        "addcurrencywallet",
        "hbarDetails",
        "profile",
        "changepin",
        "developerSettings",
        "about",
        "nftTradeSubmitted",
        "notifications",
        "support",
        "nftcollections",
        "merchantList",
        "offers",
        "connectedDapps",
        "connectWithDapps"
    ];
    const screensWithFooter = [
        "fundnow",
        "redeemnow",
        "redeemCrypto",
        "nftHistory",
        "associateNFT",
        "nftReceiving",
        "nftTrade",
        "nftTransfer",
        "addcurrencywallet",
        "profile",
        "changepin",
        "about",
        "support",
        "txnSupport",
        "nftTradeSubmitted",
        "notifications"
    ];

    useEffect(() => {
        if (currentScreen !== 'accountsettings' && currentScreen !== 'transactions') {
            setPageLoading(true);
            api.fetchUserDetails()
            .then((data) => {
                if (data.responseCode != 0) {
                    setBackendErr((data.errors && data.errors.length) ? data.errors[0] : "Something went wrong!!");
                    resetExpiryForIPQS(data.responseCode);
                } else if (data.data) {
                    setUserDetails(data.data);
                    if(typeof window.Startup !== "undefined" && !window.droppUserId) {
                        window.droppUserId = data.data.userId;
                        window.Startup.Store('userID', data.data.userId);
                    }
                }
                setLoading(false);
                setPageLoading(false);
            if (currentScreen === "profile" || currentScreen === "changepin") {
                const backHandler = () => {
                    if (screenData && screenData.fromScreen === "accountsettings") {
                        setCurrentScreen("accountsettings");
                    } else {
                        setCurrentScreen("dashboard");
                        onSetSidebarOpen(true);
                    }
                    setFunctionCallOnBack(null);
                };
                setFunctionCallOnBack(() => backHandler);
                return () => {
                    setFunctionCallOnBack(null);
                };
            }
            })
            .catch(e => {
                setLoading(false);
                setMpsDown(true);
                setPageLoading(false);
            });
        }
    }, [currentScreen]);

    React.useEffect(() => {
        async function fetchUserNetwork() {
            let userData = await localstorage.decrypted.get();
            if(userData && userData.activeNetwork) {
                setWorkingEnv(userData.activeNetwork);
            }
        }

        fetchUserNetwork();
    },[])

    React.useEffect(() => {
        async function fetchNodes() {
            let nodeDetails = await api.fetchNodes();
            const nodeArr = nodeDetails.data[0].nodeAccountId.split(".");
            const node = nodeArr[nodeArr.length - 1];
            setDroppNodeId(parseInt(node));
        }

        async function getSignatures() {
            let signatures = await localstorage._get("_decrypted");
            setSignatures(signatures._decrypted);
        }

        async function automaticAssociatedTokenCount() {
            let res = await api.getAssociatedTokenCount();
            if (res && res.responseCode == 0) {
                getSignatures();
                fetchNodes();
                setAssociatedTokenCount(res.data);
            }
        }

        if (userDetails && userDetails.hhAccount && userDetails.automaticTokenAssociation) {
            automaticAssociatedTokenCount();
        }
    }, [userDetails]);

    const createEncodedUpdateAccount = async() => {
        let droppAccId = await getDroppAccountId();
        const droppAccIdParts = droppAccId.split(".");
        let accountIDDropp = AccountID.create({accountNum: parseInt(droppAccIdParts[2], 10)});
        const accountIDSender = AccountID.create({accountNum:userDetails.hhAccount.accountNumber})
        const accountIDNode = AccountID.create({accountNum:droppNodeId});
        const maxAutomaticTokenAssociations = associatedTokenCount;
        var cryptoUpdateTransactionBody = CryptoUpdateTransactionBody.create({maxAutomaticTokenAssociations: maxAutomaticTokenAssociations, accountIDToUpdate: accountIDSender});

        let timeStampNano = p2phelper.createTimestampNano();
        var timestamp = Timestamp.create({seconds:Math.floor(timeStampNano), nanos: 0})

        var transactionID = TransactionID.create({transactionValidStart:timestamp, accountID: accountIDDropp});
        var duration = Duration.create({seconds:180})

        var transactionBody = TransactionBody.create({
          transactionID:transactionID,
          nodeAccountID:accountIDNode,
          transactionFee : MAX_HEDERA_TXN_FEE,
          transactionValidDuration : duration,
          generateRecord : true,
        //   memo : "Update Account via Dropp",
          cryptoUpdateAccount : cryptoUpdateTransactionBody
        })

        var transactionBodyBytes = TransactionBody.encode(transactionBody).finish();
        return await getEncodedTransactionBytes(transactionBodyBytes, signatures, userDetails);

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
        // var signatureMap = SignatureMap.create()
        // signatureMap.sigPair.push(signaturePair)

        // var transaction = Transaction.create({
        //   bodyBytes : transactionBodyBytes,
        //   sigMap : signatureMap
        // })
        // var transactionBytes = Transaction.encode(transaction).finish();
        // let encodedTransactionBytes = btoa(String.fromCharCode(...new Uint8Array(transactionBytes)));

        // //var encodedTransactionBytes = forge.util.encode64(transactionBytes)
        // return encodedTransactionBytes
      };

    React.useEffect(() => {
        async function resetMaxAutomaticTokenAssociations() {
            const updateAccountTxn = await createEncodedUpdateAccount();
            const result = await api.updateUserToRemoveAssociateTokenAutomatically({hederaTransaction: updateAccountTxn});
        }
        if (signatures && signatures.privateKey && (associatedTokenCount || associatedTokenCount == 0) && droppNodeId) {
            resetMaxAutomaticTokenAssociations();
        }
    }, [associatedTokenCount, signatures, droppNodeId]);

    const onSetSidebarOpen = open => {
        setSidebarOpen(open);
    };

    const setScreenWithData = (screenName, data) => {
        setScreenData(data);
        setCurrentScreen(screenName);
    };

    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
        if (request.message === "paymentTransaction") {
            responseCallback = sendResponse;
            setMerchantTxnBody(request);
            setCurrentScreen("payment");
        }
        return true;
    });

    const cancel = () => {
        window.close();
    };

    const unlink = async () => {
        resetLocalData(forceUpdate)
    };

    const updateUserDetails = (details) => {
        if (details && details.data) {
            setUserDetails(details.data);
        }
    };

    React.useEffect(() => {
        if (currentScreen === "fundnow" || currentScreen==="fundCrypto" || currentScreen==="transferUSDC") {
            const backHandler = () => {
                if (screenData && screenData.fromScreen === "dashboard") {
                    setCurrentScreen("dashboard");
                } else {
                    setCurrentScreen("dashboard");
                    onSetSidebarOpen(true);
                }
                setFunctionCallOnBack(null);
            };
            setFunctionCallOnBack(() => backHandler);
            return () => {
                setFunctionCallOnBack(null);
            };
        }
    }, [currentScreen, screenData]);


    const renderSwitch = () => {
        switch (currentScreen) {
            case "dashboard":
                return <Dashboard setCurrentScreen={setCurrentScreen} setScreenWithData={setScreenWithData} forceUpdate={forceUpdate} userDetails={userDetails} />;
            case "changepin":
                return <ChangePin setFooterObj={setFooterObj} workingEnv={workingEnv} setCurrentScreen={setCurrentScreen} data={screenData} forceUpdate={forceUpdate} />;
            case "profile":
                return <Profile setFooterObj={setFooterObj} setCurrentScreen={setCurrentScreen} setScreenWithData={setScreenWithData} />;
            case "notifications":
                return userDetails && <Notifications pageLoading={pageLoading} userDetails={userDetails} setFooterObj={setFooterObj} setCurrentScreen={setCurrentScreen} />;
            case "accountsettings":
                return <AccountSettings setCurrentScreen={setCurrentScreen} setScreenWithData={setScreenWithData} />;
            case "favorites":
                return <Favorites setCurrentScreen={setCurrentScreen} />;
            case "history":
                return <TxnHistory setScreenWithData={setScreenWithData} data={screenData} setCurrentScreen={setCurrentScreen} />;
            case "fundaccount":
                return userDetails && <FundAccount setCurrentScreen={setCurrentScreen} setScreenWithData={setScreenWithData} userDetails={userDetails} />;
            case "fundnow":
                return <Replenishment setFooterObj={setFooterObj} setCurrentScreen={setCurrentScreen} />;
            case "fundCrypto":
                return userDetails && <FundCrypto setCurrentScreen={setCurrentScreen} userDetails={userDetails} />;
            case "fundingAccount":
                return userDetails && <FundingAccount  setCurrentScreen={setCurrentScreen} userDetails={userDetails} />
            case "offers":
                return <Offers setCurrentScreen={setCurrentScreen} data={screenData} />;
            case "about":
                return <About setFooterObj={setFooterObj} setCurrentScreen={setCurrentScreen} />;
            case "details":
                return <PurchaseDetails data={screenData} setScreenWithData={setScreenWithData} setCurrentScreen={setCurrentScreen} />;
            case "merchantTxns":
                return <MerchantTxns data={screenData} setScreenWithData={setScreenWithData} setCurrentScreen={setCurrentScreen} />;
            case "merchantCredits":
                return <MerchantCredits data={screenData} setScreenWithData={setScreenWithData} setCurrentScreen={setCurrentScreen} />;
            case "credits":
                return <PurchasesCredits setCurrentScreen={setCurrentScreen} setScreenWithData={setScreenWithData} />;
            case "myrecurringpayments":
                return userDetails && <MyRecurringPayments setCurrentScreen={setCurrentScreen} userDetails={userDetails} />;
            case "support":
                return <Support setFooterObj={setFooterObj} setCurrentScreen={setCurrentScreen} />;
            case "txnsupport":
                return <Support setFooterObj={setFooterObj} data={screenData} setCurrentScreen={setCurrentScreen} />;
            case "fundinghistory":
                return <FundingHistory data={screenData} setCurrentScreen={setCurrentScreen} />;
            case "manageaccounts":
                return userDetails && <ManageAccounts workingEnv={workingEnv} data={screenData} setCurrentScreen={setCurrentScreen} setScreenWithData={setScreenWithData} userDetails={userDetails} updateUserDetails={updateUserDetails} />;
            case "addcurrencywallet":
                return userDetails && <AddCurrencyWallet setFooterObj={setFooterObj} data={screenData} setCurrentScreen={setCurrentScreen} userDetails={userDetails} />;
            case "redeemnow":
                return userDetails && <RedeemNow setCurrentScreen={setCurrentScreen} userDetails={userDetails} setFooterObj={setFooterObj} />;
            case "redeemCrypto":
                return userDetails && <RedeemCrypto setPageHeading={setPageHeading} setFunctionCallOnBack={setFunctionCallOnBack} setFooterObj={setFooterObj} setCurrentScreen={setCurrentScreen} userDetails={userDetails} />;
            case "hbarDetails":
                return userDetails && <HbarDetails setCurrentScreen={setCurrentScreen} data={screenData} userDetails={userDetails} />;
            case "transferUSDC":
                return userDetails && <TransferUSDC setCurrentScreen={setCurrentScreen} screenData={screenData} userDetails={userDetails} setScreenWithData={setScreenWithData} />;
            case "usdcHistory":
                return <USDCHistory setCurrentScreen={setCurrentScreen} />;
            case "transactions":
                return userDetails && <Transactions setCurrentScreen={setCurrentScreen} data={screenData} userDetails={userDetails} setScreenWithData={setScreenWithData} />;
            case "merchantList":
                return <MerchantList setCurrentScreen={setCurrentScreen} />;
            case "nftcollections":
                return userDetails && <NFTCollections setCurrentScreen={setCurrentScreen} setScreenWithData={setScreenWithData} userDetails={userDetails}/>
            case "nftDetails":
                return <NFTDetails workingEnv={workingEnv} setCurrentScreen={setCurrentScreen} setScreenWithData={setScreenWithData} data={screenData} userDetails={userDetails} />
            case "nftTrade":
                return <NFTTrade setCurrentScreen={setCurrentScreen}
                        setFooterObj={setFooterObj}
                        workingEnv={workingEnv}
                        setFunctionCallOnBack={setFunctionCallOnBack}
                        setScreenWithData={setScreenWithData}
                        screenData={screenData}
                        userDetails={userDetails}/>
            case "nftTransfer":
                return <NFTTransfer setCurrentScreen={setCurrentScreen}
                        setFooterObj={setFooterObj}
                        setFunctionCallOnBack={setFunctionCallOnBack}
                        setScreenWithData={setScreenWithData}
                        workingEnv={workingEnv}
                        screenData={screenData}
                        userDetails={userDetails}/>
            case "nftReceiving":
                return userDetails && <NFTReceiving setFunctionCallOnBack={setFunctionCallOnBack} setFooterObj={setFooterObj} workingEnv={workingEnv} setCurrentScreen={setCurrentScreen}  userDetails={userDetails}/>
            case "shareAccForNFT":
                return userDetails && <ShareAccForNFT setCurrentScreen={setCurrentScreen} userDetails={userDetails}/>
            case "associateNFT":
                return userDetails && <NFTAssociate setFooterObj={setFooterObj} setCurrentScreen={setCurrentScreen} userDetails={userDetails}/>
            case "nftTradeSubmitted":
                return screenData && screenData.tradeId && <NFTTradeSubmitted setFooterObj={setFooterObj} screenData={screenData} setCurrentScreen={setCurrentScreen} />
            case "nftHistory":
                return userDetails && <NFTHistory setFooterObj={setFooterObj} workingEnv={workingEnv} setCurrentScreen={setCurrentScreen} userDetails={userDetails}/>
            case "walletConnect":
                return userDetails && <WalletConnect setCurrentScreen={setCurrentScreen} userDetails={userDetails} />
            case "connectWithDapps":
                return userDetails && <ConnectWithDapps setCurrentScreen={setCurrentScreen} userDetails={userDetails} />
            case "connectedDapps":
                return userDetails && <ConnectedDapps setCurrentScreen={setCurrentScreen} userDetails={userDetails} />
            case "payment":
                return (
                    <Pay
                        setCurrentScreen={setCurrentScreen}
                        merchantTxnBody={merchantTxnBody}
                        responseCallback={responseCallback}
                    />
                );
            case "createDepositeAddress":
                return userDetails && <CreateDepositeAddress setFunctionCallOnBack={setFunctionCallOnBack} userDetails = {userDetails} setCurrentScreen= {setCurrentScreen} setScreenWithData={setScreenWithData} screenData={screenData}/>
            case "chainAddress":
                return userDetails && <ChainAddress setFunctionCallOnBack={setFunctionCallOnBack} setFooterObj={setFooterObj} userDetails={userDetails} setCurrentScreen={setCurrentScreen} setScreenWithData={setScreenWithData} screenData={screenData}/>
            case "developerSettings":
                return <DeveloperSettings setCurrentScreen={setCurrentScreen} setScreenWithData={setScreenWithData}/>
            case "gettingStarted":
                return <GettingStarted setScreenWithData={setScreenWithData} screenData={screenData}/>
            case "sandboxRecovery":
                return <SandboxRecovery setCurrentScreen={setCurrentScreen}  setScreenWithData={setScreenWithData} screenData={screenData}/>
            case "sandboxRecoveryModal":
                return <SandboxRecoveryModal screenData={screenData}/>
            default:
                return userDetails && <Dashboard forceUpdate={forceUpdate} userDetails={userDetails} />;
        }
    };
    return (
        <>
            {loading ?
                <Grid container direction="column" className="App">
                    <div className="loader">
                        <CircularProgress color="inherit" />
                    </div>
                </Grid>
            :
                <>
                    {backendErr ?
                        <Grid container justifyContent={"center"} alignItems={"center"}>
                            <Grid item style={{marginTop: "25px"}}>
                                <img height="40" src="./dropp_logo.png" alt="logo" />
                            </Grid>
                            <Grid item xs={12} style={{marginTop: "100px", padding: "1.5em"}}>
                                <Typography>{backendErr}</Typography>
                            </Grid>
                            <Grid item xs={6} style={{padding: "1em", textAlign: "center"}}>
                                <button className="button-done" style={{margin: "5px 0 10px"}} onClick={unlink}>
                                    UNLINK
                                </button>
                            </Grid>
                            <Grid item xs={6} style={{padding: "1em", textAlign: "center"}}>
                                <button className="button-cancel" style={{margin: "5px 0 10px"}} onClick={cancel}>
                                    CANCEL
                                </button>
                            </Grid>
                        </Grid>
                    :
                        <>
                            {mpsDown ?
                                <>
                                    <div
                                        style={{
                                            color: "#18C2EE",
                                            marginTop:"70px",
                                            marginLeft:"20px",
                                            marginLeft:"20px"
                                        }}>
                                        <h2>
                                            Something went wrong. Please close the application and try again
                                            later.
                                        </h2>
                                    </div>
                                    <Grid container justifyContent={"center"} alignItems={"center"}>
                                        <Grid item style={{padding: "1em"}}>
                                            <button className="button-done" style={{margin: "5px 0 10px"}} onClick={cancel}>
                                                OK
                                            </button>
                                        </Grid>
                                    </Grid>
                                </>
                            :
                                <>
                                    {userDetails && userDetails.userId ?
                                        newScreens.includes(currentScreen) && currentScreen !== "dashboard"?
                                            <Grid container style={{marginTop: "20px"}}>
                                                <Grid item>
                                                    <Sidebar
                                                        pullRight
                                                        sidebar={
                                                            <div style={{ width: "100%" }}>
                                                                <SidebarMenu
                                                                    setCurrentScreen={setCurrentScreen}
                                                                    onSetOpen={onSetSidebarOpen}
                                                                    userDetails={userDetails}
                                                                    setScreenWithData={setScreenWithData}
                                                                />
                                                            </div>
                                                        }
                                                        open={sidebarOpen}
                                                        onSetOpen={onSetSidebarOpen}
                                                        styles={{ sidebar: { background: "#FFF", width: "100%" }, content: {overflowX: "hidden"}}}>
                                                        {
                                                            sidebarOpen ? "" :
                                                            <Grid container alignItems="center" justifyContent="space-between" direction="row" style={{ padding: "1em 1em 0 1.4em", position: "fixed", zIndex: 2, backgroundColor:"#fff" }}>
                                                                <Grid item xs={2}>
                                                                    <img src="./arrowBack.png" alt="back" onClick={functionCallOnBack ? functionCallOnBack : () => {setCurrentScreen(UITexts[currentScreen].pageOnBack); onSetSidebarOpen(UITexts[currentScreen]?.sidebarOpen || false);}} style={{cursor:"pointer"}}/>
                                                                </Grid>
                                                                <Grid item xs={8}>
                                                                    <Typography title={pageHeading ? pageHeading : UITexts[currentScreen].heading} className={`${styles.pageHeading} ${styles.darkBoldText}`}>
                                                                        {pageHeading ? pageHeading : UITexts[currentScreen].heading}
                                                                    </Typography>
                                                                </Grid>
                                                                <Grid item xs={2}>
                                                                    {/* <img
                                                                        style={{ cursor: "pointer" , display: currentScreen != "dashboard" ? "none" : "inline-block" }}
                                                                        height="30"
                                                                        width="30"
                                                                        src="./icon_accounts_on.png"
                                                                        onClick={() => onSetSidebarOpen(true)}
                                                                    /> */}
                                                                    <div
                                                                        style={{ cursor: "pointer" , display: newScreens.includes(currentScreen) && !screensWithNoHamburger.includes(currentScreen) ? "inline-block" : "none"}}
                                                                        height="30"
                                                                        width="30"
                                                                        onClick={() => onSetSidebarOpen(true)}
                                                                    >
                                                                        <MenuIcon fontSize="large" />
                                                                    </div>
                                                                </Grid>
                                                            </Grid>
                                                        }
                                                        <br />
                                                        <div style={{maxHeight: Object.keys(footerObj).length > 0 ? "580px" : "630px", overflowY: "scroll"}}>
                                                            {renderSwitch()}
                                                        </div>
                                                        {
                                                            screensWithFooter.includes(currentScreen) && footerObj && Object.keys(footerObj).length ?
                                                                <Grid container className={styles.footer}>
                                                                    {
                                                                        footerObj.footerText && <Grid item xs={12}>
                                                                            <Typography variant="body2">
                                                                                {footerObj.footerText}
                                                                            </Typography>
                                                                        </Grid>
                                                                    }
                                                                    {footerObj.primaryBtnText && footerObj.primaryFuncToCall &&
                                                                        <Grid item xs={12}>
                                                                            <button disabled={footerObj.disabledPrimaryBtn} className={`${styles.circularBtn} ${styles.primaryBtn} ${footerObj.disabledPrimaryBtn ? styles.buttonDisabled : ""}`} onClick={footerObj.primaryFuncToCall}>
                                                                                {footerObj.primaryBtnText}
                                                                            </button>
                                                                        </Grid>
                                                                    }
                                                                </Grid> : <></>
                                                        }
                                                        <TestModeText testModeActive={workingEnv === "test"}/>
                                                    </Sidebar>
                                                </Grid>
                                            </Grid>
                                            :
                                            <Sidebar
                                                pullRight
                                                sidebar={
                                                    <div style={{ width: "100%" }}>
                                                        <SidebarMenu
                                                            setCurrentScreen={setCurrentScreen}
                                                            onSetOpen={onSetSidebarOpen}
                                                            userDetails={userDetails}
                                                            setScreenWithData={setScreenWithData}
                                                        />
                                                    </div>
                                                }
                                                open={sidebarOpen}
                                                onSetOpen={onSetSidebarOpen}
                                                styles={{ sidebar: { background: "#FFF", width: "100%" }, content: {overflowX: "hidden"}}}>
                                                <Grid container direction="row" style={{ padding: "2em 1em 0 1.4em" }}>
                                                    <Grid item style={{position:"fixed", right:"20px", top: "15px"}}>
                                                        {/* <img
                                                            style={{ cursor: "pointer" , display: currentScreen != "dashboard" ? "none" : "inline-block" }}
                                                            height="30"
                                                            width="30"
                                                            src="./icon_accounts_on.png"
                                                            onClick={() => onSetSidebarOpen(true)}
                                                        /> */}
                                                        <div
                                                            style={{ cursor: "pointer" , display: newScreens.includes(currentScreen) ? "inline-block" : "none"}}
                                                            height="30"
                                                            width="30"
                                                            onClick={() => onSetSidebarOpen(true)}
                                                        >
                                                            <MenuIcon fontSize="large" />
                                                        </div>
                                                    </Grid>
                                                </Grid>
                                                <br />
                                                <div>
                                                    {renderSwitch()}
                                                </div>
                                                <TestModeText testModeActive={workingEnv === "test"}/>
                                            </Sidebar>
                                    : ""}
                                </>
                            }
                        </>
                    }
                </>
            }
        </>
    );
};

export default Home;
