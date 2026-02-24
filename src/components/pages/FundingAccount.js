import React from "react";
import {
    Accordion,
    AccordionDetails,
    AccordionSummary,
    Box,
    Divider,
    Grid,
    Modal,
    Typography,
    makeStyles,
} from "@material-ui/core";
import * as api from "./../../api";
import { getActiveWallet } from "../../utils/utils";
import Checkbox from "@material-ui/core/Checkbox";
import FormControlLabel from "@material-ui/core/FormControlLabel";
import ArrowBackOutlinedIcon from "@material-ui/icons/ArrowBackOutlined";
import CreditCardInfo from "../CreditCardInfo";
import BankAccountInfo from "../BankAccountInfo";
import SaveCCModal from "../SaveCCModal";
import SavedACHForPayOnDemandModal from "../SavedACHForPayOnDemandModal";
import UITexts from "./../../../configurations/dropp.json";
import styles from "./../../styles/common.module.scss";

const payOptions = {
    PLAID: "PLAID",
    STRIPE: "STRIPE",
    UNIONPAY: "UNIONPAY"
}

const feeMsgStyle = {
    fontSize: "1em",
    fontWeight: "600",
    padding: "5px"
};

const feeExStyle = {
    fontSize: "1em",
    fontWeight: "400",
    padding: "5px"
};


