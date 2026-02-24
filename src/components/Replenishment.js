import React, { useEffect } from "react";
import ReactTooltip from "react-tooltip";
import Dropdown from "react-dropdown";
import * as api from "./../api";
import "react-dropdown/style.css";
import forge from "node-forge";
import Loader from "react-loader-spinner";
import '../inputbutton.css';
import Radio from '@material-ui/core/Radio';
import RadioGroup from '@material-ui/core/RadioGroup';
import FormControlLabel from '@material-ui/core/FormControlLabel';
import {
  fade,
  ThemeProvider,
  withStyles,
  makeStyles,
  createTheme,
} from '@material-ui/core/styles';
import TextField from '@material-ui/core/TextField';
import ArrowBackOutlinedIcon from '@material-ui/icons/ArrowBackOutlined';
import { Accordion, AccordionDetails, AccordionSummary, Divider, FormControl, FormLabel, Grid, Tab, Tabs, Typography, CircularProgress } from "@material-ui/core";
import getSymbolFromCurrency from "currency-symbol-map";
import { getActiveWallet, displayAmount, getStripePK, addStripeLib } from "./../utils/utils";
import Box from '@material-ui/core/Box';
import Modal from '@material-ui/core/Modal';
import styles from "../styles/common.module.scss";
import UITexts from "./../../configurations/dropp.json";
import LoadingOverLay from "./LoadingOverLay";
import classNames from 'classnames';
// import { loadStripe } from "@stripe/stripe-js";

const feeMsgStyle = {
  fontSize: "1em",
  // fontWeight: "600",
  // padding: "5px"
};

const feeExStyle = {
  fontSize: "1em",
  // fontWeight: "400",
  // padding: "5px"
};

/* global chrome */

