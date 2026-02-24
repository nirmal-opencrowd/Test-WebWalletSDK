import React from "react";
import ArrowBackOutlinedIcon from '@material-ui/icons/ArrowBackOutlined';
import { makeStyles } from '@material-ui/core/styles';
import Typography from "@material-ui/core/Typography";
import { hederaAccountToString, displayAmount, getUSDCTokenId, getCurrencyDecimal, getEthCircleAccountID, getEncodedTransactionBytes } from "./../../utils/utils";
import * as api from "./../../api";
// import * as p2phelper from "./../../utils/p2phelper.js";
import * as p2phelper from "../../utils/p2phelper.js";
import * as localstorage from "./../../utils/local-storage";
import forge from "node-forge";
import TextField from '@material-ui/core/TextField';
import { proto } from "@hashgraph/proto";
import Box from '@material-ui/core/Box';
import Modal from '@material-ui/core/Modal';
import { COMMON_ERROR_MSG, MAX_HEDERA_TXN_FEE } from "./../../utils/constants";
import { getUSDCPayoutMemo, getUSDCGasFeeAccountId, getDroppCircleAccountId, getAmountWithDecimals, getDroppAccountId, getCARATTokenId} from "./../../utils/utils";
import CircularProgress from "@material-ui/core/CircularProgress";
import NavigateNextIcon from '@material-ui/icons/NavigateNext';
import styles from "./../../styles/common.module.scss";
import UITexts from "./../../../configurations/dropp.json";
import { Accordion, AccordionDetails, AccordionSummary, Divider, Grid } from "@material-ui/core";

const ed25519 = forge.pki.ed25519;

