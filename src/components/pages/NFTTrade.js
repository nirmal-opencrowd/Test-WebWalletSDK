import { CircularProgress, Divider, Grid, Table, TableBody, TableCell, TableRow, Typography } from '@material-ui/core';
import ArrowBackOutlinedIcon from '@material-ui/icons/ArrowBackOutlined'
import React, { useEffect } from 'react';
import "../../NFTcollections.css";
import * as api from "../../api";
import { displayAmount, hederaAccountToString, getCurrencyDecimal, stringToHederaAccount, getAmountWithDecimals, getUSDCTokenId, getEncodedTransactionBytes } from "../../utils/utils";
import * as p2phelper from "../../utils/p2phelper.js";
import * as localstorage from "../../utils/local-storage";
import forge from "node-forge";
import TextField from '@material-ui/core/TextField';
import {proto} from "@hashgraph/proto";
import Box from '@material-ui/core/Box';
import Modal from '@material-ui/core/Modal';
import CancelOutlinedIcon from '@material-ui/icons/CancelOutlined';
import CheckCircleOutlineIcon from '@material-ui/icons/CheckCircleOutline';
import { MAX_HEDERA_TXN_FEE } from "../../utils/constants";
import { makeStyles } from '@material-ui/core/styles';
import classNames from 'classnames';
import TradeCurrencyDropdown from './TradeCurrencyDropdown';
import uiTexts from "./../../../configurations/dropp.json";
import commonStyles from "./../../styles/common.module.scss";

const useStyles = makeStyles((theme) => ({
  margin: {
    margin: theme.spacing(1),
  },
  modalContainer: {
    backgroundColor: '#FFFFFF',
    border: 0,
    left: '10%',
    padding: "15px",
    position: 'absolute',
    top: '30%',
    width: 250,

  },
  ctrlBtns: {
    marginTop: "5px",
    textAlign: "right",
  },
  table: {
    border: 'none',
    borderCollapse: 'collapse',
  },
  headings: {
    height: "35px"
  },
  cell: {
    border: 'none',
    fontSize: '15px',
    padding: '10px 0px',
    verticalAlign: "top",
  },
  keyCell: {
    border: 'none',
    fontSize: '15px',
    verticalAlign: "top",
    width: "56%",
  },
  valueCell: {
    paddingLeft: "5px"
  },
  tableRow: {
    padding: "5px 0px"
  },
  normal: {
    fontSize: "14px"
  },
  large: {
    fontSize: "16px"
  },
  greyBackground : {
    backgroundColor:"#f9f9f9",
    padding:"8px",
    borderRadius: "16px"
  },
  disabledText: {
    color: "#ccc"
  },
  roundedInputField: {
    "& .MuiOutlinedInput-root": {
      borderRadius: "20px",
    }
  },
}));

const ed25519 = forge.pki.ed25519;
const pageTexts = uiTexts.nftTrade;

