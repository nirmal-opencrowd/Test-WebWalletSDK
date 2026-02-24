import React, {useState} from "react";
import ArrowBackOutlinedIcon from '@material-ui/icons/ArrowBackOutlined';
import { makeStyles } from '@material-ui/core/styles';
import Grid from "@material-ui/core/Grid";
import TextField from "@material-ui/core/TextField";
import Typography from "@material-ui/core/Typography";
import * as api from "./../../api";
import { getActiveWallet, displayAmount, getCurrencyDecimal } from "./../../utils/utils";
import getSymbolFromCurrency from 'currency-symbol-map';
import Box from '@material-ui/core/Box';
import Modal from '@material-ui/core/Modal';
import styles from "./../../styles/common.module.scss";
import UITexts from "./../../../configurations/dropp.json";
import { Accordion, AccordionDetails, AccordionSummary, Divider } from "@material-ui/core";

const useStyles = makeStyles((theme) => ({
  root: {
    display: 'flex',
    flexWrap: 'wrap',
  },
  input: {
    fontSize : 10,
  },
  rdmContainer: {
    paddingLeft:"20px",
    paddingRight:"20px",
    marginTop:"30px",
    // maxHeight:"450px",
    overflowY:"scroll"
  },
  feeMsgStyle: {
    fontSize: "1em",
    fontWeight: "600",
    padding: "5px"
  },
  chargeTitle: {
    fontSize: "1.25em",
    fontWeight: "700",
    margin: "10px",
    textAlign: "center",
  },
  successBox: {
    marginTop: "30%",
    textAlign: "center"
  },
  successTitle: {
    color: "#18C2EE"
  },
  successFields: {
    fontSize: "1.25em",
    lineHeight: "1.5em",
    marginTop: "15px"
  },
  modalContainer: {
    backgroundColor: '#FFFFFF',
    border: 0,
    padding: "15px",
    position: 'absolute',
    left: '10%',
    top: '10%',
    width: 250,

  },
  ctrlBtns: {
    marginTop: "5px",
    textAlign: "right",
  },
  roundedInputField: {
    "& .MuiOutlinedInput-root": {
      borderRadius: "20px"
    }
  },
  feeAccordionContainer: {
    position: "absolute",
    bottom: "49px",
    width: "87%",
  },
  feeAccordion: {
    backgroundColor: "#f9f9f9",
    border: "1px solid #a9a9a9",
    boxShadow: "none",
    width: "100%",
  },
  mainContainer: {
    marginBottom: "200px"
  },
  feeAccordionDetails: {
    padding: "0 16px 16px",
    marginTop: "-14px",
  },
  label: {
    paddingLeft: "10px",
    paddingBottom: "5px"
  },
}));

