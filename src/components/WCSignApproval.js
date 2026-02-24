import React, { useState } from "react";
import { Box, Grid, InputAdornment, Modal, TextField, Typography } from "@material-ui/core";
import * as localstorage from "./../utils/local-storage";
import * as api from "./../api";
import { getQueryParams, hederaAccountToString, droppConfig, displayAmount, getCurrencyDecimal, getUSDCTokenId } from "../utils/utils";
import { proto } from "@hashgraph/proto";
import { format } from "crypto-js";
import { TokenId, ContractId } from "@hashgraph/sdk";
import { makeStyles } from "@material-ui/core";
import CloseIcon from '@material-ui/icons/Close';
import JSONView from 'react-json-view';
import Copy from "./pages/Copy";
import TestModeText from "./TestModeText";
// import Loader from "./Loader";
// import { CheckBox } from "@material-ui/icons";
// import { WalletConnector } from '@hashgraph/hedera-wallet-connect';
// import WalletConnectSigner from "./../helpers/walletSigner";

/* global chrome */

const useStyles = makeStyles(() => ({
  greyBackground: {
    backgroundColor: "#f9f9f9",
    borderRadius: "10px",
    height: "fit-content",
    marginTop: "10px",
    padding: "10px",
    textAlign: "left",
    width: "100%",
  },
  cancelIcon: {
    cursor: "pointer",
    opacity: "0.7",
    zIndex: 100,
  },
  modalAtCenter: {
    alignItems: "center",
    display: "flex",
    justifyContent: "center",
  },
  modalContainer: {
    backgroundColor: '#f9f9f9',
    border: 0,
    bottom: 0,
    height: "400px",
    overflowY: "scroll",
    padding: "0",
    position: 'absolute',
  },
  transparent: {
    opacity: 0
  },
  copyIcon: {
    cursor: "pointer",
    marginRight: "5px",
    zIndex: 100,
  },
  modalHeader: {
    backgroundColor: "#f9f9f9",
    display: "flex",
    justifyContent: "space-between",
    padding: "9px",
    position: "sticky",
    top: "0px",
    zIndex: 1,
  },
  labels: {
    fontSize:"14px",
    opacity: 0.6,
    padding: "7px 0px 2px 0px",
  }
}))

