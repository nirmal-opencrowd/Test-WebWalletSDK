import React from 'react';
import { Box, Checkbox, CircularProgress, FormControl, FormControlLabel, FormLabel, Grid, Modal, Radio, RadioGroup, Typography, makeStyles } from '@material-ui/core';
import CloseIcon from '@material-ui/icons/Close';
import CreditCardInfoForm from './CreditCardInfoForm';
import * as api from "./../api";
import CreditCardInfo from './CreditCardInfo';
import { getStripePK, removeTrailingZeroes, addStripeLib, roundUpAmtToTwoDecimals } from '../utils/utils';
import { renderCurrency } from '../utils/currency';
import ArrowBackOutlined from '@material-ui/icons/ArrowBackOutlined';
import SaveCCModal from './SaveCCModal';
import classNames from 'classnames';
import BankAccountInfo from './BankAccountInfo';
import PlaidModal from './PlaidModal';
import commonStyles from "./../styles/common.module.scss";
import uiTexts from "./../../configurations/dropp.json";

const useStyles = makeStyles((theme) => ({
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
        borderRadius: "15px",
        bottom: 0,
        height: "550px",
        overflowY: "scroll",
        padding: "0px",
        position: 'absolute',
    },
    "modalContainer:focus-visible": {
        outline: "none",
    },
    transparent: {
        opacity: 0
    },
    modalHeader: {
        backgroundColor: "#f9f9f9",
        display: "flex",
        justifyContent: "center",
        paddingTop: "15px",
        position: "sticky",
        top: "0px",
        zIndex: 1,
    },
    labels: {
        fontSize: "14px",
        opacity: 0.6,
        padding: "7px 0px 2px 0px",
    },
    flexSpaceBetween: {
        display: "flex",
        justifyContent: "space-between",
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
    activeReplenishAmt : {
        backgroundColor: "#18C2EE",
    },
    activePaymentTab: {
        borderBottom: "2px solid #18C2EE",
    },
    paymentTab: {
        cursor: "pointer",
        padding: "5px",
    },
    subContainers: {
        margin: "10px 0px",
    },
    paymentMethodContainer: {
        minHeight: "75px",
        border: "1px solid #000"
    },
    errText: {
        color: "#E42131"
    },
    greyText : {
        color:"#888B8E",
    },
    modalContainer2: {
        backgroundColor: '#FFFFFF',
        border: 0,
        padding: "15px",
        position: 'absolute',
        left: '10%',
        top: '10%',
        width: 250,

    },
    ctrlBtns2: {
        marginTop: "5px",
        textAlign: "right",
    },
    fontSize12: {
        fontSize: "12px",
    },
    fontSize14: {
        fontSize: "14px",
    },
    linkText: {
        color: "#18C2EE",
        cursor:"pointer",
        textDecoration: "underline"
    },
    formControl: {
      margin: theme.spacing(1),
    },
}));

