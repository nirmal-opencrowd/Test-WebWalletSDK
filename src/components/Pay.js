import React from "react";
import { Grid, TextField, InputAdornment, Typography, Link } from "@material-ui/core";
import * as localstorage from "./../utils/local-storage";
import * as api from "./../api";
import * as utils from "./../utils/utils.js";
import { renderCurrency as renderCurrencyUtility } from "./../utils/currency.js";
import * as p2phelper from "./../utils/p2phelper.js";
import forge, { util } from "node-forge";
import { getQueryParams, displayAmount, getUSDCTokenId, getCurrencyDecimal, getStripePK, updateBadgeText } from "../utils/utils";
import PaymentMessage from "./pages/PaymentMessage";
import { baseDroppAPPUrl, MAX_ASSOCIATE_TOKEN_FEE } from "../utils/constants";
import getSymbolFromCurrency from 'currency-symbol-map';
import {proto} from "@hashgraph/proto";
import { MAX_HEDERA_TXN_FEE } from "../utils/constants";
import FormGroup from '@material-ui/core/FormGroup';
import FormControlLabel from '@material-ui/core/FormControlLabel';
import Checkbox from '@material-ui/core/Checkbox';
import { makeStyles } from "@material-ui/core";
import Modal from "@material-ui/core/Modal";
import Box from "@material-ui/core/Box";
import CircularProgress from "@material-ui/core/CircularProgress";
import TestModeText from "./TestModeText";
import LowBalanceModal from "./LowBalanceModal";
import moment from 'moment';
import OfferCell from "./OfferCell.js";
import styles from "./../styles/common.module.scss";
import classNames from 'classnames';
import FeeBreakdown from "./FeeBreakdown.js";

const ed25519 = forge.pki.ed25519;

/* global chrome */

const useStyles = makeStyles((theme) => ({
    droppCreditCheckbox: {
        fontSize: "12px",
        opacity: 0.5,
    },
    modalContainer: {
        backgroundColor: '#FFFFFF',
        border: 0,
        padding: "15px",
        position: 'absolute',
        left: '10%',
        top: '30%',
        width: 250,
    },
    mainContainer: {
        padding: "1em",
        margin: "0px 1em",
    },
    lowBalanceSection: {
        padding: "1em",
        margin: "1em",
    },
    txnTitle: {
        textAlign: "left",
        fontWeight: "bold",
        fontSize: "1.5em",
        lineHeight: "1.5em",
    },
    ctrlBtns: {
        marginTop: "5px",
        textAlign: "right",
    },
    fontSize12 : {
        fontSize: "12px",
    },
    borderedBoxContainer: {
        marginTop: "30px"
    },
    offerExpText: {
        fontSize: "0.75rem",
    },
    greyText : {
        color:"#888B8E",
    },
    linkText: {
        color:"#18c2ee",
        cursor: "pointer",
    },
    scroll: {
        height:"450px",
        overflowY: "auto"
    },
    footer: {
        backgroundColor: "#fff",
        bottom: "-11px",
        left: 0,
        position: "fixed",
        width: "100%",
    },
    scrollableSection: {
        borderRadius: "8px",
        overflowY: "scroll",
        paddingBottom: "250px",
        width: "100%",
    },
    droppCreditCheck: {
        padding: "9px",
        paddingRight: "2px",
    },
    paymentLinkSupported:{
        margin: "10px 0px",
        color: "red",
        fontSize: "1em",
    },
    paymentNotAllowed:{
        margin: "10px 0px",
        color: "red",
        fontSize: "1em",
    },
    linkMarginRightBottom: {
        marginRight: "5px",
        marginBottom: "5px",
},
    expiresText: {
            fontSize: ".75em",
            paddingBottom: "5px",
        },
    boxPaddingWidth: {
        padding: "1em",
        width: "95%",
    },
    lineThroughText: {
    textDecoration: "line-through",
  },
  centeredScrollableDiv: {
        overflow: "auto",
        height: "150px",
        justifyContent: "center",
        display: "flex",
        alignItems: "center",
        marginBottom: "10px",
    },
    thumbnailDiv: {
        width: "100%",
        height: "100%",
        backgroundSize: "contain",
        backgroundRepeat: "no-repeat",
        backgroundPosition: "center",
    },
    fullWidthMarginTop15: {
        width: "100%",
        marginTop: "15px",
     },
    containerGrid: {
        fontSize: "14px",
        marginTop: "10px",
     },
    gridItemWithPaddingTop: {
        paddingTop: "25px",
     },
    hbarIcon: {
        height: "12px",
    },
    errorText: {
        marginLeft: "70px",
        fontWeight: "bold",
        color: "#18C2EE",
        fontSize: "26px",
    },
    hhbarIcon: {
        height: "10px",
        verticalAlign: "baseline",
        paddingRight: "2px",
    },
    centerGridItem: {
        marginTop: "50%",
        padding: "1em",
    },
    customGridContainer: {
        textAlign: "left",
        justifyContent: "flex-end",
    },
    clickableImage: {
        cursor: "pointer",
        padding: "1em",
    },
    gridItemCustom: {
        width: "100%",
        padding: "1em",
        marginTop: 25,
        marginBottom: 10,
    },
    balanceDiv: {
        marginBottom: 10,
    },
    hbarIconHeight: {
        height: 14,
        width: 10,
    },
    fullWidthPadding: {
        width: "100%",
        padding: "1em",
    },
     fixedPositioning: {
        position: "fixed",
        bottom: "14px",
        right: "20px",
    },
    doneButton: {
        marginRight: "5px",
        marginBottom: "5px",
        width: 145,
    },
    cancelButton: {
        marginRight: 10,
        width: 145,
    },
    columnContainer: {
        textAlign: "left",
        justifyContent: "flex-end", // "end" should be written as "flex-end" in CSS
    },
    clickableLogo: {
        cursor: "pointer",
        padding: "1em",
    },
    fixedBottom: {
        position: "fixed",
        bottom: "20px",
    },
    clickableUnderlineText: {
        cursor: "pointer",
        textDecoration: "underline",
        color: "#2AC3EF",
    },
    horizontalPadding: {
        paddingLeft: "1em",
        paddingRight: "1em",
    },
    verifiedIconWrapper: {
        verticalAlign: "bottom",
        paddingLeft: "8px",
    },
    clickableIcon: {
        cursor: "pointer",
    },
    merchantGrid: {
        backgroundColor: "#18C2EE",
        width: "100%",
        padding: "1em",
    },
    whiteText: {
        color: "white",
    },
     paddedGrid: {
        paddingLeft: "1em",
        paddingRight: "1em",
    },
    fontSmallPaddingLeft: {
        fontSize: "12px",
        paddingLeft: "1em",
    },
    underlinePointer: {
        textDecoration: "underline",
        cursor: "pointer",
    },
    containerGridmargin: {
        marginTop: "5px",
        padding: "1em",
    },
    paddedFullWidthGridItem: {
        paddingLeft: "1em",
        paddingRight: "1em",
        width: "100%",
    },
    clickableIconheight: {
        height: "20px",
        paddingRight: "8px",
        cursor: "pointer",
    },
    trustText: {
        fontSize: ".8em",
    },
    boldErrorText: {
        fontWeight: 600,
        fontSize: "12px",
    },
}));


