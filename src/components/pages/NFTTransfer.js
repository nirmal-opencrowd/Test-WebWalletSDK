import { CircularProgress, Divider, Grid, Table, TableBody, TableCell, TableRow, Typography } from '@material-ui/core';
import ArrowBackOutlinedIcon from '@material-ui/icons/ArrowBackOutlined'
import React, { useEffect } from 'react';
import "../../NFTcollections.css";
import * as api from "../../api";
import { displayAmount, hederaAccountToString, getCurrencyDecimal, stringToHederaAccount, getEncodedTransactionBytes } from "../../utils/utils";
import * as p2phelper from "../../utils/p2phelper.js";
import * as localstorage from "../../utils/local-storage";
import forge from "node-forge";
import TextField from '@material-ui/core/TextField';
import { proto } from "@hashgraph/proto";
import Box from '@material-ui/core/Box';
import Modal from '@material-ui/core/Modal';
import CancelOutlinedIcon from '@material-ui/icons/CancelOutlined';
import CheckCircleOutlineIcon from '@material-ui/icons/CheckCircleOutline';
import { MAX_HEDERA_TXN_FEE } from "../../utils/constants";
import { makeStyles } from '@material-ui/core/styles';
import classNames from 'classnames';
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
    borderRadius: "16px",
    padding:"8px",
  },
  disabledText: {
    color: "#ccc"
  },
}));

const ed25519 = forge.pki.ed25519;
const pageTexts = uiTexts.nftTransfer;