const useStyles = makeStyles((theme) => ({
    root: {
        display: 'flex',
        flexWrap: 'wrap',
    },
    mainContainer: {
      padding: "20px",
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
    paymentMethodContainer : {
        minHeight: "75px",
        border: "1px solid #000"
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
    feeAccordion: {
        backgroundColor: "#f9f9f9",
        border: "1px solid #a9a9a9",
        boxShadow: "none",
        width:"100%"
    },
    feeAccordionDetails: {
      padding: "0 16px 16px",
      marginTop: "-14px",
    },
    label: {
      paddingLeft: "10px",
    },
}));

const FundingAccount = ({ setCurrentScreen }) => {
    const [activeWallet, setActiveWallet] = React.useState({});
    const [openConfirmModal, setOpenConfirmModal] = React.useState(false);
    const [openSaveCCModal, setOpenSaveCCModal] = React.useState(false);
    const [openOnDemandACH, setopenOnDemandACH] = React.useState(false);

    const [removeObj, setRemoveObj] = React.useState(null);
    const [history, setHistory] = React.useState([]);
    const [userDetails, setUserDetails] = React.useState({});
    const [fundingOptions, setFundingOptions] = React.useState({});
    const [isChecked, setIsChecked] = React.useState(false);
    const [payOnDemandACHchecked, setPayOnDemandACHChecked] = React.useState(false);

    const [paymentOptions, setPaymentOptions] = React.useState(null);
    const [noOptions, setNoOptions] = React.useState(null);

    const pageTexts = UITexts.fundingAccount;

    const handleCheckboxChange = () => {
        setOpenSaveCCModal(true);
    };

 
   const handleCheckboxpayOnDemandACH = () => {
    setopenOnDemandACH(true);
  };

    const classes = useStyles();

    async function fetchReplenishHistory() {
        let replenishHistoryDetails = await api.fetchReplenishHistory();
        replenishHistoryDetails.data.sort(
            (a, b) =>
                parseFloat(b.creationTimeInEpochSec) - parseFloat(a.creationTimeInEpochSec)
        );
        setHistory(replenishHistoryDetails.data.slice(0, 2));
      }

    async function getUserWalletList() {
        let walletList = await api.fetchUserWalletList();
        if (walletList && walletList.data.length) {
        setActiveWallet(getActiveWallet(walletList.data));
        }
    }

    async function getFundingOptions(operatorId, countryCode, currency) {
        const options = await api.getOperatorFundingOptions({operatorId, countryCode, currency});
        if (options && options.data && options.data.operatorCountryCurrency) {
          setFundingOptions(options.data);
        }
    }

    async function fetchUserDetails() {
        let userDetailsLocal = await api.fetchUserDetails();
        setUserDetails(userDetailsLocal.data);
        setIsChecked(userDetailsLocal.data.payOnDemand);
        setPayOnDemandACHChecked(userDetailsLocal.data.payOnDemandACH)
        getFundingOptions(userDetailsLocal.data.operatorId, userDetailsLocal.data.countryCode, userDetailsLocal.data.currency);
    }

    const fetchDetailsForScreen = () => {
        getUserWalletList();
        fetchReplenishHistory();
        fetchUserDetails();
    };

    React.useEffect(() => {
        getUserWalletList();
        fetchDetailsForScreen();
    },[]);

    React.useEffect(() => {
        if (userDetails && userDetails.userId && activeWallet && activeWallet.walletId && fundingOptions && Object.keys(fundingOptions).length) {
          let options = [];
          if (fundingOptions.ach) {
            for (let i = 0; i < fundingOptions.ach.length; i++) {
              if (fundingOptions.ach[i].enabler == payOptions.PLAID && activeWallet.achAccountLastFourDigits) {
                options.push({enabler: fundingOptions.ach[i].enabler, feeAbsolute: fundingOptions.ach[i].feeAbsolute, feePercent: fundingOptions.ach[i].feePercent, feePercentText: fundingOptions.ach[i].feePercentText, feeAbsoluteText: fundingOptions.ach[i].feeAbsoluteText, feeExample: fundingOptions.ach[i].feeExample, message: fundingOptions.ach[i].message});
              }
            }
          }
          if (fundingOptions.creditCard) {
            for (let i = 0; i < fundingOptions.creditCard.length; i++) {
              if (fundingOptions.creditCard[i].enabler == payOptions.STRIPE && activeWallet.ccLastFourDigits) {
                options.push({enabler: fundingOptions.creditCard[i].enabler, feeAbsolute: fundingOptions.creditCard[i].feeAbsolute, feePercent: fundingOptions.creditCard[i].feePercent, feePercentText: fundingOptions.creditCard[i].feePercentText, feeAbsoluteText: fundingOptions.creditCard[i].feeAbsoluteText, feeExample: fundingOptions.creditCard[i].feeExample, message: fundingOptions.creditCard[i].message});
              } else if (fundingOptions.creditCard[i].enabler != payOptions.STRIPE) {
                options.push({enabler: fundingOptions.creditCard[i].enabler, feeAbsolute: fundingOptions.creditCard[i].feeAbsolute, feePercent: fundingOptions.creditCard[i].feePercent, feePercentText: fundingOptions.creditCard[i].feePercentText, feeAbsoluteText: fundingOptions.creditCard[i].feeAbsoluteText, feeExample: fundingOptions.creditCard[i].feeExample, message: fundingOptions.creditCard[i].message});
              }
            }
          }
          setPaymentOptions(options);
          if (options.length == 0) {
            setNoOptions(true);
          }
        }
      }, [userDetails, activeWallet, fundingOptions]);

    const remove = async () => {
        if (!removeObj) return;
        let res;
        if (removeObj.type == "ACH") {
          res = await api.removeACH({lastFourDigitsOfACHAct: removeObj.lastFourDigits});
        } else if (removeObj.type == "CC") {
          res = await api.removeCC({lastFourDigitsOfCC: removeObj.lastFourDigits});
        }
        if (res.responseCode == 0) {
          fetchDetailsForScreen();
          handleConfirmModalClose();
        }
    };

    const showConfirmationModal = (type, lastFourDigits) => {
        setRemoveObj({type, lastFourDigits});
        setOpenConfirmModal(true);
    };

    const handleConfirmModalClose = () => {
        setRemoveObj(null);
        setOpenConfirmModal(false);
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

    return (
        <div style={{ marginTop: "33px" }}>
            {/* <div
                style={{
                    textAlign: "left",
                    width: "600px",
                    marginTop: "6px",
                    marginLeft: "20px",
                    marginBottom: "10px"
                }}>
                <div style={{ paddingTop: "9px", marginRight: "180px" }}>
                    <label style={{ fontWeight: "450", color: "#18C2EE", fontSize: "1.8em" }}>
                        FUNDING
                    </label>
                    <br />
                    <label style={{ fontSize: "1.3em" }}>
                        ACCOUNTS
                    </label>
                </div>
            </div> */}
            <div className={`${styles.lightGreyContainer} ${classes.mainContainer}`}>
              {
                (paymentOptions && paymentOptions.length > 0) ?
                  <div>
                    <div style={{ maxHeight: "545px", overflow: "scroll" }}>
                      {
                        activeWallet.achAccountLastFourDigits ?
                          <Box my={2}>
                            <Grid container>
                              <Grid item >
                                <Typography className={styles.upperCase} style={{ fontWeight: "600" }}>
                                  {pageTexts.bankAccSubHeading}
                                </Typography>
                              </Grid>
                            </Grid>
                              <BankAccountInfo
                                payOnDemandACHchecked={payOnDemandACHchecked}
                                handleCheckboxpayOnDemandACH={handleCheckboxpayOnDemandACH}
                                pageTexts={pageTexts}
                                activeWallet={activeWallet}
                                showConfirmationModal={showConfirmationModal}
                              />
                            <Divider className={styles.divider} />
                          </Box> : ""
                      }
                      {
                        activeWallet.ccLastFourDigits ?
                          <div style={{ margin: "20px 0px" }}>
                            <Box my={2}>
                              <Typography className={styles.upperCase} style={{ fontWeight: "600" }}>
                                {pageTexts.creditCardSubHeading}
                              </Typography>
                              <CreditCardInfo isChecked={isChecked} handleCheckboxChange={handleCheckboxChange} pageTexts={pageTexts} activeWallet={activeWallet} showConfirmationModal={showConfirmationModal} />
                            </Box>
                          </div> : ""
                      }

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
                                    {/* {showFreeFundingMsg && (
                                              <Typography style={feeMsgStyle}>{fundingOptions.fundingMessage}</Typography>
                                            )} */}
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
                    </div>
                  </div>
                  : <>
                    {(noOptions === true) && <div style={{ fontSize: "16px", marginTop: "30px", padding: "0 20px" }}>
                      {pageTexts.commonNoPayOptionTxt}
                    </div>}
                  </>
              }
            </div>
            {/* <div style={{position:"fixed",bottom:`${(activeWallet && activeWallet.walletId && activeWallet.walletId.operatorId == 2) ? "25px" : "14px"}`,left:"20px"}}>
              <ArrowBackOutlinedIcon onClick={()=> setCurrentScreen("dashboard")} style={{cursor:"pointer",color:"#18C2EE"}}/>
            </div> */}
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
          {/* <Modal
              open={openSaveCCModal}
              onClose={saveCCModalClose}
            >
              <Box className={classes.modalContainer}>
                <Typography id="modal-modal-description" sx={{ mt: 2 }}>
                  Do you want to save your credit card details for future purchases in case of insufficient balance?
                </Typography>
                <div className={classes.ctrlBtns}>
                  <button className="button-cancel" onClick={saveCCModalClose}>
                      No
                  </button>
                  &nbsp;&nbsp;&nbsp;&nbsp;
                  <button className="button-done" onClick={saveCC}>
                      Yes
                  </button>
                </div>
              </Box>
            </Modal> */}
            <SaveCCModal isChecked={isChecked} userDetails={userDetails} openSaveCCModal= {openSaveCCModal} setOpenSaveCCModal={setOpenSaveCCModal} setIsChecked={setIsChecked}/>
             <SavedACHForPayOnDemandModal payOnDemandACHchecked={payOnDemandACHchecked} userDetails={userDetails} openOnDemandACH={openOnDemandACH} setopenOnDemandACH={setopenOnDemandACH} setPayOnDemandACHChecked={setPayOnDemandACHChecked}/> 
        </div>
    )
}

export default FundingAccount;