const WCSignApproval = ({ setCurrentScreen, responseCallback, merchantTxnBody = {} }) => {
  const [userDetails, setUserDetails] = React.useState({});
  const [signatures, setSignatures] = React.useState({});
  const [userSuspendedErr, setUserSuspendedErr] = React.useState(null);
  const queryParams = getQueryParams(window.location.href, true);
  const [merchantTx, setMerchantTx] = React.useState(queryParams);
  const [transaction, setTransaction] = React.useState(null);
  const [transactionName, setTransactionName] = React.useState("Sign Transaction");
  const [amountToPay, setAmountToPay] = React.useState(null);
  const [tokenToTransfer, setTokenToTransfer] = React.useState(null);
  const [tokenToPay, setTokenToPay] = React.useState(null);
  const [metaData, setMetaData] = React.useState(JSON.parse(queryParams.metaData));
  const [subHeading, setSubHeading] = React.useState("would like you to sign this transaction with your wallet.");
  const [maxTransactionFee, setMaxTransactionFee] = React.useState(null);
  const [tokensToAssociate, setTokensToAssociate] = React.useState(null);
  const [nftsToBuy, setNftsToBuy] = React.useState(null);
  const [openRawTransactionModal, setOpenRawTransactionModal] = React.useState(false);
  const [usdcTokenId, setUsdcTokenId] = React.useState(null);
  const [testModeActive, setTestModeActive] = React.useState(false);
  const { Transaction, NftTransfer } = proto;
  const classes = useStyles();

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
    async function fetchUserDetails() {
      let userDetailsLocal = await api.fetchUserDetails(true);
      if (userDetailsLocal && userDetailsLocal.data) {
        setUserDetails(userDetailsLocal.data);
        if (typeof window.Startup !== "undefined" && !window.droppUserId) {
          window.droppUserId = userDetailsLocal.data.userId;
          window.Startup.Store('userID', userDetailsLocal.data.userId);
        }
      } else if (userDetailsLocal.responseCode != 0) {
        setUserSuspendedErr((userDetailsLocal.errors && userDetailsLocal.errors.length) ? userDetailsLocal.errors[0] : "Something went wrong!!");
      }
    }

    async function getSignatures() {
      let signatures = await localstorage._get("_decrypted");
      setSignatures(signatures._decrypted);
    }

    async function fetchUSDCToken() {
      const token = await getUSDCTokenId();
      setUsdcTokenId(token);
    }
    Promise.all([fetchUserDetails(), getSignatures(), droppConfig(), fetchUSDCToken()]);
  }, []);

  React.useEffect(() => {
    if (merchantTx.transaction) {
      setTransaction(Transaction.create(JSON.parse(merchantTx.transaction)));
    }
  }, [merchantTx]);

  React.useEffect(() => {
    if (transaction) {
      let txt = '';
      if (transaction._maxTransactionFee && transaction._maxTransactionFee._valueInTinybar && parseInt(transaction._maxTransactionFee._valueInTinybar, 10) > 0) {
        setMaxTransactionFee(parseInt(transaction._maxTransactionFee._valueInTinybar, 10));
      }
      if (transaction._hbarTransfers && transaction._hbarTransfers.length > 0) {
        let amt = 0;
        for (let i = 0; i < transaction._hbarTransfers.length; i++) {
          // if (transaction._hbarTransfers[i].amount && transaction._hbarTransfers[i].amount._valueInTinybar && parseInt(transaction._hbarTransfers[i].amount._valueInTinybar, 10) > 0) {
          if (transaction._hbarTransfers[i].amount && parseInt(transaction._hbarTransfers[i].amount, 10) > 0) {
            // amt += parseInt(transaction._hbarTransfers[i].amount._valueInTinybar, 10);
            amt += parseInt(transaction._hbarTransfers[i].amount, 10);
          }
        }
        setSubHeading("would like you to sign this transaction with your wallet.");
        setAmountToPay(amt);
      }
      if (transaction._tokenTransfers && transaction._tokenTransfers.length > 0) {
        let amt = 0;
        for (let i = 0; i < transaction._tokenTransfers.length; i++) {
          if (transaction._tokenTransfers[i].amount && transaction._tokenTransfers[i].amount.low && transaction._tokenTransfers[i].amount.low < 0) {
            amt += parseInt(transaction._tokenTransfers[i].amount.low);
          }
        }
        setSubHeading("would like you to sign this transaction with your wallet.");
        setTokenToPay(Math.abs(amt));
      }
      if (transaction._tokenIds && transaction._tokenIds.length > 0) {
        let tokens = [];
        for (let i = 0; i < transaction._tokenIds.length; i++) {
          tokens.push(new TokenId(transaction._tokenIds[i]));
        }
        setTokensToAssociate(tokens);
        setSubHeading("would like you to add the following tokens to your account.");
      }
      if (transaction._nftTransfers && transaction._nftTransfers.length > 0) {
        let nfts = [];
        for (let i = 0; i < transaction._nftTransfers.length; i++) {
          nfts.push(new TokenId(transaction._nftTransfers[i].tokenId));
        }
        setNftsToBuy(nfts);
        setSubHeading("would like you to sign this transaction with your wallet.");
      }
    }
  }, [transaction]);

  const approve = async () => {
    chrome.runtime.sendMessage({
      type: "wcSignApproved",
      request: { approved: true, accountId: hederaAccountToString(userDetails.hhAccount), transaction: merchantTx.transaction }
    });
    window.close();
  };

  const reject = async () => {
    chrome.runtime.sendMessage({
      type: "wcSignReject",
      request: { approved: false, promiseResolve: merchantTx.resolve, promiseReject: merchantTx.reject, reason: { code: 402, message: "User rejected the request" } }
    });
    window.close();
  };

  const showEncryptAccount = () => {
    let accNo = userDetails.hhAccount.accountNumber.toString();
    let totalChars = accNo.length;
    accNo = accNo.slice(0, Math.floor(totalChars / 2));
    for (let i = 0; i < Math.floor(totalChars / 2); i++) {
      accNo += "X";
    }
    return [userDetails.hhAccount.realm, userDetails.hhAccount.shard, accNo].join(".");
  };

  const showHostName = (siteUrl) => {
    let url = {};
    try {
      url = new URL(siteUrl);
    } catch (err) {
      url = {};
    }
    return url.host ? url.host : "";
  };

  const transactionLength = () => {
    if (tokensToAssociate && tokensToAssociate.length) {
      return tokensToAssociate.length;
    } else if (nftsToBuy && nftsToBuy.length) {
      return nftsToBuy.length;
    } else if (tokenToPay && tokenToPay.length) {
      return tokenToPay.length;
    } else if (transaction._hbarTransfers && transaction._hbarTransfers.length) {
      return transaction._hbarTransfers.length > 1 ? transaction._hbarTransfers.length - 1 : transaction._hbarTransfers.length;
    } else if (transaction._tokenTransfers && transaction._tokenTransfers.length) {
      return transaction._tokenTransfers.length > 1 ? transaction._tokenTransfers.length - 1 : transaction._tokenTransfers.length;
    } else if (transaction._contractId) {
      return 1;
    }  else {
      return 0;
    }
  }

  const rawTransactionOpen = () => {
    if (transaction) {
      setOpenRawTransactionModal(true);
    }
  }

  const rawTransactionClose = () => {
    setOpenRawTransactionModal(false);
  }

  const siteUrl = showHostName(metaData && metaData.metadata && metaData.metadata.url ? metaData.metadata.url : "");
  const renderGetConfirmation = () => {
    return (
      <React.Fragment>
        <Grid container direction="column" >
          {transactionName ?
            <Grid container item justifyContent="left">
              <Grid item>
                <div style={{ fontSize: "1.25em", fontWeight: 600, padding: "10px 0", width: "100%" }}>
                  <div>
                    <span style={{ verticalAlign: "middle" }}>{transactionName}</span>
                  </div>
                </div>
              </Grid>
            </Grid>
            : ""}
          {siteUrl ?
            <Grid container item justifyContent="center">
              <Grid item>
                <div style={{ fontSize: "1.25em", fontWeight: 400, marginBottom: "25px", width: "100%" }}>
                  <div>
                    <span style={{ verticalAlign: "middle" }}>{siteUrl} {subHeading}</span>
                  </div>
                </div>
              </Grid>
            </Grid>
            : ""}
          {
            transactionLength() ? <>
              <Grid container item justifyContent="left">
                <Grid item>
                  <div style={{ fontSize: "1em", fontWeight: 600, width: "100%" }}>
                    <div>
                      <span style={{ verticalAlign: "middle" }}>{`Number of items in this transaction: ${transactionLength()}`}</span>
                    </div>
                  </div>
                </Grid>
              </Grid>
              <hr style={{ width: "100%", opacity: "0.6", marginBottom: "10px" }} />
            </>
              : ""
          }

          <Grid container item justifyContent="center" style={{ maxHeight: "230px", overflowY: "scroll"}}>
            {transaction && transaction._nftTransfers && transaction._nftTransfers.length > 0 ?
              transaction._nftTransfers.map((item, index) => {
                return (
                  <div className={classes.greyBackground}>
                    <Grid container>
                      <Grid item xs={6}>
                        <Typography className={classes.labels}>
                          NFT
                        </Typography>
                        {/* {nftsToBuy.map((token, index) => {
                                      return ( */}
                        <p style={{
                          lineHeight: "20px",
                          fontSize: "1.25em",
                          fontWeight: 600
                        }}>
                          {new TokenId(item.tokenId).toString()} {item.serialNumber ? `#${item.serialNumber.low}` : ""}
                        </p>
                        {/* )
                                    })} */}
                      </Grid>
                      {amountToPay != null || tokenToPay != null ?
                        <Grid item xs={6}>
                          <Typography className={classes.labels}>
                            Amount (you pay)
                          </Typography>
                          <p style={{
                            lineHeight: "20px",
                            // margin: "10px 20px",
                            fontSize: "1.25em",
                            fontWeight: 600
                          }}>
                            {amountToPay ? `${displayAmount(amountToPay / getCurrencyDecimal("HBAR"), 8)} HBAR`
                              :
                              `${displayAmount(tokenToPay)} ${new TokenId(transaction._tokenTransfers[0].tokenId).toString() == usdcTokenId ? 'USDC' : '(' + new TokenId(transaction._tokenTransfers[0].tokenId).toString() + ')'}`
                            }
                          </p>
                        </Grid>
                        : ""}
                    </Grid>
                    <Grid container>
                      <Grid item xs={6}>
                        <Typography className={classes.labels}>
                          From
                        </Typography>
                        {/* {senderAccountId.map((token, index) => {
                                        return ( */}
                        <p style={{
                          lineHeight: "20px",
                          fontSize: "1.25em",
                          fontWeight: 600
                        }}>
                          {new TokenId(item.senderAccountId).toString()}
                        </p>
                        {/* )
                                      })} */}
                      </Grid>
                      <Grid item xs={6}>
                        <Typography className={classes.labels}>
                          To
                        </Typography>
                        {/* {recieverAccountId.map((token, index) => {
                                        return ( */}
                        <p style={{
                          lineHeight: "20px",
                          fontSize: "1.25em",
                          fontWeight: 600
                        }}>
                          {new TokenId(item.receiverAccountId).toString()}
                        </p>
                        {/* )
                                      })} */}
                      </Grid>
                    </Grid>
                  </div>
                )
              }) : ""
            }
            {
              transaction._tokenTransfers && transaction._tokenTransfers.length > 0 && !(transaction._nftTransfers && transaction._nftTransfers.length > 0) ?
                transaction._tokenTransfers.map((item, index) => {
                  return (
                    <>{
                      item.amount.low < 0 ?
                        <div className={classes.greyBackground}>
                          <Grid container>
                            <Grid item xs={6}>
                              <Typography className={classes.labels}>
                                Token
                              </Typography>
                              <p style={{
                                lineHeight: "20px",
                                fontSize: "1.25em",
                                fontWeight: 600
                              }}>
                                {new TokenId(item.tokenId).toString()}
                              </p>
                            </Grid>
                            {amountToPay != null || tokenToPay != null ?
                              <Grid item xs={6}>
                                <Typography className={classes.labels}>
                                  Amount (you pay)
                                </Typography>
                                <p style={{
                                  lineHeight: "20px",
                                  fontSize: "1.25em",
                                  fontWeight: 600
                                }}>
                                  {displayAmount(tokenToPay)} {new TokenId(item.tokenId).toString() == usdcTokenId ? 'USDC' : '(' + new TokenId(item.tokenId).toString() + ')'}
                                </p>
                              </Grid>
                              : ""}
                          </Grid>
                          <Grid container>
                            <Grid item xs={6}>
                              <Typography className={classes.labels}>
                                From
                              </Typography>
                              <p style={{
                                lineHeight: "20px",
                                fontSize: "1.25em",
                                fontWeight: 600
                              }}>
                                {new TokenId(transaction._tokenTransfers[0].accountId).toString()}
                              </p>
                              {/* )
                                            })} */}
                            </Grid>
                            <Grid item xs={6}>
                              <Typography className={classes.labels}>
                                To
                              </Typography>
                              {/* {recieverAccountId.map((token, index) => {
                                              return ( */}
                              <p style={{
                                lineHeight: "20px",
                                fontSize: "1.25em",
                                fontWeight: 600
                              }}>
                                {new TokenId(transaction._tokenTransfers[1].accountId).toString()}
                              </p>
                              {/* )
                                            })} */}
                            </Grid>
                          </Grid>
                        </div>
                        : ""
                    }
                    </>
                  )
                })
                : ""
            }
            {!nftsToBuy && transaction && transaction._hbarTransfers && transaction._hbarTransfers.length > 0 ?
              <>
                {transaction._hbarTransfers.map((transfer, index) => {
                  return (
                    <>
                      {transfer.amount < 0 ? ""
                        :
                        <div className={classes.greyBackground}>
                          <Grid container >
                            <Grid item xs={6}>
                              <Typography className={classes.labels}>
                                To
                              </Typography>
                              <p style={{
                                lineHeight: "20px",
                                fontSize: "1.25em",
                                fontWeight: 600
                              }}>
                                {transfer.accountId}
                                {/* {new TokenId(transfer.accountId).toString()} */}
                              </p>
                            </Grid>
                            <Grid item xs={6}>
                              <Typography className={classes.labels}>
                                Amount (you pay)
                              </Typography>
                              <p style={{
                                lineHeight: "20px",
                                fontSize: "1.25em",
                                fontWeight: 600
                              }}>
                                {displayAmount(parseInt(transfer.amount, 10) / getCurrencyDecimal("HBAR"))} HBAR
                              </p>
                            </Grid>
                          </Grid>
                        </div>
                      }
                    </>
                  )
                })}

                {transaction._hbarTransfers.map((transfer, index) => {
                  return (
                    <>
                      {transfer.amount > 0 ? ""
                        :
                        <div style={{ padding: "10px", width: "100%" }}>
                          <Grid container >
                            <Grid item xs={6}>
                              <p style={{
                                lineHeight: "20px",
                                fontSize: "14px",
                                fontWeight: 400
                              }}>
                                Total Amount
                              </p>
                            </Grid>
                            <Grid item xs={6}>
                              <p style={{
                                lineHeight: "20px",
                                fontSize: "14px",
                                fontWeight: 400
                              }}>
                                {displayAmount(Math.abs(parseInt(transfer.amount, 10)) / getCurrencyDecimal("HBAR"))} HBAR
                              </p>
                            </Grid>
                          </Grid>
                        </div>
                      }
                    </>
                  )
                })}
              </>
              : ""}
            {(tokensToAssociate && tokensToAssociate.length > 0) ?
              tokensToAssociate.map((token, index) => {
                return (
                  <div className={classes.greyBackground}>
                    <Grid item xs={12}>
                      <Typography>
                        Token {tokensToAssociate.length == 1 ? "" : "s"}
                      </Typography>
                      <p style={{
                        lineHeight: "20px",
                        fontSize: "1.25em",
                        fontWeight: 600
                      }}>
                        {token.toString()}
                      </p>
                    </Grid>
                  </div>
                )
              })
              : ""}

              {(transaction._contractId) ?
                <div className={classes.greyBackground}>
                  <Grid container >
                    <Grid item xs={6}>
                      <Typography className={classes.labels}>
                        Contract ID
                      </Typography>
                      <p style={{
                        lineHeight: "20px",
                        fontSize: "1.25em",
                        fontWeight: 600
                      }}>
                        {new ContractId(transaction._contractId).toString()}
                      </p>
                    </Grid>
                    {(transaction._amount && transaction._amount._valueInTinybar > 0) ?
                      <Grid item xs={6}>
                        <Typography className={classes.labels}>
                          Amount (you pay)
                        </Typography>
                        <p style={{
                          lineHeight: "20px",
                          fontSize: "1.25em",
                          fontWeight: 600
                        }}>
                          {displayAmount(parseInt(transaction._amount._valueInTinybar, 10) / getCurrencyDecimal("HBAR"))} HBAR
                        </p>
                      </Grid>
                    : ""}
                  </Grid>
                  {(transaction._gas && transaction._gas.low > 0) ?
                    <Grid container>
                      <Grid item xs={6}>
                        <Typography className={classes.labels}>
                          Gas Limit
                        </Typography>
                        <p style={{
                          lineHeight: "20px",
                          fontSize: "1.25em",
                          fontWeight: 600
                        }}>
                          {parseInt(transaction._gas.low, 10)}
                        </p>
                      </Grid>
                    </Grid>
                  : ""}
                </div>
              : ""}
          </Grid>
          <div
              className={testModeActive ?"footer" : ""}  style={testModeActive ? {height :"100px" , paddingLeft:"0px"} :{
                backgroundColor: "#ffffff",
                bottom: "14px",
                position: "fixed",
                right: "20px",
                zIndex: 1,
              }}>
              {maxTransactionFee ?
                <Grid container item justifyContent="space-between" style={{ borderBottom: "1px solid lightgray", marginBottom: "5px" }}>
                  <Grid item xs={4}>
                    <p style={{
                      lineHeight: "20px",
                      fontSize: "1em",
                      fontWeight: 600
                    }}>
                      Max Fee: {displayAmount(maxTransactionFee / getCurrencyDecimal("HBAR"))} HBAR
                    </p>
                  </Grid>
                  <Grid item xs={8} onClick={rawTransactionOpen}>
                    <p style={{
                      color: "#28C3EF",
                      cursor: "pointer",
                      fontSize: "1em",
                      fontWeight: 400,
                      lineHeight: "20px",
                      textAlign: testModeActive ? "center":"right"
                    }}>
                      View raw transaction details
                    </p>
                  </Grid>
                </Grid>
                : ""}
              <Grid container item direction="row" >
                <Grid item>
                  <button style={{ marginRight: "10px", width: "145px" }} className="button-cancel" onClick={reject}>
                    Reject
                  </button>
                </Grid>
                <Grid item>
                  <button
                    style={{
                      marginRight: "5px",
                      marginBottom: "5px",
                      width: "145px"
                    }}
                    className="button-done"
                    onClick={approve}
                  >
                    Approve
                  </button>
                </Grid>
              </Grid>
            </div>
        </Grid>
        {
          transaction ? renderRawTransactionModal(transaction) : ""
        }
      </React.Fragment>
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

  const renderRawTransactionModal = (data) => {
    return (
      <Modal
        open={openRawTransactionModal}
        onClose={rawTransactionClose}
        className={classes.modalAtCenter}
        BackdropProps={{
          classes: classes.transparent
          // classes: {
          //   root: classes.transparent,
          // },
        }}
      >
        <Box className={classes.modalContainer}>
          <div className={classes.modalHeader}>
            <Typography>Raw Transaction Details</Typography>
            <div style={{ display: "flex" }}>
              <div className={classes.copyIcon}><Copy iconSize={"25px"} iconColor="disabled" messagePosition="top" toolTipTitle={`Copy your raw transaction details`} copyMessage={`Transaction copied`} text={JSON.stringify(transaction)} /></div>
              <CloseIcon className={classes.cancelIcon} onClick={rawTransactionClose} />
            </div>
          </div>
          <div style={{ paddingTop: "5px" }}>
            <JSONView src={data} enableClipboard={false} />
          </div>
        </Box>
      </Modal>
    )
  }

  return (
    <>
      {userSuspendedErr ?
        <Grid container justifyContent={"center"} alignItems={"center"}>
          <Grid item style={{ marginTop: "50%", padding: "1em" }}>
            {userSuspendedErr}
          </Grid>
        </Grid>
        :
        <>
          {userDetails && userDetails.hhAccount ?
            <Grid
              container
              item
              direction="column"
              style={{
                textAlign: "left",
                justifyContent: "end",
                padding: "0 20px"
              }}>
              {chrome.extension.getViews({ type: "popup" }).length === 0 && (
                <Grid item style={{ textAlign: "center" }}>
                  <img
                    style={{ cursor: "pointer", padding: "1em" }}
                    height="50"
                    width="120"
                    src="./dropp_logo.png"
                  />
                </Grid>
              )}

              <Grid container direction="column" >
                <Grid item>
                  <div>
                    <div style={{ backgroundColor: "#DEF8FF", fontWeight: 600, marginBottom: "25px", padding: "15px 40px", textAlign: "center" }}>
                      <span>
                        Dropp Account ID ({hederaAccountToString(userDetails.hhAccount)})
                      </span>
                    </div>
                  </div>
                </Grid>
              </Grid>

              {renderGetConfirmation()}
              <TestModeText testModeActive={testModeActive}/>
            </Grid>
            : ""}
        </>
      }
    </>
  );
};

export default WCSignApproval;