const RedeemNow =( {setCurrentScreen, userDetails, setFooterObj}) => {
  const [redeemAmt, setRedeemAmt] = useState("");
  const [backendMsg, setBackendMsg] = useState({})
  const [activeWallet, setActiveWallet] = useState({});
  const [isACHRequired, setIsACHRequired] = useState(null);
  const [refundDroppCredit, setRefundDroppCredit] = useState(null);
  const [successfulTxn, setSuccessfulTxn] = useState(null);
  const [openSuccessModal, setOpenSuccessModal] = React.useState(false);
  const [redeemAmountAllowed, setRedeemAmountAllowed] = useState(0)
  const [msgType, setMsgType] = React.useState("");
  const [successNote, setSuccessNote] = React.useState("");
  const [isPrimaryBtnLoading, setIsPrimaryBtnLoading] = React.useState(false);
  const classes = useStyles();

  const balanceUSD = userDetails && userDetails.balance ? displayAmount(userDetails.balance) : 0;
  const pageTexts = UITexts.redeemnow;

  // React.useEffect(() => {
  //   let primaryBtnText;
  //   let primaryFuncToCall;
  //   if(successfulTxn) {
  //     primaryBtnText = pageTexts.successBtnTxt;
  //     primaryFuncToCall = ()=> setCurrentScreen("dashboard");
  //   } else {
  //     primaryBtnText = pageTexts.primaryBtnText;
  //     primaryFuncToCall = redeemNow;
  //   }
  //   setFooterObj({primaryBtnText: primaryBtnText, primaryFuncToCall: primaryFuncToCall});
  //   return () => {
  //     setFooterObj({});
  //   }
  // },[successfulTxn, redeemAmt, activeWallet, refundDroppCredit])

  React.useEffect(() => {
    let primaryBtnText;
    let primaryFuncToCall;
    if (successfulTxn) {
      primaryBtnText = pageTexts.successBtnTxt;
      primaryFuncToCall = () => setCurrentScreen("dashboard");
    } else {
      primaryBtnText = isPrimaryBtnLoading ? "Processing..." : pageTexts.primaryBtnText;
      primaryFuncToCall = redeemNow;
    }
    setFooterObj({
      primaryBtnText,
      primaryFuncToCall,
      isPrimaryBtnLoading, 
    });

    return () => {
      setFooterObj({});
    };
  }, [successfulTxn, redeemAmt, activeWallet, refundDroppCredit, isPrimaryBtnLoading]);

  React.useEffect(() => {
    async function getUserWallets() {
      let userWalletList = await api.fetchUserWalletList();
      const wallet = getActiveWallet(userWalletList.data);
      if (wallet) {
        setActiveWallet(wallet);
      }
    }

    async function checkIfACHRequiredForRedemption() {
      let result = await api.checkIfACHRequiredForRedemption();
      if (result && result.responseCode == 0 && result.data) {
        setRedeemAmountAllowed(result.data.redeemAmountAllowed);
        setIsACHRequired(result.data.refundToACH);
        setRefundDroppCredit(result.data.refundDroppCredit);
      }
    }
    Promise.all([getUserWallets(), checkIfACHRequiredForRedemption()]);
  }, []);

  const handleSuccessModalClose = () => {
    setOpenSuccessModal(false);
  };

  const renderUserCurrency = (labelTxt, usdBal) => {
    if (userDetails.currency != "HBAR") {
      return (
        <Box my={2}>
          <Grid container>
            <Grid item xs={12} className={styles.textCenter}>
              <div>
                <img src="./usd_currency_icon.png" alt="dollar" width={35}/>
              </div>
              {usdBal && usdBal >= 0 && <Typography className={styles.darkBoldText}>
                {usdBal}
              </Typography>}
            </Grid>
          </Grid>
      </Box>
      );
    }
  };

  const renderDCT = () => {
    const droppCreditAmt = userDetails.droppCredit / getCurrencyDecimal("DCT");
    return (
      <Typography style={{fontSize: "12px"}}>You have {getSymbolFromCurrency("USD")}{displayAmount(droppCreditAmt)} available in your Dropp Credit</Typography>
    );
  };

  const validate = () => {
    if (redeemAmt) {
      let amt = parseFloat(redeemAmt);
      if (amt > 0) {
       let totalBalance = redeemAmountAllowed;
        // if (userDetails && userDetails.droppCredit && refundDroppCredit) {
        //   totalBalance += (userDetails.droppCredit / getCurrencyDecimal("DCT"));
        // }
        // if (totalBalance < 5) {
        //   setBackendMsg({msg: "You can redeem only if balance is more than or equal to $5", error: true});
        //   return false;
        // }
        if (amt <= totalBalance) {
          return true;
        } else {
          setBackendMsg({msg: "You don't have sufficient balance to redeem!", error: true});
        }
      } else {
        setBackendMsg({msg: "Amount must be > 0", error: true});
      }
    } else {
      setBackendMsg({msg: "Please enter valid amount!", error: true});
    }
    return false;
  }

  // const redeemNow = async () => {
  //   if (validate()) {
  //     let amt = parseFloat(redeemAmt);
  //     let result = await api.redeemNow({amount: amt});
  //     if (result && result.responseCode != 0) {
  //       let msg = (result.errors && result.errors.length > 0) ? result.errors[0] : "Something went wrong!";
  //       setBackendMsg({msg: msg, error: true});
  //     } else {
  //       if (result.messageType && result.errors && result.errors.length) {
  //         setMsgType(result.messageType);
  //         setSuccessNote(result.errors[0].replaceAll("\n", "<br />"));
  //         setOpenSuccessModal(true);
  //       }
  //       setSuccessfulTxn(result.data);
  //     }
  //   }
  // };

  const redeemNow = async () => {
    if (isPrimaryBtnLoading) return; 
    if (validate()) {
      try {
        setIsPrimaryBtnLoading(true); 
        let amt = parseFloat(redeemAmt);
        let result = await api.redeemNow({ amount: amt });
        if (result && result.responseCode !== 0) {
          let msg =
            result.errors && result.errors.length > 0
              ? result.errors[0]
              : "Something went wrong!";
          setBackendMsg({ msg: msg, error: true });
        } else {
          if (result.messageType && result.errors && result.errors.length) {
            setMsgType(result.messageType);
            setSuccessNote(result.errors[0].replaceAll("\n", "<br />"));
            setOpenSuccessModal(true);
          }
          setSuccessfulTxn(result.data);
        }
      } catch (error) {
        setBackendMsg({ msg: "Something went wrong!", error: true });
      } finally {
        setIsPrimaryBtnLoading(false);
      }
    }
  };


  return (
    <div style={{marginTop:"33px"}}>
      {/* <div
        style={{
          textAlign: "left",
          marginTop: "6px",
          marginLeft: "20px",
          marginBottom: "10px"
      }}>
        <div style={{ paddingTop: "9px"}}>
          <label style={{ fontWeight: "450", color: "#18C2EE", fontSize: "1.8em" }}>
              REDEEM
          </label>
          <br/>
          <label style={{fontSize: "1.3em" }}>
              NOW
          </label>
        </div>
      </div> */}
      <div className={classes.rdmContainer}>
        {successfulTxn ?
          <>
            <div className={classes.successBox}>
              <Grid container justifyContent="center">
                <Grid item xs>
                  <Typography variant="h5" className={classes.successTitle}>Transaction Successful!</Typography>
                </Grid>
              </Grid>
              <Grid container justifyContent="center" className={classes.successFields}>
                <Grid item xs>
                  <div><strong>Amount:</strong> ${displayAmount(successfulTxn.redeemAmount)}</div>
                  <div><strong>Fee:</strong> ${displayAmount(successfulTxn.fee)}</div>
                  <div><strong>Redeem Mode:</strong> {successfulTxn.redeemMode == "ACHBANKACCT" ? "Bank Account ACH" : ((successfulTxn.redeemMode == "CREDITCARD") ? "Credit Card" : successfulTxn.redeemMode)}</div>
                </Grid>
              </Grid>
            </div>
          </>
        :
        <>
          <div className={`${styles.lightGreyContainer} ${classes.mainContainer}`}>
            {(userDetails && userDetails.droppCredit && refundDroppCredit) ?
              <>
                <div style={{marginBottom: "10px"}}>{renderUserCurrency("BALANCE:", (parseFloat(redeemAmountAllowed) + parseFloat(userDetails.droppCredit / getCurrencyDecimal("DCT"))))}</div>
                <div style={{marginBottom: "10px"}}>
                  {renderDCT()}
                </div>
              </>
            :
              <div style={{marginBottom: "10px"}}>{renderUserCurrency("BALANCE:", redeemAmountAllowed)}</div>
            }
            <Divider className={styles.divider} />
            {(Object.keys(activeWallet).length > 0) && <>
              {((isACHRequired != null && isACHRequired == false) || (isACHRequired != null && isACHRequired && activeWallet && activeWallet.achAccountLastFourDigits)) ?
                <Box my={2}>
                  <Typography className={`${classes.label} ${styles.darkBoldText}`}>
                    {pageTexts.amountFieldLabel}
                  </Typography>
                  <TextField
                    size="small"
                    className={`${styles.inputFieldWithGreyBg} ${classes.roundedInputField}`}
                    label={pageTexts.amountPlaceHolder}
                    onChange={e=> setRedeemAmt(e.target.value)}
                    variant="outlined"
                    fullWidth
                  />
                  {/* <Typography className={classes.chargeTitle}>Redeem Charges</Typography>
                  <Typography className={classes.feeMsgStyle}>
                    Fee Charged when redeem your Wallet: $0.75
                  </Typography> */}

                  {backendMsg && backendMsg.msg && (
                      <div
                          className={`alert extension ${backendMsg.error ? 'error' : 'success'}`}
                          style={{ textAlign: "center", marginTop: "25px", marginLeft: "auto", marginRight: "auto" }}>
                          <strong>{backendMsg.msg}</strong>
                      </div>
                  )}
                </Box>
                : isACHRequired !=null &&
                  <div
                      className={`alert extension error`}
                      style={{ textAlign: "center", marginTop: "25px", marginLeft: "auto", marginRight: "auto" }}>
                      <strong>Please associate your bank account first!</strong>
                  </div>
              }
              </>
            }
          </div>
            <Box my={2} className={classes.feeAccordionContainer}>
              <Grid container>
                <Grid item xs={12}>
                  <div className={classes.root}>
                    <Accordion className={classes.feeAccordion} aria-setsize={"large"}>
                      <AccordionSummary
                        expandIcon={<img src="./arrowDown.png" alt="show" />}
                        aria-controls="panel1a-content"
                        id="panel1a-header"
                      >
                        <Typography className={`${styles.darkBoldText} ${styles.largeSizedText}`}>{pageTexts.cashOutFeeLabel}</Typography>
                      </AccordionSummary>
                      <AccordionDetails className={`${styles.mediumSizedText} ${classes.feeAccordionDetails}`}>
                          {pageTexts.cashOutFeeMsg}
                      </AccordionDetails>
                    </Accordion>
                  </div>
                </Grid>
              </Grid>
            </Box>
          </>
        }
      </div>

      <Modal
        open={openSuccessModal}
        onClose={handleSuccessModalClose}
        style={{overflow: "scroll"}}
      >
        <Box className={classes.modalContainer}>
          <>
            <Typography sx={{ mt: 2 }}>
              <strong>{msgType ? msgType : "Note"}</strong>
            </Typography>
            <Typography sx={{ mt: 2 }} dangerouslySetInnerHTML={{__html: successNote}}>
            </Typography>
          </>

          <div className={classes.ctrlBtns}>
            <button className="button-done" onClick={handleSuccessModalClose}>
                Ok
            </button>
          </div>
        </Box>
      </Modal>

      {/* {successfulTxn ?
        <div style={{position:"fixed",bottom:"14px",right:"20px"}}>
          <button
            style={{ marginLeft: "30px", marginTop: "30px" }}
            className="button-done"
            onClick={()=> setCurrentScreen("dashboard")}>
            Done
          </button>
        </div>
      :
        <><div className="footer">
            <div className="backArrow">
              <ArrowBackOutlinedIcon onClick={()=> setCurrentScreen("dashboard")} style={{cursor:"pointer",color:"#18C2EE"}}/>
            </div>
            <div className="footerRightButtonMedium">
              <button
                className="button-done"
                onClick={()=> redeemNow()}>
                Redeem
              </button>
            </div>
        </div>
        </>
      } */}


    </div>
  );
};

export default RedeemNow;