const useStyles = makeStyles((theme) => ({
  detailContainer: {
    paddingLeft: "20px",
    paddingRight: "20px",
    marginTop: "30px",
    overflowY: "scroll"
  },
  margin: {
    margin: theme.spacing(1),
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
  ctrlBtns: {
    marginTop: "5px",
    textAlign: "right",
  },
  networkWrapper: {
    marginBottom: "10px",
  },
  networkBox: {
    border: "1px solid #ccc",
    display: "inline-block",
    padding: "10px 0",
    cursor: "pointer",
    textAlign: "center",
    width: "100px",
  },
  active: {
    backgroundColor: "#61dafb",
    borderColor: "#333",
    color: "#FFFFFF"
  },
  chain: {
    cursor: "pointer",
    display: "flex",
    justifyContent: "space-between",
    padding: "5px 20px",
  },
  chainContainer: {
    paddingTop: "20px",
  },
  subHeadings: {
    fontSize: "20px"
  },
  icons: {
    color: "#18C2EE"
  },
  footer: {
    bottom: "0",
    padding: "0px 20px 10px 20px",
    position: "fixed",
  },
  transferMsg: {
    marginBottom: 5
  },
  balance: {
    color: "#000",
    fontSize: "25px",
  },
  balanceContainer: {
    padding: "20px"
  },
  roundedInputField: {
    "& .MuiOutlinedInput-root": {
      borderRadius: "20px",
      width: "100%"
    }
  },
  label: {
    paddingLeft: "10px",
  },
  feeAccordion: {
    backgroundColor: "#f9f9f9",
    border: "1px solid #a9a9a9",
    boxShadow: "none",
    width: "100%",
    // '& .Mui-expanded:last-child' : {
    //   minHeight : "200px"
    // }
  },
  feeAccordionDetails: {
    padding: "0 16px 16px",
    marginTop: "-14px",
  }
}));

const RedeemCrypto = ({ setCurrentScreen, userDetails, setFooterObj, setFunctionCallOnBack, setPageHeading }) => {
  const [signatures, setSignatures] = React.useState({});
  const [maxCryptoFee, setMaxCryptoFee] = React.useState(null);
  const [usdcTransferFee, setUsdcTransferFee] = React.useState(null);
  const [toAccount, setToAccount] = React.useState(null);
  const [toAccountErr, setToAccountErr] = React.useState("");
  const [transferAmt, setTransferAmt] = React.useState(null);
  const [transferAmtErr, setTransferAmtErr] = React.useState("");
  const [memo, setMemo] = React.useState(null);
  const [droppNodeId, setDroppNodeId] = React.useState(0);
  const [backendErr, setBackendErr] = React.useState("");
  const [openSuccessModal, setOpenSuccessModal] = React.useState(false);
  const [review, setReview] = React.useState(false);
  const [networkType, setNetworkType] = React.useState(null);
  const [loading, setLoading] = React.useState(false);
  const [disableBtn, setDisableBtn] = React.useState(false);
  const [networkChains, setNetworkChains] = React.useState([]);
  const [chainTitle, setChainTitle] = React.useState(null);
  const [openConfirmModal, setOpenConfirmModal] = React.useState(false);

  const [lastUsedChain, setLastUsedChain] = React.useState(null);
  const classes = useStyles();
  const pageTexts = UITexts.redeemCrypto;
  const { AccountID, AccountAmount, TransferList, CryptoTransferTransactionBody, Timestamp, TransactionID, Duration, TransactionBody, SignaturePair, SignatureMap, Transaction, TokenID, TokenTransferList } = proto;

  React.useEffect(() => {
    async function getMaxFee() {
      const maxFeeData = await api.getMaxCryptoTransferFee();
      if (maxFeeData) {
        setMaxCryptoFee(maxFeeData);
      }
    }

    async function getUSDCTransferFee() {
      const estimatedGasFee = await api.getUSDCTransferFee();
      if (estimatedGasFee && estimatedGasFee.responseCode == 0 && estimatedGasFee.data) {
        setUsdcTransferFee(estimatedGasFee.data);
      }
    }

    async function updateSignatures() {
      const sign = await localstorage._get("_decrypted");
      if (sign && sign._decrypted) {
        setSignatures(sign._decrypted);
      }
    }

    async function fetchNodes() {
      let nodeDetails = await api.fetchNodes();
      const nodeArr = nodeDetails.data[0].nodeAccountId.split(".");
      const node = nodeArr[nodeArr.length - 1];
      setDroppNodeId(parseInt(node));
    }

    async function getNetworkChains() {
      let chains = await api.getNetworkChains();
      const localData = await localstorage.decrypted.get();
      if (localData && localData.lastUsedChain) {
        let lastUsedChain;
        for (let i = 0; i < chains.data.length; i++) {
          if (chains.data[i].chainTitle == localData.lastUsedChain) {
            lastUsedChain = chains.data[i];
            chains.data.splice(i, 1);
            chains.data.unshift(lastUsedChain);
            setLastUsedChain(lastUsedChain);
            break;
          }
        }
      }
      setNetworkChains(chains.data);
    }

    if (userDetails.currency === "USDC") {
      Promise.all([updateSignatures(), fetchNodes(), getNetworkChains()]);
    } else {
      Promise.all([getMaxFee(), updateSignatures(), fetchNodes()]);
    }
    setPageHeading(`${pageTexts.heading} ${userDetails.currency}`)
    return () => {
      setPageHeading(null);
    }
  }, []);

  const handlePrimaryButtonClick = () => {
    setOpenConfirmModal(true);
  };

  const handleModalOk = async () => {
    try {
      setOpenConfirmModal(false);

      // If you need validation before the transfer, uncomment this:
      // const isValid = await validateAndConfirm();
      // if (!isValid) return;

      await makeTransfer();
    } catch (error) {
      console.error("Transfer failed:", error);
      // Optionally show an error message to the user here
    }
  };


  React.useEffect(() => {
    const showBtn = networkType || userDetails.currency == "HBAR" || userDetails.currency == "CARAT";
    if(showBtn) {
      setFooterObj({primaryBtnText: review ? pageTexts.primaryBtnText : "CONFIRM" , primaryFuncToCall: review ? handlePrimaryButtonClick : validateAndConfirm, disabledPrimaryBtn: disableBtn});
    }
    setFunctionCallOnBack(review ? () => backBtnHandler : () => backToFundAccountScreen);
    return () => {
      setFunctionCallOnBack(null);
      setFooterObj({});
    }
  }, [networkType, transferAmt, toAccount, usdcTransferFee, chainTitle, review, toAccountErr, disableBtn])

  const storeLastUsedChain = async(chain) => {
    let userData = await localstorage.decrypted.get();
    userData['lastUsedChain'] = chain;
    await localstorage.decrypted.set(userData);
  };

  const validate = () => {
    let hasError = false;
    if (toAccount) {
      if((["HBAR", "CARAT"].includes(userDetails.currency) && toAccount.match(/^(0|(?:[1-9]\d*))\.(0|(?:[1-9]\d*))\.(([1-9]\d*))$/g) == null)) {
        setToAccountErr( "Invalid Account Number");
        hasError = true;
      } else if ((networkType == "HBAR" && toAccount.match(/^(0|(?:[1-9]\d*))\.(0|(?:[1-9]\d*))\.(([1-9]\d*))$/g) == null) || (networkType != null && networkType != "HBAR" && toAccount.match(/^0x[a-fA-F0-9]{40}$/g) == null)) {
        setToAccountErr(networkType == "HBAR" ? "Invalid Account Number" : `Invalid ${chainTitle} address`);
        hasError = true;
      } else if (networkType == "HBAR" && toAccount == hederaAccountToString(userDetails.hhAccount)) {
        setToAccountErr("You can’t transfer USDC to your own account");
        hasError = true;
      } else {
        setToAccountErr("");
      }
    } else {
      setToAccountErr((networkType == "HBAR" || userDetails.currency == "HBAR" || userDetails.currency == "CARAT") ? "Account Number cannot be empty" : `${chainTitle} address cannot be empty`);
      hasError = true;
    }
    if (transferAmt) {
      // if (!(transferAmt.match(/^[+]?\d+(\.\d+)?$/) != null && parseFloat(transferAmt) != NaN) || parseFloat(transferAmt) <= 0) {
        if (!(transferAmt.match(/^[+]?(?:\d+|\d*\.\d{1,4})$/) != null && !isNaN(parseFloat(transferAmt))) || parseFloat(transferAmt) <= 0) {
        setTransferAmtErr("Invalid Amount");
        hasError = true;
      } else if (parseFloat(transferAmt) != getAmountWithDecimals(transferAmt, 4)) {
        setTransferAmtErr("Amount should have maximum 4 decimal places");
        hasError = true;
      } else if ((userDetails.cryptoBalance / getCurrencyDecimal(userDetails.currency)) < parseFloat(transferAmt)) {
        setTransferAmtErr("Enter amount less or equal to the available balance!");
        hasError = true;
      } else if (networkType != "HBAR" && ((userDetails.cryptoBalance / getCurrencyDecimal(userDetails.currency))) < (parseFloat(transferAmt) + (usdcTransferFee || 0))) {
        setTransferAmtErr("Amount including fees should be less or equal to the available balance!");
        hasError = true;
      } else {
        setTransferAmtErr("");
      }
    } else {
      setTransferAmtErr("Amount cannot be empty");
      hasError = true;
    }
    return !hasError;
  };
// old function createEncodedHHTransfer
  // const createEncodedHHTransfer = async () => {
  //   let toAccountParts = toAccount.split(".");
  //   let usdcTokenId = "";
  //   let caratTokenId = "";
  //   let droppPayerAccount = "";
  //   let droppFeeAccount = "";
  //   if (userDetails.currency == "USDC") {
  //     let tokenId = await getUSDCTokenId();
  //     const idParts = tokenId.split(".");
  //     usdcTokenId = TokenID.create({ shardNum: parseInt(idParts[0], 10), realmNum: parseInt(idParts[1], 10), tokenNum: parseInt(idParts[2], 10) });

  //     const droppPayerAccountId = await getDroppAccountId();
  //     const droppPayerAccountIdParts = droppPayerAccountId.split(".");
  //     droppPayerAccount = AccountID.create({ accountNum: droppPayerAccountIdParts[droppPayerAccountIdParts.length - 1] });

  //     if (networkType == "HBAR") {
  //       const droppFeeAccountId = await getUSDCGasFeeAccountId();
  //     }
  //   }

  //   if (userDetails.currency == "CARAT") {
  //     let tokenId = await getCARATTokenId();
  //     const idParts = tokenId.split(".");
  //     caratTokenId = TokenID.create({ shardNum: parseInt(idParts[0], 10), realmNum: parseInt(idParts[1], 10), tokenNum: parseInt(idParts[2], 10) });
  //   }

  //   let accountIDSender = AccountID.create({ accountNum: userDetails.hhAccount.accountNumber });
  //   if (networkType != "HBAR" && userDetails.currency == "USDC") {
  //     const droppCircleAccount = await getEthCircleAccountID();
  //     toAccountParts = droppCircleAccount.split(".");
  //   }
  //   let accountIDReceiver = AccountID.create({ accountNum: toAccountParts[toAccountParts.length - 1] });
  //   let accountIDNode = AccountID.create({ accountNum: droppNodeId })
  //   let transferList = (usdcTokenId || caratTokenId ) ? TokenTransferList.create() : TransferList.create();
  //   if (usdcTokenId || caratTokenId) {
  //     transferList.token = usdcTokenId ? usdcTokenId : caratTokenId;
  //   }

  //   let amount = Math.floor(parseFloat(transferAmt) * getCurrencyDecimal(userDetails.currency));
  //   let accountAmountSender = AccountAmount.create({ accountID: accountIDSender, amount: amount * -1 });
  //   if (usdcTokenId || caratTokenId) {
  //     transferList.transfers.push(accountAmountSender);
  //   } else {
  //     transferList.accountAmounts.push(accountAmountSender);
  //   }
  //   let receiverAmt;
  //   let feeAccountAmountReceiver;
  //   if ((userDetails.currency == "USDC" && networkType == "HBAR")) {
  //     let feeAmount = Math.floor(parseFloat(usdcTransferFee) * getCurrencyDecimal(userDetails.currency));
  //     const droppFeeAccount = await getUSDCGasFeeAccountId();
  //     const droppFeeAccountParts = droppFeeAccount.split(".");
  //     let feeAccountIDReceiver = AccountID.create({ accountNum: droppFeeAccountParts[droppFeeAccountParts.length - 1] });
  //     feeAccountAmountReceiver = AccountAmount.create({ accountID: feeAccountIDReceiver, amount: feeAmount });
  //     receiverAmt = amount - feeAmount;
  //   } else {
  //     receiverAmt = amount;
  //   }
  //   let accountAmountReceiver = AccountAmount.create({ accountID: accountIDReceiver, amount: receiverAmt });
  //   if (usdcTokenId || caratTokenId) {
  //     transferList.transfers.push(accountAmountReceiver);
  //     if (feeAccountAmountReceiver) {
  //       transferList.transfers.push(feeAccountAmountReceiver);
  //     }
  //   } else {
  //     transferList.accountAmounts.push(accountAmountReceiver);
  //   }
  //   // let ethGasFeeTransferList;
  //   // if (usdcTokenId && networkType == "ETH") {
  //   //   ethGasFeeTransferList = TokenTransferList.create();
  //   //   ethGasFeeTransferList.token = usdcTokenId;
  //   //   let feeAmount = Math.floor(usdcTransferFee * getCurrencyDecimal(userDetails.currency));
  //   //   let feeAccountAmountSender = AccountAmount.create({accountID: accountIDSender, amount: feeAmount * -1});
  //   //   ethGasFeeTransferList.transfers.push(feeAccountAmountSender);
  //   //   const droppFeeAccount = await getUSDCGasFeeAccountId();
  //   //   const droppFeeAccountParts = droppFeeAccount.split(".");
  //   //   let feeAccountIDReceiver = AccountID.create({accountNum: droppFeeAccountParts[droppFeeAccountParts.length - 1]});
  //   //   let feeAccountAmountReceiver = AccountAmount.create({accountID: feeAccountIDReceiver, amount: feeAmount});
  //   //   ethGasFeeTransferList.transfers.push(feeAccountAmountReceiver);
  //   // }
  //   let transferObj = {}
  //   if (usdcTokenId || caratTokenId) {
  //     transferObj = { tokenTransfers: [transferList] }
  //     // if (networkType == "ETH") {
  //     //   transferObj.tokenTransfers.push(ethGasFeeTransferList);
  //     // }
  //   } else {
  //     transferObj = { transfers: transferList };
  //   }
  //   let cryptoTransferTransactionBody = CryptoTransferTransactionBody.create(transferObj);
  //   let timeStampNano = p2phelper.createTimestampNano();
  //   let timestamp = Timestamp.create({ seconds: Math.floor(timeStampNano), nanos: 0 })

  //   let transactionID = TransactionID.create({ transactionValidStart: timestamp, accountID: userDetails.currency == "USDC" ? droppPayerAccount : accountIDSender });
  //   let duration = Duration.create({ seconds: 180 });

  //   let transactionBody;

  //   transactionBody = TransactionBody.create({
  //     transactionID: transactionID,
  //     nodeAccountID: accountIDNode,
  //     transactionFee: (maxCryptoFee ? (maxCryptoFee * Math.pow(10, 8)) : MAX_HEDERA_TXN_FEE),
  //     transactionValidDuration: duration,
  //     generateRecord: true,
  //     memo: (networkType != "HBAR" && userDetails.currency == "USDC") ? await getUSDCPayoutMemo() : memo,
  //     cryptoTransfer: cryptoTransferTransactionBody
  //   });

  //   let transactionBodyBytes = TransactionBody.encode(transactionBody).finish()

  //   let encoding = "binary";
  //   let priv = signatures.privateKey;
  //   let privateKey = forge.util.hexToBytes(priv);
  //   let signature = ed25519.sign({
  //     message: Buffer.from(transactionBodyBytes),
  //     encoding,
  //     privateKey,
  //   });

  //   let signaturePair = SignaturePair.create({ ed25519: signature });
  //   signaturePair.pubKeyPrefix = Buffer.from(p2phelper.hexToBytes(signatures.publicKey));
  //   let signatureMap = SignatureMap.create();
  //   signatureMap.sigPair.push(signaturePair);

  //   let transaction = Transaction.create({
  //     bodyBytes: transactionBodyBytes,
  //     sigMap: signatureMap
  //   })

  //   let transactionBytes = Transaction.encode(transaction).finish();
  //   let encodedTransactionBytes = btoa(String.fromCharCode(...new Uint8Array(transactionBytes)));

  //   //let encodedTransactionBytes = forge.util.encode64(transactionBytes)
  //   return encodedTransactionBytes
  // }

// new function createEncodedHHTransfer
const createEncodedHHTransfer = async () => {
    let toAccountParts = toAccount.split(".");
    let usdcTokenId = "";
    let caratTokenId = "";
    let droppPayerAccount = "";
    let droppFeeAccount = "";
    if (userDetails.currency == "USDC") {
      let tokenId = await getUSDCTokenId();
      const idParts = tokenId.split(".");
      usdcTokenId = TokenID.create({ shardNum: parseInt(idParts[0], 10), realmNum: parseInt(idParts[1], 10), tokenNum: parseInt(idParts[2], 10) });

      const droppPayerAccountId = await getDroppAccountId();
      const droppPayerAccountIdParts = droppPayerAccountId.split(".");
      droppPayerAccount = AccountID.create({ accountNum: droppPayerAccountIdParts[droppPayerAccountIdParts.length - 1] });

      if (networkType == "HBAR") {
        const droppFeeAccountId = await getUSDCGasFeeAccountId();
      }
    }

    if (userDetails.currency == "CARAT") {
      let tokenId = await getCARATTokenId();
      const idParts = tokenId.split(".");
      caratTokenId = TokenID.create({ shardNum: parseInt(idParts[0], 10), realmNum: parseInt(idParts[1], 10), tokenNum: parseInt(idParts[2], 10) });
    }

    let accountIDSender = AccountID.create({ accountNum: userDetails.hhAccount.accountNumber });
    if (networkType != "HBAR" && userDetails.currency == "USDC") {
      const droppCircleAccount = await getEthCircleAccountID();
      toAccountParts = droppCircleAccount.split(".");
    }
    let accountIDReceiver = AccountID.create({ accountNum: toAccountParts[toAccountParts.length - 1] });
    let accountIDNode = AccountID.create({ accountNum: droppNodeId })
    let transferList = (usdcTokenId || caratTokenId ) ? TokenTransferList.create() : TransferList.create();
    if (usdcTokenId || caratTokenId) {
      transferList.token = usdcTokenId ? usdcTokenId : caratTokenId;
    }

    let amount = Math.floor(parseFloat(transferAmt) * getCurrencyDecimal(userDetails.currency));
    let accountAmountSender = AccountAmount.create({ accountID: accountIDSender, amount: amount * -1 });
    if (usdcTokenId || caratTokenId) {
      transferList.transfers.push(accountAmountSender);
    } else {
      transferList.accountAmounts.push(accountAmountSender);
    }
    let receiverAmt;
    let feeAccountAmountReceiver;
    if ((userDetails.currency == "USDC" && networkType == "HBAR")) {
      let feeAmount = Math.floor(parseFloat(usdcTransferFee) * getCurrencyDecimal(userDetails.currency));
      const droppFeeAccount = await getUSDCGasFeeAccountId();
      const droppFeeAccountParts = droppFeeAccount.split(".");
      let feeAccountIDReceiver = AccountID.create({ accountNum: droppFeeAccountParts[droppFeeAccountParts.length - 1] });
      feeAccountAmountReceiver = AccountAmount.create({ accountID: feeAccountIDReceiver, amount: feeAmount });
      receiverAmt = amount - feeAmount;
    } else {
      receiverAmt = amount;
    }
    let accountAmountReceiver = AccountAmount.create({ accountID: accountIDReceiver, amount: receiverAmt });
    if (usdcTokenId || caratTokenId) {
      transferList.transfers.push(accountAmountReceiver);
      if (feeAccountAmountReceiver) {
        transferList.transfers.push(feeAccountAmountReceiver);
      }
    } else {
      transferList.accountAmounts.push(accountAmountReceiver);
    }
    // let ethGasFeeTransferList;
    // if (usdcTokenId && networkType == "ETH") {
    //   ethGasFeeTransferList = TokenTransferList.create();
    //   ethGasFeeTransferList.token = usdcTokenId;
    //   let feeAmount = Math.floor(usdcTransferFee * getCurrencyDecimal(userDetails.currency));
    //   let feeAccountAmountSender = AccountAmount.create({accountID: accountIDSender, amount: feeAmount * -1});
    //   ethGasFeeTransferList.transfers.push(feeAccountAmountSender);
    //   const droppFeeAccount = await getUSDCGasFeeAccountId();
    //   const droppFeeAccountParts = droppFeeAccount.split(".");
    //   let feeAccountIDReceiver = AccountID.create({accountNum: droppFeeAccountParts[droppFeeAccountParts.length - 1]});
    //   let feeAccountAmountReceiver = AccountAmount.create({accountID: feeAccountIDReceiver, amount: feeAmount});
    //   ethGasFeeTransferList.transfers.push(feeAccountAmountReceiver);
    // }
    let transferObj = {}
    if (usdcTokenId || caratTokenId) {
      transferObj = { tokenTransfers: [transferList] }
      // if (networkType == "ETH") {
      //   transferObj.tokenTransfers.push(ethGasFeeTransferList);
      // }
    } else {
      transferObj = { transfers: transferList };
    }
    let cryptoTransferTransactionBody = CryptoTransferTransactionBody.create(transferObj);
    let timeStampNano = p2phelper.createTimestampNano();
    let timestamp = Timestamp.create({ seconds: Math.floor(timeStampNano), nanos: 0 })

    let transactionID = TransactionID.create({ transactionValidStart: timestamp, accountID: userDetails.currency == "USDC" ? droppPayerAccount : accountIDSender });
    let duration = Duration.create({ seconds: 180 });

    let transactionBody;

    transactionBody = TransactionBody.create({
      transactionID: transactionID,
      nodeAccountID: accountIDNode,
      transactionFee: (maxCryptoFee ? (maxCryptoFee * Math.pow(10, 8)) : MAX_HEDERA_TXN_FEE),
      transactionValidDuration: duration,
      generateRecord: true,
      memo: (networkType != "HBAR" && userDetails.currency == "USDC") ? await getUSDCPayoutMemo() : memo,
      cryptoTransfer: cryptoTransferTransactionBody
    });

    let transactionBodyBytes = TransactionBody.encode(transactionBody).finish();

    return await getEncodedTransactionBytes(transactionBodyBytes, signatures, userDetails);

    // let encoding = "binary";
    // let priv = signatures.privateKey;
    // let privateKey = forge.util.hexToBytes(priv);
    // let signature = ed25519.sign({
    //   message: Buffer.from(transactionBodyBytes),
    //   encoding,
    //   privateKey,
    // });

    // let signaturePair = SignaturePair.create({ ed25519: signature });
    // signaturePair.pubKeyPrefix = Buffer.from(p2phelper.hexToBytes(signatures.publicKey));
    // let signatureMap = SignatureMap.create();
    // signatureMap.sigPair.push(signaturePair);

    // let transaction = Transaction.create({
    //   bodyBytes: transactionBodyBytes,
    //   sigMap: signatureMap
    // })

    // let transactionBytes = Transaction.encode(transaction).finish();
    // let encodedTransactionBytes = btoa(String.fromCharCode(...new Uint8Array(transactionBytes)));

    // //let encodedTransactionBytes = forge.util.encode64(transactionBytes)
    // return encodedTransactionBytes
  }

  const transferHbar = async () => {
    setDisableBtn(true);
    if (validate()) {
      try {
        setLoading(true);
        setOpenSuccessModal(true);
        const encodedTransfer = await createEncodedHHTransfer();
        const res = await api.transferHBAR({ base64encodedTransferTx: encodedTransfer });
        if (res && res.responseCode == 0) {
          setLoading(false);
          api.resetUserDetails();
        } else {
          const errorMsg = (res && res.errors && res.errors.length > 0) ? res.errors[0] : "Transfer unsuccessful!";
          setBackendErr(errorMsg);
          setLoading(false);
        }
        setDisableBtn(false);
      } catch (error) {
        const res = error.response;
        const errorMsg = (res && res.errors && res.errors.length > 0) ? res.errors[0] : COMMON_ERROR_MSG;
        setBackendErr(errorMsg);
        setLoading(false);
        setDisableBtn(false);
      }
    }
  }

  const transferETH = async () => {
    setDisableBtn(true);
    if (validate()) {
      try {
        setLoading(true);
        setOpenSuccessModal(true);
        const encodedTransfer = await createEncodedHHTransfer();
        const tinyUsdcAmount = Math.floor(parseFloat(transferAmt) * getCurrencyDecimal("USDC"));
        const tinyFee = Math.floor(parseFloat(usdcTransferFee) * getCurrencyDecimal("USDC"));

        const res = await api.transferETH({
          usdcAmount: tinyUsdcAmount,
          totalFee: tinyFee,
          type: "TRANSFER",
          entityType: "USER",
          destinationChain: networkType,
          circleDepositHederaAddress: await getEthCircleAccountID(),
          destinationAddress: toAccount,
          hederaTokenTransferTx: encodedTransfer, //"GmYKZAogywcoPd8AzOKF2TWesUi4jRDEV8fMkYuXxOh4H8iUPmIaQFC/pCD69O4QAUFShXC1CTPBnxqlt1uzh+wRvfBPSy4A8uw/nMGMEUhBHbANntS9OyuBTiru7hIWqBZ28BcLlgoiZwoVCgwIoLPbmAYQ6vGeuwISBRjCvfsWEgIYBhiAxoaPASICCB4oATIKNzI1ODY2NjQyN3IyEjAKBRjT+ooBEgwKBRjCvfsWEJnhmAISCwoFGMXxlgEQgIl6EgwKBRiMk/cWEJrYngE=",
        });

        // const res =  await api.transferETH({
        //   usdcAmount: tinyUsdcAmount,
        //   totalFee: tinyFee,
        //   type: "TRANSFER",
        //   entityType: "USER",
        //   destinationChain: networkType,
        //   // circleDepositHederaAddress: await getDroppCircleAccountId(),
        //   circleDepositHederaAddress: await getEthCircleAccountID(),
        //   // cirlceMemo: await getUSDCPayoutMemo(),
        //   destinationAddress: toAccount,
        //   hederaTokenTransferTx: encodedTransfer, //"GmYKZAogywcoPd8AzOKF2TWesUi4jRDEV8fMkYuXxOh4H8iUPmIaQFC/pCD69O4QAUFShXC1CTPBnxqlt1uzh+wRvfBPSy4A8uw/nMGMEUhBHbANntS9OyuBTiru7hIWqBZ28BcLlgoiZwoVCgwIoLPbmAYQ6vGeuwISBRjCvfsWEgIYBhiAxoaPASICCB4oATIKNzI1ODY2NjQyN3IyEjAKBRjT+ooBEgwKBRjCvfsWEJnhmAISCwoFGMXxlgEQgIl6EgwKBRiMk/cWEJrYngE=",
        // });
        if (res && res.responseCode == 0) {
          storeLastUsedChain(chainTitle);
          api.resetUserDetails();
        } else {
          const errorMsg = (res && res.errors && res.errors.length > 0) ? res.errors[0] : "Transfer unsuccessful!";
          setBackendErr(errorMsg);
        }
        setLoading(false);
        setDisableBtn(false);
      } catch (error) {
        const res = error.response
        const errorMsg = (res && res.errors && res.errors.length > 0) ? res.errors[0] : COMMON_ERROR_MSG;
        setBackendErr(errorMsg);
        setLoading(false);
        setDisableBtn(false);
      }
    }
  }

  const makeTransfer = async () => {
    if (networkType == "HBAR" || (userDetails.currency == "CARAT" || userDetails.currency == "HBAR")) {
      await transferHbar();
    } else if (networkType != "HBAR") {
      await transferETH();
    }
  };

  const handleSuccessModalClose = () => {
    setOpenSuccessModal(false);
    api.resetUserDetails();
    setReview(false);
    setCurrentScreen("dashboard");
  };

  const getUSDCFees = async () => {
    try {
      setLoading(true);
      let res = await api.getUSDCFees({ amount: transferAmt, type: "TRANSFER", chain: networkType == "HBAR" ? "HBAR" : networkType });
      if (res && res.responseCode == 0) {
        if (res.data && (res.data.totalFee == 0 || res.data.totalFee)) {
          setUsdcTransferFee(res.data.totalFee);
        } else {
          setBackendErr("unable to fetch the fees");
          setOpenSuccessModal(true);
        }
      }
    } catch (error) {
      setLoading(false);
      setBackendErr(COMMON_ERROR_MSG);
      setOpenSuccessModal(true);
    }
  }
  // validateAndConfirm
  const validateAndConfirm = async () => {
    setDisableBtn(true);
    if (validate()) {
      if (userDetails.currency == "USDC" ) {
        await getUSDCFees();
      }
    }
    if (validate()) {
      if (networkType == "HBAR" && userDetails.currency == "USDC") {
        try {
          setLoading(true);
          const tokenId = await getUSDCTokenId();
          const result = await api.checkUSDCTokenAssociation({ accountId: toAccount, tokenId: tokenId })
          if (result && result.responseCode == 0) {
            if (result && result.data) {
              setReview(true);
              setDisableBtn(false);
            } else {
              setBackendErr("Target account is not setup to accept USDC");
              setOpenSuccessModal(true);
            }
            setLoading(false);
          } else {
            const errorMsg = (result && result.messages && result.messages.length > 0) ? result.messages[0] : "Provided account id is invalid";
            setBackendErr(errorMsg);
            setLoading(false);
            setOpenSuccessModal(true);
          }
        } catch (error) {
          setLoading(false);
          setBackendErr(COMMON_ERROR_MSG);
          setOpenSuccessModal(true);
        }
        setDisableBtn(false);
      } else {
        setLoading(false);
        setDisableBtn(false);
        setReview(true);
      }
    } else {
      setDisableBtn(false);
    }
  };

  const changeNetwork = (item) => {
    if (item != networkType) {
      setToAccount("");
      setTransferAmt("");
      setMemo("");
      setTransferAmtErr("");
      setToAccountErr("");
      setUsdcTransferFee(null);
      setNetworkType(item);
    }
  }

  const backBtnHandler = () => {
    setReview(false);
  }

  const backToFundAccountScreen = () => {
    setToAccountErr(null);
    setTransferAmtErr(null);
    setNetworkType(null);
    setUsdcTransferFee(null);
    setBackendErr(null);
    setToAccount(null);
    setTransferAmt(null);
    // if (["HBAR", "CARAT"].includes(userDetails.currency)) {
    //   setCurrentScreen("dashboard");
    // }
    setCurrentScreen("dashboard");
  }

  const chainHandler = (data) => {
    setNetworkType(data.chain);
    setChainTitle(data.chainTitle);
  }

  return (
    <div style={{ marginTop: "33px" }}>
      {/* <div
        style={{
          textAlign: "left",
          marginTop: "6px",
          marginLeft: "20px",
          marginBottom: "10px"
        }}>
        <div style={{ paddingTop: "9px" }}>
          <label style={{ fontWeight: "450", color: "#18C2EE", fontSize: "1.8em" }}>
            TRANSFER OUT
          </label>
          <br />
          <label style={{ fontSize: "1.3em" }}>
            {userDetails.currency == "USDC"? "USDC (Circle)" : userDetails.currency}
          </label>
        </div>
      </div> */}
      <div className={classes.detailContainer}>
        {/* <div style={{ marginBottom: "10px", backgroundColor: "#f9f9f9", borderRadius: "5px", padding: "8px" }}>
          <Typography>Current Balance:&nbsp;
            {userDetails.currency == "HBAR" ?
              <>
                <img
                  style={{}}
                  height="19"
                  width="14"
                  src="./hbar_icon.png"
                />
                {displayAmount(userDetails.cryptoBalance / getCurrencyDecimal(userDetails.currency))}
              </>
              :
              <>
                {displayAmount(userDetails.cryptoBalance / getCurrencyDecimal(userDetails.currency))} {userDetails.currency}
              </>
            }
          </Typography>
        </div> */}

        <div className={`${styles.greyListContainer} ${classes.balanceContainer}`}>
          <Typography variant="subtitle2" style={{fontWeight:"600"}}>
            {userDetails.currency == "USDC" ? pageTexts.balanceHeading : `${userDetails.currency} BALANCE` }
          </Typography>
          <Typography className={`${styles.darkBoldText} ${classes.balance}`}>
            {displayAmount(userDetails.cryptoBalance/getCurrencyDecimal(userDetails.currency), 4)}
          </Typography>
        </div>
        {
          !["HBAR", "CARAT"].includes(userDetails.currency) &&
            <Box mt={2}>
              <Typography className={classes.transferMsg} >Transfer {userDetails.currency} {chainTitle ? `to ${chainTitle} Wallet.` : 'from your Dropp wallet.'}</Typography>
            </Box>
        }
        <Box my={2}>
          {networkType || ["HBAR", "CARAT"].includes(userDetails.currency) ?
            <div style={{ marginBottom: "10px" }}>
              <Typography className={`${classes.label} ${styles.darkBoldText} ${styles.upperCase}`}>{pageTexts.from}</Typography>
              <Typography className={`${styles.roundedBorderedTypography} ${styles.darkBoldText}`}>{hederaAccountToString(userDetails.hhAccount)}</Typography>
            </div> : ""}


          {
            networkType || ["HBAR", "CARAT"].includes(userDetails.currency) ? <>
              <div>
                <Typography className={`${classes.label} ${styles.darkBoldText}`}>TO</Typography>
                <TextField
                  style={{ marginLeft: "2px" }}
                  size="small"
                  className={`${classes.margin} ${styles.inputFieldWithGreyBg} ${classes.roundedInputField}`}
                  label="TO"
                  value={toAccount}
                  disabled={review}
                  onChange={e => setToAccount(e.target.value)}
                  variant="outlined"
                />
                {toAccountErr && (<div className="errMsg extension" style={{ marginBottom: "10px", marginLeft: "5px" }}>
                  <strong>{toAccountErr}</strong>
                </div>)}
                <Typography className={`${classes.label} ${styles.darkBoldText}`}>{pageTexts.amount}</Typography>
                <TextField
                  style={{ marginLeft: "2px", marginTop: "8px" }}
                  size="small"
                  className={`${classes.margin} ${styles.inputFieldWithGreyBg} ${classes.roundedInputField}`}
                  disabled={review}
                  label={`AMOUNT ${userDetails.currency}`}
                  value={transferAmt}
                  onChange={e => setTransferAmt(e.target.value)}
                  variant="outlined"
                />
                {transferAmtErr && (<div className="errMsg extension" style={{ marginBottom: "10px", marginLeft: "5px" }}>
                  <strong>{transferAmtErr}</strong>
                </div>)}

                {networkType == "HBAR" || userDetails.currency == "HBAR"  || userDetails.currency == "CARAT" ? <div>
                  <Typography className={`${classes.label} ${styles.darkBoldText}`}>{pageTexts.memo}</Typography>
                  <TextField
                    style={{ marginLeft: "2px", marginTop: "8px"}}
                    size="small"
                    className={`${classes.margin} ${styles.inputFieldWithGreyBg} ${classes.roundedInputField}`}
                    disabled={review}
                    label="MEMO"
                    value={memo}
                    onChange={e => setMemo(e.target.value)}
                    variant="outlined"
                  />
                </div>
                  : ""}
              </div>
              {maxCryptoFee && maxCryptoFee > 0 && <Box my={2}>
                <Grid container>
                  <Grid item xs={12}>
                    <div className={classes.root}>
                      <Accordion defaultExpanded className={classes.feeAccordion} aria-setsize={"large"}>
                        <AccordionSummary
                          expandIcon={<img src="./arrowDown.png" alt="show" />}
                          aria-controls="panel1a-content"
                          id="panel1a-header"
                        >
                          <Typography className={`${styles.darkBoldText} ${styles.largeSizedText}`}>{pageTexts.cashOutFeeLabel}</Typography>
                        </AccordionSummary>
                        <AccordionDetails aria-expanded="true" className={classes.feeAccordionDetails}>
                          <Typography>
                            {pageTexts.maxFee}:&nbsp;
                            {/* <img
                              height="19"
                              width="14"
                              src="./hbar_icon.png"
                            /> */}
                            <strong>{displayAmount(maxCryptoFee)} HBAR</strong>
                          </Typography>
                        </AccordionDetails>
                      </Accordion>
                    </div>
                  </Grid>
                </Grid>
              </Box>
              }
              <div style={{ marginTop: "20px"}}>
                {
                  userDetails.currency === "USDC" ? <>
                    {
                      usdcTransferFee == 0 || usdcTransferFee ? <>
                        <Typography>
                          <strong>
                            {pageTexts.estimatedFees}
                          </strong>
                        </Typography>
                        <Typography>
                          {pageTexts.feesIncluNetFees}: {usdcTransferFee == 0 ? 0 : displayAmount(usdcTransferFee)} USDC
                        </Typography>
                        <div>
                        Please ensure that you are providing the correct Hedera address to avoid losing your assets. Once the transfer is completed, Dropp will not be able to recover it back.
                        <br />
                         Transfer could take several minutes to complete. USDC will be available on the wallet once completed
                         </div>

                      </> : ""
                    }
                    {/* {
                      userDetails.currency === "USDC" && networkType != "HBAR" ?
                        <Typography>
                          <strong>
                            Note: Please ensure that you are providing the correct {chainTitle} address to avoid losing
                            your assets. Once the transfer is completed, Dropp will not be able to recover it back.
                            <br />
                            Transfer could take several minutes to complete. USDC will be available on the {chainTitle} wallet once completed.
                          </strong>
                        </Typography> : ""
                    } */}
                  </> : <>
                    {
                      maxCryptoFee && maxCryptoFee > 0 ? <>
                        <Typography>
                          {pageTexts.feeNote}
                        </Typography>
                      </> : ""
                    }
                  </>
                }
              </div>
            </> : <>{
              !["HBAR", "CARAT"].includes(userDetails.currency) ?
              <div className={classes.chainContainer}>
                <div>
                  <label className={`${classes.subHeadings} ${styles.darkBoldText}`}>
                    {pageTexts.to} 
                  </label>
                </div>
                <Box my={2}>
                    {
                      networkChains && networkChains.length ? networkChains
                      .filter(item => item.chain === "HBAR" )
                      .map((item) => {
                        return (<>
                          <div
                            onClick={() => chainHandler(item)}
                            key={item.chain}
                            className={classes.chain}
                            style={
                              {
                                display: "flex",
                                alignItems: "center"
                              }
                            }>
                            <div style={{ display: "flex", alignItems: "center" }}>
                              <Typography style={{ fontWeight: "600" }} variant="h6">
                                {item.chainTitle} {lastUsedChain && lastUsedChain.chainTitle ? (item.chainTitle == lastUsedChain.chainTitle ? "(Last used)" : "") : ""}
                              </Typography>
                            </div>
                            <NavigateNextIcon className={classes.icons} />
                          </div>
                          <Divider className={styles.divider} />
                        </>)
                      }) : <div className="loader" style={{ margin: "9px auto auto" }}>
                      <CircularProgress color="inherit" />
                    </div>
                    }
                  <div>
                    <Typography style={{ opacity: "0.4", fontWeight: "600" }} variant="subtitle2">
                      {pageTexts.OtherNetworksSoonTxt}
                    </Typography>
                  </div>
                </Box>
              </div> : ""
            }
            </>
          }
        </Box>
      </div>

      <Modal
        open={openSuccessModal}
        onClose={backendErr ? () => setOpenSuccessModal(false) : handleSuccessModalClose}
      >
        <Box className={classes.modalContainer}>
          {
            loading ?
              <div className="loader" style={{ margin: "9px auto auto" }}>
                <CircularProgress color="inherit" />
              </div> :
              backendErr ?
                <>
                  <Typography sx={{ mt: 2 }}>
                    <strong>Error</strong>
                  </Typography>
                  <Typography sx={{ mt: 2 }} style={{ wordBreak: "break-word" }}>
                    {backendErr}
                  </Typography>
                </>
                :
                <Typography id="modal-modal-description" sx={{ mt: 2 }}>
                  {`${displayAmount(transferAmt)} ${userDetails.currency} transfer initiated successfully. It may take some time to reflect in your account`}
                </Typography>
               }
              <div className={classes.ctrlBtns}>
              {loading ?
              ""
              :
               <button className="button-done" onClick={backendErr ? () => setOpenSuccessModal(false) : handleSuccessModalClose}>
                {pageTexts.OKBtnTxt}
              </button>
            }

          </div>
        </Box>
      </Modal>
      {/* <div className="footer">
        {
          networkType || userDetails.currency == "HBAR" || userDetails.currency == "CARAT"  ? <>
            <div className="backArrow">
              <ArrowBackOutlinedIcon onClick={review ? backBtnHandler : backToFundAccountScreen} style={{ cursor: "pointer", color: "#18C2EE" }} />
            </div>
            <div className="footerRightButtonMedium" style={{left: review ? "200px" : ""}}>
              {
                review ?
                  <button
                    className={disableBtn ? "button-done button-disabled" : "button-done"}
                    disabled={disableBtn}
                    onClick={makeTransfer}>
                    TRANSFER
                  </button> :
                  <button
                    className={disableBtn ? "button-done button-disabled" : "button-done"}
                    disabled={disableBtn}
                    onClick={validateAndConfirm}>
                    REVIEW
                  </button>
              }
            </div>
          </> : <>
          <div className="backArrow">
              <ArrowBackOutlinedIcon onClick={() => setCurrentScreen("dashboard")} style={{ cursor: "pointer", color: "#18C2EE" }} />
            </div>
          </>
        }
      </div> */}
        <Modal
        open={openConfirmModal}
        onClose={() => setOpenConfirmModal(false)}
 >
        <Box className={classes.modalContainer}>
        <Typography id="modal-modal-description" sx={{ mt: 2 }}>
        Are you sure you want to transfer {transferAmt === 0 ? "0" : displayAmount(transferAmt)} {userDetails.currency} to account ID {toAccount}?
       </Typography>
       <div className={classes.ctrlBtns}>
        <button className="button-cancel" onClick={() => setOpenConfirmModal(false)}>
          Cancel
        </button>
        &nbsp;&nbsp;&nbsp;&nbsp;
        <button className="button-done" onClick={handleModalOk}>
        OK
        </button>
        </div>
        </Box>
        </Modal>
       </div>
  );
};

export default RedeemCrypto;