const NFTTrade = ({ screenData, setCurrentScreen, setScreenWithData, userDetails, workingEnv, setFunctionCallOnBack, setFooterObj }) => {
  const [signatures, setSignatures] = React.useState({});
  const [toAccount, setToAccount] = React.useState(null);
  const [toAccountErr, setToAccountErr] = React.useState("");
  const [droppNodeId, setDroppNodeId] = React.useState(0);
  const [backendErr, setBackendErr] = React.useState("");
  const [openSuccessModal, setOpenSuccessModal] = React.useState(false);
  const [openConfirmModal, setOpenConfirmModal] = React.useState(false);
  const [tradePrice, setTradePrice] = React.useState(null);
  const [tradePriceErr, setTradePriceErr] = React.useState("");
  const [reviewNFT, setReviewNFT] = React.useState(true);
  const [nftTradeErr, setNftTradeErr] = React.useState([]);
  const [nftTradePass, setNftTradePass] = React.useState([]);
  const [hasTradeErr, setHasTradeErr] = React.useState(false);
  const [droppFeeDetails, setDroppFeeDetails] = React.useState(null);
  const [exchangeRate, setExchangeRate] = React.useState(null);
  const [loading, setLoading] = React.useState(true);
  const [tradeCurrency, setTradeCurrency] = React.useState(screenData.cryptoWallets && screenData.cryptoWallets[0] && screenData.cryptoWallets[0].walletId ? screenData.cryptoWallets[0].walletId.currencyCode : '');
  const [usdcTokenId, setUsdcTokenId] = React.useState(null);
  const [submitBtnDisabled, setSubmitBtnDisabled] = React.useState(false);
  const { AccountID, TransactionID,AccountAmount, TransferList, CryptoTransferTransactionBody, TokenID, TokenTransferList, NftTransfer, ScheduleCreateTransactionBody, SchedulableTransactionBody,Timestamp,Duration,TransactionBody } = proto;

  const NFTDataDetails = screenData.dataDetails;
  const imageUrl = screenData.data.imgUrl;
  const NFTDataInObject = screenData.data.object;
  const mapping = screenData.data.mapping;
  const NFTFeesDetails = screenData.nftFees;
  const fixedFeesArr = NFTFeesDetails.custom_fees && NFTFeesDetails.custom_fees.fixed_fees && NFTFeesDetails.custom_fees.fixed_fees.length > 0 ? NFTFeesDetails.custom_fees.fixed_fees : [];
  const royaltyFeesArr = NFTFeesDetails.custom_fees && NFTFeesDetails.custom_fees.royalty_fees && NFTFeesDetails.custom_fees.royalty_fees.length > 0 ? NFTFeesDetails.custom_fees.royalty_fees : [];
  const cryptoWallets = screenData.cryptoWallets;
  let totalFeesPaidBySeller;
  let tradeErrArray = [];
  let tradePassArray = [];
  const classes = useStyles();
  let hederaTransactionFees = exchangeRate && droppFeeDetails && droppFeeDetails.scheduleCreateFeeUSD ? droppFeeDetails.scheduleCreateFeeUSD / exchangeRate : null;

  useEffect(() => {
    async function fetchNodes() {
      let nodeDetails = await api.fetchNodes();
      const nodeArr = nodeDetails.data[0].nodeAccountId.split(".");
      const node = nodeArr[nodeArr.length - 1];
      setDroppNodeId(parseInt(node));
    }

    async function getFeeDetails() {
      const res = await api.getFeeDetails();
      if (res && res.data && res.data.responseCode == 0) {
        setDroppFeeDetails(res.data.data);
      }
    }

    async function updateSignatures() {
      const sign = await localstorage._get("_decrypted");
      if (sign && sign._decrypted) {
        setSignatures(sign._decrypted);
      }
    }

    async function hbarToUSD() {
      let exRate = await api.fetchExchangeRate("USD", "HBAR");
      if (exRate) {
        setExchangeRate(exRate);
      }
    }

    Promise.all([getFeeDetails(), fetchNodes(), updateSignatures(), hbarToUSD()])
  }, []);

  useEffect(() => {
    async function setUsdcToken() {
      const token = await getUSDCTokenId();
      setUsdcTokenId(token);
    }
    if (tradeCurrency == "USDC") {
      setUsdcToken();
    } else {
      setUsdcTokenId("");
    }
  }, [tradeCurrency])

  useEffect(()=> {
    setFunctionCallOnBack(() => backButtonHandler)
    setFooterObj({
      primaryBtnText: reviewNFT ? pageTexts.reviewBtnText : pageTexts.submitBtnText,
      primaryFuncToCall: reviewNFT ? validate  : submitHandler,
      disabledPrimaryBtn: reviewNFT ? false : submitBtnDisabled
    })
    return () => {
      setFooterObj({});
      setFunctionCallOnBack(null);
    }
  }, [reviewNFT, submitBtnDisabled, toAccount, tradePrice])

  const getTotalFeesPaidBySeller = (skipRoyaltyFee) => {
    let obj = {HBAR: 0};
    if (usdcTokenId) {
      obj[usdcTokenId] = 0;
    }
    if (fixedFeesArr) {
      for (let i = 0; i < fixedFeesArr.length; i++) {
        if (fixedFeesArr[i].denominating_token_id) {
          if (obj[fixedFeesArr[i].denominating_token_id]) {
            obj[fixedFeesArr[i].denominating_token_id] += fixedFeesArr[i].amount;
          } else {
            obj[fixedFeesArr[i].denominating_token_id] = fixedFeesArr[i].amount;
          }
        } else {
          obj["HBAR"] += (fixedFeesArr[i].amount / getCurrencyDecimal("HBAR"));
        }
      }
    }

    if (!skipRoyaltyFee && royaltyFeesArr && tradePrice) {
      for (let i = 0; i < royaltyFeesArr.length; i++) {
        let royaltyFees = royaltyFeesArr[i].amount.numerator / royaltyFeesArr[i].amount.denominator * tradePrice;
        if (usdcTokenId) {
          obj[usdcTokenId] += royaltyFees;
        } else {
          obj["HBAR"] += royaltyFees;
        }
      }
    }

    if (hederaTransactionFees) {
      obj["HBAR"] += hederaTransactionFees;
    }

    return obj;
  };

  const getEstimatedFees = () => {
    let droppTradeFees = droppFeeDetails ? (droppFeeDetails.feePercentage * 100) * tradePrice * 0.01 : 0;
    let totalFeesPaidBySeller = getTotalFeesPaidBySeller();

    return tradePrice ? (tradePrice - (usdcTokenId ? totalFeesPaidBySeller[usdcTokenId] : totalFeesPaidBySeller["HBAR"]) - droppTradeFees) : 0;
  }

  const getHBARFees = () => {
    const totalFeesPaidBySeller = getTotalFeesPaidBySeller();
    return totalFeesPaidBySeller["HBAR"];
  }

  const validate = async () => {
    let hasError = false;
    if (toAccount) {
      if ((toAccount.match(/^(0|(?:[1-9]\d*))\.(0|(?:[1-9]\d*))\.(0|(?:[1-9]\d*))?$/g) == null)) {
        setToAccountErr("Invalid Buyer Account ID");
        hasError = true;
      } else if (toAccount === hederaAccountToString(userDetails.hhAccount)) {
        setToAccountErr("You can’t transfer to your own account");
        hasError = true;
      } else {
        let tokenAssociated;
        let usdcTokenAssociated;
        setToAccountErr("");
        setSubmitBtnDisabled(true);
        setReviewNFT(false);
        totalFeesPaidBySeller = getTotalFeesPaidBySeller(true);
        const response = await api.getAccountBalanceAndTokenInfo({ hhAccountID: userDetails.hhAccount });
        if (response.data.responseCode == 0) {
          const balanceAndTokens = response.data.data;
          let tokens = balanceAndTokens.balance && balanceAndTokens.balance.tokens && balanceAndTokens.balance.tokens.length ? balanceAndTokens.balance.tokens : [];
          for (let i = 0; i < tokens.length; i++) {
            if (tokens[i].token_id == NFTDataInObject.token) {
              tokenAssociated = true;
            }
            if (usdcTokenId && tokens[i].token_id == usdcTokenId) {
              usdcTokenAssociated = true;
            }
            if (totalFeesPaidBySeller[tokens[i].token_id]) {
              if (tokens[i].balance < totalFeesPaidBySeller[tokens[i].token_id]) {
                if (tokens[i].token_id == usdcTokenId) {
                  tradeErrArray.push(`Insufficient USDC balance (current balance ${displayAmount(tokens[i].balance)})`);
                } else {
                  tradeErrArray.push(`Insufficient token (${tokens[i].token_id}) balance (current balance ${displayAmount(tokens[i].balance)})`);
                }
                hasError = true;
              } else {
                if (usdcTokenId == tokens[i].token_id) {
                  tradePassArray.push(`Sufficient USDC balance (current balance ${displayAmount(tokens[i].balance)})`);
                } else {
                  tradePassArray.push(`Sufficient token (${tokens[i].token_id}) balance (current balance ${displayAmount(tokens[i].balance)})`);
                }
              }
            }
          }
          if (!tokenAssociated) {
            tradeErrArray.push(`Token ${NFTDataInObject.token} is not associated to your account ${hederaAccountToString(userDetails.hhAccount)}`);
            hasError = true;
          } else {
            tradePassArray.push(`Token ${NFTDataInObject.token} associated to your account ${hederaAccountToString(userDetails.hhAccount)}`);
          }
          if (usdcTokenId) {
            if (!usdcTokenAssociated) {
              tradeErrArray.push(`Token ${usdcTokenId} is not associated to your account ${hederaAccountToString(userDetails.hhAccount)}`);
              hasError = true;
            } else {
              tradePassArray.push(`Token ${usdcTokenId} associated to your account ${hederaAccountToString(userDetails.hhAccount)}`);
            }
          }
        }

        tokenAssociated = false; // reset flag
        usdcTokenAssociated = false;

        const buyerResponse = await api.getAccountBalanceAndTokenInfo({ hhAccountID: stringToHederaAccount(toAccount) });
        if (buyerResponse.data.responseCode == 0) {
          let tokens = buyerResponse.data && buyerResponse.data.data && buyerResponse.data.data.balance && buyerResponse.data.data.balance.tokens ? buyerResponse.data.data.balance.tokens : [];
          for (let i = 0; i < tokens.length; i++) {
            if (tokens[i].token_id == NFTDataInObject.token) {
              tokenAssociated = true;
            }
            if (usdcTokenId && tokens[i].token_id == usdcTokenId) {
              usdcTokenAssociated = true;
            }
          }
          if (!tokenAssociated) {
            tradeErrArray.push(`Token ${NFTDataInObject.token} not associated to receiving account ${toAccount}`);
            hasError = true;
          } else {
            tradePassArray.push(`Token ${NFTDataInObject.token} associated to receiving account ${toAccount}`);
          }

          if (usdcTokenId) {
            if (!usdcTokenAssociated) {
              tradeErrArray.push(`Token ${usdcTokenId} not associated to receiving account ${toAccount}`);
              hasError = true;
            } else {
              tradePassArray.push(`Token ${usdcTokenId} associated to receiving account ${toAccount}`);
            }
          }
        }
        if (buyerResponse.data.responseCode != 0 && buyerResponse.data.errors && buyerResponse.data.errors.length) {
          buyerResponse.data.responseCode == 213
          ?
          setToAccountErr("Invalid Buyer Account ID")
          :
          setNftTradeErr([buyerResponse.data.errors[0]])
          hasError = true;
        }
      }
    } else {
      setToAccountErr("Account Number cannot be empty");
      hasError = true;
    }

    setNftTradeErr(tradeErrArray);
    setNftTradePass(tradePassArray);
    if (tradePrice) {
      if (!(tradePrice.match(/^[+]?\d+(\.\d+)?$/) != null && parseFloat(tradePrice) != NaN) || parseFloat(tradePrice) <= 0) {
        setTradePriceErr("Invalid Trade Price");
        hasError = true;
      } else if (parseFloat(tradePrice) != getAmountWithDecimals(tradePrice, 8)) {
        setTradePriceErr("Trade price should have maximum 8 decimal places");
        hasError = true;
      } else {
        setTradePriceErr("");
      }
    }
    setHasTradeErr(hasError)
    if (hasError == true) {
      setSubmitBtnDisabled(true);
    } else {
      setSubmitBtnDisabled(false);
    }
    return !hasError;
  };

  const createEncodedNFTTransfer = async () => {
    let toAccountParts = toAccount.split(".");
    const tokenId = NFTDataInObject.token;
    const idParts = tokenId.split(".");
    let NFTTokenId = TokenID.create({ shardNum: parseInt(idParts[0], 10), realmNum: parseInt(idParts[1], 10), tokenNum: parseInt(idParts[2], 10) });
    let accountIDSender = AccountID.create({ accountNum: userDetails.hhAccount.accountNumber });
    let accountIDReceiver = AccountID.create({ accountNum: parseInt(toAccountParts[toAccountParts.length - 1], 10) });
    let accountIDNode = AccountID.create({ accountNum: droppNodeId });
    let droppAccountId = droppFeeDetails ? droppFeeDetails.droppAccountId : null;
    let accountIDDropp = AccountID.create({ accountNum: droppAccountId.accountNumber ? droppAccountId.accountNumber : null });

    // NFT transfer
    let nftTransferList = TokenTransferList.create();
    nftTransferList.token = NFTTokenId;
    let nftTransfer = NftTransfer.create();
    nftTransfer.receiverAccountID = accountIDReceiver;
    nftTransfer.senderAccountID = accountIDSender;
    nftTransfer.serialNumber = NFTDataInObject.serialNumber;
    nftTransferList.nftTransfers.push(nftTransfer);

    // crypto transfer
    let amount = tradePrice ? tradePrice * getCurrencyDecimal(tradeCurrency) : 0;
    let transferList;
    let usdcTokenAcc;
    if (amount && (droppFeeDetails && (droppFeeDetails.feePercentage || droppFeeDetails.feePercentage == 0))) {
      transferList = usdcTokenId ? TokenTransferList.create() : TransferList.create();
      if (usdcTokenId) {
        const idParts = usdcTokenId.split(".");
        usdcTokenAcc = TokenID.create({shardNum: parseInt(idParts[0], 10), realmNum: parseInt(idParts[1], 10), tokenNum: parseInt(idParts[2], 10)});
        transferList.token = usdcTokenAcc;
      }

      let accountAmountBuyer = AccountAmount.create({ accountID: accountIDReceiver, amount: amount * -1 });
      let fees = Math.floor(amount * (droppFeeDetails.feePercentage * 100) * 0.01);
      let accountAmountDropp = AccountAmount.create({ accountID: accountIDDropp, amount: fees });
      amount -= fees;
      let accountAmountSeller = AccountAmount.create({ accountID: accountIDSender, amount: amount });

      if (usdcTokenAcc) {
        transferList.transfers.push(accountAmountBuyer);
        transferList.transfers.push(accountAmountSeller);
        transferList.transfers.push(accountAmountDropp);
      } else {
        transferList.accountAmounts.push(accountAmountBuyer);
        transferList.accountAmounts.push(accountAmountSeller);
        transferList.accountAmounts.push(accountAmountDropp);
      }
    }

    let obj = {
      tokenTransfers: [nftTransferList]
    };
    if (transferList) {
      if (usdcTokenAcc) {
        obj.tokenTransfers.push(transferList);
      } else {
        obj['transfers'] = transferList;
      }
    }

    let cryptoTransferTransactionBody = CryptoTransferTransactionBody.create(obj);
    let timeStampNano = p2phelper.createTimestampNano();
    let timestamp = Timestamp.create({ seconds: Math.floor(timeStampNano), nanos: 0 })

    let scheduledTransactionBody = SchedulableTransactionBody.create()
    scheduledTransactionBody.cryptoTransfer = cryptoTransferTransactionBody;
    scheduledTransactionBody.transactionFee = MAX_HEDERA_TXN_FEE;

    let scheduleCreateTransactionBody = ScheduleCreateTransactionBody.create({
      scheduledTransactionBody: scheduledTransactionBody,
      payerAccountID: accountIDReceiver,
      // memo: `Dropp: NFT Transfer Inner Schedule ${Math.floor(Math.random() * Math.pow(10, 6))}`,
      transactionFee: MAX_HEDERA_TXN_FEE
    });

    let transactionID = TransactionID.create({ transactionValidStart: timestamp, accountID: accountIDSender });
    let duration = Duration.create({ seconds: 180 });

    let transactionBody = TransactionBody.create({
      transactionID: transactionID,
      nodeAccountID: accountIDNode,
      transactionFee: MAX_HEDERA_TXN_FEE,
      transactionValidDuration: duration,
      generateRecord: true,
      // memo: `Dropp: NFT Transfer Main Schedule ${Math.floor(Math.random() * Math.pow(10, 6))}`,
      scheduleCreate: scheduleCreateTransactionBody
    });
    let transactionBodyBytes = TransactionBody.encode(transactionBody).finish()

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
    // return encodedTransactionBytes;
  };

  const transferNFT = async () => {
    setOpenConfirmModal(false);
    if (validate()) {
      const encodedTransfer = await createEncodedNFTTransfer();
      const res = await api.transferHBAR({ base64encodedTransferTx: encodedTransfer });
      if (res && res.responseCode == 0) {
        setOpenSuccessModal(true);
        setLoading(false);
      } else {
        const errorMsg = (res && res.errors && res.errors.length > 0) ? res.errors[0] : "NFT Transfer unsuccessful!";
        setBackendErr(errorMsg);
        setOpenSuccessModal(true);
        setLoading(false)
      }
    }
  }

  const handleConfirmModalClose = () => {
    setOpenConfirmModal(false);
  };

  const validateAndConfirm = async () => {
    if (validate()) {
      setOpenConfirmModal(true);
    }
  };

  const handleSuccessModalClose = () => {
    setOpenSuccessModal(false);
    setCurrentScreen("dashboard");
  };

  const toAccountHandler = (e) => {
    setToAccount(e.target.value);
    setNftTradeErr(null);
    setToAccountErr(null);
  }

  const submitHandler = async () => {
    const encodedTransfer = await createEncodedNFTTransfer();
    const response = await api.createScheduleTxForNFTTrade({ base64encodedTransferTx: encodedTransfer })
    if (response && response.data.responseCode == 0) {
      const tradeIdObj = response.data.data;
      api.resetUserDetails();
      setScreenWithData("nftTradeSubmitted", { data: screenData.data, nftFees: NFTFeesDetails, dataDetails: NFTDataDetails, imageUrl: imageUrl, toAccount: toAccount, tradePrice: tradePrice, tradeCurrency: tradeCurrency, tradeId: [tradeIdObj.shardNum, tradeIdObj.realmNum, tradeIdObj.scheduleNum].join(".") });
    }
  }

  const tradePriceHandler = (e) => {
    if (!isNaN(e.target.value)) {
      setTradePrice(e.target.value);
    } else {
      setTradePrice('');
    }
  }

  const backButtonHandler = () => {
    if(reviewNFT) {
      setScreenWithData("nftDetails", screenData.data)
      setFunctionCallOnBack(null);
    } else {
      setHasTradeErr(false);
      setReviewNFT(true);
    }
  }

  return (
    <div style={{ marginTop: "33px" }}>
      {/* <div
        style={{
          textAlign: "left",
          width: "600px",
          marginTop: "6px",
          marginLeft: "20px",
        }}
        >
        <div style={{ paddingTop: "9px", marginRight: "180px" }}>
          <label style={{ fontWeight: "450", color: "#18C2EE", fontSize: "1.8em" }}>
            TRADE
          </label>
          <br />
          <label style={{ fontSize: "1.3em" }}>
            NFT
          </label>
        </div>
      </div> */}
      <div style={{ padding: "10px 17px", height: workingEnv === "test" ? "442px" : "", overflow:"scroll" }}>
        <Grid container justifyContent="center" alignItems="center" className={classes.greyBackground} >
          <Grid item xs={12}>
            <img width={"100%"} src={imageUrl} alt={NFTDataDetails.name} />
          </Grid>
          <Grid item xs={12}>
            <Box py={2}>
              <Typography align="center" variant='body2' className={commonStyles.darkBoldText}>
                {NFTDataDetails.name}
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={12} style={{backgroundColor:"#fff", borderRadius: "10px", padding: "10px"}}>
            <Grid container>
              <Grid item xs={4}>
                <Typography variant="body2">
                  {mapping[NFTDataInObject.token]}
                </Typography>
              </Grid>
              <Grid item xs={4}>
                <Typography variant="body2">
                  #{NFTDataInObject.serialNumber}
                </Typography>
              </Grid>
              <Grid item xs={4}>
                <Typography variant="body2">
                  {NFTDataInObject.token}
                </Typography>
              </Grid>
            </Grid>
          </Grid>
        </Grid>
        <Divider className={commonStyles.divider}/>
        <Box py={1}>
          <Typography className={classes.normal}>Ensure that receiving hedera account has this token <strong>{NFTDataInObject.token}</strong> associated. <strong>Transfer will fail without prior token association and may incur additional fees.</strong></Typography>
        </Box>
        <Divider className={commonStyles.divider}/>
        <div className="transactionBetween">
          {/* <div id="from">
            <Typography fontSize={14} className="NFTKeys" style={{ padding: "7px 0px" }}>FROM</Typography>
            <p style={{ fontSize: "15px" }}>{NFTDataInObject.owner}</p>
          </div> */}
          <div>
            <Box my={1}>
              <div id="tradePrice">
                <Typography style={{ fontSize:"14px" }} className={commonStyles.darkBoldText}>{pageTexts.tradeToLabel}</Typography>
              </div>
            </Box>
            <TextField
              size="small"
              className={`${commonStyles.inputFieldWithGreyBg} ${classes.roundedInputField}`}
              label={pageTexts.accIdFieldLabel}
              value={toAccount}
              onChange={toAccountHandler}
              variant="outlined"
              disabled={!reviewNFT}
            />
            {toAccountErr && (<div className="errMsg extension" style={{ marginBottom: "10px", marginLeft: "5px" }}>
              <strong>{toAccountErr}</strong>
            </div>)}
          </div>

        </div>

        <div style={{display: "flex", padding:"10px 0"}}>
          <div style={{width: "50%"}}>
            <Box mb={1}>
              <div id="tradePrice">
                <Typography  className={commonStyles.darkBoldText} style={{ fontSize:"14px" }}>{pageTexts.tradePriceText}</Typography>
              </div>
            </Box>
            <Box mt={2}>
              <TextField
                placeholder={tradeCurrency}
                style={{ marginLeft: "2px", width: "100%"}}
                size="small"
                // className={classes.margin}
                className={`${commonStyles.inputFieldWithGreyBg} ${classes.roundedInputField}`}
                value={tradePrice}
                disabled={!reviewNFT}
                onChange={tradePriceHandler}
                variant="outlined" />
            </Box>
          </div>
          <div id="tradePrice" style={{marginLeft:"10px"}}>
            <Box mb={1}>
              <Typography className={commonStyles.darkBoldText} style={{ fontSize:"14px" }}>{pageTexts.tradeCurrencyText}</Typography>
            </Box>
            <TradeCurrencyDropdown reviewNFT={reviewNFT} cryptoWallets={cryptoWallets} tradeCurrency={tradeCurrency} setTradeCurrency={setTradeCurrency} />
          </div>
        </div>
        {tradePriceErr && (<div className="errMsg extension" style={{ marginBottom: "10px", marginLeft: "5px" }}>
          <strong>{tradePriceErr}</strong>
        </div>)}
        <Divider className={commonStyles.divider}/>
        <div style={{marginTop: "16px"}} className={classes.greyBackground}>
          <Typography className={`${classes.large} ${commonStyles.darkBoldText}`} variant='h6'>
            {pageTexts.estimatedFeesTxt}
          </Typography>
            <>
              {/* <div>
                <Typography fontSize={14} className={commonStyles.darkBoldText} style={{ padding: "2px 0px" }}>NFT FEES</Typography>
              </div> */}
              {((fixedFeesArr && fixedFeesArr.length) || (royaltyFeesArr && royaltyFeesArr.length)) ?
              <div>
                <Table className={classes.table}>
                  <TableBody>
                    {
                      Object.keys(fixedFeesArr).map((index) => {

                        return (
                          <>{
                            !fixedFeesArr[index].denominating_token_id ?
                              <TableRow className={classes.tableRow}>
                                <TableCell className={classNames([classes.cell, classes.keyCell])}>
                                  <Typography>
                                    Fixed Fee paid to {fixedFeesArr[index].collector_account_id}
                                  </Typography>
                                </TableCell>
                                <TableCell className={classNames([classes.cell, classes.valueCell])}>
                                  <Typography className={commonStyles.darkBoldText}>
                                    {displayAmount(fixedFeesArr[index].amount/getCurrencyDecimal("HBAR"))} HBAR
                                  </Typography>
                                </TableCell>
                              </TableRow>
                              :
                              <TableRow className={classes.tableRow}>
                                <TableCell className={classNames([classes.cell, classes.keyCell])}>
                                  <Typography>
                                    Fixed Fee paid to {fixedFeesArr[index].collector_account_id}
                                  </Typography>
                                </TableCell>
                                <TableCell className={classNames([classes.cell, classes.valueCell])}>
                                  <Typography className={commonStyles.darkBoldText}>
                                    {fixedFeesArr[index].amount} {`${(fixedFeesArr[index].amount == 1 ? "Token" : "Tokens")} (${fixedFeesArr[index].denominating_token_id})`}
                                  </Typography>
                                </TableCell>
                              </TableRow>
                          }
                          </>
                        )
                      })
                    }
                    {
                      royaltyFeesArr && royaltyFeesArr.length > 0
                        ? Object.keys(royaltyFeesArr).map((index) => {
                          return (
                            <>
                              <TableRow className={classes.tableRow}>
                                <TableCell className={classNames([classes.cell, classes.keyCell])}>
                                  <Typography>
                                    Royalty ({royaltyFeesArr[index].amount.numerator / royaltyFeesArr[index].amount.denominator * 100}%) paid to {royaltyFeesArr[index].collector_account_id}
                                  </Typography>
                                </TableCell>
                                <TableCell className={classNames([classes.cell, classes.valueCell])}>
                                  <Typography className={commonStyles.darkBoldText}>
                                    {tradePrice ? displayAmount(royaltyFeesArr[index].amount.numerator / royaltyFeesArr[index].amount.denominator * tradePrice) : 0} {tradeCurrency}
                                  </Typography>
                                </TableCell>
                              </TableRow>
                              {
                                royaltyFeesArr[index].fallback_fee && royaltyFeesArr[index].fallback_fee.amount
                                  ?
                                  <>
                                    <TableRow className={classes.tableRow}>
                                      <TableCell className={classNames([classes.cell, classes.keyCell])}>
                                        <Typography>
                                          Fallback paid to {royaltyFeesArr[index].collector_account_id}
                                        </Typography>
                                      </TableCell>
                                      {royaltyFeesArr[index].fallback_fee.denominating_token_id
                                      ?
                                      <TableCell className={classNames([classes.cell, classes.valueCell])}>
                                        <Typography className={commonStyles.darkBoldText}>
                                          {royaltyFeesArr[index].fallback_fee.amount} {`${(royaltyFeesArr[index].fallback_fee.amount == 1 ? "Token" : "Tokens")} (${royaltyFeesArr[index].fallback_fee.denominating_token_id})`}
                                        </Typography>
                                      </TableCell>
                                      :
                                      <TableCell className={classNames([classes.cell, classes.valueCell])}>
                                        <Typography className={commonStyles.darkBoldText}>
                                          {displayAmount(royaltyFeesArr[index].fallback_fee.amount/ getCurrencyDecimal("HBAR"))} HBAR
                                        </Typography>
                                      </TableCell>
                                      }
                                    </TableRow>
                                  </>
                                  :
                                  <Table className={classes.table}>
                                    <TableBody>
                                      <TableRow>
                                        <TableCell className={classes.cell}>
                                          <Typography className={classes.disabledText}>None</Typography>
                                        </TableCell>
                                      </TableRow>
                                    </TableBody>
                                  </Table>
                              }
                              {/* <TableRow className={classes.tableRow}>
                                <TableCell className={classNames([classes.cell, classes.keyCell])}>Royalty (0.1%) <br />paid to {royaltyFeesArr[index].fallback_fee.collector_account_id}</TableCell>
                                <TableCell className={classNames([classes.cell, classes.valueCell])}>{tradePrice ? 0.001 * tradePrice : 0} HBAR</TableCell>
                              </TableRow> */}
                            </>
                          )
                        })
                        :
                        ""
                    }
                  </TableBody>
                </Table>
              </div>
              :
              <Typography className={classes.disabledText}>NONE</Typography>
              }
            </>
          {/* <div>
            <Typography fontSize={14} className={commonStyles.darkBoldText} style={{ padding: "2px 0px" }}>TRADE FEES</Typography>
          </div> */}
          <div>
            <Table className={classes.table}>
              <TableBody>
                {
                  tradePrice
                    ?
                    <>
                      <TableRow className={classes.tableRow}>
                        <TableCell className={classNames([classes.cell, classes.keyCell])}>
                          <Typography>
                            Dropp Trade Fee ({droppFeeDetails && droppFeeDetails.feePercentage ? (droppFeeDetails.feePercentage * 100) : ""}%)
                          </Typography>
                        </TableCell>
                        <TableCell className={classNames([classes.cell, classes.valueCell])}>
                          <Typography className={commonStyles.darkBoldText}>
                            {tradePrice
                            ?
                            displayAmount(((droppFeeDetails && droppFeeDetails.feePercentage ? (droppFeeDetails.feePercentage * 100) : 0) * tradePrice * 0.01))
                            : 0} {tradeCurrency}
                          </Typography>
                        </TableCell>
                      </TableRow>
                    </>
                    :
                    ""
                }

                <TableRow className={classes.tableRow}>
                  <TableCell className={classNames([classes.cell, classes.keyCell])}>
                    <Typography>
                      Hedera Transaction Fee (${droppFeeDetails && droppFeeDetails.scheduleCreateFeeUSD ? displayAmount(droppFeeDetails.scheduleCreateFeeUSD) : ""})
                    </Typography>
                  </TableCell>
                  <TableCell className={classNames([classes.cell, classes.valueCell])}>
                    <Typography className={commonStyles.darkBoldText}>
                      {hederaTransactionFees ? displayAmount(hederaTransactionFees) : 0} HBAR
                    </Typography>
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
        {/* <div style={{ clear: "both" }}>
          <hr className='dashedLine' />
        </div> */}
        <Divider className={commonStyles.divider}/>
        <Table className={classes.table}>
          <TableBody>
            <TableRow className={classes.tableRow}>
              <TableCell className={classNames([classes.cell, classes.keyCell])} style={{paddingBottom:"0px"}}>
                <Typography>
                  {pageTexts.amountToBeReceivedText}
                </Typography>
              </TableCell>
              <TableCell className={classNames([classes.cell, classes.valueCell])} style={{paddingBottom:"0px"}}>
                <Typography className={commonStyles.darkBoldText}>
                  {displayAmount(getEstimatedFees())} {tradeCurrency}
                </Typography>
              </TableCell>
            </TableRow>
            {/* {usdcTokenId ?
              <TableRow className={classes.tableRow} style={{padding:"0px"}}>
                <TableCell className={classNames([classes.cell, classes.keyCell])} style={{paddingTop:"0px"}}></TableCell>
                <TableCell className={classNames([classes.cell, classes.valueCell])} style={{paddingTop:"0px"}}>
                  <Typography className={commonStyles.darkBoldText}>
                    -{displayAmount(getHBARFees())} HBAR
                  </Typography>
                </TableCell>
              </TableRow>
            : ""} */}
          </TableBody>
        </Table>
        <Divider className={commonStyles.divider}/>
          {/* <div style={{ clear: "both" }}>
            <hr className='dashedLine' />
          </div> */}

        </div>
        {
          !reviewNFT && nftTradePass && Object.keys(nftTradePass).map((index)=>{
            return (
              <div className="error extension" >
                <span style={{ color: "#18c2ee" }}><CheckCircleOutlineIcon /></span>  <strong>{nftTradePass[index]}</strong>
              </div>)
          })
        }
        {
          !reviewNFT && nftTradeErr && Object.keys(nftTradeErr).map((index)=>{
            return (
              <div className="errMsg extension">
                <CancelOutlinedIcon/><strong>{nftTradeErr[index]}</strong>
              </div>)
          })
        }
      </div>
      {/* <div className="footer" style={{height: workingEnv === "test" ? "75px" :""}}>
        <div className='backArrow'>
          <ArrowBackOutlinedIcon onClick={backButtonHandler} style={{ cursor: "pointer", color: "#18C2EE" }} />
        </div>
        <div className='footerRightButtonSmall'>
            {
              reviewNFT
                ?
                <button
                  className="getNFTBtn"
                  style={{ position: "relative", right: "25px" }}
                  onClick={validate}
                >
                  Review
                </button>
                :
                <button
                  className={submitBtnDisabled ? "disabledgetNFTBtn" : "getNFTBtn"}
                  style={{ position: "relative", right: "25px" }}
                  onClick={submitHandler}
                  disabled={submitBtnDisabled}
                >
                  Submit
                </button>
            }
        </div>
      </div> */}

      <Modal
        open={openSuccessModal}
        onClose={backendErr ? () => setOpenSuccessModal(false) : handleSuccessModalClose}
      >
        <Box className={classes.modalContainer}>
          {
            loading ?
              <div className="loader" style={{margin:"9px auto auto"}}>
                <CircularProgress color="inherit" />
              </div>
              :
              backendErr ?
                <>
                  <Typography sx={{ mt: 2 }}>
                    <strong>{pageTexts.modalErrHeading}</strong>
                  </Typography>
                  <Typography sx={{ mt: 2 }} style={{ wordBreak: "break-all" }}>
                    {backendErr}
                  </Typography>
                </>
                :
                <Typography id="modal-modal-description" sx={{ mt: 2 }}>
                  {pageTexts.modalSuccessMsg}
                </Typography>
          }
          <div className={classes.ctrlBtns}>
            {loading ?
              "" :
              <button className="button-done" onClick={ backendErr ? () => setOpenSuccessModal(false) : handleSuccessModalClose}>
                {pageTexts.OKBtnTxt}
              </button>
            }
          </div>
        </Box>
      </Modal>

      <Modal
        open={openConfirmModal}
        onClose={handleConfirmModalClose}
      >
        <Box className={classes.modalContainer}>
          <Typography id="modal-modal-description" sx={{ mt: 2 }}>
            {pageTexts.modalConfirmationText}
          </Typography>
          <div className={classes.ctrlBtns}>
            <button className="button-cancel" onClick={handleConfirmModalClose}>
              {pageTexts.modalTradeCancelBtnText}
            </button>
            &nbsp;&nbsp;&nbsp;&nbsp;
            <button className="button-done" onClick={transferNFT}>
              {pageTexts.modalTradeCancelBtnText}
            </button>
          </div>
        </Box>
      </Modal>
    </div>

  )
}

export default NFTTrade;