import { Box, CircularProgress, Divider, Grid, makeStyles, Modal, Table, TableBody, TableCell, TableRow, TextField, Typography } from '@material-ui/core';
import ArrowBackOutlinedIcon from '@material-ui/icons/ArrowBackOutlined';
import "../../NFTcollections.css";
import * as api from "./../../api";
import React, { useEffect } from 'react';
import * as utils from '../../utils/utils';
import * as p2phelper from "./../../utils/p2phelper.js";
import forge, { util } from "node-forge";
import {proto} from '@hashgraph/proto';
import { MAX_HEDERA_TXN_FEE, MAX_ASSOCIATE_TOKEN_FEE } from "./../../utils/constants";
import * as localstorage from "./../../utils/local-storage";
import CancelOutlinedIcon from '@material-ui/icons/CancelOutlined';
import LaunchOutlinedIcon from '@material-ui/icons/LaunchOutlined';
import classNames from 'classnames';
import uiTexts from "./../../../configurations/dropp.json";
import commonStyles from "./../../styles/common.module.scss";
import RemoveCircleOutlineIcon from '@material-ui/icons/RemoveCircleOutline';
import { renderCurrency } from '../../utils/currency';

const useStyles = makeStyles((theme) => ({
  detailContainer: {
    paddingTop: "0px",
  },
  tokenListContainer: {
    maxHeight: "280px",
    paddingBottom: "80px",
    overflow: "hidden",
    overflowY: "scroll"
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
  keyField: {
    width: "100%",
  },
  multilineInput: {
    '& .MuiInput-multiline': {
      paddingTop: 0
    }
  },
  greyBackground: {
    backgroundColor: "#f9f9f9",
    marginTop: "10px",
    padding: "8px",
  },
  launchIconInBox: {
    float: "right",
    height: "30px",
    marginRight: "10px",
  },
  footer: {
    backgroundColor: "white",
    bottom: "0px",
    height: "42px",
    padding: "0px 20px",
    position: "fixed",
    width: "100%",
    zIndex: "100",
  },
  launchIconInFooter: {
    height:"18px",
    position:"relative",
    top:"4px"
  },
  table: {
    border: 'none',
    borderCollapse: 'collapse',
  },
  cell: {
      border: 'none',
      padding:"5px 0px",
      verticalAlign: "top"
  },
  greyText:{
    color:"#888B8E"
  },
  cancelLink: {
    alignItems: "center",
    backgroundColor:"transparent",
    border:"none",
    color: "#18C2EE",
    cursor: "pointer",
    display: "flex",
    marginTop:"10px",
    textAlign: "center",
  },
  roundedInputField: {
    "& .MuiOutlinedInput-root": {
      borderRadius: "20px"
    }
  },
}));
const ed25519 = forge.pki.ed25519;
const pageTexts = uiTexts.associateNFT;

const NFTAssociate = ({ setCurrentScreen, userDetails, screenData, setFooterObj }) => {
  const classes = useStyles();
  const [tokenId, setTokenId] = React.useState(null);
  const [tokenIdErr, setTokenIdErr] = React.useState("");
  const [openConfirmModal, setOpenConfirmModal] = React.useState(false);
  const [openSuccessModal, setOpenSuccessModal] = React.useState(false);
  const [backendErr, setBackendErr] = React.useState("");
  const [droppNodeId, setDroppNodeId] = React.useState(0);
  const [signatures, setSignatures] = React.useState({});
  const [hbarBalance, setHbarBalance] = React.useState(null);
  const [loading, setLoading] = React.useState(false);
  const [associatedToken, setAssociatedToken] = React.useState(null);
  const [tokenAssociated, setTokenAssociated] = React.useState(null);
  const [associationErr, setAssociationErr] = React.useState(null);
  const [showTokenInfo, setShowTokenInfo] = React.useState(false);
  const [fixedFeesArr, setFixedFeeArr] = React.useState(null);
  const [royaltyFeesArr, setRoyaltyFeesArr] = React.useState(null);
  const [nftName, setNftName] = React.useState(null);
  const [symbol, setSymbol] = React.useState(null);
  const [discardedTokenId, setDiscardedTokenId] = React.useState(null);
  const [successMsg, setSuccessMsg] = React.useState("");
  const [droppFeeDetails, setDroppFeeDetails] = React.useState(null);
  const [exchangeRate, setExchangeRate] = React.useState(null);
  const {
    AccountID, Duration,
    SignatureMap,
    SignaturePair,
    Timestamp, TokenAssociateTransactionBody, TokenDissociateTransactionBody,
    TokenID, Transaction, TransactionBody, TransactionID
  } = proto;

  const goToUrl = (transactionUrl) => {
    chrome.runtime.sendMessage({
        type: "openInNewTab",
        request: {url: transactionUrl},
    });
  };

  useEffect(() => {
    const fetchCryptoBalance = async () => {
      const balanceData = await api.getCryptoBalance({ hhAccountID: utils.hederaAccountToString(userDetails.hhAccount), currency: "HBAR" });
      if (balanceData && (balanceData.data || balanceData.data == 0)) {
        setHbarBalance(balanceData.data / utils.getCurrencyDecimal("HBAR"));
      }
    };

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

    Promise.all([fetchCryptoBalance(), fetchNodes(), updateSignatures()]);
  }, []);


  const getPayerNFTTokens = async () => {
    let res = await api.getPayerNFTTokens();
    if (res && res.data && res.data.responseCode == 0) {
      setAssociatedToken(res.data.data);
    } else {
      setAssociatedToken("Error from Backend");
      setBackendErr(res && res.data && res.data.errors && res.data.errors.length ? res.data.errors[0] : "Something went wrong when fetching associated tokens");
      setOpenSuccessModal(true);
    }
  };

  React.useEffect(()=>{
    getPayerNFTTokens();
    setFooterObj({footerText: (
      <p className={commonStyles.footerContainer}>
        <p>{pageTexts.removableTokenMsg}</p>
        <img
          src='./exchange.png'
          alt='launch'
          className={commonStyles.footerIconLeft}
        />
        <span>{pageTexts.viewTxnOnDragonGlassMsg}</span>
      </p>
    )});
    return () => {
      setFooterObj({})
    }
  },[])

  useEffect(() => {
    if (exchangeRate && droppFeeDetails) {
      // setFeeMsg(`Associating a token will cost you $${utils.displayAmount(droppFeeDetails.tokenAssociateFeeUSD)} (${renderCurrency((droppFeeDetails.tokenAssociateFeeUSD / exchangeRate), "HBAR", "14px", 8, true)} approx.)`);
    }
  }, [exchangeRate, droppFeeDetails]);

  const validate = () => {
    let hasError = false;
    if (tokenId) {
      if ((tokenId.match(/^(0|(?:[1-9]\d*))\.(0|(?:[1-9]\d*))\.(0|(?:[1-9]\d*))?$/g) == null)) {
        setTokenIdErr("Invalid Token ID");
        hasError = true;
      } else if (tokenId === utils.hederaAccountToString(userDetails.hhAccount)) {
        setTokenIdErr("Invalid Token ID");
        hasError = true;
      } else {
        setTokenIdErr("");
      }
    } else {
      setTokenIdErr("Token ID cannot be empty");
      hasError = true;
    }
    return !hasError;
  };

  React.useEffect(()=>{
    if (tokenAssociated) {
      setAssociationErr(`Token ${tokenId} already associated`)
    }
  },[tokenAssociated])

  const handleConfirmModalClose = () => {
    setDiscardedTokenId(null);
    setOpenConfirmModal(false);
  }

  const getFeeDetails = async () => {
    const res = await api.getFeeDetails();
    if (res && res.data && res.data.responseCode == 0) {
      setDroppFeeDetails(res.data.data);
    }
  };

  const hbarToUSD = async () => {
    let exRate = await api.fetchExchangeRate("USD", "HBAR");
    if (exRate) {
      setExchangeRate(exRate);
    }
  };

  const getNftInfo = async (data) => {
    let res = await api.getNFTFees({hhAccountID : utils.stringToHederaAccount(data)})
    if (res && res.data && res.data.responseCode == 0) {
      if (res.data.data) {
        setTokenAssociated(res.data.data.associated);
        if (!res.data.data.associated) {

          setShowTokenInfo(true);
          const tokenInfo = res.data.data;
          Promise.all([hbarToUSD(), getFeeDetails()]);
          if (tokenInfo.name) {
            setNftName(tokenInfo.name);
          }
          if (tokenInfo.symbol) {
            setSymbol(tokenInfo.symbol);
          }
          if (tokenInfo.custom_fees) {
            if (tokenInfo.custom_fees.fixed_fees && tokenInfo.custom_fees.fixed_fees.length) {
              setFixedFeeArr(tokenInfo.custom_fees.fixed_fees);
            }
            if (tokenInfo.custom_fees.royalty_fees && tokenInfo.custom_fees.royalty_fees.length) {
              setRoyaltyFeesArr(tokenInfo.custom_fees.royalty_fees);
            }
          }
        }
      }
    } else if (res && res.data && res.data.errors && res.data.errors.length) {
      setBackendErr(res.data.errors[0]);
      setOpenSuccessModal(true);
    }
  }

  const getTokenTransaction = async () => {
    let tokenIdForTransaction = discardedTokenId ? discardedTokenId : tokenId;
    const idParts = tokenIdForTransaction.split(".");
    let merchantTokenId = TokenID.create({ shardNum: parseInt(idParts[0], 10), realmNum: parseInt(idParts[1], 10), tokenNum: parseInt(idParts[2], 10) });

    // let droppAccId = await utils.getDroppAccountId();
    // const droppAccIdParts = droppAccId.split(".");
    // let accountIDDropp = AccountID.create({accountNum: parseInt(droppAccIdParts[2], 10)});

    let accountIDSender = AccountID.create({
      accountNum: userDetails.hhAccount.accountNumber,
    });
    let accountIDNode = AccountID.create({ accountNum: droppNodeId });
    let transactionBody;
    if (discardedTokenId) {
      transactionBody = TokenDissociateTransactionBody.create({ account: accountIDSender });
    } else {
      transactionBody = TokenAssociateTransactionBody.create({ account: accountIDSender });
    }
    transactionBody.tokens.push(merchantTokenId);
    let timeStampNano = p2phelper.createTimestampNano();
    let timestamp = Timestamp.create({ seconds: Math.floor(timeStampNano), nanos: 0 });

    let transactionID = TransactionID.create({ transactionValidStart: timestamp, accountID: accountIDSender });
    let duration = Duration.create({ seconds: 180 })
    let obj = {
      transactionID: transactionID,
      nodeAccountID: accountIDNode,
      transactionFee: MAX_HEDERA_TXN_FEE,
      transactionValidDuration: duration,
      generateRecord: true,
    };
    if (discardedTokenId) {
      obj = {
        ...obj,
        // memo: `Dropp: Token dissociate ${Math.floor(Math.random() * Math.pow(10, 6))}`,
        tokenDissociate: transactionBody
      };
    } else {
      obj = {
        ...obj,
        // memo: `Dropp: Token associate ${Math.floor(Math.random() * Math.pow(10, 6))}`,
        tokenAssociate: transactionBody
      };
    }
    let mainTransactionBody = TransactionBody.create(obj);

    var transactionBodyBytes = TransactionBody.encode(mainTransactionBody).finish();

    return await utils.getEncodedTransactionBytes(transactionBodyBytes, signatures, userDetails);

    // let encoding = "binary";
    // let priv = signatures.privateKey;
    // let privateKey = forge.util.hexToBytes(priv);
    // let signature = ed25519.sign({
    //   message: Buffer.from(transactionBodyBytes),
    //   encoding,
    //   privateKey,
    // });

    // var signaturePair = SignaturePair.create({ ed25519: signature });
    // signaturePair.pubKeyPrefix = Buffer.from(p2phelper.hexToBytes(signatures.publicKey));
    // var signatureMap = SignatureMap.create();
    // signatureMap.sigPair.push(signaturePair);

    // var transaction = Transaction.create({
    //   bodyBytes: transactionBodyBytes,
    //   sigMap: signatureMap
    // });

    // var transactionBytes = Transaction.encode(transaction).finish();
    // let encodedTransactionBytes = btoa(String.fromCharCode(...new Uint8Array(transactionBytes)));
    // return encodedTransactionBytes;
  };


  const associateNFT = async () => {
    // setOpenConfirmModal(false);
    if (hbarBalance < parseFloat(MAX_ASSOCIATE_TOKEN_FEE)) {
      setBackendErr("You don't have sufficient fund to associate token.");
      setOpenSuccessModal(true);
    } else {
      setLoading(true);
      let hederaTransaction = await getTokenTransaction();
      const result = await api.associateToken({ hederaTransaction: hederaTransaction });
      if (result && result.responseCode == 0 && result.data) {
        api.resetUserDetails();
        setOpenSuccessModal(true);
        setLoading(false);
      } else {
        const errorMsg = (result && result.errors && result.errors.length > 0) ? result.errors[0] : "Token Association unsuccessful!";
        setOpenSuccessModal(true);
        setBackendErr(errorMsg);
        setLoading(false);
      }
    }

  }

  const handleSuccessModalClose = async () => {
    setShowTokenInfo(false);
    setAssociationErr("");
    await getPayerNFTTokens();
    setOpenSuccessModal(false);
    setTokenId(null);
  };

  const validateAndConfirm = () => {
    if (validate()) {
      getNftInfo(tokenId);
    }
  };

  const handleTransferError = () => {
    setOpenSuccessModal(false);
    setBackendErr("");
  };

  const handleTokenId = (e) => {
    setShowTokenInfo(false);
    setAssociationErr(null);
    setTokenId(e.target.value);
    setTokenIdErr(null);
    setSuccessMsg(null);
    setBackendErr(null);
  };

  const showConfirmation = (token) => {
    setDiscardedTokenId(token);
    setOpenConfirmModal(true);
  };

  const dissociateToken = async () => {
    setLoading(true);
    let hederaTransaction = await getTokenTransaction(discardedTokenId);
    let res = await api.disAssociateToken({ hederaTransaction: hederaTransaction });
    setOpenConfirmModal(false);
    if (res && res.responseCode == 0 && res.data == true) {
      api.resetUserDetails();
      setSuccessMsg(`Token ${discardedTokenId} dissociated successfully!`);
      setOpenSuccessModal(true);
    } else {
      const errorMsg = (res && res.errors && res.errors.length > 0) ? res.errors[0] : `Token ${discardedTokenId} Dissociation unsuccessful!`;
      setBackendErr(errorMsg);
      setOpenSuccessModal(true);
      setLoading(false);
    }
    setDiscardedTokenId(null);
    setLoading(false);
  };

  const cancel = () => {
    setTokenId(null);
    setShowTokenInfo(false);
  }

  return (
    <div style={{
      marginTop: "33px",
      // zIndex: "100"
    }}>
      {/* <div
        style={{
          textAlign: "left",
          width: "70%",
          marginTop: "6px",
          marginLeft: "20px",
        }}
        className="header">
        <div style={{ paddingTop: "9px", marginRight: "87px" }}>
          <label style={{ fontWeight: "450", color: "#18C2EE", fontSize: "1.8em" }}>
            TOKEN ASSOCIATIONS
          </label>
          <br />
          <label style={{ fontSize: "0.6m" }}>
            TOKENS ASSOCIATED WITH YOUR ACCOUNT
          </label>
        </div>
      </div> */}
      <div style={{ padding: "0px 20px"}}>
        <div className={classNames([classes.detailContainer])}>
          <Box py={2}>
            <Typography>{pageTexts.tokenAssociationMsg}</Typography>
          </Box>
          <TextField
            className={`${commonStyles.inputFieldWithGreyBg} ${classes.roundedInputField}`}
            size="small"
            // className={classes.margin}
            label={pageTexts.tokenIdFieldLabel}
            value={tokenId ? tokenId : ""}
            onChange={handleTokenId}
            variant="outlined"
          />
          {tokenIdErr && (<div className={classNames(["errMsg" ,"error extension"])} style={{ marginBottom: "10px", marginLeft: "5px" }}>
            <strong>{tokenIdErr}</strong>
          </div>)}

          {
            showTokenInfo
            ?
            <div>
              <div style={{marginTop: "10px"}}>
                <Typography className={classes.greyText}>{pageTexts.tokenInfoText}</Typography>
                <Typography className="NFTKeys">
                  {pageTexts.nameKeyText}
                </Typography>
                {nftName ?
                  <div>
                    <Typography>{nftName} {symbol ? `(${symbol})` : ""} </Typography>
                  </div>
                : ""}
              </div>
              <div style={{padding:"5px 0px"}}>
              <Typography className='NFTKeys'>{pageTexts.fixedFeesText}</Typography>
              {
                fixedFeesArr && fixedFeesArr.length
                ?
                Object.keys(royaltyFeesArr).map((index) => {
                  return (
                <div>
                  <Table className={classes.table}>
                    <TableBody>
                      <TableRow>
                        <TableCell className={classes.cell}>
                        <Typography>
                                {utils.displayAmount(fixedFeesArr[index].denominating_token_id ? fixedFeesArr[index].amount : (fixedFeesArr[index].amount / utils.getCurrencyDecimal("HBAR")))} {fixedFeesArr[index].denominating_token_id ? "" : "HBAR"}
                                {fixedFeesArr[index].denominating_token_id ? `${(fixedFeesArr[index].amount == 1 ? "Token" : "Tokens")} (${fixedFeesArr[index].denominating_token_id})` : ""}
                        </Typography>
                        </TableCell>
                        <TableCell className={classes.cell}>
                            <Typography>
                                Paid to {fixedFeesArr[index].collector_account_id}
                            </Typography>
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </div>)
                })
                :
                <Typography className={classes.greyText}>{pageTexts.noneText}</Typography>
              }
              </div>
              <div style={{padding:"5px 0px"}}>
              <Typography className='NFTKeys'>{pageTexts.royaltyFeesText}</Typography>
              {
                royaltyFeesArr && royaltyFeesArr.length
                ? Object.keys(royaltyFeesArr).map((index) => {
                  return (
                        <div>
                          <Table className={classes.table}>
                            <TableBody>
                              <TableRow>
                                <TableCell className={classes.cell}>
                                  <Typography>
                                    Royalty: {utils.displayAmount((royaltyFeesArr[index].amount.numerator/royaltyFeesArr[index].amount.denominator)*100)}%
                                  </Typography>
                                  {royaltyFeesArr[index].fallback_fee ?
                                    <Typography>
                                      Fallback: {utils.displayAmount(royaltyFeesArr[index].fallback_fee.denominating_token_id ? royaltyFeesArr[index].fallback_fee.amount : (royaltyFeesArr[index].fallback_fee.amount / utils.getCurrencyDecimal("HBAR")))}
                                      {royaltyFeesArr[index].fallback_fee.denominating_token_id ?
                                          ""
                                      :
                                          <span>{"HBAR"}</span>
                                      }
                                      {royaltyFeesArr[index].denominating_token_id ? `${(royaltyFeesArr[index].amount == 1 ? "Token" : "Tokens")} (${royaltyFeesArr[index].denominating_token_id})` : ""}
                                    </Typography>
                                : ""}
                                </TableCell>

                                {/* {royaltyFeesArr[index].fallback_fee && royaltyFeesArr[index].fallback_fee.denominating_token_id ?
                                  <TableCell>
                                    <Typography>Fallback: {utils.displayAmount(royaltyFeesArr[index].fallback_fee.amount/ utils.getCurrencyDecimal("HBAR"))}
                                      <img
                                          height="14"
                                          width="10"
                                          style={{marginLeft:"5px"}}
                                          src="./hbar_icon.png"
                                      />
                                    </Typography>
                                  </TableCell>
                                  :
                                  ""
                                } */}
                                <TableCell className={classes.cell}>
                                  <Typography>
                                    Paid to {royaltyFeesArr[index].collector_account_id}
                                  </Typography>
                                </TableCell>
                              </TableRow>
                            </TableBody>
                          </Table>
                        </div>
                  )
                })
                :
                <Typography className={classes.greyText}>{pageTexts.noneText}</Typography>
              }
              </div>
            </div>
            :
            ""
          }

          {showTokenInfo ?
            <Divider className={commonStyles.divider}/>
          : ""}
          {exchangeRate && droppFeeDetails ? <Box py={2}>
            <Typography variant='body2' >Associating a token will cost you ${utils.displayAmount(droppFeeDetails.tokenAssociateFeeUSD)} ({renderCurrency((droppFeeDetails.tokenAssociateFeeUSD / exchangeRate), "HBAR", "14px", 4, true)} approx.)</Typography>
          </Box> : ""}
          <div style={{display:"flex", justifyContent: associationErr || showTokenInfo ? "space-between" : "flex-start"}}>
            {showTokenInfo ?
              <Grid container spacing={1} alignItems="center">
                <Grid item xs={8}>
                  <button
                    className={classNames([commonStyles.primaryBtn, commonStyles.circularBtn])}
                    onClick={associateNFT}
                  >
                    {pageTexts.associateTokenBtnText}
                  </button>
                </Grid>
                <Grid item xs={4}>
                  <button
                    className={classNames([commonStyles.secondaryBtn, commonStyles.circularBtn])}
                    onClick={cancel}
                    >
                    {pageTexts.cancelBtnTxt}
                  </button>
                </Grid>
              </Grid>
            :
              <Grid container spacing={1}>
                <Grid item xs={6}>
                  <button
                    style={{ marginTop: "10px" }}
                    className={classNames([commonStyles.primaryBtn, commonStyles.circularBtn])}
                    onClick={validateAndConfirm}
                  >
                    {pageTexts.validateTokenBtnText}
                  </button>
                </Grid>
                {associationErr && tokenId ?
                  <Typography variant='body2' className='errMsg' style={{display:"flex", alignItems:"center", textAlign:"center", paddingTop:"5px"}}>
                    {associationErr}
                  </Typography>
                : ""}
              </Grid>
          }
          </div>
        </div>
        <div style={{ marginTop: "20px" }}>
          <Box my={1}>
            <Typography className={commonStyles.darkBoldText} style={{fontSize:"14px"}}>NFT TOKENS ASSOCIATED TO YOUR ACCOUNT</Typography>
          </Box>
          <div className={classes.tokenListContainer}>
            {(associatedToken && typeof associatedToken != "string" && associatedToken.length) ?
              associatedToken.map((token)=> {
                return (
                      <div className={classes.greyBackground} style={{ display: "flex", alignItems: "center", justifyContent:"space-between" }}>
                        <div>
                          <Typography className={commonStyles.darkBoldText}>{token.tokenId ? token.tokenId : ""} </Typography><Typography className={commonStyles.darkBoldText}>{token.tokenName ? token.tokenName : ""}</Typography>
                        </div>
                        <div style={{ display: "flex", justifyContent:"end", width:"40%" }}>
                          <div style={{cursor:"pointer"}}
                          onClick={async (e) => {e.preventDefault(); goToUrl(token.url ? token.url : "")}}
                          >
                            <img
                              src='./exchange.png'
                              alt='launch'
                              className={classes.launchIconInBox}
                            />
                            {/* <LaunchOutlinedIcon className={classes.launchIconInBox} /> */}
                          </div>
                          {
                            token.balance ?
                              <div style={{cursor:"not-allowed", opacity: 0.4}} title='You can remove only if the balance is 0'>
                                <RemoveCircleOutlineIcon  className={classNames([classes.launchIconInBox]) }/>
                              </div>
                            :
                              <div style={{cursor:"pointer"}} title='remove'>
                                <RemoveCircleOutlineIcon className={classNames([classes.launchIconInBox]) } onClick={() => showConfirmation(token.tokenId)}/>
                              </div>
                          }
                        </div>
                      </div>
                )
              })
            : (associatedToken == null) ?
                <div style={{ display: "flex", alignItems: "center", textAlign: "center", minHeight: "130px" }}>
                  <div className="loader" style={{margin:"45px auto auto"}}>
                    <CircularProgress color="inherit" />
                  </div>
                </div>
              :
                <>
                  {(typeof associatedToken != "string") ? <div style={{ display: "flex", alignItems: "center", textAlign: "center", minHeight: "130px" }}>
                    <Typography>{pageTexts.noAssociatedToken}</Typography>
                  </div> : ""}
                </>
            }
          </div>
        </div>
      </div>
        {/* <div className='footer' style={{height:"100px", width:"90%"}}>
          {associatedToken && typeof associatedToken != "string" && associatedToken.length ?
            <>
              <div style={{ clear: "both"}}>
                <hr className='dashedLine' />
              </div>
              <div>
                <Typography variant="caption text" style={{width:"90%"}}>Only tokens with zero balance can be removed.</Typography>
                <Typography variant="caption text" style={{ width: "90%"}}>
                  Tap this icon
                  <div style={{ display: "inline-block" }}>
                    <LaunchOutlinedIcon className={classes.launchIconInFooter} />
                  </div>
                  above to view details of the token in DragonGlass Hedera Explorer.
                </Typography>
              </div>
            </>
          : ""}
          <div style={{ position: "fixed", bottom: "12px", left: "20px" }}>
            <ArrowBackOutlinedIcon onClick={() => setCurrentScreen("nftcollections")} style={{ cursor: "pointer", color: "#18C2EE" }} />
          </div>
        </div> */}
      <Modal
        open={openSuccessModal}
        onClose={backendErr ? () => setOpenSuccessModal(false) : handleSuccessModalClose}
      >
        <Box className={classes.modalContainer}>
          {backendErr ?
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
              {successMsg ? successMsg : `Token ${tokenId} associated successfully`}
            </Typography>
          }
          <div className={classes.ctrlBtns}>
            {
              backendErr ?
                <button className="button-done" onClick={handleTransferError}>
                  {pageTexts.OKBtnTxt}
                </button>
                :
                <button className="button-done" onClick={handleSuccessModalClose}>
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
            Are you sure you want to dissociate {discardedTokenId} Token?
          </Typography>
          <div className={classes.ctrlBtns}>
            <button className="button-cancel" onClick={handleConfirmModalClose}>
              {pageTexts.dissociateModalCancel}
            </button>
            &nbsp;&nbsp;&nbsp;&nbsp;
            <button className="button-done" onClick={dissociateToken}>
              {pageTexts.dissociateModalConfirm}
            </button>
          </div>
        </Box>
      </Modal>
      <Modal
        open={loading}
      >
        <Box style={{ backgroundColor: "transparent", height: "100vh", width: "100%", display: "flex" }}>
          <div style={{ margin: "auto", textAlign: "center", color: "#18C2EE" }}>
            <CircularProgress color="inherit" />
          </div>
        </Box>
      </Modal>
    </div>
  )
}

export default NFTAssociate;