const LowBalanceModal = ({setLowBalanceModalOpen, lowBalanceModalOpen , setCurrentScreen, checkLowBalance, lowBalance, invoiceAmt, merchantTxn, pay}) => {
    const [activePaymentMethod, setActivePaymentMethod] = React.useState("CC");
    const [isChecked, setIsChecked] = React.useState(false);
    const [fundingOptions, setFundingOptions] = React.useState({});
    const [loading, setLoading] = React.useState(true);
    const [replenishAmt, setReplenishAmt] = React.useState(0);
    const [ccSaved, setCcSaved] = React.useState(false);
    const [openSaveCCModal, setOpenSaveCCModal] = React.useState(false);
    const [errorMessage, setErrorMessage] = React.useState(null);
    const [creditCardFormValues, setCreditCardFormValues] = React.useState({});
    const [openSuccessModal, setOpenSuccessModal] = React.useState(false);
    const [cardInfoErr, setCardInfoErr] = React.useState({});
    const [bankDetails, setBankDetails] = React.useState({});
    const [linkToken, setLinkToken] = React.useState(null);
    const [selectedBankId, setSelectedBankId] = React.useState(null);
    const [userDetails, setUserDetails] = React.useState(null);
    const [bankTransferMethod, setBankTransferMethod] = React.useState("ACH");
    const classes = useStyles();
    const {name, cardNumber, expiryMonth, expiryYear, cvc, zipCode} = creditCardFormValues;

    const pageTexts = uiTexts.lowBalanceModal;
    const fundAccountText = uiTexts.fundingAccount;

    const getFundingOptions = async (operatorId, countryCode, currency) => {
        let options = await api.getOperatorFundingOptions({ operatorId, countryCode, currency });
        if (options && options.data && options.data.operatorCountryCurrency) {
            setFundingOptions(options.data);
        }
    };

    const fetchUserDetails = async () => {
        let userDetailsLocal = await api.fetchUserDetails(true);
        if (userDetailsLocal && userDetailsLocal.data) {
            setUserDetails(userDetailsLocal.data);
            getFundingOptions(userDetailsLocal.data.operatorId, userDetailsLocal.data.countryCode, userDetailsLocal.data.currency);
        }
    };

    React.useEffect(() => {
        fetchUserDetails();
    }, []);

    React.useEffect(() => {
        // if (userDetails && userDetails.ccLastFourDigits) {
        //     if (fundingOptions.creditCard) {
        //         setCcSaved(true);
        //     } else {
        //         setCcSaved(false);
        //     }
        // }
        setCcSaved(userDetails && userDetails.ccLastFourDigits);
        setLoading(false);
    }, [userDetails]);

    const handleModalClose = () => {
        setLowBalanceModalOpen(false);
    }

    const setPaymentMethod = (type) => {
        if (type === "ACH" && replenishAmt === invoiceAmt) {
            setReplenishAmt(0);
        }
        setActivePaymentMethod(type)
    }

    const handleCheckboxChange = () => {
        // setOpenSaveCCModal(true);
        setIsChecked(!isChecked);
    };

    const disableButton = (amount) => {
        if ((userDetails.balance + amount) < invoiceAmt) {
            return true;
        }
        return false;
    }

    const validate = (amount) => {
        let hasError = false;
        let err = {}
        const currentYear = new Date().getFullYear();
        if (!amount) {
            err["amount"] = "Please select the amount to replenish"
            hasError = true;
        }
        if (activePaymentMethod == "CC" && !ccSaved) {
            if(!name) {
                err["name"] = "Name is required";
                hasError = true;
            }
            if (!cardNumber){
                err["cardNumber"] = "Card no. is required";
                hasError = true;
            }
            if (cardNumber && !/^\d{16}$/.test(cardNumber)){
                err["cardNumber"] = "Card no. must be of 16 digits";
                hasError = true;
            }
            if (!expiryMonth) {
                err["expiryMonth"] = "Expiry month is required";
                hasError= true;
            }
            if (parseInt(expiryMonth) < 1 || parseInt(expiryMonth) > 12) {
                err["expiryMonth"] = "Expiry month can be between 1 - 12";
                hasError = true;
            }
            if (!expiryYear) {
                err["expiryYear"] = "Expiry year is required";
                hasError = true;
            }
            if (!/^\d{4}$/.test(expiryYear) || parseInt(expiryYear) < currentYear) {
                err["expiryYear"] = "Please enter a valid future year (YYYY)";
                hasError = true;
            }
            if (!cvc || !/^[0-9]{3,4}$/.test(cvc)){
                err["cvc"] = "CVC must be exactly 3 digits.";
                hasError = true;
            }
            if (!zipCode) {
                err["zipCode"] = "Zip Code is required";
                hasError = true;
            }
        }
        setCardInfoErr(err);
        return !hasError;
    }

    const handlePayment = async (amount) => {
        let res;
        await addStripeLib();
        if (validate(amount)) {
            setLoading(true);
            if (!ccSaved && creditCardFormValues) {
                res = await api.getClientSecretFor3DSecure(amount, { ...creditCardFormValues, payOnDemandFunding: true }, isChecked);
            } else if (ccSaved) {
                res = await api.getClientSecret3DSecureForSavedCard(amount, userDetails.ccLastFourDigits, {payOnDemandFunding : true, payOnDemand: isChecked});
            }
            if (res && res.responseCode != 0) {
                setLoading(false);
                setErrorMessage(res.errors && res.errors.length ? res.errors[0].replaceAll("\n", "<br />") : "Replenishment Failed");
                setOpenSuccessModal(true);
            } else {
                setLoading(false);
                if (res && res.data) {
                    let clientSecret = res.data;
                    const stripe = window.Stripe(await getStripePK());
                    const { paymentIntent, error } = await stripe.confirmCardPayment(clientSecret);
                    if (paymentIntent && paymentIntent.id) {
                        await api.confirm3DSecurePayment({result: paymentIntent.status, clientSecret: paymentIntent.client_secret, id: paymentIntent.id});
                        setOpenSuccessModal(true);
                        await api.fetchUserDetails(true);
                    } else if (error && error.code) {
                        setErrorMessage(error.message ? error.message : "Replenishment Failed");
                        setOpenSuccessModal(true);
                    }
                }
            }
        }
    }

    const handleSuccessModalClose = async () => {
        setOpenSuccessModal(false);
        if(activePaymentMethod === "CC") {
            await pay();
        } else if (merchantTxn.acceptPaymentDelay) {
            const lowBalance = await checkLowBalance();
            if (!lowBalance) {
                await pay(true);
            } else {
                window.close(); // close popup for ACH
            }
        } else {
            window.close(); // close popup for ACH
        }
        setLowBalanceModalOpen(false);
    };

    const selectReplenishAmount = (amount) => {
        setReplenishAmt(amount)
    }

    const fundAccount = (event) => {
        event.preventDefault();
        replenish();
    }

    const replenish = async (accountMask) => {
        setLoading(true);
        if (validate(replenishAmt)) {
            try {
                let result;
                result = await api.replenishUserACH({
                    amount: parseFloat(replenishAmt),
                    lastFourDigitsOfACHAct: accountMask ? accountMask : userDetails.achAccountLastFourDigits,
                    payOnDemand: isChecked,
                    payOnDemandFunding: true
                });
                if (result && result.responseCode != 0) {
                    setLoading(false);
                    setErrorMessage(result.errors && result.errors.length ? result.errors[0].replaceAll("\n", "<br />") : "Replenishment Failed");
                    setOpenSuccessModal(true);
                } else {
                    setLoading(false);
                    if (result && result.data) {
                        setOpenSuccessModal(true);
                        await api.fetchUserDetails(true);
                    }
                }
                setReplenishAmt(0);
            } catch (e) {
                setLoading(false);
                setErrorMessage("Replenishment Failed");
                setOpenSuccessModal(true);
            }
        }
        setLoading(false);
    }

    const resetPlaidData = () => {
        setLinkToken(null);
    }

    const setupACH = async () => {
        let res = await api.createLinkToken({platform: "extension"});
        if(res && res.responseCode == 0 && res.data.link_token) {
            setLinkToken(res.data.link_token);
        }
    }

    const handleSelectedBank = (e) => {
        setSelectedBankId(e.target.value);
    }

    const selectBank = async () => {
        const selectedAccount = bankDetails.accounts.find((account) => account.id === selectedBankId);
        let res = await api.linkUserBankAccount({account_id : selectedAccount.id, accountMask: selectedAccount.mask, public_token: bankDetails.public_token});
        if (res && res.responseCode == 0) {
            await fetchUserDetails();
            // window.location.reload();
            replenish(selectedAccount.mask);
        }
    }

    const handleBankTransfer = (e) => {
        setBankTransferMethod(e.target.value);
    }

    return (
        <div>
            {(userDetails && userDetails.hhAccount) ?
                <>
                    <Modal
                        open={lowBalanceModalOpen}
                        onClose={handleModalClose}
                        className={classes.modalAtCenter}
                        BackdropProps={{
                            classes: classes.transparent
                        }}
                        disableBackdropClick={true}
                    >
                        <Box className={classes.modalContainer}>
                            <div style={{ padding: "0px 20px" }}>
                                <div className={classes.modalHeader}>
                                    <Typography style={{ fontWeight: 600 }} >LOW BALANCE</Typography>
                                </div>
                                <div style={{ paddingTop: "5px", height: "408px", overflow: "scroll" }}>
                                    <Typography variant='caption text'>
                                        You don’t have sufficient funds to complete this purchase.
                                    </Typography>
                                    <div className={classes.flexSpaceBetween} style={{ marginTop: "5px" }}>
                                        <Typography variant='caption text'>
                                            Current Balance: {renderCurrency(userDetails.balance, "USD")}
                                        </Typography>
                                        <Typography variant='caption text'>
                                            Purchase Amount: {renderCurrency(invoiceAmt, "USD")}
                                        </Typography>
                                    </div>
                                    <hr className='line' />
                                    {cardInfoErr.amount && <Typography variant='caption text' className={classes.errText}>{cardInfoErr.amount}</Typography>}
                                    <div className={classes.subContainers}>
                                        <Typography variant='subtitle2' style={{ fontWeight: 600 }}>
                                            Fund your wallet
                                        </Typography>
                                        <p>
                                            Save on transaction fees
                                        </p>
                                        <Grid container justifyContent='space-between' style={{ marginTop: "10px" }}>
                                            <Grid item xs={2}>
                                                <button onClick={() => selectReplenishAmount(5)} disabled={disableButton(5)} className={classNames([classes.fadedBackground, replenishAmt === 5 ? classes.activeReplenishAmt : "" ])}>
                                                    $5
                                                </button>
                                            </Grid>
                                            <Grid item xs={2}>
                                                <button onClick={() => selectReplenishAmount(10)} disabled={disableButton(10)} className={classNames([classes.fadedBackground, replenishAmt === 10 ? classes.activeReplenishAmt : "" ])}>
                                                    $10
                                                </button>
                                            </Grid>
                                            <Grid item xs={2}>
                                                <button onClick={() => selectReplenishAmount(25)} disabled={disableButton(25)} className={classNames([classes.fadedBackground, replenishAmt === 25 ? classes.activeReplenishAmt : "" ])}>
                                                    $25
                                                </button>
                                            </Grid>
                                            <Grid item xs={2}>
                                                <button onClick={() => selectReplenishAmount(50)} disabled={disableButton(50)} className={classNames([classes.fadedBackground, replenishAmt === 50 ? classes.activeReplenishAmt : "" ])}>
                                                    $50
                                                </button>
                                            </Grid>
                                        </Grid>
                                    </div>
                                    <div className={classes.subContainers}>
                                        <Grid container justifyContent='space-between'>
                                            <Grid item xs={5}><hr className="line" style={{backgroundColor: "#b4b4b47D"}} /></Grid>
                                            <Grid item xs={2}><Typography align='center' style={{ opacity: 0.5 }}>OR</Typography></Grid>
                                            <Grid item xs={5}><hr className="line" style={{backgroundColor: "#b4b4b47D"}} /></Grid>
                                        </Grid>
                                    </div>
                                    <div className={classes.subContainers}>
                                        <Typography variant='subtitle2' style={{ fontWeight: 600 }}>
                                            Pay invoice amount
                                        </Typography>
                                        <Grid container style={{ marginTop: "10px" }}>
                                            <Grid item xs={2}>
                                                <button onClick={() => selectReplenishAmount(roundUpAmtToTwoDecimals(invoiceAmt))} disabled={invoiceAmt && roundUpAmtToTwoDecimals(invoiceAmt) < 0.50} className={classNames([classes.fadedBackground, replenishAmt === roundUpAmtToTwoDecimals(invoiceAmt) ? classes.activeReplenishAmt : "" ])}>
                                                    ${invoiceAmt}
                                                </button>
                                            </Grid>
                                        </Grid>
                                    </div>
                                    <div className={classes.subContainers}>
                                        <Typography variant='subtitle2' style={{ fontWeight: 600 }}>
                                            How would you like to pay?
                                        </Typography>
                                        <div style={{ marginTop: "5px" }}>
                                            <Grid container>
                                                <Grid item xs={6} onClick={() => setPaymentMethod("ACH")} className={`${classes.paymentTab} ${activePaymentMethod === "ACH" ? classes.activePaymentTab : ""}`} >
                                                    Bank Account
                                                </Grid>
                                                <Grid item xs={6} onClick={() => setPaymentMethod("CC")} className={`${classes.paymentTab} ${activePaymentMethod === "CC" ? classes.activePaymentTab : ""}`}>
                                                    Credit Card
                                                </Grid>
                                            </Grid>
                                        </div>
                                    </div>
                                    <div className={classes.subContainers}>
                                        {
                                            loading ? <div className='loader' style={{ marginTop: "10px" }}>
                                                <CircularProgress color='inherit' />
                                            </div> :
                                                activePaymentMethod === "CC" ? <div>
                                                    {
                                                        ccSaved ? <CreditCardInfo pageTexts={fundAccountText} lowBalanceModal={true} />
                                                        : <CreditCardInfoForm setCreditCardFormValues={setCreditCardFormValues} cardInfoErr={cardInfoErr}/>
                                                    }
                                                    <Typography variant='body2' style={{ marginTop: "10px" }}>
                                                        Credit Card Fees: {fundingOptions && fundingOptions.creditCard && fundingOptions.creditCard.length && fundingOptions.creditCard[0].feeAbsoluteText ? <span>{fundingOptions.creditCard[0].feeAbsoluteText}</span> : ""}
                                                    </Typography>
                                                </div>
                                                    : <><div>
                                                            {/* <Box my={1}>
                                                                <Typography variant='body2' className={commonStyles.darkBoldText}>
                                                                    Fund account via Instant transfer (RFP)
                                                                </Typography>
                                                            </Box> */}
                                                            <div style={{marginBottom: "25px"}}>
                                                                <Typography variant="body2" className={commonStyles.boldGreyText}>{pageTexts.bankTransferMethod}</Typography>
                                                                <FormControl component="fieldset" className={classes.formControl}>
                                                                    <RadioGroup aria-label="transfer" name="transfer" value={bankTransferMethod} onChange={handleBankTransfer}>
                                                                        <FormControlLabel
                                                                            value="INSTANT"
                                                                            control={<Radio color="primary" disabled />}
                                                                            label={
                                                                                <Typography variant="body2">
                                                                                    Instant Transfer (RFP)
                                                                                </Typography>
                                                                            }
                                                                        />
                                                                        <Typography variant="caption" style={{ paddingLeft: "31px", marginTop: "-10px" }} className={commonStyles.lightGreyText}>
                                                                            {pageTexts.fastest}
                                                                        </Typography>

                                                                        <FormControlLabel
                                                                            value="ACH"
                                                                            control={<Radio color="primary" />}
                                                                            label={
                                                                                <Typography variant="body2">
                                                                                    Bank Transfer (ACH)
                                                                                </Typography>
                                                                            }
                                                                        />
                                                                        <Typography variant="caption" style={{ paddingLeft: "31px", marginTop: "-10px" }} className={commonStyles.lightGreyText}>
                                                                            {pageTexts.cheapest}
                                                                        </Typography>
                                                                    </RadioGroup>
                                                                </FormControl>
                                                                {/* <Typography variant='body2' className={commonStyles.darkBoldText}>Fund account using ACH</Typography> */}
                                                                {merchantTxn.acceptPaymentDelay ? "" : <Typography variant='body2' className={classes.errText}>You can initiate funding using ACH but cannot complete the purchase at this time.</Typography>}
                                                            </div>
                                                        {
                                                            userDetails.achAccountLastFourDigits ? <BankAccountInfo lowBalanceModal={true} /> :
                                                                bankDetails && Object.keys(bankDetails).length > 0 && bankDetails.accounts && bankDetails.accounts.length ? <div>
                                                                    <FormControl>
                                                                        <FormLabel style={{color:"#000", fontWeight: 600}}>{bankDetails.institution.name}</FormLabel>
                                                                        <RadioGroup value={selectedBankId} onChange={handleSelectedBank}>
                                                                            {
                                                                                bankDetails.accounts.map((details) => (
                                                                                    <FormControlLabel
                                                                                        key={details.id}
                                                                                        value={details.id}
                                                                                        control={<Radio color="primary"/>}
                                                                                        label=<Typography className={classes.fontSize14} >{`${details.name} (XXXXXXXXXXXX-${details.mask})`}</Typography>
                                                                                    />
                                                                                ))
                                                                            }
                                                                        </RadioGroup>
                                                                    </FormControl>
                                                                </div>
                                                                    : <Typography variant='body2' onClick={setupACH} className={classes.linkText}>Setup ACH</Typography>
                                                        }
                                                            <div style={{marginTop:"25px"}}>
                                                                <Typography className={classes.fontSize12} variant='body2'>
                                                                    {fundingOptions && fundingOptions.ach && fundingOptions.ach.length && fundingOptions.ach[0].message ? fundingOptions.ach[0].message : ""}
                                                                </Typography>
                                                                <Typography className={classes.fontSize12} variant='body2'>
                                                                    {fundingOptions && fundingOptions.ach && fundingOptions.ach.length && fundingOptions.ach[0].feePercentText ? fundingOptions.ach[0].feePercentText : ""}
                                                                </Typography>
                                                            </div>
                                                        </div>
                                                    </>
                                        }
                                    </div>
                                </div>
                                <div style={{ position: "absolute", bottom: 0, padding: "10px 0px", borderTop: "1px solid #B4B4B4", width: "88%" }}>
                                    {
                                        <FormControlLabel
                                            style={{
                                                marginRight: 0
                                            }}
                                            control={
                                                <Checkbox
                                                    checked={isChecked}
                                                    onChange={handleCheckboxChange}
                                                    color="primary"
                                                />
                                            }
                                            label=<p style={{ fontSize: "12px" }}>Don’t ask me again.
                                                Remember this selection for future purchases.
                                                You can update this in Funding settings anytime</p>
                                        />
                                    }
                                    <div style={{display: "flex", justifyContent: "space-between"}}>
                                        <ArrowBackOutlined onClick={handleModalClose} style={{cursor:"pointer",color:"#18C2EE"}}/>
                                        {
                                            activePaymentMethod === "CC" ?
                                                <button
                                                    style={{
                                                        marginRight: "5px",
                                                        marginBottom: "5px",
                                                    }}
                                                    className="button-done"
                                                    onClick={() => handlePayment(replenishAmt)}
                                                >
                                                    PAY
                                                </button>
                                                :
                                                    <>
                                                        {!userDetails.achAccountLastFourDigits ?
                                                            <button
                                                                style={{
                                                                    marginRight: "5px",
                                                                    marginBottom: "5px",
                                                                }}
                                                                className={`button-done ${!selectedBankId ? "button-disabled" : ""}`}
                                                                onClick={selectBank}
                                                                disabled={!selectedBankId}
                                                            >
                                                                { merchantTxn.acceptPaymentDelay ? "PAY" : "FUND" }
                                                            </button>
                                                            :
                                                            <button
                                                                style={{
                                                                    marginRight: "5px",
                                                                    marginBottom: "5px",
                                                                }}
                                                                className={`button-done ${!userDetails.achAccountLastFourDigits ? "button-disabled" : ""}`}
                                                                onClick={fundAccount}
                                                                disabled={!userDetails.achAccountLastFourDigits}
                                                            >
                                                                { merchantTxn.acceptPaymentDelay ? "PAY" : "FUND" }
                                                            </button>
                                                        }
                                                    </>

                                        }
                                    </div>
                                </div>
                            </div>
                        </Box>
                    </Modal>
                    <SaveCCModal isChecked={isChecked} userDetails={userDetails} openSaveCCModal= {openSaveCCModal} setOpenSaveCCModal={setOpenSaveCCModal} setIsChecked={setIsChecked}/>
                    <Modal
                        open={openSuccessModal}
                        disableBackdropClick={true}
                        onClose={errorMessage ? ()=>setOpenSuccessModal(false) : handleSuccessModalClose}
                    >
                        <Box className={classes.modalContainer2}>
                            {errorMessage ?
                            <>
                                <Typography sx={{ mt: 2 }}>
                                <strong>Error</strong>
                                </Typography>
                                <Typography sx={{ mt: 2 }} dangerouslySetInnerHTML={{__html: errorMessage}} />
                            </>
                            :
                            <Typography id="modal-modal-description" sx={{ mt: 2 }}>
                                Replenishment Successful
                            </Typography>
                            }
                            <div className={classes.ctrlBtns2}>
                            {errorMessage ?
                                <button className="button-done" onClick={()=>setOpenSuccessModal(false)}>
                                Ok
                                </button>
                            :
                                <button className="button-done" onClick={handleSuccessModalClose}>
                                Ok
                            </button>
                            }

                            </div>
                        </Box>
                    </Modal>
                    {linkToken ? <PlaidModal linkToken={linkToken} setBankDetails={setBankDetails} resetPlaidData={resetPlaidData} /> : ""}
                </>
            :
                <div className='loader' style={{ marginTop: "10px" }}>
                    <CircularProgress color='inherit' />
                </div>
            }
        </div>
    )
}

export default LowBalanceModal