const Pay = ({ setCurrentScreen, responseCallback, merchantTxnBody = {} }) => {
    const [merchantDetails, setMerchantDetails] = React.useState({});
    const [merchantTxn, setMerchantTxn] = React.useState({});
    const [isFavorite, setIsFavorite] = React.useState(false);
    const [makeFavorite, setMakeFavorite] = React.useState(false);
    const [signatures, setSignatures] = React.useState({});
    const [timestamp, setTimestamp] = React.useState(null);
    const [showMerchantDetails, setShowMerchantDetails] = React.useState(false);
    const [currency, setCurrency] = React.useState();
    const [exchangeRate, setExchangeRate] = React.useState(null);
    const [userDetails, setUserDetails] = React.useState({});
    const [lowBalance, setLowBalance] = React.useState(false);
    const [droppAccountId, setDroppAccountId] = React.useState(0);
    const [droppNodeId, setDroppNodeId] = React.useState(null);
    const [feePercentage, setFeePercentage] = React.useState(0.05);
    const [paymentAmount, setPaymentAmount] = React.useState(null);
    const [showSuccessMsg, setShowSuccessMsg] = React.useState(false);
    const [paymentError, setPaymentError] = React.useState({error: false, msg: ""});
    const [paymentNotAllowed, setPaymentNotAllowed] = React.useState(false);
    const [customerOffers, setCustomerOffers] = React.useState(null);
    const [showOffers, setShowOffers] = React.useState(false);
    const [selectedOffer, setSelectedOffer] = React.useState(null);
    const [discountedAmt, setDiscountedAmt] = React.useState(null);
    const [noOffers, setNoOffers] = React.useState(false);
    const [useDroppCredits, setUseDroppCredits] = React.useState(false);
    const [dctToWalletExchangeRate, setDctToWalletExchangeRate] = React.useState(null);
    const [dctToInvoiceExchangeRate, setDctToInvoiceExchangeRate] = React.useState(null);
    const [paymentLinkSupported, setPaymentLinkSupported] = React.useState(true);
    const [userSuspendedErr, setUserSuspendedErr] = React.useState(null);
    const [needToSwitchWallet, setNeedToSwitchWallet] = React.useState(false);
    const [walletToSwitch, setWalletToSwitch] = React.useState(false);
    const [isGivenTokenAssociated, setIsGivenTokenAssociated] = React.useState(null);
    const [tokenAssociationInProgress, setTokenAssociationInProgress] = React.useState(false);
    const [hbarBalance, setHbarBalance] = React.useState(null);
    const [errorMessage, setErrorMessage] = React.useState("");
    const [openErrorModal, setOpenErrorModal] = React.useState(false);
    const [testModeActive, setTestModeActive] = React.useState(false);
    const [lowBalanceModalOpen, setLowBalanceModalOpen] = React.useState(false);
    const [disablePayBtn, setDisablePayBtn] = React.useState(false);
    const [nodeIdAvailable, setNodeIdAvailable] = React.useState(false);
    const [availableBalance, setAvailableBalance] = React.useState(null);

    let dctToBeUsedInTiny;
    let dctInInvoiceCurrency;
    let dctInWalletCurrency;

    const classes = useStyles();
    const HBAR = "HBAR";
    const USDC = "USDC";
    const USD = "USD";
    const CARAT = "CARAT";
    const DCT = "DCT";
    const {AccountID, AccountAmount, TransferList,CryptoTransferTransactionBody, Timestamp, TransactionID, Duration, TransactionBody, SignaturePair, SignatureMap, Transaction, TokenTransferList, TokenID, TokenAssociateTransactionBody} = proto;

    async function fetchNodes() {
        let nodeDetails = await api.fetchNodes();
        const nodeArr = nodeDetails.data[0].nodeAccountId.split(".");
        const node = nodeArr[nodeArr.length - 1];
        setDroppNodeId(parseInt(node));
    }

    const droppNodeIdAvailable = () => {
        if (droppNodeId || (userDetails.currency == USD && !useDroppCredits)) {
            setNodeIdAvailable(true);
            return;
        }
        setNodeIdAvailable(false);
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
        droppNodeIdAvailable();
    }, [droppNodeId, userDetails])

    React.useEffect(() => {
        async function fetchUserDetails() {
            let userDetailsLocal = await api.fetchUserDetails(true);
            // userDetailsLocal.data['droppCredit'] = 20000; // for testing purpose only
            if (userDetailsLocal && userDetailsLocal.responseCode == 0 && userDetailsLocal.data) {
              setUserDetails(userDetailsLocal.data);
              if(typeof window.Startup !== "undefined" && !window.droppUserId) {
                window.droppUserId = userDetailsLocal.data.userId;
                window.Startup.Store('userID', userDetailsLocal.data.userId);
              }
              setCurrency(userDetailsLocal.data.currency);
              if (userDetailsLocal.data.currency != USD) {
                fetchNodes();
              }
            } else if (userDetailsLocal.responseCode != 0) {
              setUserSuspendedErr((userDetailsLocal.errors && userDetailsLocal.errors.length) ? userDetailsLocal.errors[0] : "Something went wrong!!");
              await utils.resetExpiryForIPQS(userDetailsLocal.responseCode);
            }
        }


        async function fetchFeeDetails() {
            let feeDetails = await api.fetchFeeDetails();
            setFeePercentage(feeDetails.data.feePercentage);
            setDroppAccountId(feeDetails.data.droppAccountId.accountNumber)
        }

        Promise.all([fetchUserDetails(), fetchFeeDetails(), utils.droppConfig()]);
    }, []);

    React.useEffect(() => {
        if ((useDroppCredits && !(droppNodeId || droppNodeId == 0)) || (isGivenTokenAssociated != null && isGivenTokenAssociated == false)) {
            fetchNodes();
        }
    }, [useDroppCredits, isGivenTokenAssociated]);

    React.useEffect(() => {
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
      if (userDetails && userDetails.currency && merchantAccount) {
          Promise.all([getMerchantDetails(merchantAccount)])
              .then(([merchantDetails, exRate]) => {
                  setMerchantDetails(merchantDetails);

                  getSignatures()
                      .then(signatures => {
                          setSignatures(signatures);
                      })
                      .catch(console.error);
                  localstorage.favorites
                      .isFavorite(merchantDetails.organizationName)
                      .then(isFav => {
                          setIsFavorite(isFav);
                      })
                      .catch(console.error);
                  setTimestamp(p2phelper.createTimestampNano());
              })
              .catch("ERROR :: ",console.error);
      } else if (!merchantAccount) {
          setMerchantDetails({ validMerchant: false });
      }
    }, [userDetails]);

    React.useEffect(() => {
        // CHECK if merchant accepts payment in HBAR
        if ((userDetails && userDetails.userId && merchantDetails && merchantDetails.merchantId && (!merchantDetails.walletCurrencyList || (merchantDetails.walletCurrencyList.length > 0 && merchantDetails.walletCurrencyList.indexOf(userDetails.currency) == -1))) || (merchantTxn.skipCrypto && utils.isCrypto(userDetails.currency))) {
            setPaymentNotAllowed(true);
        }
      }, [userDetails, merchantDetails, merchantTxn]);

    React.useEffect(() => {
        const fetchCryptoBalance = async () => {
            const balanceData = await api.getCryptoBalance({hhAccountID: utils.hederaAccountToString(userDetails.hhAccount), currency: "HBAR"});
            if (balanceData && (balanceData.data || balanceData.data == 0)) {
                setHbarBalance(balanceData.data / utils.getCurrencyDecimal(HBAR));
            }
        };
        if (isGivenTokenAssociated != null && isGivenTokenAssociated == false) {
            if (userDetails.currency == HBAR) {
                setHbarBalance(userDetails.cryptoBalance / utils.getCurrencyDecimal(HBAR));
            } else {
                fetchCryptoBalance();
            }
        }

    }, [isGivenTokenAssociated]);

    React.useEffect(() => {
        async function checkForTokenAssociation() {
            const result = await api.checkUSDCTokenAssociation({accountId: utils.hederaAccountToString(userDetails.hhAccount), tokenId: merchantTxn.tokenId});
            if (result && result.responseCode == 0) {
                if (result && result.data) {
                setIsGivenTokenAssociated(true);
                } else {
                setIsGivenTokenAssociated(false);
                }
            } else {
                setIsGivenTokenAssociated(false);
            }
        }

        if (isGivenTokenAssociated == null && userDetails && userDetails.hhAccount && merchantTxn && merchantTxn.tokenId) {
            checkForTokenAssociation();
        }
    }, [userDetails, merchantTxn]);

    const handleErrorModalClose = () => {
        setErrorMessage(null);
        setOpenErrorModal(false);
    }

    const needToCheckOtherWallets = () => {
        let needToCheck = false;
        let activeWalletCurrency = userDetails.currency;
        let merchantWallets = (merchantDetails && merchantDetails.walletCurrencyList && merchantDetails.walletCurrencyList.length > 0) ? merchantDetails.walletCurrencyList : [];
        let cryptoWallet = utils.isCrypto(activeWalletCurrency);
        if (cryptoWallet) {
            if (merchantTxn.skipCrypto) {
                needToCheck = true;
                merchantWallets = merchantWallets.filter((currency) => !utils.isCrypto(currency));
            } else if (utils.isCrypto(merchantTxn.currency) && merchantTxn.currency != activeWalletCurrency) {
                needToCheck = true;
            } else if (merchantWallets.indexOf(activeWalletCurrency) == -1) {
                needToCheck = true;
            }
        }
        needToCheck = cryptoWallet && needToCheck;
        if (!needToCheck && !cryptoWallet) {
            if (utils.isCrypto(merchantTxn.currency)) {
                needToCheck = true;
            } else {
                const mechantFiatWallets = merchantWallets.filter((currency) => !utils.isCrypto(currency));
                needToCheck = mechantFiatWallets.indexOf(activeWalletCurrency) == -1;
            }
        }

        return needToCheck;
    };

    React.useEffect(() => {
        async function fetchCustomerOffers() {
            let offers = await api.getCustomerOffers({userId: utils.hederaAccountToString(userDetails.hhAccount), currency: userDetails.currency, countryCode: userDetails.countryCode, merchantId: merchantDetails.merchantId, statuses: ["ACTIVE"]});
            if (offers && offers.length) {
                setNoOffers(false);
                setCustomerOffers(offers);
                setSelectedOffer(offers[0]);
            } else {
                setNoOffers(true);
            }
        }

        if (userDetails && userDetails.currency && merchantTxn && merchantTxn.currency && merchantDetails && merchantDetails.merchantId && !merchantTxn.noOffers) {
            if (((userDetails.currency == merchantTxn.currency) || (userDetails.currency == USDC && merchantTxn.currency == USD)) && !(merchantTxn.lowerLimit && merchantTxn.upperLimit)) {
                fetchCustomerOffers();
            } else {
                setNoOffers(true);
            }
        }

        if (userDetails && userDetails.currency && merchantTxn && merchantTxn.currency && merchantDetails && merchantDetails.walletCurrencyList) {
            let needToCheck = needToCheckOtherWallets();
            setNeedToSwitchWallet(needToCheck);
        }
    }, [userDetails, merchantDetails, merchantTxn]);

    React.useEffect(() => {
        async function getMostEligibleWalletToSwitch() {
            let eligibleWallet = {};
            let userWallets = [];
            let merchantWallets = merchantDetails.walletCurrencyList || [];
            let invoiceCurrency = merchantTxn.currency
            let walletList = await api.fetchUserWalletList();
            if (walletList && walletList.data && walletList.data.length) {
                userWallets = walletList.data;
                userWallets = userWallets.filter((wallet) => !wallet.active);
                // check if skip crypto then remove crypto wallets
                if (merchantTxn.skipCrypto) {
                    userWallets = userWallets.filter((wallet) => !utils.isCrypto(wallet.walletId.currencyCode));
                    merchantWallets = merchantWallets.filter((currency) => !utils.isCrypto(currency));
                }
                if (utils.isCrypto(merchantTxn.currency)) {
                    userWallets = userWallets.filter((wallet) => wallet.walletId.currencyCode == merchantTxn.currency);
                }
                // check if user has invoice currency wallet and merchant supports it
                if (merchantWallets.indexOf(invoiceCurrency) != -1) {
                    userWallets = userWallets.filter((wallet) => wallet.walletId.currencyCode == invoiceCurrency);
                    eligibleWallet = userWallets && userWallets.length ? userWallets[0] : null;
                } else { // check first user wallets supported by merchant
                    for (let i = 0; i < userWallets.length; i++) {
                        if (merchantWallets.indexOf(userWallets[i].walletId.currencyCode) != -1) {
                            eligibleWallet = userWallets[i];
                            break;
                        }
                    }
                }
                if (eligibleWallet) {
                    setWalletToSwitch(eligibleWallet);
                }
            }
        }
        if (needToSwitchWallet) {
            getMostEligibleWalletToSwitch();
        }
    }, [needToSwitchWallet]);

    React.useEffect(()=> {
        if (merchantTxn && merchantTxn.droppSignature && userDetails && exchangeRate) {
            let amt = (merchantTxn.lowerLimit ? merchantTxn.lowerLimit : merchantTxn.amount);
            amt = parseFloat(displayAmount(amt / exchangeRate));
            setPaymentAmount(amt);
        }
    }, [userDetails, merchantTxn, exchangeRate]);

    React.useEffect(()=> {
        async function fetchExchangeRateForCurrencyPair() {
            const sourceCurrencyType = utils.isCrypto(userDetails.currency) ? "CRYPTO" : "FIAT";
            const targetCurrencyType = utils.isCrypto(merchantTxn.currency) ? "CRYPTO" : "FIAT";
            let currencyExchange = await api.fetchExchangeRateForCurrencyPair({merchantAccountId: merchantTxn.merchantAccount, sourceCurrency: userDetails.currency, targetCurrency: merchantTxn.currency, sourceCurrencyType: sourceCurrencyType, targetCurrencyType: targetCurrencyType });
            if (currencyExchange && currencyExchange.data) {
                setExchangeRate(currencyExchange.data);
            } else {
                setPaymentNotAllowed(true);
            }
        }

        if (userDetails && userDetails.currency && merchantTxn && merchantTxn.currency) {
            if (!exchangeRate) {
                (userDetails.currency != merchantTxn.currency) ? fetchExchangeRateForCurrencyPair() : setExchangeRate(1);
            }
            if (!dctToWalletExchangeRate) {
                fetchExchangeRateForUSDtoUserCurrency();
            }
            if (!dctToInvoiceExchangeRate) {
                fetchExchangeRateForUSDtoInvoiceCurrency();
            }
            setPaymentLinkSupported(utils.isPaymentLinkSupported(merchantTxn.currency, userDetails.currency));
        }
    }, [userDetails, merchantTxn]);

    async function checkLowBalance() {
        let hasLowBalance = false;
        let amt = (discountedAmt || discountedAmt == 0) ? discountedAmt : (paymentAmount ? paymentAmount : merchantTxn.amount);
        if (!amt) {
            amt = 0;
        }
        // const dctExchangeRate = await fetchExchangeRateForUSDtoUserCurrency();
        if(userDetails.currency == HBAR) {
          let hbarequivalent = 0;
          if ((discountedAmt || discountedAmt == 0) || paymentAmount) {
            hbarequivalent = amt * getCurrencyDecimal(HBAR);
          } else {
            hbarequivalent = parseFloat(parseFloat(amt || 0) * (1/exchangeRate) * getCurrencyDecimal(HBAR));
          }
          var hbarEquiDCT = 0;
          if (useDroppCredits && userDetails.droppCredit > 0) {
            hbarEquiDCT = ((userDetails.droppCredit / utils.getCurrencyDecimal(DCT)) * dctToWalletExchangeRate) * utils.getCurrencyDecimal("HBAR");
          }
          hasLowBalance = (parseFloat(userDetails.cryptoBalance) + hbarEquiDCT) < hbarequivalent
        } else if (userDetails.currency == CARAT) {
            let caratEquivalent = 0;
            caratEquivalent = parseFloat(amt || 0) * getCurrencyDecimal(CARAT);

            var caratEquiDCT = 0;
            if (useDroppCredits && userDetails.droppCredit > 0) {
                caratEquiDCT = ((userDetails.droppCredit / utils.getCurrencyDecimal(DCT)) * dctToWalletExchangeRate) * utils.getCurrencyDecimal(CARAT);
            }
            hasLowBalance = (parseFloat(userDetails.cryptoBalance) + caratEquiDCT) < caratEquivalent
        } else if (!userDetails.autoReplenishMyAccount) {
            let basePaymentAmt = 0;
            if ((discountedAmt || discountedAmt == 0) || paymentAmount) {
                basePaymentAmt = amt;
            } else {
                basePaymentAmt = parseFloat(parseFloat(amt || 0) / exchangeRate);
            }
            let userBalance = parseFloat(userDetails.currency == USDC ? (userDetails.cryptoBalance / utils.getCurrencyDecimal(userDetails.currency)) : (availableBalance || userDetails.balance));
            if (useDroppCredits && userDetails.droppCredit > 0) {
                const equiDCT = ((userDetails.droppCredit / utils.getCurrencyDecimal(DCT)) * dctToWalletExchangeRate);
                userBalance += equiDCT;
            }
            hasLowBalance = userBalance < parseFloat(basePaymentAmt);
            if (merchantTxn && userDetails.currency == USD) {
                try {
                    const res = await api.validateUserBalance({acceptPaymentDelay: merchantTxn.acceptPaymentDelay, amount: basePaymentAmt, includeDCT: useDroppCredits});
                    if (res && (res.data || res.data == 0)) {
                        setAvailableBalance(res.data);
                    }
                    if (res && res.responseCode != 0) {
                        hasLowBalance = true;
                    }
                } catch (err) {
                    console.error("Error in validateUserBalance", err);
                }
            }
        }
        setLowBalance(hasLowBalance);
        return hasLowBalance
    }

    React.useEffect(() => {
      if(userDetails && merchantTxn && exchangeRate) {
        checkLowBalance();
      }
    }, [userDetails,merchantTxn,exchangeRate,paymentAmount, dctToWalletExchangeRate, useDroppCredits, discountedAmt]);

    async function fetchDiscountedPrice() {
        let amtToPay = (paymentAmount ? paymentAmount : merchantTxn.amount);
        let amt = await api.getDiscountedAmt({userId: utils.hederaAccountToString(userDetails.hhAccount), currency: userDetails.currency, countryCode: userDetails.countryCode, merchantId: selectedOffer.merchantId, offerCode: selectedOffer.offerCode, value: amtToPay});
        if (amt || amt == 0) {
            setDiscountedAmt(parseFloat(displayAmount(amt)));
        }
    }

    React.useEffect(() => {
        if (selectedOffer) {
            fetchDiscountedPrice();
            if (showOffers) {
                toggleShowOffers();
            }
        }
    }, [selectedOffer]);

    async function fetchExchangeRateForUSDtoUserCurrency() {
        if (userDetails.currency == "USD") {
            setDctToWalletExchangeRate(1);
            return 1;
        }
        const sourceCurrencyType = "FIAT";
        const targetCurrencyType = utils.isCrypto(userDetails.currency) ? "CRYPTO" : "FIAT";
        let currencyExchange = await api.fetchExchangeRateForCurrencyPair({merchantAccountId: merchantTxn.merchantAccount, sourceCurrency: "USD", targetCurrency: userDetails.currency, sourceCurrencyType: sourceCurrencyType, targetCurrencyType: targetCurrencyType });
        if (currencyExchange && currencyExchange.data) {
            setDctToWalletExchangeRate(currencyExchange.data);
            return currencyExchange.data;
        } else {
            return 1;
        }
    }

    async function fetchExchangeRateForUSDtoInvoiceCurrency() {
        if (merchantTxn.currency == "USD") {
            setDctToInvoiceExchangeRate(1);
            return;
        }
        const sourceCurrencyType = "FIAT";
        const targetCurrencyType = utils.isCrypto(merchantTxn.currency) ? "CRYPTO" : "FIAT";
        let currencyExchange = await api.fetchExchangeRateForCurrencyPair({merchantAccountId: merchantTxn.merchantAccount, sourceCurrency: "USD", targetCurrency: merchantTxn.currency, sourceCurrencyType: sourceCurrencyType, targetCurrencyType: targetCurrencyType });
        if (currencyExchange && currencyExchange.data) {
            setDctToInvoiceExchangeRate(currencyExchange.data);
        } else {
            setDctToInvoiceExchangeRate(1);
        }
    }

    const toggleShowOffers = () => {
        setShowOffers(!showOffers);
    };


    const cancel = () => {
        let views = chrome.extension.getViews({ type: "popup" });
        if (views && views.length === 0) {
            if (merchantTxn && merchantTxn.cancelURL) {
                messageBGScriptToLoadURl({
                    type: "cancelPayment",
                    request: merchantTxn
                });
            } else {
                window.close();
                updateBadgeText();
            }
        } else {
            setCurrentScreen("dashboard");
            updateBadgeText();
        }
    };

    const getInvoiceAmount = () => {
        let amount = parseFloat(merchantTxn.amount || 0);
        if (merchantTxn.droppSignature && merchantTxn.lowerLimit && paymentAmount) {
            amount = parseFloat(paymentAmount * (exchangeRate || 1));
        }
        return amount;
    };

    const getAmtUserNeedsToPay = () => {
        return (discountedAmt || discountedAmt == 0) ? discountedAmt : getInvoiceAmount();
    };

    const getActualAmtNeedsToAutoCharge = () => {
        let amt = getAmtUserNeedsToPay();
        amt -= (availableBalance || userDetails.balance);
        if (useDroppCredits && userDetails.droppCredit > 0) {
            amt -= getDroppCredit();
        }
        return amt;
    };

    const getAmtNeedsToAutoCharge = () => {
        // Need to return (discountedAmt || invoiceAmt) - droppCredits - balance;
        let amt = getActualAmtNeedsToAutoCharge();
        if (amt < 0.50) {
            amt = 0.50;
        }
        return amt > 0 ? utils.roundUpAmtToTwoDecimals(amt) : 0.50;
    };

    const createSignature = () => {
        let invoiceAmt = getInvoiceAmount();
        let invoice = p2phelper.createInvoice(merchantTxn, invoiceAmt, selectedOffer, discountedAmt, userDetails);
        let invoiceSha256 = p2phelper.sha256Calc(invoice);

        let timestampArr = String(timestamp).split(".");
        let tsSecondsByteArr = p2phelper.longToByteArray(parseInt(timestampArr[0]));

        let tsNanoSecondsByteArr = p2phelper.longToByteArray(parseInt(timestampArr[1]));

        let signatureByteArr = tsSecondsByteArr.concat(tsNanoSecondsByteArr, invoiceSha256);

        let encoding = "binary";
        let priv = signatures.privateKey;
        let privateKey = forge.util.hexToBytes(priv);
        let signature = ed25519.sign({
            message: Buffer.from(signatureByteArr),
            encoding,
            privateKey,
        });
        return forge.util.bytesToHex(signature);
    };

    const getDroppCredit = () => {
        return (userDetails.droppCredit / getCurrencyDecimal(DCT));
    }

    const isCurrencySameForCreditToken = () => {
        return merchantTxn.currency == USD;
    };

    const eligibleForDroppCredits = () => {
        return useDroppCredits && getCreditsToBeUsed() > 0;
    }

    const getTokenId = async (currency) => {
        let tokenId;
        let idParts;
        switch(currency) {
            case USDC:
                tokenId = await getUSDCTokenId();
                idParts = tokenId.split(".");
                return TokenID.create({shardNum: parseInt(idParts[0], 10), realmNum: parseInt(idParts[1], 10), tokenNum: parseInt(idParts[2], 10)});
            case CARAT:
                tokenId = await utils.getCARATTokenId();
                idParts = tokenId.split(".");
                return TokenID.create({shardNum: parseInt(idParts[0], 10), realmNum: parseInt(idParts[1], 10), tokenNum: parseInt(idParts[2], 10)});
            case DCT:
                tokenId = await utils.getDroppCreditTokenId();
                idParts = tokenId.split(".");
                return TokenID.create({shardNum: parseInt(idParts[0], 10), realmNum: parseInt(idParts[1], 10), tokenNum: parseInt(idParts[2], 10)});
            default:
                return "";
        }
    };

    const createEncodedHHTransfer = async() => {
      const isCryptoAcc = utils.isCrypto(userDetails.currency);
      const offerApplied = selectedOffer && selectedOffer.id;
      let cryptoTokenId = "";
      cryptoTokenId = await getTokenId(userDetails.currency);

      const eligibleForDCT = eligibleForDroppCredits();
      let droppCreditTokenId = "";
      if (eligibleForDCT) {
        droppCreditTokenId = await getTokenId(DCT);
      }

      let accountIDSender = AccountID.create({accountNum:userDetails.hhAccount.accountNumber});
      let dctAccountIDReceiver = AccountID.create({accountNum: (merchantDetails && merchantDetails.creditTokenPayoutAccountId) ? merchantDetails.creditTokenPayoutAccountId.accountNumber : merchantDetails.merchantAccountId.accountNumber});
      let accountIDReceiver = AccountID.create({accountNum: (merchantDetails && merchantDetails.payoutAccountId) ? merchantDetails.payoutAccountId.accountNumber : merchantDetails.merchantAccountId.accountNumber});
      let accountIDDropp = AccountID.create({accountNum:droppAccountId});
      let accountIDNode = AccountID.create({accountNum:droppNodeId});
      let amount = getAmtUserNeedsToPay();
      let dctPayerAmount = 0;
      if (eligibleForDCT) {
        dctPayerAmount = getDroppCredit();
        if (!isCurrencySameForCreditToken()) {
            dctPayerAmount *= dctToInvoiceExchangeRate;
        }
      }
      var payerAmount = 0;
      if (isCryptoAcc) {
        payerAmount = (1/exchangeRate) * getCurrencyDecimal(userDetails.currency) * amount;
      } else {
        payerAmount = (1/exchangeRate) * amount;
      }
      let equiDCTAmt = (1/exchangeRate) * dctPayerAmount *  getCurrencyDecimal(userDetails.currency);
      let DCTToBeUsed = 0;
      let walletAmtToBeUsed = 0;
      if (equiDCTAmt && payerAmount) {
          if (payerAmount <= equiDCTAmt) {
            DCTToBeUsed = payerAmount;
          } else {
            DCTToBeUsed = equiDCTAmt;
            if (isCryptoAcc) { // For USD it will return 0 in purchasing
                walletAmtToBeUsed = payerAmount - equiDCTAmt;
            }
          }
      } else if (utils.isCrypto(userDetails.currency) && payerAmount) {
        walletAmtToBeUsed = payerAmount;
      }
      const creditInWalletCurrency = parseFloat(DCTToBeUsed * (1/getCurrencyDecimal(userDetails.currency)));
      const creditInUSD = (1/dctToWalletExchangeRate) * creditInWalletCurrency;
      const creditsToBeUsedInTiny = Math.floor(parseFloat((parseFloat(displayAmount(creditInUSD)) * getCurrencyDecimal(DCT))));
      if (isCryptoAcc) {
        walletAmtToBeUsed = Math.floor(walletAmtToBeUsed);
      } else {
        walletAmtToBeUsed = 0
      }

      let walletDroppFee = Math.floor(feePercentage * walletAmtToBeUsed);
      let DCTDroppFee = Math.floor(feePercentage * creditsToBeUsedInTiny);

      if (dctToWalletExchangeRate && dctToInvoiceExchangeRate) {
        dctToBeUsedInTiny = creditsToBeUsedInTiny;
        dctInWalletCurrency = parseFloat(displayAmount(creditInUSD * dctToWalletExchangeRate));
        dctInInvoiceCurrency = parseFloat(displayAmount(creditInUSD * dctToInvoiceExchangeRate));
      }

    //   const totalMerchantAmt = payerAmount - droppFee;
    //   let merchantAmt = totalMerchantAmt;
      let merchantAmt = Math.floor(walletAmtToBeUsed - walletDroppFee);
      let dctMerchantAmt = Math.floor(creditsToBeUsedInTiny - DCTDroppFee);
      let transferList;
      if (cryptoTokenId) {
        transferList = TokenTransferList.create();
        transferList.token = cryptoTokenId;
      } else {
        transferList = TransferList.create();
      }
      let dctTransferList;
      if (eligibleForDCT) {
        dctTransferList = TokenTransferList.create();
        dctTransferList.token = droppCreditTokenId;
      }

      let accountAmountSender = AccountAmount.create({accountID: accountIDSender,amount: walletAmtToBeUsed * -1});
      let accountAmountDropp = AccountAmount.create({accountID: accountIDDropp,amount: walletDroppFee});
      // FOR DROPP CREDIT TOKEN
      let dctAccountAmountSender = AccountAmount.create({accountID: accountIDSender, amount: creditsToBeUsedInTiny * -1});
      let dctAccountAmountDropp = AccountAmount.create({accountID: accountIDDropp, amount: DCTDroppFee});
      if (eligibleForDCT) {
        dctTransferList.transfers.push(dctAccountAmountSender);
        dctTransferList.transfers.push(dctAccountAmountDropp);
      }
      if (cryptoTokenId) {
        transferList.transfers.push(accountAmountSender);
        transferList.transfers.push(accountAmountDropp);
      } else {
        transferList.accountAmounts.push(accountAmountSender);
        transferList.accountAmounts.push(accountAmountDropp);
      }

      if (merchantTxn.distribution) {
          const distribution = JSON.parse(merchantTxn.distribution);
          for (let key in distribution) {
            if (distribution[key]) {
                const acctIdParts = key.split(".");
                const distAcctId = acctIdParts[acctIdParts.length - 1].trim();
                const distAmt = Math.floor(walletAmtToBeUsed * (parseFloat(distribution[key]/100)));
                const distAcct = AccountID.create({accountNum: parseInt(distAcctId, 10)});
                if (distAcct.accountNum != accountIDReceiver.accountNum) {
                    if (cryptoTokenId) {
                        transferList.transfers.push(AccountAmount.create({accountID: distAcct, amount: distAmt}));
                    } else {
                        transferList.accountAmounts.push(AccountAmount.create({accountID: distAcct, amount: distAmt}));
                    }
                    merchantAmt -= distAmt;
                }

                if (eligibleForDCT && (distAcct.accountNum != dctAccountIDReceiver.accountNum)) {
                    const dctDistAmt = Math.floor(creditsToBeUsedInTiny * (parseFloat(distribution[key]/100)));
                    dctTransferList.transfers.push(AccountAmount.create({accountID: distAcct, amount: dctDistAmt}));
                    dctMerchantAmt -= dctDistAmt;
                }
            }
          }
      }

      if (merchantTxn.referrer && merchantTxn.referralFee) {
        const referrerAccArr = merchantTxn.referrer.split(".");
        const accountIDReferrer = AccountID.create({accountNum: parseInt(referrerAccArr[referrerAccArr.length - 1], 10)});
        const referrerAmt = Math.floor(walletAmtToBeUsed * (parseFloat(merchantTxn.referralFee)/100));
        if (accountIDReferrer.accountNum != accountIDReceiver.accountNum) {
            if (cryptoTokenId) {
                transferList.transfers.push(AccountAmount.create({accountID: accountIDReferrer, amount: referrerAmt}));
            } else {
                transferList.accountAmounts.push(AccountAmount.create({accountID: accountIDReferrer, amount: referrerAmt}));
            }
            merchantAmt -= referrerAmt;
        }

        if (eligibleForDCT && (accountIDReferrer.accountNum != dctAccountIDReceiver.accountNum)) {
            const dctReferrerAmt = Math.floor(creditsToBeUsedInTiny * (parseFloat(merchantTxn.referralFee)/100));
            dctTransferList.transfers.push(AccountAmount.create({accountID: accountIDReferrer, amount: dctReferrerAmt}));
            dctMerchantAmt -= dctReferrerAmt;
        }
      }

      var accountAmountReceiver = AccountAmount.create({accountID:accountIDReceiver, amount: merchantAmt});
      if (merchantAmt > 0 || (merchantAmt == 0 && offerApplied) ) {
        if (cryptoTokenId) {
            transferList.transfers.push(accountAmountReceiver);
        } else {
            transferList.accountAmounts.push(accountAmountReceiver);
        }
      }

      if (eligibleForDCT && ((dctMerchantAmt > 0) || (dctMerchantAmt == 0 && offerApplied))) {
        var dctAccountAmountReceiver = AccountAmount.create({accountID:dctAccountIDReceiver, amount: dctMerchantAmt});
        dctTransferList.transfers.push(dctAccountAmountReceiver);
      }

      let cryptoTransferTransactionBody;
      let transferObj = {};
      if (cryptoTokenId) {
        if (walletAmtToBeUsed > 0 || (walletAmtToBeUsed == 0 && offerApplied)) {
            transferObj = {tokenTransfers: [transferList]};
        }
        if (eligibleForDCT) {
            if (transferObj["tokenTransfers"] && transferObj["tokenTransfers"].length > 0) {
                transferObj["tokenTransfers"].push(dctTransferList)
            } else {
                transferObj["tokenTransfers"] = [dctTransferList];
            }

        }
      } else {
        if (isCryptoAcc && (walletAmtToBeUsed > 0 || (walletAmtToBeUsed == 0 && offerApplied))) {
            transferObj = {transfers: transferList};
        }
        if (eligibleForDCT) {
            transferObj["tokenTransfers"] = [dctTransferList];
        }
      }
      cryptoTransferTransactionBody = CryptoTransferTransactionBody.create(transferObj);
      let timeStampNano = p2phelper.createTimestampNano();
      var timestamp = Timestamp.create({seconds:Math.floor(timeStampNano), nanos: 0});

      let payerAccountId = accountIDSender;
      if (dctToBeUsedInTiny > 0 && walletAmtToBeUsed <= 0) {
        let droppPayerAccount = await utils.getDroppAccountId();
        const droppAccIdParts = droppPayerAccount.split(".");
        payerAccountId = AccountID.create({accountNum: parseInt(droppAccIdParts[2], 10)});
      }

      var transactionID = TransactionID.create({transactionValidStart:timestamp, accountID: payerAccountId});
      var duration = Duration.create({seconds:180});

      var transactionBody = TransactionBody.create({
        transactionID:transactionID,
        nodeAccountID:accountIDNode,
        transactionFee : MAX_HEDERA_TXN_FEE,
        transactionValidDuration : duration,
        generateRecord : true,
        memo : (userDetails.currency == "USDC" && merchantDetails && merchantDetails.memo) ? merchantDetails.memo : "Dropp Payment",
        cryptoTransfer : cryptoTransferTransactionBody
      });

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
    //   });

    //   var transactionBytes = Transaction.encode(transaction).finish();
    //   let encodedTransactionBytes = btoa(String.fromCharCode(...new Uint8Array(transactionBytes)));

    //   //var encodedTransactionBytes = forge.util.encode64(transactionBytes)
    //   return encodedTransactionBytes;
    };

    const createPromiseToPay = async () => {
        let invoiceAmt = getInvoiceAmount();
        let ptp = {
            payer: `${signatures.userId}:${utils.getLast6Chars(signatures.publicKey)}`,
            timeStamp: timestamp,
            ... (utils.isCrypto(userDetails.currency) || eligibleForDroppCredits()) && { encodedHHTransfer: await createEncodedHHTransfer() },
            invoiceBytes: p2phelper.createInvoice(merchantTxn, invoiceAmt, selectedOffer, discountedAmt, userDetails),
            signatures: {
                payer: createSignature(),
            },
            walletCurrency: userDetails.currency,
            exchangeRate: (exchangeRate || 1)
        };
        if (merchantTxn.droppSignature) {
            ptp['signatures']['dropp'] = merchantTxn.droppSignature;
        }
        if (eligibleForDroppCredits()) {
            ptp['droppCredits'] = dctToBeUsedInTiny;
            ptp['droppCreditsInInvoiceCurrency'] = dctInInvoiceCurrency;
            ptp['droppCreditsInWalletCurrency'] = dctInWalletCurrency;
        }
        return ptp;
    };

    const toggleMerchantDetails = () => {
        setShowMerchantDetails(!showMerchantDetails);
    };

    const toggleMakeFavorite = () => {
        setMakeFavorite(!makeFavorite);
    };

    const preparePurchaseURL = () => {
        var options = {...merchantTxn};
        delete options["isLoggedIn"];
        delete options["isLocked"];
        var esc = encodeURIComponent;
        var validQuery = Object.keys(options).filter((k) => options[k] !== null && options[k] !== '') // Remove undef. and null.
            .reduce((newObj, k) => ({ ...newObj, [k]: options[k] }), {})
        let purchaseData = Object.keys(validQuery).map(p => esc(p) + '=' + esc(validQuery[p])).join('&');
        return `${baseDroppAPPUrl}?${purchaseData}`;
    };

    const processPostPayment = async (p2p) => {
        if (merchantTxn.url) {
            const response = await api.submitP2PToMerchant(merchantTxn.url, p2p);
            if (response && response.responseCode === 0) {
                updateMerchantTxn({...merchantTxn, successMessage: "Payment successful!"});
                setShowSuccessMsg(true);
            } else if (merchantTxn.failureURL) {
                let views = chrome.extension.getViews({ type: "popup" });
                const obj = {
                    type: "paymentFailure",
                    request: merchantTxn,
                };
                if (views && views.length === 0) {
                    messageBGScriptToLoadURl(obj);
                } else {
                    responseCallback({ failureURL: merchantTxn.failureURL });
                    messageBGScriptToLoadURl(obj);
                }
            } else {
                let errMsg = "Payment failed. Please contact us at support@dropp.cc"
                if (response && response.responseCode === 27 && response.errors.length) {
                    errMsg = response.errors[0];
                }
                setPaymentError({error: true, msg: errMsg});
            }
        }
    };

    const processPayment = async (p2p) => {
        if (merchantTxn.droppSignature) {
            let purchaseURL = merchantTxn.purchaseURL;
            if (!purchaseURL) {
                purchaseURL = preparePurchaseURL();
            } else if(purchaseURL.indexOf('thumbnail=') == -1 && merchantTxn.thumbnail) {
                purchaseURL += (purchaseURL.indexOf('?') == -1) ? `?thumbnail=${encodeURIComponent(merchantTxn.thumbnail)}` : `&thumbnail=${encodeURIComponent(merchantTxn.thumbnail)}`;
            }
            p2p["purchaseURL"] = purchaseURL;
            let shareURL = merchantTxn.shareURL;
            if (!shareURL) {
                shareURL = purchaseURL;
            }
            p2p["shareURL"] = shareURL;
        }
        let response;
        if (merchantTxn.droppSignature) {
            response = await api.processSignedPayment(p2p);
        } else {
            p2p['actionBy'] = [userDetails.firstName, userDetails.lastName].join(" ");
            response = await api.processInvoicePayment(p2p);
        }
        if (response && response.responseCode === 0) {
            if (merchantTxn.successURL) {
                let views = chrome.extension.getViews({ type: "popup" });
                const obj = {
                    type: "paymentSuccess",
                    request: merchantTxn,
                };
                if (views && views.length === 0) {
                    messageBGScriptToLoadURl(obj);
                } else {
                    responseCallback({ successURL: merchantTxn.successURL });
                    messageBGScriptToLoadURl(obj);
                }
            } else {
                if (!merchantTxn.successMessage) {
                    updateMerchantTxn({...merchantTxn, successMessage: "Payment successful!"});
                }
                setShowSuccessMsg(true);
            }
        } else {
            if (merchantTxn.failureURL) {
                let views = chrome.extension.getViews({ type: "popup" });
                const obj = {
                    type: "paymentFailure",
                    request: merchantTxn,
                };
                if (views && views.length === 0) {
                    messageBGScriptToLoadURl(obj);
                } else {
                    responseCallback({ failureURL: merchantTxn.failureURL });
                    messageBGScriptToLoadURl(obj);
                }
            } else {
                let errMsg = "Something went wrong while processing your payment. If this error persists, please contact us at support@dropp.cc."
                if (response && response.responseCode === 27 && response.errors.length) {
                    errMsg = response.errors[0];
                }
                setPaymentError({error: true, msg: errMsg});
            }
        }
    };

    const addFavoritesToStorage = async () => {
        if (makeFavorite) {
            await localstorage.favorites.upsertFavorite({
                id: merchantDetails.merchantId,
                domain: merchantDetails.domain,
                organizationName: merchantDetails.organizationName,
                merchantAccountId: utils.hederaAccountToString(merchantDetails.merchantAccountId),
            });
        } else if (isFavorite) {
            // TODO: Right now the ext is agnostic and doesn't know if user is charged or not
        }
    };

    const fundWithSavedCC = async () => {
        const amtToFund = getAmtNeedsToAutoCharge();
        let res = await api.getClientSecret3DSecureForSavedCard(amtToFund, userDetails.ccLastFourDigits, {payOnDemandFunding : true, payOnDemand: true});
        if (res && res.responseCode == 0) {
            if (res && res.data) {
                let clientSecret = res.data;
                const stripe = window.Stripe(await getStripePK());
                const { paymentIntent, error } = await stripe.confirmCardPayment(clientSecret);
                if (paymentIntent && paymentIntent.id) {
                    const confirmResult = await api.confirm3DSecurePayment({result: paymentIntent.status, clientSecret: paymentIntent.client_secret, id: paymentIntent.id});
                    if (confirmResult && confirmResult.responseCode == 0) {
                        api.resetUserDetails();
                        return true;
                    }
                } else if (error && error.code) {
                  setErrorMessage(error.message ? error.message : "Funding unsuccessful, please try agin later.");
                  return false;
                }
            } else {
                setErrorMessage("Funding unsuccessful, please try agin later.");
                return false;
            }
        } else {
            setErrorMessage(res && res.errors && res.errors.length ? res.errors[0] : "Funding unsuccessful, please try agin later.");
            return false;
        }
    };

    const makeFundingWithSavedACH = async (amtToFund) => {
        const result = await api.replenishUserACH({
                           amount: parseFloat(amtToFund),
                           lastFourDigitsOfACHAct: userDetails.achAccountLastFourDigits,
                           payOnDemand: true,
                           payOnDemandFunding: true
                       });
        const success = result && result.responseCode == 0;
        if (!success) {
            setErrorMessage(result.errors && result.errors.length ? result.errors[0].replaceAll("\n", "<br />") : "Replenishment Failed");
        }
        return success;
    };

    const messageBGScriptToLoadURl = (obj) => {
        setTimeout(() => {
            chrome.runtime.sendMessage(obj);
            updateBadgeText();
        }, 0);
        setTimeout(() => {
            window.close();
        }, 200);
    };

    const pay = async (skipLowBalance) => {
        if (!skipLowBalance && showLowBalanceAlert()) {
            setDisablePayBtn(true);
            let isFundingSuccess = false;
            const amtToFund = getAmtNeedsToAutoCharge();
            if (merchantTxn.acceptPaymentDelay && userDetails.payOnDemandACH) {
                isFundingSuccess = await makeFundingWithSavedACH(amtToFund);
            } else if (userDetails.payOnDemand) {
                await utils.addStripeLib();
                isFundingSuccess = await fundWithSavedCC();
            } else if (userDetails.payOnDemandACH) {
                isFundingSuccess = await makeFundingWithSavedACH(amtToFund);
            }
            if (!isFundingSuccess) {
                setOpenErrorModal(true);
                setDisablePayBtn(false);
                return;
            }
        }

        let ptp = await createPromiseToPay();
        await addFavoritesToStorage();
        if (merchantTxn.droppSignature || (merchantTxn.invoiceId && merchantTxn.b2bInvoice)) {
            processPayment(ptp);
        } else if (merchantTxn.submitToCallBack && merchantTxn.submitToCallBack.toLowerCase() === "post") {
            processPostPayment(ptp);
        } else {
            let views = chrome.extension.getViews({ type: "popup" });
            const obj = {
                type: "makePayment",
                request: merchantTxn,
                ptp: ptp,
            };
            if (views && views.length === 0) {
                messageBGScriptToLoadURl(obj);
            } else {
                responseCallback({ ptp, referrer: merchantTxn.referrer });
                messageBGScriptToLoadURl(obj);
            }
        }
    };


    const getAssociateTokenTransaction = async () => {
        let tokenId = merchantTxn.tokenId;
        const idParts = tokenId.split(".");
        let merchantTokenId = TokenID.create({shardNum: parseInt(idParts[0], 10), realmNum: parseInt(idParts[1], 10), tokenNum: parseInt(idParts[2], 10)});

        // let droppAccId = await utils.getDroppAccountId();
        // const droppAccIdParts = droppAccId.split(".");
        // let accountIDDropp = AccountID.create({accountNum: parseInt(droppAccIdParts[2], 10)});

        let accountIDSender = AccountID.create({accountNum:userDetails.hhAccount.accountNumber});
        let accountIDNode = AccountID.create({accountNum:droppNodeId});

        let tokenAssociateTransactionBody = TokenAssociateTransactionBody.create({account: accountIDSender});
        tokenAssociateTransactionBody.tokens.push(merchantTokenId);
        let timeStampNano = p2phelper.createTimestampNano();
        var timestamp = Timestamp.create({seconds:Math.floor(timeStampNano), nanos: 0});

        var transactionID = TransactionID.create({transactionValidStart:timestamp, accountID:accountIDSender});
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

    const associateMerchantToken = async () => {
        if (hbarBalance < MAX_ASSOCIATE_TOKEN_FEE) {
            setErrorMessage("You don't have sufficient fund to associate token.");
            setOpenErrorModal(true);
        } else {
            setTokenAssociationInProgress(true);
            let hederaTransaction = await getAssociateTokenTransaction();
            const result = await api.associateToken({hederaTransaction: hederaTransaction});
            if (result && result.responseCode == 0 && result.data) {
                setIsGivenTokenAssociated(true);
            } else {
                setTokenAssociationInProgress(false);
            }
        }
    };

    const getMakeFavoriteUrl = () => {
        if (makeFavorite || isFavorite) {
            return "./dropp-icon-checkbox-checked.png";
        }
        return "./dropp-icon-checkbox-empty.png";
    };

    const applyOffer = (data) => {
        setSelectedOffer(data);
    };

    const removeOffer = () => {
        setDiscountedAmt(null);
        setSelectedOffer(null);
    };

    const changeActiveWallet = async () => {
        const walletId = walletToSwitch.walletId;
        let result = await api.setWalletAsDefault({countryCode: walletId.countryCode, currencyCode: walletId.currencyCode, operatorId: walletId.operatorId});
        if (result && result.responseCode == 0) {
          window.location.reload();
        }
    };

    const showLowBalanceAlert = () => {
        return lowBalance && userDetails.currency == USD && (userDetails.payOnDemand || userDetails.payOnDemandACH);
    };

    const renderGetConfirmation = () => {
        let expires;
        if (merchantTxn.expires) {
            expires = utils.casualTimeToExpiration(parseInt(merchantTxn.expires, 10));
        }
        return (
            <React.Fragment>
                <div className={classes.footer} style={ testModeActive ? {maxHeight:"460px", overflow:"scroll"} : {}}>
                    {(walletToSwitch && walletToSwitch.walletId) ?
                        <Box m={1} component={Grid} container className={`${styles.greyListContainer} ${classes.boxPaddingWidth}`} direction="column">
                        {!paymentLinkSupported ?
                                <Grid item>
                                    <p className={classes.paymentLinkSupported}>
                                        Wallet should be in same Crypto currency
                                    </p>
                                </Grid>
                            :
                                <>
                                    {paymentNotAllowed ?
                                        <Grid item>
                                            <p className={classes.paymentLinkSupported}>
                                                Merchant {merchantDetails.organizationName} doesn't accept amount in {userDetails.currency}
                                            </p>
                                        </Grid>
                                    :
                                        <>
                                            {(lowBalance && userDetails.currency == USD && !(userDetails.payOnDemand || userDetails.payOnDemandACH)) ?
                                                <LowBalanceModal lowBalanceModalOpen={lowBalanceModalOpen} setLowBalanceModalOpen={setLowBalanceModalOpen} setCurrentScreen={setCurrentScreen} pay={pay} checkLowBalance={checkLowBalance} lowBalance={lowBalance} merchantTxn={merchantTxn} invoiceAmt={getAmtUserNeedsToPay()} />
                                            :
                                                <>
                                                    {lowBalance && userDetails.currency !== USD ?
                                                        <Grid item>
                                                            <p className={classes.paymentNotAllowed}>
                                                                Low Balance. Please replenish your account.
                                                            </p>
                                                        </Grid>
                                                    : ""}
                                                </>
                                            }
                                        </>
                                    }
                                </>
                            }
                            <Grid container item>
                                <Grid container item direction="row">
                                    <Grid item>
                                        <Link
                                            className={`${styles.blueBoldLink} ${styles.upperCase} ${classes.linkMarginRightBottom}`}
                                            onClick={changeActiveWallet}
                                            >
                                            Switch to {walletToSwitch.walletId.currencyCode} currency account
                                        </Link>
                                    </Grid>
                                </Grid>
                            </Grid>
                        </Box>
                    :
                      <>
                        {(lowBalance && userDetails.currency == USD && !(userDetails.payOnDemand || userDetails.payOnDemandACH)) ?
                            <LowBalanceModal lowBalanceModalOpen={lowBalanceModalOpen} setLowBalanceModalOpen={setLowBalanceModalOpen} setCurrentScreen={setCurrentScreen} pay={pay} checkLowBalance={checkLowBalance} lowBalance={lowBalance} merchantTxn={merchantTxn} invoiceAmt={getAmtUserNeedsToPay()} />
                        : ""}
                      </>
                    }
                    <Grid container direction="column" style={{ padding: "1em" }}>
                        <Grid container item>
                            <Grid container spacing={2} direction="row">
                                <Grid item xs={4}>
                                    {(!paymentLinkSupported || (lowBalance && userDetails.currency !== USD) || paymentNotAllowed || (merchantTxn.droppSignature && paymentAmount == null)) ?
                                        <button
                                            className={classNames([styles.primaryBtn, styles.circularBtn,classes.linkMarginRightBottom,])}
                                            disabled
                                            >
                                            PAY
                                        </button>
                                        :
                                        <button
                                            className={classNames([styles.primaryBtn, styles.circularBtn, classes.linkMarginRightBottom, disablePayBtn || (lowBalance && userDetails.currency == USD) ? styles.buttonDisabled : ""])}
                                            disabled={disablePayBtn || (lowBalance && userDetails.currency == USD)}
                                            onClick={(lowBalance && userDetails.currency == USD && !(userDetails.payOnDemand || userDetails.payOnDemandACH)) ? () => setLowBalanceModalOpen(true) : () => pay(false)}
                                            >
                                            PAY
                                        </button>
                                    }

                                </Grid>
                                <Grid item xs={4}>
                                    <button className={`${styles.secondaryBtn} ${styles.circularBtn} ${disablePayBtn ? styles.buttonDisabled : ""}`} disabled={disablePayBtn} onClick={cancel}>
                                        CANCEL
                                    </button>
                                </Grid>
                            </Grid>
                            {expires && (
                                <Grid item>
                                    <p className={classes.expiresText}>
                                        {expires}
                                    </p>
                                </Grid>
                            )}

                        </Grid>
                    </Grid>
                </div>
                <TestModeText testModeActive={testModeActive}/>
            </React.Fragment>
        );
    };

    const updateAmount = (event) => {
        const amount = event.target.value ? parseFloat(event.target.value) : 0;
        if (userDetails && userDetails.currency == HBAR) {
            if (amount && amount > 0 && amount >= parseFloat(displayAmount(merchantTxn.lowerLimit / exchangeRate)) && amount <= parseFloat(displayAmount(merchantTxn.upperLimit / exchangeRate))) {
                setPaymentAmount(amount);
            } else {
                setPaymentAmount(null);
            }
        } else {
            if (amount && amount > 0 && amount >= parseFloat(merchantTxn.lowerLimit / exchangeRate) && amount <= parseFloat(merchantTxn.upperLimit / exchangeRate)) {
                setPaymentAmount(amount);
            } else {
                setPaymentAmount(null);
            }
        }
    };

    const renderContentDetails = () => {
        let thumbnailUrl;
        if (merchantTxn.thumbnail) {
            thumbnailUrl = decodeURIComponent(merchantTxn.thumbnail);
        }

        return (
            <div
                className={classNames([classes.mainContainer, styles.greyListContainer])}
            >
                <Grid
                    container
                    direction="column"
                    >
                    <Grid container justifyContent="space-between">
                        <Grid item xs={6}>
                            <Typography className={`${styles.darkBoldText} ${styles.mediumSizedText}`}>
                                {merchantDetails.organizationName
                                    ? merchantDetails.organizationName.toUpperCase()
                                    : "ANONYMOUS"}
                            </Typography>
                        </Grid>
                        <Grid item xs={6}>
                            {merchantTxn.droppSignature && !merchantTxn.amount ? '' :
                                <Typography align="right">
                                    {(discountedAmt && discountedAmt != merchantTxn.amount) ?
                                        <span className={`${styles.boldGreyText} ${classes.lineThroughText}`}>{
                                            renderCurrency(merchantTxn.amount)}</span>
                                        : ''} &nbsp;
                                    <span className={`${styles.darkBoldText}`}>
                                        {renderCurrency((discountedAmt || discountedAmt == 0) ? discountedAmt : merchantTxn.amount)}</span>
                                </Typography>}
                        </Grid>
                    </Grid>
                    <Grid item>
                        <p
                            className={classNames([styles.upperCase, styles.lightGreyText, classes.txnTitle, styles.mediumSizedText])}
                            >
                            {merchantTxn.title}
                        </p>
                    </Grid>
                    {thumbnailUrl && (
                        <>
                            <Grid item>
                                <div className={classes.centeredScrollableDiv}>
                                    <div
                                      className={classes.thumbnailDiv}
                                      style={{ backgroundImage: `url(${thumbnailUrl})` }}
                                    ></div>
                                </div>
                            </Grid>
                            <Grid item>
                                <p className={classNames([styles.upperCase, styles.lightGreyText, classes.txnTitle, styles.mediumSizedText])}>
                                    {merchantTxn.title}
                                </p>
                            </Grid>
                        </>
                    )}

                    <Grid item>
                        <p title={merchantTxn.description} className={styles.ellipsisAfterThreeLines} >
                            {merchantTxn.description}
                        </p>
                    </Grid>
                    {exchangeRate && (userDetails.currency != merchantTxn.currency) && (
                        <Grid
                            item className={classes.fullWidthMarginTop15}>
                            <div style={{ fontSize: "12px" }}>
                                <p>Exchange Rate: 1 {userDetails.currency} = {displayAmount(exchangeRate)} {merchantTxn.currency}</p>
                            </div>
                        </Grid>
                    )}
                    {merchantTxn.droppSignature && !merchantTxn.amount && userDetails && userDetails.currency && exchangeRate ?
                        <Grid container spacing={2} className={classes.containerGrid}>
                            <Grid item xs>
                                <TextField
                                label="Amount"
                                autoFocus
                                name="amount"
                                required={true}
                                defaultValue={parseFloat(displayAmount(merchantTxn.lowerLimit / exchangeRate))}
                                onChange={updateAmount}
                                InputProps={{
                                    startAdornment: <InputAdornment position="start">{(userDetails && userDetails.currency == HBAR) ? <img
                                        className={classes.hbarIcon}
                                        src="./hbar_icon.png"
                                    />  : getSymbolFromCurrency(userDetails.currency)}</InputAdornment>,
                                }}
                                />
                            </Grid>
                            <Grid item xs className={classes.gridItemWithPaddingTop}>

                                (<span>{renderCurrency(merchantTxn.lowerLimit)}</span> - <span>{renderCurrency(merchantTxn.upperLimit)}</span>)
                            </Grid>
                        </Grid>
                        : ''}
                </Grid>
            </div>
        );
    };

    const renderErrorText = text => {
        return (
            <h3
                className={classes.errorText}>
                {text}
            </h3>
        );
    };

    const openSignupTab = () => {
        const baseUrl = chrome.runtime.getURL("index.html");
        chrome.tabs.create({ url: `${baseUrl}#/gettingStarted` });
        window.close();
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

    const renderDCTCurrency = (amount) => {
        if (currency === HBAR) {
            return (
                <React.Fragment>
                    <img
                        className={classes.hhbarIcon}
                        src="./hbar_icon.png"
                        alt="HBAR icon"
                    />
                    {displayAmount(amount)}
                </React.Fragment>
            );
        } else {
            return `${utils.isCrypto(currency) ? `${currency} ` : getSymbolFromCurrency(currency)}${displayAmount(amount)} `;
        }
    };

    const renderCurrency = (amount) => {
        if (currency === HBAR) {
            return (
                <React.Fragment>
                    {exchangeRate ? displayAmount(amount / exchangeRate) : amount}
                    <img
                        className={classes.hhbarIcon}
                        src="./hbar_icon.png"
                        alt="HBAR icon"
                    />
                </React.Fragment>
            );
        } else {
            return ` ${utils.isCrypto(currency) ? "" : getSymbolFromCurrency(currency)}${exchangeRate ? displayAmount(amount / exchangeRate) : amount } ${utils.isCrypto(currency) ? `${currency}` : ""}`;
        }
    };

    const getCreditsToBeUsed = () => {
        let dctAmtToBeUsed = 0;

        try {
            const invoiceAmt = getAmtUserNeedsToPay();
            const dctAmountInInvoice = (userDetails.droppCredit / utils.getCurrencyDecimal(DCT) * dctToInvoiceExchangeRate);
            const dctAmtInWalletCurrency = ((1/exchangeRate) * getCurrencyDecimal(userDetails.currency) * dctAmountInInvoice);

            const payerAmount = ((1/exchangeRate) * getCurrencyDecimal(userDetails.currency) * invoiceAmt);
            if (dctAmtInWalletCurrency <= payerAmount) {
                dctAmtToBeUsed = dctAmtInWalletCurrency;
            } else {
                dctAmtToBeUsed = payerAmount;
            }
            if (dctAmtToBeUsed) {
                const invoiceAmtInUSD = ((1/dctToInvoiceExchangeRate) * invoiceAmt); // check invoice amount in USD for minimum allowed amount
                if ((utils.isCrypto(userDetails.currency) && invoiceAmtInUSD <= 0.01) || (invoiceAmtInUSD <= 0.002)) {
                    return 0;
                }
                return (dctAmtToBeUsed / getCurrencyDecimal(userDetails.currency));
            }
        } catch(err) {
            dctAmtToBeUsed = 0;
        }
        return 0;
    };

    const merchantIsVerifiedText = () => {
        if (merchantDetails.status === "VERIFIED") {
            return "Verified";
        }
        return "Unverified";
    };

    const handleAssociateTokenErr = () => {
        setOpenErrorModal(false);
    }

    const prepareDataForFeeBreakdown = () => {
        const {
                amount,
                createTimeEpoch,
                cryptoAmount,
                cryptoAmountInHBars,
                discountedAmount,
                droppCredits,
                exchangeRateUSDToHbars,
                invoiceAmount,
                invoiceCurrency,
                itemId,
                merchantId,
                merchantOrganiationName,
                numOfTxns,
                offerCode,
                pageTexts,
                paymentRef,
                purchaseURL,
                qrCodeUUID,
                receiptData,
                refFirstName,
                refLastName,
                shareURL,
                thumbnail,
                transactionType,
        } = {...merchantTxn, ...selectedOffer};
        const data = {
            amount,
            createTimeEpoch,
            cryptoAmount,
            cryptoAmountInHBars,
            currency,
            discountedAmount,
            droppCredits,
            exchangeRateUSDToHbars,
            invoiceAmount,
            invoiceCurrency,
            itemId,
            merchantId,
            merchantOrganiationName,
            numOfTxns,
            offerCode,
            pageTexts,
            paymentRef,
            purchaseURL,
            qrCodeUUID,
            receiptData,
            refFirstName,
            refLastName,
            shareURL,
            thumbnail,
            transactionType,
        }
        if(!data.discountedAmount) {
            data.discountedAmount = discountedAmt;
        }
        if(!data.invoiceAmount) {
            data.invoiceAmount = getInvoiceAmount();
            data["amountDiscounted"] = ((paymentAmount || merchantTxn.amount) - (discountedAmt || 0));
        }
        if(utils.isCrypto(currency) && exchangeRate){
            data.cryptoAmount = getInvoiceAmount()/exchangeRate;
        }
        if(!data.invoiceCurrency || !data.currency) {
            data.invoiceCurrency = merchantTxn.currency;
            data.currency = currency;
        }
        if(!data.createTimeEpoch) {
            delete data.createTimeEpoch;
        }
        if(!data.merchantOrganiationName) {
            data.merchantOrganiationName = merchantTxn.title || merchantDetails.organizationName;
        }
        if(!data.merchantId) {
            data.merchantId = merchantDetails.merchantId;
        }

        return data;
    }
    return (
        <>
            {userSuspendedErr ?
                <Grid container justifyContent={"center"} alignItems={"center"}>
                    <Grid item className={classes.centerGridItem}>
                        {userSuspendedErr}
                    </Grid>
                </Grid>
            :

                <>
                    {(merchantTxn && merchantTxn.tokenId && isGivenTokenAssociated != null && isGivenTokenAssociated == false) ?
                        // new code
                            <>
                                <Grid
                                    container
                                    item
                                    direction="column"
                                    alignItems="center"
                                    className={classes.customGridContainer}>
                                    {chrome.extension.getViews({ type: "popup" }).length === 0 && (
                                        <Grid item>
                                            <img
                                               className={classes.clickableImage}
                                                height="50"
                                                width="120"
                                                src="./dropp_logo.png"
                                                alt="Dropp Logo"
                                            />
                                        </Grid>
                                    )}
                                <Grid item className={classes.gridItemCustom}>
                                        {(hbarBalance || hbarBalance == 0) ?
                                            <div className={classes.balanceDiv}>
                                                <Typography>HBAR Balance: <img
                                                className={classes.hbarIconHeight}
                                                src="./hbar_icon.png"
                                                alt="HBAR icon"
                                                /> {utils.displayAmount(hbarBalance)}</Typography>
                                            </div>
                                        : ""}
                                        <Typography>
                                            Your Hedera Account ({utils.hederaAccountToString(userDetails.hhAccount)}) is not associated with the token ({merchantTxn.tokenId}).
                                            You need to associate your account first to make this purchase.
                                        </Typography>
                                    </Grid>
                                <Grid item className={classes.fullWidthPadding}>
                                    <Typography>
                                        Max Fee: <img
                                            className={classes.hbarIconHeight}
                                            src="./hbar_icon.png"
                                            alt="HBAR icon"
                                        /> {utils.displayAmount(MAX_ASSOCIATE_TOKEN_FEE)}
                                    </Typography>
                                    <Typography>
                                        <strong>
                                            Note: The fee will be deducted from your HBAR wallet, please make sure you have sufficient HBAR.
                                        </strong>
                                    </Typography>
                                </Grid>
                                </Grid>
                                <Modal
                                    open={openErrorModal}
                                >
                                    <Box className={classes.modalContainer}>
                                        <Typography sx={{ mt: 2 }}>
                                            <strong>Error</strong>
                                        </Typography>
                                        <Typography sx={{ mt: 2 }}>
                                            {errorMessage}
                                        </Typography>

                                        <div className={classes.ctrlBtns}>
                                            <button className="button-done" onClick={handleAssociateTokenErr}> Ok</button>
                                        </div>
                                    </Box>
                                </Modal>
                                <div className={classes.fixedPositioning}>
                                    <Grid container item direction="row" >
                                        <Grid item>
                                            <button disabled={tokenAssociationInProgress}  className={`button-cancel ${classes.cancelButton}`} onClick={cancel}>
                                                CANCEL
                                            </button>
                                        </Grid>
                                        <Grid item>
                                            <button
                                                className={`button-done ${classes.doneButton}`}
                                                onClick={associateMerchantToken}
                                                disabled={tokenAssociationInProgress}
                                                >
                                                ASSOCIATE
                                            </button>
                                        </Grid>
                                    </Grid>
                                </div>
                                {/* <Grid container direction="column" style={{ padding: "1em" }}>
                                    <Grid container item>
                                        <Grid container item direction="row">
                                            <Grid item>
                                                <button
                                                    style={{
                                                        marginRight: "5px",
                                                        marginBottom: "5px",
                                                    }}
                                                    className="button-done"
                                                    onClick={associateMerchantToken}
                                                    disabled={tokenAssociationInProgress}
                                                    >
                                                    ASSOCIATE
                                                </button>
                                            </Grid>
                                            <Grid item>
                                                <button disabled={tokenAssociationInProgress} style={{}} className="button-cancel" onClick={cancel}>
                                                    CANCEL
                                                </button>
                                            </Grid>
                                        </Grid>
                                    </Grid>
                                </Grid> */}
                            </>
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
                                                    alignItems="center"
                                                    className={classes.columnContainer}>
                                                    {chrome.extension.getViews({ type: "popup" }).length === 0 && (
                                                        <Grid item>
                                                            <img
                                                                className={classes.clickableLogo}
                                                                height="35"
                                                                src="./dropp_logo.png"
                                                                alt="Dropp Logo"
                                                            />
                                                        </Grid>
                                                    )}

                                                    {showOffers ? <>
                                                        <Grid
                                                            item
                                                          className={`${classes.scroll} ${classes.fullWidthPadding}`}>
                                                            {
                                                                customerOffers.map((data, index) => {
                                                                    return(
                                                                        <div key={index}>
                                                                            <OfferCell offer={data} applyOffer={applyOffer} selectedOffer={selectedOffer}/>
                                                                        </div>
                                                                    )
                                                                })
                                                            }
                                                            {/* <div style={{fontSize: "14px", fontWeight: "600", paddingTop: "1em", paddingBottom: "10px"}}>OFFERS</div>
                                                            <div style={{height: "400px", overflowY: "scroll"}}>
                                                                {customerOffers.map((data, index) =>
                                                                    <div key={data.id} style={{padding: "5px", margin: "10px 0", backgroundColor: "#CCCCCC"}}>
                                                                        <p style={{fontWeight: 500, fontSize: "14px", lineHeight: "20px"}}>{data.tagLine}</p>
                                                                        <p style={{fontSize: "12px", lineHeight: "20px"}}>Valid {((new Date(data.start)).getMonth() + 1)}/{(new Date(data.start)).getDate()} - {((new Date(data.expiry)).getMonth() + 1)}/{(new Date(data.expiry)).getDate()}</p>
                                                                        {(selectedOffer && (selectedOffer.id == data.id)) ?
                                                                            <p style={{textAlign: "right"}}><span style={{fontWeigth: 400, fontSize: "12px", lineHeight: "20px", marginRight: "10px"}}>APPLIED</span></p>
                                                                        :
                                                                            <p style={{textAlign: "right"}}><span style={{textDecoration: "underline", fontWeigth: 500, cursor: "pointer", fontSize: "12px", lineHeight: "20px", marginRight: "10px"}} onClick={() => applyOffer(data)}>APPLY</span></p>
                                                                        }
                                                                    </div>
                                                                )}
                                                            </div> */}
                                                            <div className={classes.fixedBottom}>
                                                                <span className={classes.clickableUnderlineText} onClick={toggleShowOffers}>Back</span>
                                                            </div>
                                                        </Grid>
                                                        </>
                                                    :
                                                        <div className={classes.scrollableSection}>
                                                            <Grid
                                                                item
                                                                xs={12}
                                                                className={classes.horizontalPadding}>
                                                                {/* <Grid container justifyContent="space-between">
                                                                    <Grid item xs={6}>
                                                                        {merchantDetails.organizationName
                                                                            ? merchantDetails.organizationName.toUpperCase()
                                                                            : "ANONYMOUS"}
                                                                    </Grid>
                                                                    <Grid item xs={6}>
                                                                        {merchantTxn.droppSignature && !merchantTxn.amount ? '' :
                                                                        <>
                                                                            {(discountedAmt && discountedAmt != merchantTxn.amount) ?
                                                                                <span className={styles.lightGreyText} style={{textDecoration: "line-through"}}>{renderCurrency(merchantTxn.amount)} </span>
                                                                            : ''} &nbsp;
                                                                            <span>{renderCurrency((discountedAmt || discountedAmt == 0) ? discountedAmt : merchantTxn.amount)}</span>
                                                                        </>}
                                                                    </Grid>
                                                                </Grid> */}
                                                                {/* <span style={{ fontSize: "1em", fontWeight: "bold" }}>
                                                                    {merchantTxn.droppSignature && !merchantTxn.amount ? '' :
                                                                    <>
                                                                        {(discountedAmt && discountedAmt != merchantTxn.amount) ?
                                                                            <span style={{textDecoration: "line-through"}}>{renderCurrency(merchantTxn.amount)} </span>
                                                                        : ''}
                                                                        <span>{renderCurrency((discountedAmt || discountedAmt == 0) ? discountedAmt : merchantTxn.amount)}</span>
                                                                        <span style={{ fontSize: ".8em" }}> to </span>
                                                                    </>}
                                                                    <span style={{ fontSize: "1em" }}>
                                                                        {merchantDetails.organizationName
                                                                            ? merchantDetails.organizationName.toUpperCase()
                                                                            : "ANONYMOUS"}
                                                                    </span>
                                                                </span> */}
                                                                {merchantDetails.status === "VERIFIED" && (
                                                                    <span
                                                                        className={classes.verifiedIconWrapper}>
                                                                        <img
                                                                            onClick={toggleMerchantDetails}
                                                                           className={classes.clickableIcon}
                                                                            height="24"
                                                                            src="./dropp-icon-checked.png"
                                                                            alt="Verified Icon"
                                                                        />
                                                                    </span>
                                                                )}
                                                            </Grid>
                                                            {showMerchantDetails && (
                                                                <Grid
                                                                    item
                                                                    className={classes.merchantGrid}>
                                                                    <div
                                                                        className={classes.whiteText}>
                                                                        <span>
                                                                            <b>
                                                                                <span>{merchantIsVerifiedText()}</span> Merchant (
                                                                                {merchantTxn.merchantAccount})
                                                                            </b>
                                                                        </span>
                                                                    </div>
                                                                </Grid>
                                                            )}
                                                            {renderContentDetails()}
                                                            {!(walletToSwitch && walletToSwitch.walletId) ? <FeeBreakdown showAccordion={false} {...prepareDataForFeeBreakdown()} pageText={{}}/> : ""}
                                                            {selectedOffer && selectedOffer.id ?
                                                            <>
                                                                <Grid container className={classes.borderedBoxContainer}>
                                                                    <Grid
                                                                        item
                                                                        xs={12}
                                                                        className={classes.paddedGrid}>
                                                                        <Grid
                                                                            item
                                                                            className={styles.borderedBoxDashed}
                                                                            >
                                                                            <div>
                                                                                <Typography
                                                                                    align="center"
                                                                                    // style={{fontSize: "12px", marginBottom: "10px"}}
                                                                                >You save <span className={classes.fontWeight600}>{renderCurrencyUtility(((paymentAmount || merchantTxn.amount) - (discountedAmt || 0)), merchantTxn.currency, null, null, utils.isCrypto(merchantTxn.currency))}</span> with this offer
                                                                                </Typography>
                                                                                <Grid container>
                                                                                    <Grid item xs={12}>
                                                                                        <Typography
                                                                                            title={selectedOffer.value && (selectedOffer.discountType === "PERCENTAGE" ? `${selectedOffer.value}%` : `${selectedOffer.currency === "USD" ? getSymbolFromCurrency("USD") : ""}${displayAmount(selectedOffer.value)} ${selectedOffer.currency !== "USD" ? selectedOffer.currency : ""}`)}
                                                                                            className={`${classes.offerExpText} ${classes.textWithEllipsis}`}
                                                                                            variant="subtitle2"
                                                                                            align="center"
                                                                                        >
                                                                                            {selectedOffer.value && (selectedOffer.discountType === "PERCENTAGE" ? `${selectedOffer.value}%` : `${selectedOffer.currency === "USD" ? getSymbolFromCurrency("USD") : ""}${displayAmount(selectedOffer.value)} ${selectedOffer.currency !== "USD" ? selectedOffer.currency : ""}`)} OFF.
                                                                                            Expires {moment(selectedOffer.expiry).format('MMM DD, YYYY')}
                                                                                        </Typography>
                                                                                        {/* {
                                                                                            selectedOffer.expiry && <Grid item xs={12}>
                                                                                                <Typography align="left" variant="body2" className={classes.greyText}>
                                                                                                    Valid until {moment(selectedOffer.expiry).format('MMM DD YYYY')}
                                                                                                </Typography>
                                                                                            </Grid>
                                                                                        } */}
                                                                                    </Grid>
                                                                                    {/* <Grid item xs={7}>
                                                                                        <Typography>{selectedOffer.tagLine}</Typography>
                                                                                    </Grid> */}
                                                                                </Grid>
                                                                                <hr className={styles.horizontalLine}/>
                                                                                <Grid container spacing={4}>
                                                                                    {(customerOffers && customerOffers.length > 1) ? <Grid item xs={6}>
                                                                                         <div onClick={toggleShowOffers}>
                                                                                            <Typography className={styles.blueBoldLink} align="right" variant="subtitle2">CHANGE OFFER</Typography>
                                                                                        </div>
                                                                                    </Grid>: ""}
                                                                                    <Grid item xs={customerOffers && customerOffers.length > 1 ? 6 : 12}>
                                                                                        <div onClick={removeOffer}>
                                                                                            <Typography className={styles.blueBoldLink} variant="subtitle2" align="center">REMOVE OFFER</Typography>
                                                                                        </div>
                                                                                    </Grid>
                                                                                </Grid>
                                                                            </div>
                                                                        </Grid>
                                                                    </Grid>
                                                                </Grid>
                                                            </>
                                                            :
                                                                <>
                                                                    {(customerOffers && customerOffers.length > 0) &&
                                                                        <Grid
                                                                            item
                                                                            className={classes.fullWidthPadding}>
                                                                            <div className={classes.fontSmallPaddingLeft}>
                                                                                <p>You have <span onClick={toggleShowOffers}  className={`${styles.blueBoldLink} ${classes.underlinePointer}`}><b>{customerOffers.length} {customerOffers.length ===1 ? "offer" : "offers"}</b></span> available for this purchase.</p>
                                                                            </div>
                                                                        </Grid>
                                                                    }
                                                                </>
                                                            }

                                                            <Grid
                                                                container
                                                               className={classes.containerGridmargin}>
                                                                {!(walletToSwitch && walletToSwitch.walletId) && userDetails && userDetails.droppCredit && exchangeRate && dctToInvoiceExchangeRate && getCreditsToBeUsed() > 0 ?
                                                                    <Grid
                                                                        item
                                                                        xs={12}
                                                                        className={classes.paddedFullWidthGridItem}>
                                                                        <Grid item>
                                                                            <FormGroup>
                                                                                <FormControlLabel control={<Checkbox classes={{root: classes.droppCreditCheck}} onChange={() => setUseDroppCredits(!useDroppCredits)} color="primary" name="useDroppCredits" />} label={<Typography className={classes.droppCreditCheckbox}>Use {renderDCTCurrency(getCreditsToBeUsed())} available from Dropp Credit</Typography>} />
                                                                            </FormGroup>
                                                                        </Grid>
                                                                    </Grid>
                                                                    : ""}
                                                                    {
                                                                        !(walletToSwitch && walletToSwitch.walletId) ?
                                                                        <Grid item xs={12} style={{paddingLeft:"1em", paddingRight: "1em"}}>
                                                                            <Grid container spacing={1}>
                                                                                <Grid item xs={1}>
                                                                                    <span>
                                                                                        <img
                                                                                            onClick={toggleMakeFavorite}
                                                                                             className={classes.clickableIconheight}
                                                                                            src={getMakeFavoriteUrl()}
                                                                                            alt="Make Favorite Icon"
                                                                                        />
                                                                                    </span>
                                                                                </Grid>

                                                                                <Grid item xs={10}>
                                                                                    <span
                                                                                        className={classes.trustText}>
                                                                                        I trust <b>{merchantDetails.organizationName}</b>, don’t ask for payment
                                                                                        confirmations again
                                                                                    </span>
                                                                                </Grid>
                                                                            </Grid>
                                                                        </Grid>: ""
                                                                    }
                                                            </Grid>
                                                            {lowBalance && userDetails.currency == USD && (userDetails.payOnDemand || userDetails.payOnDemandACH) ? <div>
                                                                    <div className={classNames([classes.lowBalanceSection, styles.greyListContainer])}>
                                                                        <div className={styles.flexSpaceBetween}>
                                                                            <Typography color="error" className={classes.boldErrorText}>
                                                                                LOW BALANCE ALERT
                                                                            </Typography>
                                                                            <Typography className={classes.fontSize12} >
                                                                                CURRENT BALANCE: {renderCurrency((availableBalance || availableBalance == 0) ? availableBalance : userDetails.balance)}
                                                                            </Typography>
                                                                        </div>
                                                                        {(userDetails.payOnDemandACH && merchantTxn.acceptPaymentDelay) ?
                                                                            <>
                                                                                <Typography className={classes.fontSize12}>
                                                                                    We will charge your bank a/c  (Ending in:{userDetails.achAccountLastFourDigits ? userDetails.achAccountLastFourDigits : ""}) to cover for this purchase.
                                                                                    You can update this in Funding settings anytime.
                                                                                </Typography>
                                                                            </>
                                                                        : <>
                                                                            {userDetails.payOnDemand ?
                                                                                <Typography className={classes.fontSize12}>
                                                                                    We will charge your card  ({userDetails.ccLastFourDigits ? userDetails.ccLastFourDigits : ""}) to cover for this purchase.
                                                                                    You can update this in Funding settings anytime.
                                                                                </Typography>
                                                                            :
                                                                                <Typography className={classes.fontSize12}>
                                                                                    We will charge your bank a/c  (Ending in:{userDetails.achAccountLastFourDigits ? userDetails.achAccountLastFourDigits : ""}) to cover for this purchase.
                                                                                    You can update this in Funding settings anytime.
                                                                                </Typography>
                                                                            }
                                                                          </>
                                                                        }
                                                                        {getActualAmtNeedsToAutoCharge() < 0.50 ?
                                                                            <Typography className={classes.fontSize12}>
                                                                                Note: Funding requires a minimum amount of $0.50.
                                                                            </Typography>
                                                                        : ""}
                                                                    </div>
                                                                    <Modal
                                                                        open={openErrorModal}
                                                                    >
                                                                        <Box className={classes.modalContainer}>
                                                                            <Typography sx={{ mt: 2 }}>
                                                                                <strong>Error</strong>
                                                                            </Typography>
                                                                            <Typography sx={{ mt: 2 }}>
                                                                                {errorMessage ? errorMessage : ""}
                                                                            </Typography>

                                                                            <div className={classes.ctrlBtns}>
                                                                                <button className="button-done" onClick={handleErrorModalClose}> Ok</button>
                                                                            </div>
                                                                        </Box>
                                                                    </Modal>
                                                                </div>: ""
                                                            }
                                                        </div>
                                                    }
                                                    {(Object.keys(userDetails).length > 0 && nodeIdAvailable) ?
                                                        <div>
                                                            {(isFavorite === true && userDetails.droppCredit == 0 && !merchantTxn.droppSignature && noOffers == true && paymentLinkSupported && !lowBalance && !paymentNotAllowed)
                                                                ? (() => {
                                                                    pay(false).catch(console.error);
                                                                })()
                                                                : renderGetConfirmation()}
                                                        </div>
                                                        : ''
                                                    }
                                                </Grid>}
                                        </>}
                                    </>}
                            </>
                    }
                </>
            }
        </>
    );
};

export default Pay;
