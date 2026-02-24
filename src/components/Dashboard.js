import React, {useEffect, useState} from "react";
import { Box, Grid, Modal, Typography, makeStyles ,} from "@material-ui/core";
import * as api from "../api";
import * as localstorage from "../utils/local-storage";
import * as utils from "../utils/utils";
import getSymbolFromCurrency from 'currency-symbol-map';
import TransactionHistoryListingItem from "./TransactionHistoryListItem";
import Tooltip from "@material-ui/core/Tooltip";
import InfoOutlinedIcon from "@material-ui/icons/InfoOutlined";
import classNames from "classnames";
import { COMMON_ERROR_MSG } from "../utils/constants";
import OfferCell from "./OfferCell";
import moment from "moment";
import CurrencyToggle from "./CurrencyToggle";
import ArrowForwardIosIcon from '@material-ui/icons/ArrowForwardIos';
import LockIcon from '@material-ui/icons/Lock';
import styles from './../styles/common.module.scss';
import uiText from './../../configurations/dropp.json'
import {renderCurrency } from "../utils/currency";
// const ShowExchangeRateMsg = ({exchangeRate}) => {
//     return (
//         <div>
//             Based on current exchange rate 1 HBAR = {getSymbolFromCurrency("USD")}{utils.displayAmount(exchangeRate)}
//         </div>
//     );
// }

const useStyles = makeStyles(() => ({
    ctrlBtns: {
        marginTop: "10px",
        display :"flex",
        justifyContent:"space-around"
    },
    btnWidth: {
        minWidth:"83px"
    },
    subHeadingContainer: {
        marginBottom: "5px",
        padding:"0 10px",
    },
    txnBox: {
        marginBottom: "20px",
    },
    txnPrice: {
        textAlign: "right"
    },
    txn: {
        cursor: "pointer"
    },
    txnArrowWrapper: {
        textAlign: "right"
    },
    mainTitle: {
        fontSize: "14px",
        whiteSpace: "nowrap",  /* stay on one line */
        overflow: "hidden",     /* hide extra text */
        textOverflow: "ellipsis", /* show ... */
    },
    txnDate: {
        fontSize: "12px",
        color:"#888B8E",
    },
    btnContainer: {
        marginTop: "20px",
        paddingLeft: "10px"
    },
    // scrollableSection: {
    //     borderRadius: '8px',
    //     height: '100%',
    //     overflowY: 'scroll',
    //     paddingTop: "25px",
    // },
    mainBalanceContainer: {
        textAlign: "center",
        paddingLeft:"62px",
    },
    creditBalanceContainer: {
        textAlign: "center"
    },
    subBalanceHeading: {
        fontSize: "12px",
        fontWeight: "600",
        lineHeight: "1.5rem",
    },
    subBalanceHeight: {
        padding:"3px 12px !important",
    },
    viewKeyContainer: {
        textAlign: "center",
        marginTop: "10px"
    },
    lockIconWrapper: {
        alignItems: "center",
        display: "flex",
        justifyContent: "center"
    },
    borderedBoxDashedUI:{
        border: "2px dashed #61dafb !important",
        borderRadius: "15px",
        padding: "1em",
        width: "100%",
    },
    flexBetween: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        marginTop: "5px",
    },
    subtleText: {
        marginTop: "4px",
        fontSize: "12px",
        opacity: 0.8,
        textAlign: "left",
    },
    centerRightPadding: {
        alignItems: "center",
        paddingRight: "30px",
    }
}))