const NFTTransfer = ({ screenData, setCurrentScreen, setScreenWithData, userDetails, workingEnv, setFooterObj, setFunctionCallOnBack }) => {
  const [signatures, setSignatures] = React.useState({});
  const [toAccount, setToAccount] = React.useState(null);
  const [toAccountErr, setToAccountErr] = React.useState("");
  const [droppNodeId, setDroppNodeId] = React.useState(0);
  const [backendErr, setBackendErr] = React.useState("");
  const [openSuccessModal, setOpenSuccessModal] = React.useState(false);
  const [openConfirmModal, setOpenConfirmModal] = React.useState(false);
  const [reviewNFT, setReviewNFT] = React.useState(true);
  const [nftTradeErr, setNftTradeErr] = React.useState([]);
  const [nftTradePass, setNftTradePass] = React.useState([]);
  const [hasTradeErr, setHasTradeErr] = React.useState(false);
  const [droppFeeDetails, setDroppFeeDetails] = React.useState(null);
  const [exchangeRate, setExchangeRate] = React.useState(null);
  const [tokens, setTokens] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const { AccountID, CryptoTransferTransactionBody, Timestamp, TransactionID, Duration, TransactionBody, SignaturePair, SignatureMap, Transaction, TokenID, TokenTransferList, NftTransfer } = proto;

  const NFTDataDetails = screenData.dataDetails;
  const imageUrl = screenData.data.imgUrl;
  const NFTDataInObject = screenData.data.object;
  const mapping = screenData.data.mapping;
  const NFTFeesDetails = screenData.nftFees;
  const fixedFeesArr = NFTFeesDetails.custom_fees && NFTFeesDetails.custom_fees.fixed_fees && NFTFeesDetails.custom_fees.fixed_fees.length > 0 ? NFTFeesDetails.custom_fees.fixed_fees : [];
  const royaltyFeesArr = NFTFeesDetails.custom_fees && NFTFeesDetails.custom_fees.royalty_fees && NFTFeesDetails.custom_fees.royalty_fees.length > 0 ? NFTFeesDetails.custom_fees.royalty_fees : [];
  let tradeErrArray = [];
  let tradePassArray = [];
  const classes = useStyles();
  let totalBalance;
  let totalTokenFees;
  let tokenBalance;
  let hederaTransactionFees = exchangeRate && droppFeeDetails && droppFeeDetails.cryptoTransferCustomeFeeUSD ? droppFeeDetails.cryptoTransferCustomeFeeUSD / exchangeRate : null;

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

  React.useEffect(() => {
    setFooterObj({
      primaryBtnText: reviewNFT ? pageTexts.reviewBtnText : pageTexts.submitBtnText,
      primaryFuncToCall: reviewNFT ? validate  : validateAndConfirm,
      disabledPrimaryBtn: reviewNFT ? false : hasTradeErr
    })
    setFunctionCallOnBack(() => backButtonHandler)
    return () => {
      setFooterObj({})
    }
  }, [reviewNFT, hasTradeErr, toAccount])

  const backButtonHandler = () => {
    if(reviewNFT) {
      setScreenWithData("nftDetails", screenData.data)
      setFunctionCallOnBack(null);
    } else {
      setReviewNFT(true);
    }
  }

  const getNFTFeesInHbars = () => {
    let fixedHbarFees = 0;
    if (fixedFeesArr) {
      for (let i = 0; i < fixedFeesArr.length; i++) {
        if (!fixedFeesArr[i].denominating_token_id) {
          fixedHbarFees += (fixedFeesArr[i].amount / getCurrencyDecimal("HBAR"));
        }
      }
    }
    return fixedHbarFees + hederaTransactionFees;
  }

  const getTotalFeesPaidBySender = () => {
    let obj = { HBAR: 0 };
    if (hederaTransactionFees) {
      obj["HBAR"] += hederaTransactionFees;
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


    return obj;
  };

  const getEstimatedFees = () => {
    let fees = getTotalFeesPaidBySender();
    return fees["HBAR"];
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
        setToAccountErr("");
        setReviewNFT(false);
        let totalFees = getTotalFeesPaidBySender();
        let tokenAssociated;
        const senderResponse = await api.getAccountBalanceAndTokenInfo({ hhAccountID: userDetails.hhAccount });
        if (senderResponse.data.responseCode == 0) {
          const balanceAndTokens = senderResponse.data.data;
          totalBalance = balanceAndTokens.balance.balance / getCurrencyDecimal("HBAR");
          let tokens = balanceAndTokens.balance && balanceAndTokens.balance.tokens && balanceAndTokens.balance.tokens.length ? balanceAndTokens.balance.tokens : [];
          setTokens(tokens);
          for (let i = 0; i < tokens.length; i++) {
            if (tokens[i].token_id == NFTDataInObject.token) {
              tokenAssociated = true;
            }
            if (totalFees[tokens[i].token_id]) {
              if (tokens[i].balance < totalFees[tokens[i].token_id]) {
                tradeErrArray.push(`Insufficient token (${tokens[i].token_id}) balance (current balance ${displayAmount(tokens[i].balance)})`);
                hasError = true;
              } else {
                tradePassArray.push(`Sufficient token (${tokens[i].token_id}) balance (current balance ${displayAmount(tokens[i].balance)})`);
              }
            }
          }

          if (!tokenAssociated) {
            tradeErrArray.push(`Token ${NFTDataInObject.token} not associated to your account ${hederaAccountToString(userDetails.hhAccount)}`);
            hasError = true;
          } else {
            tradePassArray.push(`Token ${NFTDataInObject.token} associated to your account ${hederaAccountToString(userDetails.hhAccount)}`);
          }

          if (totalBalance < totalFees["HBAR"]) {
            let err = `Insufficient HBAR balance (current balance ${totalBalance})`
            tradeErrArray.push(err);
            hasError = true;
          } else {
            let err = `Sufficient HBAR balance (current balance ${totalBalance})`
            tradePassArray.push(err);
          }
        }


        tokenAssociated = false;
        const response = await api.getAccountBalanceAndTokenInfo({ hhAccountID: stringToHederaAccount(toAccount) });
        if (response.data.responseCode == 0) {
          let tokens = response.data && response.data.data && response.data.data.balance && response.data.data.balance.tokens ? response.data.data.balance.tokens : [];
          for (let i = 0; i < tokens.length; i++) {
            if (tokens[i].token_id == NFTDataInObject.token) {
              tokenAssociated = true;
              break;
            }
          }
          if (!tokenAssociated) {
            tradeErrArray.push(`Token ${NFTDataInObject.token} not associated to receiving account ${toAccount}`);
            hasError = true;
          } else {
            tradePassArray.push(`Token ${NFTDataInObject.token} associated to receiving account ${toAccount}`);
          }
        }
        if (response.data.responseCode != 0 && response.data.errors && response.data.errors.length && response.data.errors[0]) {
          response.data.responseCode == 213
            ?
            setToAccountErr("Invalid Receiving Account ID")
            :
            setNftTradeErr([response.data.errors[0]])
          hasError = true;
        }
      }
    } else {
      setToAccountErr("Account Number cannot be empty");
      hasError = true;
    }

    setNftTradeErr(tradeErrArray);
    setNftTradePass(tradePassArray);
    setHasTradeErr(hasError)
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
    let nftTransferList = TokenTransferList.create();
    nftTransferList.token = NFTTokenId;

    let nftTransfer = NftTransfer.create();
    nftTransfer.receiverAccountID = accountIDReceiver;
    nftTransfer.senderAccountID = accountIDSender;
    nftTransfer.serialNumber = NFTDataInObject.serialNumber;
    nftTransferList.nftTransfers.push(nftTransfer);

    let cryptoTransferTransactionBody = CryptoTransferTransactionBody.create({ tokenTransfers: [nftTransferList] });
    let timeStampNano = p2phelper.createTimestampNano();
    let timestamp = Timestamp.create({ seconds: Math.floor(timeStampNano), nanos: 0 })

    let transactionID = TransactionID.create({ transactionValidStart: timestamp, accountID: accountIDSender });
    let duration = Duration.create({ seconds: 180 });

    let transactionBody = TransactionBody.create({
      transactionID: transactionID,
      nodeAccountID: accountIDNode,
      transactionFee: MAX_HEDERA_TXN_FEE,
      transactionValidDuration: duration,
      generateRecord: true,
      // memo : `Dropp: NFT Transfer ${Math.floor(Math.random() * Math.pow(10, 6))}`,
      cryptoTransfer: cryptoTransferTransactionBody
    })

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

    // //let encodedTransactionBytes = forge.util.encode64(transactionBytes)
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
        setLoading(false);
      }
    }
  }

  const handleConfirmModalClose = () => {
    setOpenConfirmModal(false);
  };

  const validateAndConfirm = async () => {
    if (validate()) {
      setReviewNFT(false)
      setOpenConfirmModal(true);
    }
  };

  const handleSuccessModalClose = () => {
    setOpenSuccessModal(false);
    api.resetUserDetails();
    setCurrentScreen("nftcollections");
  };

  const toAccountHandler = (e) => {
    setToAccount(e.target.value);
    setNftTradeErr(null);
    setToAccountErr(null);
    setReviewNFT(true);
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
            TRANSFER
          </label>
          <br />
          <label style={{ fontSize: "1.3em" }}>
            NFT
          </label>
        </div>
      </div> */}
      <div style={{ padding: "10px 17px", height: workingEnv === "test" ? "442px" : "", overflow: "scroll" }}>
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
        {/* <div style={{ padding: "10px 0px" }} className={classes.greyBackground} >
          <div style={{ fontSize: "15px", fontWeight: "700" }}>
            {NFTDataDetails.name}
          </div>
          <div style={{ display: "flex", alignItems: "center" }}>
            <div className="NFTImage" style={{ width: "100px", margin: "0", borderRadius: "0", padding: "7px 22px", display: "inline-block" }}>
              <img src={imageUrl} alt={NFTDataDetails.name} />
            </div>
            <div className="NFTTransferDetail">
              <div style={{ padding: "0 0 10px 0px" }}>
                <div className="NFTKeys" style={{ padding: "7px 0px" }}>SERIAL NUMBER</div>
                <p style={{ fontSize: "15px" }}>#{NFTDataInObject.serialNumber}</p>
              </div>
              <div style={{ padding: "0 0 10px 0px" }}>
                <div className="NFTKeys" style={{ padding: "7px 0px" }}>TOKEN ID</div>
                <p style={{ fontSize: "15px" }}>{NFTDataInObject.token}</p>
              </div>
              {mapping && mapping[NFTDataInObject.token] ?
                <div style={{ padding: "0 0 10px 0px" }}>
                  <div className="NFTKeys" style={{ padding: "7px 0px" }}>COLLECTION</div>
                  <p style={{ fontSize: "15px" }}>{mapping[NFTDataInObject.token]}</p>
                </div>
                : ""}
            </div>
          </div>
        </div> */}
        <div className="transactionBetween">
          {/* <div id="from">
            <Typography fontSize={14} className="NFTKeys" style={{ padding: "7px 0px" }}>FROM</Typography>
            <p style={{ fontSize: "15px" }}>{NFTDataInObject.owner}</p>
          </div> */}
          {/* <div>
            <div id="tradePrice">
              <Typography fontSize={14} className="NFTKeys" style={{ padding: "7px 0px" }}>TO</Typography>
            </div>
            <TextField
              style={{ marginLeft: "2px", width: "100%" }}
              size="small"
              className={classes.margin}
              label="Account ID"
              value={toAccount}
              onChange={toAccountHandler}
              variant="outlined"
            />
            {toAccountErr && (<div className="errMsg extension" style={{ marginBottom: "10px", marginLeft: "5px" }}>
              <strong>{toAccountErr}</strong>
            </div>)}
          </div> */}
          <div>
            <Box my={1}>
              <div id="tradePrice">
                <Typography style={{ fontSize:"14px" }} className={commonStyles.darkBoldText}>{pageTexts.transferToLabel}</Typography>
              </div>
            </Box>
            <Box mb={2}>
              <TextField
                size="small"
                className={`${commonStyles.inputFieldWithGreyBg} ${classes.roundedInputField}`}
                label={pageTexts.accIdFieldLabel}
                value={toAccount}
                onChange={toAccountHandler}
                variant="outlined"
                disabled={!reviewNFT}
              />
            </Box>
            {toAccountErr && (<div className="errMsg extension" style={{ marginBottom: "10px", marginLeft: "5px" }}>
              <strong>{toAccountErr}</strong>
            </div>)}
          </div>
          {/* <div style={{ padding: "0 5px" }}>
            <Typography className={classes.normal}><strong>Ensure that receiving hedera account has this token ({NFTDataInObject.token}) associated.</strong></Typography>
            <Typography className={classes.normal}>Transfer will fail without prior token association and may incur additional fees.</Typography>
          </div> */}
        </div>
        {/* <div>
          <div id="tradePrice">
            <Typography fontSize={14} className="NFTKeys" style={{ padding: "7px 0px" }}>TRADE PRICE (HBAR)</Typography>
          </div>
        </div> */}
        {/* <TextField
          style={{ marginLeft: "2px", width: "100%"}}
          size="small"
          className={classes.margin}
          label="HBAR"
          value={tradePrice}
          disabled={!reviewNFT}
          onChange={e => setTradePrice(e.target.value)}
          variant="outlined" />
        {tradePriceErr && (<div className="error extension" style={{ color: "#9f3a38", marginBottom: "10px", marginLeft: "5px" }}>
          <strong>{tradePriceErr}</strong>
        </div>)} */}
        <div className={classes.greyBackground}>
          <Typography className={`${classes.large} ${commonStyles.darkBoldText}`} variant='h6'>
            {pageTexts.estimatedFeesTxt}
          </Typography>
          <>
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
                                    {displayAmount(fixedFeesArr[index].amount / getCurrencyDecimal("HBAR"))} HBAR
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
                      royaltyFeesArr
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
                                    0 HBAR
                                  </Typography>
                                </TableCell>
                              </TableRow>
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
              <Typography className={classes.disabledText}>{pageTexts.noneText}</Typography>
            }
          </>
          <div>
            <Table className={classes.table}>
              <TableBody>
                <TableRow className={classes.tableRow}>
                  <TableCell className={classNames([classes.cell, classes.keyCell])}>
                    <Typography>
                      Dropp Trade Fee (FREE )
                    </Typography>
                  </TableCell>
                  <TableCell className={classNames([classes.cell, classes.valueCell])}>
                    <Typography className={commonStyles.darkBoldText}>
                      0 HBAR
                    </Typography>
                  </TableCell>
                </TableRow>

                <TableRow className={classes.tableRow}>
                  <TableCell className={classNames([classes.cell, classes.keyCell])}>
                    <Typography>
                      Hedera Transaction Fee (${droppFeeDetails && droppFeeDetails.cryptoTransferCustomeFeeUSD ? displayAmount(droppFeeDetails.cryptoTransferCustomeFeeUSD) : ""})
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
                <TableCell className={classNames([classes.cell, classes.keyCell])}>
                  <Typography>
                    {pageTexts.feesToBeDeductedText}
                  </Typography>
                </TableCell>
                <TableCell className={classNames([classes.cell, classes.valueCell])}>
                  <Typography className={commonStyles.darkBoldText}>
                    {displayAmount(getEstimatedFees())} HBAR
                  </Typography>
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
          <Divider className={commonStyles.divider}/>
          {/* <div style={{ clear: "both" }}>
            <hr className='dashedLine' />
          </div> */}
        </div>
        {
          !reviewNFT && nftTradePass && Object.keys(nftTradePass).map((index) => {
            return (
              <div className="error extension" >
                <span style={{ color: "#18c2ee" }}><CheckCircleOutlineIcon /></span>  <strong>{nftTradePass[index]}</strong>
              </div>)
          })
        }
        {
          !reviewNFT && nftTradeErr && Object.keys(nftTradeErr).map((index) => {
            return (
              <div className="errMsg extension" >
                <CancelOutlinedIcon /><strong>{nftTradeErr[index]}</strong>
              </div>)
          })
        }
      </div>
      {/* <div className="footer" style={{height: workingEnv === "test" ? "75px" : ""}}>
        <div className='backArrow'>
          <ArrowBackOutlinedIcon onClick={reviewNFT ? () => setScreenWithData("nftDetails", screenData.data) : () => setReviewNFT(true)} style={{ cursor: "pointer", color: "#18C2EE" }} />
        </div>
          <div>
            {
              reviewNFT ?
              <div className='footerRightButtonMedium'>
                <button
                  className="getNFTBtn"
                  onClick={validate}
                >
                  REVIEW
                </button>
              </div>
                :
                <div className='footerRightButtonLarge' style={{left:"150px"}}>
                  <button
                    className={hasTradeErr ? "disabledgetNFTBtn" : "getNFTBtn"}
                    onClick={validateAndConfirm}
                    disabled={hasTradeErr}
                  >
                    TRANSFER NOW
                  </button>
                </div>
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
              <div className="loader" style={{ margin: "9px auto auto" }}>
                <CircularProgress color="inherit" />
              </div> :
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
              <button className="button-done" onClick={backendErr ? () => setOpenSuccessModal(false) : handleSuccessModalClose}>
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
              {pageTexts.modalTransferCancelBtnText}
            </button>
            &nbsp;&nbsp;&nbsp;&nbsp;
            <button className="button-done" onClick={transferNFT}>
              {pageTexts.modalTransferConfirmBtnText}
            </button>
          </div>
        </Box>
      </Modal>
    </div>

  )
}

export default NFTTransfer;