const Replenishment = ({ setCurrentScreen, setFooterObj }) => {
  const [replenished, setReplenished] = React.useState(false);
  const [amount, setAmount] = React.useState("");
  const [ccNumber, setCcNumber] = React.useState("");
  const [replenishmentMethod, setReplenishmentMethod] = React.useState("STRIPE");
  const [history, setHistory] = React.useState([]);
  const [userDetails, setUserDetails] = React.useState({});
  const [securityCode, setSecurityCode] = React.useState(null);
  const [errorMessage, setErrorMessage] = React.useState("");
  const [msgType, setMsgType] = React.useState("");
  const [successMessage, setSuccessMessage] = React.useState("");
  // const [options, setOptions] = React.useState(null);
  const [loading, setLoading] = React.useState(true);
  const [noOptions, setNoOptions] = React.useState(null);
  const [fundingOptions, setFundingOptions] = React.useState({});
  const [activeWallet, setActiveWallet] = React.useState({});
  const [feeDetails, setFeeDetails] = React.useState({});
  const [paymentOptions, setPaymentOptions] = React.useState(null);
  // const [selectedPaymentOption, setSelectedPaymentOption] = React.useState({});
  const [showFreeFundingMsg, setShowFreeFundingMsg] = React.useState(null);
  const [openConfirmModal, setOpenConfirmModal] = React.useState(false);
  const [removeObj, setRemoveObj] = React.useState(null);
  const [openSuccessModal, setOpenSuccessModal] = React.useState(false);
  const [bankTransferMethod, setBankTransferMethod] = React.useState("ACH");
  const [stripeLoaded, setStripeLoaded] = React.useState(false);

  const pageTexts = UITexts.fundnow;

  const payOptions = {
    PLAID: "PLAID",
    STRIPE: "STRIPE",
    UNIONPAY: "UNIONPAY"
  }

  async function getUserWalletList() {
    let walletList = await api.fetchUserWalletList();
    if (walletList && walletList.data.length) {
      setActiveWallet(getActiveWallet(walletList.data));
    }
  }

  async function fetchReplenishHistory() {
    let replenishHistoryDetails = await api.fetchReplenishHistory();
    replenishHistoryDetails.data.sort(
      (a, b) =>
        parseFloat(b.creationTimeInEpochSec) - parseFloat(a.creationTimeInEpochSec)
    );
    setHistory(replenishHistoryDetails.data.slice(0, 2));
  }

  async function fetchUserDetails() {
    let userDetailsLocal = await api.fetchUserDetails(true);
    setUserDetails(userDetailsLocal.data);
    getFundingOptions(userDetailsLocal.data.operatorId, userDetailsLocal.data.countryCode, userDetailsLocal.data.currency);
  }

  const fetchDetailsForScreen = () => {
    getUserWalletList();
    fetchReplenishHistory();
    fetchUserDetails();
  };

  React.useEffect(() => {
    fetchDetailsForScreen();
    if (replenishmentMethod == payOptions.STRIPE) {
      const stripeCB = () => {
        const intervalId = setInterval(() => {
          if (window.Stripe) {
            setStripeLoaded(true);
            if (intervalId) {
              clearInterval(intervalId);
            }
          }
        }, 100);
      }
      addStripeLib(stripeCB);
    }
    setLoading(false);
  }, [])

  React.useEffect(() => {
    const primaryBtnDisabled = () => {
      if(userDetails && Object.keys(userDetails).length > 0) {
        if (!stripeLoaded) {
          return true;
        }
        if ((replenishmentMethod == payOptions.STRIPE) && !userDetails.ccLastFourDigits) {
          return true;
        }
        if ((replenishmentMethod == payOptions.PLAID) && !userDetails.achAccountLastFourDigits) {
          return true;
        }
        return false;
      } else {
        return true;
      }
    }
    if(errorMessage) {
      setErrorMessage("");
    }
    setFooterObj({ primaryBtnText: pageTexts.primaryBtnText, primaryFuncToCall: fundAccount, disabledPrimaryBtn: primaryBtnDisabled()})
    return () => {
      setFooterObj({})
    }
  }, [amount, replenishmentMethod, stripeLoaded, userDetails]);

  async function getFundingOptions(operatorId, countryCode, currency) {
    const options = await api.getOperatorFundingOptions({ operatorId, countryCode, currency });
    if (options && options.data && options.data.operatorCountryCurrency) {
      setFundingOptions(options.data);
    }
  }

  React.useEffect(() => {
    if (fundingOptions && Object.keys(fundingOptions).length && fundingOptions.firstFundingFree && history && showFreeFundingMsg == null) {
      setShowFreeFundingMsg((history.length <= 0));
    }
  }, [fundingOptions, history]);

  React.useEffect(() => {
    if (userDetails && userDetails.userId && activeWallet && activeWallet.walletId && fundingOptions && Object.keys(fundingOptions).length) {
      let options = [];
      if (fundingOptions.ach) {
        for (let i = 0; i < fundingOptions.ach.length; i++) {
          if (fundingOptions.ach[i].enabler == payOptions.PLAID && activeWallet.achAccountLastFourDigits) {
            options.push({ enabler: fundingOptions.ach[i].enabler, feeAbsolute: fundingOptions.ach[i].feeAbsolute, feePercent: fundingOptions.ach[i].feePercent, feePercentText: fundingOptions.ach[i].feePercentText, feeAbsoluteText: fundingOptions.ach[i].feeAbsoluteText, feeExample: fundingOptions.ach[i].feeExample, message: fundingOptions.ach[i].message });
          }
        }
      }
      if (fundingOptions.creditCard) {
        for (let i = 0; i < fundingOptions.creditCard.length; i++) {
          if (fundingOptions.creditCard[i].enabler == payOptions.STRIPE && activeWallet.ccLastFourDigits) {
            options.push({ enabler: fundingOptions.creditCard[i].enabler, feeAbsolute: fundingOptions.creditCard[i].feeAbsolute, feePercent: fundingOptions.creditCard[i].feePercent, feePercentText: fundingOptions.creditCard[i].feePercentText, feeAbsoluteText: fundingOptions.creditCard[i].feeAbsoluteText, feeExample: fundingOptions.creditCard[i].feeExample, message: fundingOptions.creditCard[i].message });
          } else if (fundingOptions.creditCard[i].enabler != payOptions.STRIPE) {
            options.push({ enabler: fundingOptions.creditCard[i].enabler, feeAbsolute: fundingOptions.creditCard[i].feeAbsolute, feePercent: fundingOptions.creditCard[i].feePercent, feePercentText: fundingOptions.creditCard[i].feePercentText, feeAbsoluteText: fundingOptions.creditCard[i].feeAbsoluteText, feeExample: fundingOptions.creditCard[i].feeExample, message: fundingOptions.creditCard[i].message });
          }
        }
      }
      setPaymentOptions(options);
      if (options.length == 0) {
        setNoOptions(true);
      }
    }
  }, [userDetails, activeWallet, fundingOptions]);

  const useStyles = makeStyles((theme) => ({
    root: {
      display: 'flex',
      flexWrap: 'wrap',
    },
    selectEmpty: {
      marginTop: theme.spacing(2),
    },
    margin: {
      margin: theme.spacing(1),
    },
    input: {
      fontSize: 10,
    },
    label: {
      paddingLeft: "10px",
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
    replenishContainer: {
      flexDirection: "column",
      marginTop: "15px",
      overflowY: "scroll",
      padding: "1em",
      textAlign: "left"
    },
    customIndicator: {
      backgroundColor: theme.palette.primary.main,
    },
    customFlexContainer: {
      borderBottom: "2px solid #A6A6A6",
      "& .MuiTab-textColorInherit": {
        fontWeight: 600,
      }
    },
    formControl: {
      margin: theme.spacing(1),
    },
    roundedInputField: {
      "& .MuiOutlinedInput-root": {
        borderRadius: "20px"
      }
    },
    feeAccordion: {
      backgroundColor: "#f9f9f9",
      border: "1px solid #a9a9a9",
      boxShadow: "none",
      width: "100%",
    },
    feeAccordionDetails: {
      padding: "0 16px 16px",
      marginTop: "-14px",
    },
    fadedBackground: {
        backgroundColor: "#18C2EE4D", // 4D denotes 0.3 opacity in background-color
        border: "none",
        borderRadius: "5px",
        cursor: "pointer",
        padding: "10px",
        textAlign: "center",
        minWidth: "100%",
    },
    activeAmount : {
        backgroundColor: "#18C2EE",
    },
  }));

  const BlueRadio = withStyles({
    root: {

      '&$checked': {
        color: '#18C2EE',
      },
    },
    checked: {},
  })((props) => <Radio size="small" color="default" {...props} />);

  // function closeErrorAlert() {
  //     setTimeout(function () {
  //         setErrorMessage("");
  //     }, 3000);
  // }

  // function closeSucessAlert() {
  //   setTimeout(function () {
  //       setSuccessMessage("");
  //   }, 3000);
  // }

  const validate = () => {
    if (!replenishmentMethod) {
      setLoading(false);
      setErrorMessage("Select Replenishment Method");
      setOpenSuccessModal(true);
      return false;
    }
    if (replenishmentMethod == payOptions.UNIONPAY && !ccNumber) {
      setLoading(false);
      setErrorMessage("Please Provide Card Number");
      setOpenSuccessModal(true);
      return false;
    }
    if (amount < 5) {
      setLoading(false);
      setErrorMessage(amount ? `Replenish Amount cannot be less than 5.0 ${(replenishmentMethod == payOptions.UNIONPAY) ? 'AED' : 'USD'}` : "Invalid Amount");
      // setOpenSuccessModal(true);
      return false;
    }
    return true;
  };

  const openUnionPayWindow = (formUrl) => {
    chrome.tabs.create({
      url: formUrl,
    });
  };

  const fundAccount = (event) => {
    event.preventDefault();
    replenish();
  }

  const replenish = async () => {
    setLoading(true);
    if (validate()) {
      try {
        let result;
        if (replenishmentMethod == payOptions.PLAID) {
          result = await api.replenishUserACH({
            amount: parseFloat(amount),
            lastFourDigitsOfACHAct: userDetails.achAccountLastFourDigits
          });

        } else if (replenishmentMethod == payOptions.STRIPE) {
          result = await api.getClientSecret3DSecureForSavedCard(amount, userDetails.ccLastFourDigits, {});
        } else if (replenishmentMethod == payOptions.UNIONPAY) {
          const formUrl = await api.getUnionPayFormUrl({ ccNumber: ccNumber, amount: amount });
          result = { data: formUrl, responseCode: (formUrl ? 0 : -1) };
        }

        if (result && result.responseCode != 0) {
          setErrorMessage(result.errors && result.errors.length ? result.errors[0].replaceAll("\n", "<br />") : "Replenishment Failed");
          setMsgType(result.messageType ? result.messageType : "");
          setOpenSuccessModal(true);
        } else {
          if (replenishmentMethod == payOptions.UNIONPAY) {
            openUnionPayWindow(result.data);
            window.close();
          } else {
            if (result && result.data) {
              if (replenishmentMethod == payOptions.PLAID) {
                setSuccessMessage("Replenishment Successful");
                setOpenSuccessModal(true);
                // await api.fetchUserDetails(true);
              } else {
                let clientSecret = result.data;
                const stripe = window.Stripe(await getStripePK());
                const { paymentIntent, error } = await stripe.confirmCardPayment(clientSecret);
                if (paymentIntent && paymentIntent.id) {
                  await api.confirm3DSecurePayment({ result: paymentIntent.status, clientSecret: paymentIntent.client_secret, id: paymentIntent.id });
                  setSuccessMessage("Replenishment Successful");
                  setOpenSuccessModal(true);
                } else if (error && error.code) {
                  setErrorMessage(error.message ? error.message : "Replenishment Failed");
                  setOpenSuccessModal(true);
                }
              }
            }
          }
        }
      } catch (e) {
        setErrorMessage("Replenishment Failed");
        setOpenSuccessModal(true);
      }
    }
    setLoading(false);
  };

  const handleChange = async (selectedOption, newValue) => {
    setFeeDetails({});
    // const paymentMode = selectedOption.target.value;
    const paymentMode = newValue;
    if (paymentMode == payOptions.STRIPE) {
      setStripeLoaded(false);
      const stripeCB = () => {
        const intervalId = setInterval(() => {
          if (window.Stripe) {
            setStripeLoaded(true);
            if (intervalId) {
              clearInterval(intervalId);
            }
          }
        }, 100);
      }
      addStripeLib(stripeCB);
    }
    // updateFeeDetails(paymentMode);
    setReplenishmentMethod(paymentMode);
  };

  const handleBankTransfer = (e) => {
    setBankTransferMethod(e.target.value);
  }

  const remove = async () => {
    if (!removeObj) return;
    let res;
    if (removeObj.type == "ACH") {
      res = await api.removeACH({ lastFourDigitsOfACHAct: removeObj.lastFourDigits });
    } else if (removeObj.type == "CC") {
      res = await api.removeCC({ lastFourDigitsOfCC: removeObj.lastFourDigits });
    }
    if (res.responseCode == 0) {
      fetchDetailsForScreen();
      handleConfirmModalClose();
    }
  };

  const showConfirmationModal = (type, lastFourDigits) => {
    setRemoveObj({ type, lastFourDigits });
    setOpenConfirmModal(true);
  };

  const handleConfirmModalClose = () => {
    setRemoveObj(null);
    setOpenConfirmModal(false);
  };

  const handleSuccessModalClose = async () => {
    setOpenSuccessModal(false);
    setErrorMessage("");
    if(!errorMessage) {
      await api.fetchUserDetails(true);
      setCurrentScreen("dashboard");
    }
  };

  const renderFee = (paymentOption) => {
    return (
      <>
        {(paymentOption.feePercent == 0 && paymentOption.feeAbsolute == 0) ?
          <>
            <Typography className={styles.mediumSizedText}>
              {pageTexts.noFeeMsg}
            </Typography>
            {paymentOption && paymentOption.message ?
              <Typography className={styles.mediumSizedText}>
                {paymentOption.message}
              </Typography>
              : ""}
          </>
          :
          <>
            {paymentOption.feePercentText ?
              <Typography className={styles.mediumSizedText}>
                {paymentOption.feePercentText}
              </Typography>
              : ""}
            {paymentOption.feeAbsoluteText ?
              <Typography className={styles.mediumSizedText}>
                {paymentOption.feeAbsoluteText}
              </Typography>
              : ""}

            {paymentOption.feeExample && (<Typography className={styles.mediumSizedText}>
              {paymentOption.feeExample}
            </Typography>)}
            {paymentOption && paymentOption.message ?
              <Typography className={styles.mediumSizedText}>
                {paymentOption.message}
              </Typography>
              : ""}
          </>
        }
      </>
    );
  };

  const selectAmount = (amount) => {
    setAmount(amount)
  }


  const classes = useStyles();

  return (
    <div style={{ marginTop: "33px" }}>
      {/* <div
                style={{
                    textAlign: "left",
                    width: "600px",
                    marginTop: "6px",
                    marginLeft: "20px",
                    marginBottom:"10px"
                }}>
                <div style={{ paddingTop: "9px", marginRight: "180px" }}>
                    <label style={{ fontWeight: "450", color: "#18C2EE", fontSize: "1.8em" }}>
                        MANUAL
                    </label>
                    <br/>
                    <label style={{fontSize: "1.3em" }}>
                        REPLENISHMENT
                    </label>
                </div>
            </div> */}
      <LoadingOverLay loading={loading}/>
      <div className={classes.replenishContainer}>
        <Box my={2}>
          <Grid container>
            <Grid item xs={12} className={styles.textCenter}>
              <div>
                <img src="./usd_currency_icon.png" alt="dollar" width={35} />
              </div>
              {userDetails && userDetails.balance >= 0 && <Typography className={styles.darkBoldText}>
                {displayAmount(userDetails.balance)}
              </Typography>}

            </Grid>
          </Grid>
        </Box>
        <Divider className={styles.divider} />
        <Box my={2}>
          <Grid container justifyContent='space-between' style={{ marginTop: "10px" }}>
            <Grid item xs={2}>
              <button onClick={() => selectAmount(5)} className={classNames([classes.fadedBackground, amount == 5 ? classes.activeAmount : ""])}>
                $5
              </button>
            </Grid>
            <Grid item xs={2}>
              <button onClick={() => selectAmount(10)} className={classNames([classes.fadedBackground, amount == 10 ? classes.activeAmount : ""])}>
                $10
              </button>
            </Grid>
            <Grid item xs={2}>
              <button onClick={() => selectAmount(25)} className={classNames([classes.fadedBackground, amount == 25 ? classes.activeAmount : ""])}>
                $25
              </button>
            </Grid>
            <Grid item xs={2}>
              <button onClick={() => selectAmount(50)} className={classNames([classes.fadedBackground, amount == 50 ? classes.activeAmount : ""])}>
                $50
              </button>
            </Grid>
          </Grid>
          <Box my={2}>
            <Grid container justifyContent='space-between'>
              <Grid item xs={5}><hr className="line" style={{backgroundColor: "#b4b4b47D"}} /></Grid>
              <Grid item xs={2}><Typography align='center' style={{ opacity: 0.5 }}>OR</Typography></Grid>
              <Grid item xs={5}><hr className="line" style={{backgroundColor: "#b4b4b47D"}} /></Grid>
            </Grid>
          </Box>
          <Grid container>
            <Typography className={`${classes.label} ${styles.darkBoldText}`}>
              {pageTexts.amountSubHeading}
            </Typography>
            <Grid item xs={12}>
              <TextField
                style={{ marginLeft: "2px", width: "100%" }}
                size="small"
                value={amount}
                onChange={e => setAmount(e.target.value)}
                className={`${classes.margin} ${styles.inputFieldWithGreyBg} ${classes.roundedInputField}`}
                label={pageTexts.amountFieldLabel}
                variant="outlined"
                id="custom-css-outlined-input"
              />
              {errorMessage && !openSuccessModal && (<div className="errMsg extension" style={{ marginBottom: "10px", marginLeft: "5px" }}>
                <strong>{errorMessage}</strong>
              </div>)}
            </Grid>
          </Grid>
        </Box>
        <Grid container>
          <Typography className={`${classes.label} ${styles.darkBoldText}`}>
            {pageTexts.addCashSubheading}
          </Typography>
          <Grid item xs={12}>
            <div className={styles.greyListContainer} style={{ minHeight: "250px" }}>
              <div>
                <Tabs
                  value={replenishmentMethod}
                  onChange={handleChange}
                  aria-label="Payment Mode Tabs"
                  variant="fullWidth"
                  classes={{ indicator: classes.customIndicator, flexContainer: classes.customFlexContainer }}
                >
                  <Tab label="Bank Account" value={payOptions.PLAID} id="tab-BANK" />
                  <Tab label="Credit Card" value={payOptions.STRIPE} id="tab-CREDIT_CARD" />
                </Tabs>
              </div>
              <div>
                {
                  replenishmentMethod && userDetails && Object.keys(userDetails).length && paymentOptions ? (
                    replenishmentMethod === payOptions.STRIPE ?
                      (paymentOptions.length && paymentOptions.some(obj => obj["enabler"] == payOptions.STRIPE) ?
                        <Box my={1}>
                          <div className={styles.mediumSizedText}>
                            <span>
                              {pageTexts.cardEndingWithMsg}:&nbsp;
                            </span>
                            <span className={styles.darkBoldText}>
                              {userDetails.ccLastFourDigits}
                            </span>&nbsp;&nbsp;
                            <span>
                              {pageTexts.cardExpiryMsg}:&nbsp;
                            </span>
                            <span className={styles.darkBoldText}>
                              {`${userDetails.ccMonth}/${userDetails.ccYear}`}
                            </span>
                          </div>
                        </Box>
                        :
                        <Box p={1} >
                          <Grid constainer justifyContent="center" alignItems="center">
                            <Grid item xs={12}>
                              <Typography>
                                {pageTexts.noCcOptionMsg}
                              </Typography>
                            </Grid>
                          </Grid>
                        </Box>
                      )
                      :
                      (paymentOptions.length && paymentOptions.some(obj => obj["enabler"] == payOptions.PLAID) ?
                        <div className={styles.mediumSizedText}>
                          <Box my={1}>
                            <span>
                              {pageTexts.bankAccEndingWithMsg}:&nbsp;
                            </span>
                            <span className={styles.darkBoldText}>
                              {userDetails.achAccountLastFourDigits}
                            </span>
                          </Box>
                          <Box my={2}>
                            <Typography className={styles.boldGreyText}>{pageTexts.bankTransferMethod}</Typography>
                            <FormControl component="fieldset" className={classes.formControl}>
                              <RadioGroup aria-label="transfer" name="transfer" value={bankTransferMethod} onChange={handleBankTransfer}>
                                <FormControlLabel value="INSTANT" control={<Radio color="primary" disabled />} label="Instant Transfer (RFP)" />
                                <Typography variant="caption" style={{ paddingLeft: "31px", marginTop: "-10px" }} className={styles.lightGreyText}>{pageTexts.fastest}</Typography>
                                <FormControlLabel value="ACH" control={<Radio color="primary" />} label="Bank Transfer (ACH)" />
                                <Typography variant="caption" style={{ paddingLeft: "31px", marginTop: "-10px" }} className={styles.lightGreyText}>{pageTexts.cheapest}</Typography>
                              </RadioGroup>
                            </FormControl>
                          </Box>
                        </div> : <Box p={1}>
                          <Grid container justifyContent="center" alignItems="center">
                            <Grid item xs={12}>
                              <Typography>
                                {pageTexts.noBankOptionMsg}
                              </Typography>
                            </Grid>
                          </Grid>
                        </Box>
                      )
                  ) : ""}
              </div>
            </div>
          </Grid>
        </Grid>

        {/* {
                (paymentOptions && paymentOptions.length > 0) ?
                  <> */}
        {/* <RadioGroup aria-label="replenishmentChoice" name="replenishmentChoice" value={replenishmentMethod} onChange={handleChange}>
                      {paymentOptions.map((data, index) => {
                        return (
                          <>
                            {(data.enabler == payOptions.PLAID) && (
                              <>
                                <FormControlLabel  value={payOptions.PLAID} control={<BlueRadio />} label= "BANK ACCOUNT (ACH)" />
                                {replenishmentMethod && replenishmentMethod  == payOptions.PLAID && (
                                  <div style={{"width":"220px","height":"60px","border":"1px solid #000", marginLeft:"29px"}}>
                                    <label style={{fontSize:"1.3em", display:"inline-block",marginLeft:"12px",marginTop:"12px"}}>XXXX-XXXX-{activeWallet.achAccountLastFourDigits}</label>
                                    <div>
                                      <div style={{textAlign: "right", padding: "5px 10px"}}>
                                        <a
                                          style={{ fontSize:"16px", marginLeft: "30px", marginTop: "30px", color:"rgb(24, 194, 238)",cursor: "pointer" }}
                                          onClick={()=> showConfirmationModal("ACH", activeWallet.achAccountLastFourDigits)}>
                                          Cancel ACH
                                        </a>
                                      </div>
                                    </div>
                                  </div>)}
                              </>
                            )}
                            {(data.enabler == payOptions.STRIPE) && (
                              <>
                                <FormControlLabel style={{marginBottom:"-13px"}}  value={payOptions.STRIPE} control={<BlueRadio />} label= "CREDIT CARD" />
                                {replenishmentMethod && replenishmentMethod  == payOptions.STRIPE && (<div style={{"width":"220px","height":"90px","border":"1px solid #000",marginTop:"14px", marginLeft:"29px",marginBottom:"10px"}}>
                                  <label style={{fontSize:"1.3em", display:"inline-block",marginLeft:"12px",marginTop:"12px"}}>XXXX-XXXX-XXXX-{activeWallet.ccLastFourDigits}</label>
                                  <label style={{fontSize:"1.15em", display:"inline-block",marginLeft:"12px",marginTop:"10px"}}>Expires {activeWallet.ccMonth}/{activeWallet.ccYear}</label>
                                  <div>
                                    <div style={{textAlign: "right", padding: "5px 10px"}}>
                                      <a
                                        style={{ fontSize:"16px", marginLeft: "30px", marginTop: "30px", color:"rgb(24, 194, 238)",cursor: "pointer" }}
                                        onClick={()=> showConfirmationModal("CC", activeWallet.ccLastFourDigits)}>
                                        Remove
                                      </a>
                                    </div>
                                  </div>
                                </div>)}
                              </>
                            )}
                            {(data.enabler == payOptions.UNIONPAY) && (
                              <>
                                <FormControlLabel style={{marginBottom:"-13px"}}  value={payOptions.UNIONPAY} control={<BlueRadio />} label= "UNIONPAY" />
                                {replenishmentMethod && replenishmentMethod  == payOptions.UNIONPAY && (
                                  <TextField
                                    style={{marginLeft:"2px", marginTop:"25px", width:"253px"}}
                                    size="small"
                                    value={ccNumber}
                                    onChange={e=>setCcNumber(e.target.value)}
                                    className={classes.margin}
                                    label="CreditCard/DebitCard Number"
                                    variant="outlined"
                                    id="custom-css-outlined-input"
                                  />
                                )}
                              </>
                            )}
                          </>
                        );
                      })}
                    </RadioGroup> */}

        {/* <TextField
                      style={{marginLeft:"2px", marginTop:"25px", width:"253px"}}
                      size="small"
                      value={amount}
                      onChange={e=>setAmount(e.target.value)}
                      className={classes.margin}
                      label={`Amount to Fund (${userDetails.currency})`}
                      variant="outlined"
                      id="custom-css-outlined-input"
                    /> */}
        <Box my={2}>
          <Grid container>
            <Grid item xs={12}>
              <div className={classes.root}>
                <Accordion className={classes.feeAccordion} aria-setsize={"large"}>
                  <AccordionSummary
                    expandIcon={<img src="./arrowDown.png" alt="show" />}
                    aria-controls="panel1a-content"
                    id="panel1a-header"
                  >
                    <Typography className={`${styles.darkBoldText} ${styles.largeSizedText}`}>{pageTexts.depositFeesSubHeading}</Typography>
                  </AccordionSummary>
                  <AccordionDetails className={classes.feeAccordionDetails}>
                    <div>
                      {/* <Typography style={{fontWeight: "700", fontSize: "1.25em", margin: "10px"}}>Funding Charges</Typography> */}
                      {showFreeFundingMsg && (
                        <Typography style={feeMsgStyle}>{fundingOptions.fundingMessage}</Typography>
                      )}
                      {paymentOptions && paymentOptions.length && paymentOptions.map((data, index) => {
                        return (
                          <>
                            {(data.enabler == payOptions.PLAID) && (
                              <>
                                {/* <div style={{width: "20%", display: "inline-block", verticalAlign: "top"}}>
                                              <img src="./icon-bank.png" />
                                            </div> */}

                                <div>
                                  <Typography style={{ fontWeight: "700", fontSize: "1.25em", margin: "10px", marginLeft: 0 }}>{pageTexts.bankFeesHeading}</Typography>
                                  {renderFee(data)}
                                </div>
                              </>
                            )}
                            {(data.enabler == payOptions.STRIPE) && (
                              <>
                                {/* <div style={{width: "20%", display: "inline-block", verticalAlign: "top"}}>
                                              <img src="./icon-credit-card.png" />
                                            </div> */}
                                <div>
                                  <Typography style={{ fontWeight: "700", fontSize: "1.25em", margin: "10px", marginLeft: 0 }}>{pageTexts.ccFeesHeading}</Typography>
                                  {renderFee(data, true)}
                                </div>
                              </>
                            )}
                            {(data.enabler == payOptions.UNIONPAY) && (
                              <>
                                {/* <div style={{width: "20%", display: "inline-block", verticalAlign: "top"}}>
                                              <img src="./icon-credit-card.png" />
                                            </div> */}
                                <div>
                                  <Typography style={{ fontWeight: "700", fontSize: "1.25em", margin: "10px", marginLeft: 0 }}>{pageTexts.unionPayFees}</Typography>
                                  {renderFee(data)}
                                </div>
                              </>
                            )}
                          </>
                        );
                      })}
                    </div>
                  </AccordionDetails>
                </Accordion>
              </div>
            </Grid>
          </Grid>
        </Box>
        {/* </>
                :
                <>
                  {(noOptions === true) && <div style={{fontSize: "16px", marginTop: "30px", padding: "0 20px"}}>
                    Please add a replenishment method from Dropp app.
                  </div>}
                </>
              } */}

      </div>
      {replenished && (
        <div
          style={{
            width: "250px",
            marginTop: "40px",
            marginLeft: "36px",
            textAlign: "left",
          }}>
          <label style={{ color: "green", fontSize: "26px" }}>Account Replenished</label>
          <br />
          <br />
          <label style={{ fontSize: "15px" }}>
            <b>${amount}</b> added to your DROPP account from
            {replenishmentMethod.label.split(":")[0]} ending in
            {
              replenishmentMethod.label.split(" ")[
              replenishmentMethod.label.split(" ").length - 1
              ]
            }
          </label>
        </div>
      )}

      <Modal
        open={openSuccessModal}
        onClose={handleSuccessModalClose}
      >
        <Box className={classes.modalContainer}>
          {errorMessage ?
            <>
              <Typography sx={{ mt: 2 }}>
                <strong>{msgType ? msgType : "Error"}</strong>
              </Typography>
              <Typography sx={{ mt: 2 }} dangerouslySetInnerHTML={{ __html: errorMessage }}>
              </Typography>
            </>
            :
            <Typography id="modal-modal-description" sx={{ mt: 2 }}>
              {successMessage}
            </Typography>
          }
          <div className={classes.ctrlBtns}>
            <button className="button-done" onClick={handleSuccessModalClose}>
              Ok
            </button>
          </div>
        </Box>
      </Modal>

      {/* {errorMessage && (
              <div
                  className="alert error extension"
                  style={{ textAlign: "center", marginTop: "25px", marginLeft: "20px" }}>
                  <strong>{errorMessage}</strong>
              </div>
          )}
          {successMessage && (
              <div className="alert success extension" style={{textAlign:"center",marginTop:"25px",marginLeft:"20px"}}>
                <strong>{successMessage}</strong>
              </div>
          )} */}

      {
        <Loader
          style={{ textAlign: "center", marginTop: "20px" }}
          type="Oval"
          color="#00BFFF"
          height={40}
          width={40}
          visible={loading}
        />
      }

      {removeObj ?
        <Modal
          open={openConfirmModal}
          onClose={handleConfirmModalClose}
        >
          <Box className={classes.modalContainer}>
            <Typography id="modal-modal-description" sx={{ mt: 2 }}>
              Do you want to {removeObj.type == "ACH" ? "cancel ACH?" : "remove your saved credit card details?"}
            </Typography>
            <div className={classes.ctrlBtns}>
              <button className="button-cancel" onClick={handleConfirmModalClose}>
                No
              </button>
              &nbsp;&nbsp;&nbsp;&nbsp;
              <button className="button-done" onClick={remove}>
                Yes
              </button>
            </div>
          </Box>
        </Modal>
        : ""}

      {/* <div className="footer" style={{height: (activeWallet && activeWallet.walletId && activeWallet.walletId.operatorId == 2) ? '105px' : '54px'}}>
          <div className="backArrow">
            <ArrowBackOutlinedIcon onClick={()=> setCurrentScreen("dashboard")} style={{cursor:"pointer",color:"#18C2EE"}}/>
          </div>
          <div className="footerRightButtonMedium">
            {stripeLoaded ?
                <button
                    style={{ marginLeft: "-5px" }}
                    className="button-done"
                    onClick={fundAccount}>
                    FUND NOW
                </button>
              :
                <button
                    style={{ marginLeft: "-5px" }}
                    className="button-done button-disabled"
                    disabled={true}>
                    FUND NOW
                </button>
              }
          </div>
          {(activeWallet && activeWallet.walletId && activeWallet.walletId.operatorId == 2) &&
            <div style={{ textAlign: "center", width: "100%" }}><p>Dropp, Operated by Aleta-Planet</p></div>
          }
        </div> */}

      {/* <div>
            <div style={{position:"fixed",bottom:`${(activeWallet && activeWallet.walletId && activeWallet.walletId.operatorId == 2) ? "25px" : "14px"}`,left:"20px"}}>
              <ArrowBackOutlinedIcon onClick={()=> setCurrentScreen("fundaccount")} style={{cursor:"pointer",color:"#18C2EE"}}/>
            </div>
            {(paymentOptions && paymentOptions.length > 0) && <div style={{position:"fixed",bottom:`${(activeWallet && activeWallet.walletId && activeWallet.walletId.operatorId == 2) ? "25px" : "14px"}`,right:"20px"}}>
              {stripeLoaded ?
                <button
                    style={{ marginLeft: "30px", marginTop: "30px" }}
                    className="button-done"
                    onClick={fundAccount}>
                    FUND NOW
                </button>
              :
                <button
                    style={{ marginLeft: "30px", marginTop: "30px" }}
                    className="button-done button-disabled"
                    disabled={true}>
                    FUND NOW
                </button>
              }
            </div>}
            {(activeWallet && activeWallet.walletId && activeWallet.walletId.operatorId == 2) &&
              <div style={{position:"fixed", bottom:"5px", textAlign: "center", width: "100%"}}><p>Dropp, Operated by Aleta-Planet</p></div>
            }
          </div> */}
    </div>
  );
};
export default Replenishment;