const Dashboard = ({ setCurrentScreen, setScreenWithData, forceUpdate, userDetails }) => {
    const [balanceUSD, setBalanceUSD] = useState(0);
    const [cryptoBalance, setCryptoBalance] = useState(0);
    const [history, setHistory] = useState([]);
    const [showOfferLink, setShowOfferLink] = useState(false);
    const [exchangeRate, setExchangeRate] = useState(null);
    const [localUserData, setLocalUserData] = useState(null);
    const [noRecentTxns, setNoRecentTxns] = useState(null);
    const [droppCredit, setDroppCredit] = useState(0);
    const [backendErr, setBackendErr] = useState(null);
    const [expMsgModal, setExpMsgModal] = useState(false);
    const [activeOffers, setActiveOffers] = React.useState([]);
    const [offerFailed, setOfferFailed] = React.useState(null);
    const HBAR = "HBAR";
    const USD = "USD";
    const pageTexts = uiText.dashboard;
    const classes = useStyles();

    React.useEffect(() => {
        utils.droppConfig();
    },[]);

    useEffect(() => {
        async function getOffers() {
            try {
                let offers = await api.getCustomerOffers({userId: utils.hederaAccountToString(userDetails.hhAccount), currency: userDetails.currency, countryCode: userDetails.countryCode, statuses: ["ACTIVE"]});
                setActiveOffers(offers);
            } catch (e) {
                setOfferFailed(true);
            }
        }

        async function fetchNewOffers() {
            let offers = await localstorage.newOffers.getNewOffers();
            if (offers && offers.expiry > (new Date().getTime())) {
                setShowOfferLink(offers.hasNewOffers);
            } else {
                let createdOnMilliSec = new Date().getTime() - (24 * 60 * 60 * 1000);
                let dataToSign = {userId: utils.hederaAccountToString(userDetails.hhAccount), currency: userDetails.currency, countryCode: userDetails.countryCode, createdOnMilliSec: createdOnMilliSec};
                offers = await api.checkForNewOffers(dataToSign);
                setShowOfferLink(offers);
                localstorage.newOffers.setNewOffers(offers);
            }
        }

        async function checkIfValidUser() {
            let userData = await localstorage.decrypted.get();
            const data = await localstorage._get("env");
            if (data && data.env == "sandbox" && userData && !userData.mainnet) {
                setScreenWithData("sandboxRecoveryModal", {showSandboxRecoveryModal : true, askToUpdate: true});
                return;
            } else if (userData && userData.activeNetwork == "test") {
                let res = await api.checkIfValidUser();
                if (res && res.responseCode == 0) {
                    if (!res.data) {
                        setBackendErr("This test account is no longer available. Please switch to your main account.");
                        setExpMsgModal(true);
                    }
                } else {
                    setBackendErr(COMMON_ERROR_MSG);
                    setExpMsgModal(true);
                }
            }
        }

        async function fetchLocalUserData() {
            let userData = await localstorage.decrypted.get();
            if (userData) {
                setLocalUserData(userData);
            }
        }

        if (userDetails && userDetails.hhAccount) {
            if (utils.isCrypto(userDetails.currency)) {
                fetchLocalUserData();
                setCryptoBalance(utils.displayAmount(userDetails.cryptoBalance / utils.getCurrencyDecimal(userDetails.currency)));
            }

            setBalanceUSD(utils.displayAmount(userDetails.balance, 2));
            if (userDetails.droppCredit) {
                setDroppCredit(utils.displayAmount(userDetails.droppCredit / Math.pow(10, 4)));
            }
            Promise.all([fetchNewOffers(), checkIfValidUser(), getOffers()]);
        }

        async function fetchExchangeRate() {
            let exchangeRate = await api.fetchExchangeRate(USD, HBAR);
            setExchangeRate(exchangeRate);
            return exchangeRate;
        }

        async function fetchPurchaseHistory() {
            let purchaseHistoryDetails = await api.fetchPurchaseHistory({duration: "All", startIndex: 0, endIndex: 10});
            if (purchaseHistoryDetails && purchaseHistoryDetails.data && purchaseHistoryDetails.data.length) {
                setHistory(purchaseHistoryDetails.data.slice(0, 1));
            } else {
                setNoRecentTxns(true);
            }
            return purchaseHistoryDetails
        }

        if (userDetails && userDetails.currency == HBAR) {
            fetchExchangeRate()
        }
        fetchPurchaseHistory();
    }, [userDetails]);

    const lockAccount = async () => {
        const localData = await localstorage.decrypted.get();
        if (localData && localData.pin) {
            await localstorage._remove("_decrypted");
            forceUpdate();
        } else {
            setScreenWithData("changepin", {dashboard: true});
        }
    };

    const viewPurchaseDetails = (data) => {
        setScreenWithData("details", data);
    };

    const goToTransactions = () => {
       setCurrentScreen("transactions");
    };

    const calculateTxnListHeight = () => {
        let height = 375;
        if (userDetails) {
            if (userDetails && userDetails.currency == HBAR && userDetails.hhAccount) {
                height -= 58;
            }
            if (userDetails.pendingBalance > 0) {
                height -= 28;
            }
            if (userDetails.droppCredit > 0) {
                height -= 17;
            }
            if (utils.isCrypto(userDetails.currency) && localUserData && !localUserData.savedKeys) {
                height -= 170;
            }
        }
        if (showOfferLink == true) {
            height -= 26;
        }
        return height;
    };

    const renderDroppCredit = (labelText, amount, currency, suffixText) => {
        return (
            /*
                <div className={styles.droppCreditBalance}>
                    <Grid container alignItems="center" justifyContent="space-between">
                        <Typography className={styles.balanceHeading}>
                            {labelText}
                        </Typography>
                        <Typography className={styles.conversionBalance}>
                            {`${getSymbolFromCurrency(currency)}${amount}`}
                            // {suffixText}
                        </Typography>
                    </Grid>
                </div>
                */
                <Grid container spacing={2} style={{padding: "0 10px"}}>
                    <Grid item xs={8} className={classes.subBalanceHeight}>
                        <Typography className={styles.balanceHeading, classes.subBalanceHeading}>
                            {labelText}
                        </Typography>
                    </Grid>
                    <Grid item xs={4} className={classes.subBalanceHeight}>
                        <Typography align="right" className={styles.smallWhiteBalanceTxt}>
                        {`${getSymbolFromCurrency(currency)}${amount}`}
                        </Typography>
                    </Grid>
                </Grid>
        );
    }

    const handleModalClose = async () => {
        let userData = await localstorage.decrypted.get();
        userData = { ...userData, ...userData.mainnet }
        await localstorage.decrypted.set(userData);
        setExpMsgModal(false);
        setScreenWithData("sandboxRecoveryModal", {showSandboxRecoveryModal : true});
        return;
    }

    const handleDeposit = (currency) => {
        if(currency == HBAR) {
            setCurrentScreen("fundCrypto", { fromScreen: "dashboard" })
        } else if(utils.isCrypto(currency)) {
            setCurrentScreen("transferUSDC", { fromScreen: "dashboard" })
        } else {
            setScreenWithData("fundnow", { fromScreen: "dashboard" });
        }
    }

    const renderUserCurrency = (labelTxt, usdBal, cryptoBal) => {
        if (userDetails.currency == HBAR) {
            return (
                <div style={{ textAlign: "left" }}>
                    <div className={classNames([classes.mainBalanceContainer, classes.subHeadingContainer])}>
                        <Typography className={styles.balanceHeading}>
                            {userDetails.currency} {pageTexts.userBalanceMsg}
                        </Typography>
                        {/* <label style={{fontSize: "20px", marginTop: "6px", marginRight:"8px",float:"left"}}>
                            {labelTxt} {cryptoBal + " "}
                            <img
                                height="19"
                                width="14"
                                src="./hbar_icon.png"
                            />

                        </label> */}
                        <Typography className={styles.balance}>
                            {utils.displayAmount(cryptoBal, 4)}&nbsp;
                            <span>
                                <img
                                    height="19"
                                    width="14"
                                    src="./hbar_icon.png"
                                />
                            </span>
                        </Typography>
                    </div>
                    {userDetails.cryptoBalance ? <hr className={styles.lightHorizontalLine}/> :""}
                    <div className={styles.droppCreditBalance}>
                        <Typography className={styles.balanceHeading}>
                            {pageTexts.conversionMsg}
                        </Typography>
                        <Typography className={styles.conversionBalance}>
                            ${utils.displayAmount((userDetails.cryptoBalance / 10 ** 8) * exchangeRate, 2)}
                        </Typography>
                    </div>
                    {/* <label><p style={{paddingTop:"3px",float:"left",fontSize:"25px",margin:"auto",marginRight:"8px"}}>| </p>
                    <p style={{paddingTop:"10px",fontSize:"15px"}}>
                        ${utils.displayAmount((userDetails.cryptoBalance / 10 ** 8) * exchangeRate)}
                        <Tooltip
                            title={<ShowExchangeRateMsg exchangeRate={exchangeRate} />}
                            placement="left bottom"
                            style={{
                                color: "#18c2ee",
                                cursor: "pointer",
                                fontSize: "1.25em",
                                marginBottom: "-3px",
                                paddingLeft: "3px",
                            }}
                        >
                            <InfoOutlinedIcon />
                        </Tooltip>
                    </p>
                  </label> */}
                </div>
            );
        } else if (utils.isCrypto(userDetails.currency)) {
            return (
                <div className={classNames([classes.mainBalanceContainer, classes.subHeadingContainer])}>
                    <Typography className={styles.balanceHeading, classes.subBalanceHeading}>
                        {userDetails.currency} {labelTxt}
                    </Typography>
                    <Typography className={styles.balance}>
                        {userDetails.currency == "USDC" ? `${cryptoBal} USDC` : `${cryptoBal} ${userDetails.currency}`}
                    </Typography>
                </div>
            );
        } else {
            return (
                labelTxt !== pageTexts.pendingBalance ? 
                <div className={classNames([classes.mainBalanceContainer, classes.subHeadingContainer])}>
                    <Typography className={styles.balanceHeading}>
                        {userDetails.currency} {labelTxt}
                    </Typography>
                    <Typography className={styles.balance}>
                        {getSymbolFromCurrency(userDetails.currency) ? `${getSymbolFromCurrency(userDetails.currency)}` : ''}{utils.displayAmount(usdBal, 2)}
                    </Typography>
                </div> : 
                <Grid container spacing={2} style={{padding: "0 10px"}}>
                    <Grid item xs={8} className={classes.subBalanceHeight}>
                        <Typography className={styles.balanceHeading, classes.subBalanceHeading}>
                            {labelTxt}
                        </Typography>
                    </Grid>
                    <Grid item xs={4} className={classes.subBalanceHeight}>
                        <Typography align="right" className={styles.smallWhiteBalanceTxt}>
                            {getSymbolFromCurrency(userDetails.currency) ? `${getSymbolFromCurrency(userDetails.currency)}` : ''}{utils.displayAmount(usdBal, 2)}
                        </Typography>
                    </Grid>
                </Grid>
            );
        }
    };

    return (
        <Grid container style={{ padding: "1em" }}>
            <Grid item xs={12} className={styles.droppLogoContainer}>
                <img
                    onClick={() => setCurrentScreen("dashboard")}
                    style={{ cursor: "pointer", height: 35 }}
                    src="./dropp_logo.png"
                />
                {/* {userDetails && userDetails.currency == HBAR && userDetails.hhAccount ?
                    <div style={{fontSize: "1.15em", paddingTop: "2px", lineHeight: "18px"}}>
                        <div>HEDERA ACCT #</div>
                        <div>{utils.hederaAccountToString(userDetails.hhAccount)}</div>
                    </div>
                :''} */}
            </Grid>
            <Grid container className={styles.droppScrollableSection} style={{paddingTop: "25px"}}>
                <Grid item xs={12} style={{marginLeft:"6px"}}>
                    <Grid container>
                        <Grid item xs={12} className={styles.blueContainer}>
                            <Grid container>
                                <Grid item xs={10}>
                                    {renderUserCurrency(pageTexts.userBalanceMsg, balanceUSD, cryptoBalance)}
                                </Grid>
                                <Grid item xs={2} className={classes.lockIconWrapper}>
                                    <div onClick={lockAccount}>
                                        <LockIcon className={`${styles.cursorPointer}, ${styles.whiteIcon}`} />
                                    </div>
                                </Grid>
                                <Grid item xs={12}>
                                    {userDetails.currency == HBAR ? "" : (userDetails && (userDetails.pendingBalance > 0 || userDetails.droppCredit > 0)) ? <hr className={styles.lightHorizontalLine}/> : ""}
                                    {/* {(userDetails && userDetails.pendingBalance > 0) ? <div style={{clear: "both", marginTop: "5px", lineHeight: "20px"}}>{renderUserCurrency(pageTexts.pendingBalance, userDetails.pendingBalance)}</div> : ""}
                                    {(userDetails && userDetails.droppCredit > 0) ? <div style={{clear: "both", marginTop: "5px", lineHeight: "12px"}}>{renderDroppCredit(pageTexts.creditBalanceMsg, droppCredit, USD, `Credit${droppCredit == 1 ? "" : "s"} in ${userDetails.currency}`)} </div> : ""}                                */}
                                </Grid>
                            </Grid>
                            <Grid container className={classes.centerRightPadding} >
                                {userDetails?.pendingBalance > 0 && (
                                <>
                                    <Grid item xs={10}>
                                    <Typography className={styles.balanceHeading}>
                                        Pending Balance
                                    </Typography>
                                    </Grid>
                                    <Grid item xs={2}>
                                    <Typography className={styles.balance}>
                                        {getSymbolFromCurrency(userDetails.currency) || ""}
                                        {utils.displayAmount(userDetails.pendingBalance, 2)}
                                    </Typography>
                                    </Grid>
                                </>
                                )}

                                {userDetails?.droppCredit > 0 && (
                                <>
                                    <Grid item xs={10}>
                                    <Typography className={styles.balanceHeading}>
                                        Dropp Credit Balance
                                    </Typography>
                                    </Grid>
                                    <Grid item xs={2}>
                                    <Typography className={styles.balance}>
                                        {getSymbolFromCurrency(userDetails.currency) || ""}
                                        {utils.displayAmount(userDetails.droppCredit/10000, 2) }
                                    </Typography>
                                    </Grid>
                                </>
                                )}

                                {userDetails?.preAuthbalance > 0 && (
                                <>
                                    <Grid item xs={10}>
                                    <Typography className={styles.balanceHeading}>
                                        PRE-AUTH HOLD BALANCE
                                    </Typography>
                                    </Grid>
                                    <Grid item xs={2}>
                                    <Typography className={styles.balance}>
                                        {getSymbolFromCurrency(userDetails.currency) || ""}
                                        {utils.displayAmount(userDetails.preAuthbalance, 2) }
                                    </Typography>
                                    </Grid>
                                </>
                                )}



                                {userDetails?.preAuthbalance > 0 &&
                                userDetails?.preAuthExpiry && (
                                    <Grid item xs={12}>
                                    <Typography className={classes.subtleText}>
                                        Expires on:{" "}
                                        {moment
                                        .utc(userDetails.preAuthExpiry)
                                        .local()
                                        .format("MMM D, YYYY h:mm A")}
                                    </Typography>
                                    </Grid>
                                )}
                         </Grid>
                        </Grid>
                        <Grid container className={classes.btnContainer} justifyContent="center" alignItems="center">
                            <Grid item xs={6}>
                                <button className={classNames([styles.secondaryBtn, styles.circularBtn])} onClick={() => handleDeposit(userDetails.currency)}>
                                    {userDetails.currency == HBAR || utils.isCrypto(userDetails.currency) ? pageTexts.fundCryptoBtnText : pageTexts.fundFiatBtnText}
                                </button>
                            </Grid>
                            {/* <Grid item xs={2}>
                                <div onClick={lockAccount}>
                                    <LockIcon className={`${styles.cursorPointer}, ${styles.primaryColorIcon}`} />
                                </div>
                            </Grid> */}
                        </Grid>
                        {(userDetails && utils.isCrypto(userDetails.currency) && localUserData && !localUserData.savedKeys) && (
                            <Grid item xs={12} className={classes.viewKeyContainer}>
                                <div style={{clear: "both"}}>
                                    <Typography>
                                        We have created a hedera account for you. <br />
                                        {userDetails.hhAccount ? `Your hedera account is : ${utils.hederaAccountToString(userDetails.hhAccount)}` : ""} <br />
                                        We do not maintain your private key, Please store your key in a secure location.
                                    </Typography>
                                    <div>
                                        <a
                                            style={{ fontSize:"16px", marginTop: "15px", color:"rgb(24, 194, 238)",cursor: "pointer" }}
                                            onClick={()=> setScreenWithData("hbarDetails", {currencyCode: userDetails.currencyCode})}>
                                            {pageTexts.viewKeyLink}
                                        </a>
                                    </div>
                                </div>
                            </Grid>
                        )}
                        {(showOfferLink === true && activeOffers && !activeOffers.length) && <Grid container>
                                <div style={{clear: "both", marginTop: "10px", lineHeight: "15px" }}>
                                    <label
                                        style={{ color: "#18C2EE", fontSize: "15px", cursor:"pointer" }}
                                        onClick={() => setCurrentScreen("offers")}>
                                        <u>
                                            <b>{pageTexts.newOfferMsg}</b>
                                        </u>
                                    </label>
                                </div>
                                <hr className="line" />
                            </Grid>
                        }
                    </Grid>
                    <br />
                    {/* <div style={{ textAlign: "left" }}>
                        <button
                            style={{ marginTop: "10px" }}
                            className="button-done"
                            onClick={lockAccount}>
                            LOCK
                        </button>
                    </div> */}
                    <br />
                </Grid>

                <div className="hide-scrollbar" style={{display:"flex",flexDirection:"column", minHeight: "134px", overflowY:"scroll", width: "100%"}}>
                {(noRecentTxns != null && noRecentTxns) ?
                    <>
                        <div style={{textAlign: "center", paddingTop: "50px"}}>
                            <Typography style={{fontSize:"12px"}}>No Recent Transactions</Typography>
                        </div>
                    </>
                :
                    <>
                        {/* {history.map((data, key) => {
                            return (
                            <TransactionHistoryListingItem
                                key={key}
                                viewPurchaseDetails={viewPurchaseDetails}
                                transaction={{
                                ...data,
                                referrer: utils.hederaAccountToString(userDetails.hhAccount),
                                }}
                                />
                            );
                        })} */}
                        {
                            (history && history.length)  ? <div className={classes.txnBox}>
                                <Grid container className={classes.subHeadingContainer}>
                                    <Grid item xs={6}>
                                        <Typography className={styles.subHeading}>
                                            {pageTexts.lastTransactionHeading}
                                        </Typography>
                                    </Grid>
                                    <Grid item xs={6}>
                                        <div>
                                            <Typography onClick={goToTransactions} variant="subtitle2" align="right" className={styles.blueBoldLink}>
                                                {pageTexts.viewAll}
                                            </Typography>
                                        </div>
                                    </Grid>
                                </Grid>
                                {history.map((data, key) =>
                                    <Grid key={key} container className={classNames([classes.txn, styles.greyListContainer])} alignItems="center" onClick={()=> viewPurchaseDetails({...data, referrer: utils.hederaAccountToString(userDetails.hhAccount)})}>
                                        <Grid item xs={7}>
                                            <Tooltip title={data.merchantOrganiationName} arrow>
                                                <Typography variant="subtitle2" className={classNames([styles.darkBoldText, classes.mainTitle])}>
                                                    {data.merchantOrganiationName}
                                                </Typography>
                                            </Tooltip>
                                            <Typography className={classes.txnDate}>
                                                {moment(data.createTimeEpoch * 1000).format("MMM DD YYYY HH:mm A")}
                                            </Typography>
                                        </Grid>
                                        <Grid item xs={4} className={classes.txnPrice}>
                                            <div className={styles.subHeading}>
                                                {data.offerCode ?
                                                    <>
                                                        {(data.invoiceAmount == data.discountedAmount) ?
                                                            <CurrencyToggle hbarImageWidth="9px" hbarImageHeight="13px" fontSize="1.25em" style={{float:"right"}} {...data} />
                                                        :
                                                            utils.isCrypto(data.invoiceCurrency) ? <>
                                                                <span className={styles.boldGreyText} style={{textDecoration: "line-through"}}>{renderCurrency(data.invoiceAmount, data.invoiceCurrency, "16px", null, true)} </span>
                                                                <span style={{paddingLeft: "3px"}}>{renderCurrency(data.discountedAmount, data.invoiceCurrency, "16px", null, true)}</span>
                                                            </> : <>
                                                                <span className={styles.boldGreyText} style={{textDecoration: "line-through"}}>{renderCurrency(data.invoiceAmount, data.invoiceCurrency, null, 2)} </span>
                                                                <span style={{paddingLeft: "3px"}}>{renderCurrency(data.discountedAmount, data.invoiceCurrency, null, 2)}</span>
                                                            </>
                                                        }
                                                    </>
                                                :
                                                    <CurrencyToggle maxDecimalPlace={utils.isCrypto(data.invoiceCurrency) ? 4 : 2} hbarImageWidth="9px" hbarImageHeight="13px" fontSize="1em" style={{float:"right"}} {...data} />
                                                }
                                            </div>
                                        </Grid>
                                        <Grid item xs={1}>
                                            <div className={classes.txnArrowWrapper}>
                                                <img width={30} src="./arrowForward.png" alt="details"/>
                                                {/* <ArrowForwardIosIcon className={classes.txnLink} /> */}
                                            </div>
                                        </Grid>
                                    </Grid>
                                )}

                            </div> : ""
                        }
                    </>
                }

                { (activeOffers && activeOffers.length > 0) ?
                    <>
                        <br />
                        <Grid container className={classes.subHeadingContainer}>
                            <Grid item xs={6}>
                                <Typography variant="subtitle2" className={styles.subHeading}>
                                    <b>{pageTexts.offersHeading}</b>
                                </Typography>
                            </Grid>
                            <Grid item xs={6}>
                                <div>
                                    <Typography onClick={() => {setScreenWithData("offers", {showActiveTab: true});}} variant="subtitle2" align="right" className={styles.blueBoldLink}>
                                        <b>{pageTexts.viewAll}</b>
                                    </Typography>
                                </div>
                            </Grid>
                        </Grid>
                        <Grid container>
                            <div className={classes.borderedBoxDashedUI}>
                                <OfferCell offer={activeOffers[0]} forHomeScreen={true}/>
                            </div>
                        </Grid>
                    </>
                : ""}
                </div>
            </Grid>
            {/* {(history && history.length > 0) && <div style={{position:"fixed",bottom:"9px",left:"20px"}}>
                <a onClick={()=> setCurrentScreen("transactions")} style={{fontSize:"14px", color:"rgb(24, 194, 238)",cursor: "pointer",display:"inline-block"}}><b>More ..</b></a><br/>
            </div>} */}
            <Modal open={expMsgModal} className={styles.modalAtCenter} >
                <Box className={styles.modalContainer}>
                    <Typography>
                        {backendErr}
                    </Typography>
                    <div className={classes.ctrlBtns} >
                        <button className={classNames(["button-done", classes.btnWidth])} onClick={handleModalClose}>OK</button>
                    </div>
                </Box>
            </Modal>
        </Grid>
    );
};

export default Dashboard;
