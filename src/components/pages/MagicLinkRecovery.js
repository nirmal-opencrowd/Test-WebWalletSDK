import React, { useEffect, useState } from "react";
import { Box, Typography, Grid, Stepper, Step, StepLabel, IconButton } from "@material-ui/core";
import { useHistory, useLocation } from "react-router-dom";
import uiTexts from "./../../../configurations/dropp.json";
import PhoneInput from "react-phone-input-2";
import "react-phone-input-2/lib/style.css";
import styles from "../../styles/common.module.scss";
import { makeStyles } from "@material-ui/core/styles";
import { magicInstance } from "./../../components/MagicLink";
import { fetchValidateEmailPhone, accountRecovered } from "../../api";
import { isSafari, isFirefox } from "../../utils/utils";
import NumberStepIcon from "../../helpers/numberStepIcon";
import InfoIcon from "@material-ui/icons/Info";

const useStyles = makeStyles(theme => ({
    customGridPadding: {
        padding: "1em 1em 0 1.4em",
    },
    phoneInputContainer: {
        marginTop: "16px",
        marginBottom: "16px",
        width: "100%",
        "& .form-control": {
            width: "100%",
        },
        "& .country-list": {
            textAlign: "left",
        },
        "& .country": {
            display: "flex",
        },
        "& .dial-code": {
            marginLeft: "auto", /* pushes dial code to the right */
            textAlign: "right",
        }
    },
    popupOverlay: {
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: "rgba(0,0,0,0.5)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 9999,
    },
    popupBox: {
        background: "#fff",
        padding: "12px 12px",
        borderRadius: "8px",
        width: "260px",
        textAlign: "center",
    },
    popupButton: {
        background: "#18c2ee",
        color: "#fff",
        padding: "8px 20px",
        borderRadius: "6px",
        border: "none",
        cursor: "pointer",
        fontFamily: "'Poppins', sans-serif",
    },
    errorText: {
        color: "red",
        marginTop: "10px",
    },
        dotBlue: {
            width: 12,
            height: 12,
            borderRadius: 6,
            background: '#18c2ee',
            display: 'inline-block',
            marginRight: 8,
            verticalAlign: 'middle'
        },
        heading: {
            fontSize: '28px',
            fontWeight: 800,
            marginBottom: '6px',
            textAlign: 'left'
        },
        subHeading: {
            color: '#333333',
            fontSize: '14px',
            marginBottom: '18px',
            textAlign: 'left'
        },
        continueButton: {
            background: '#18c2ee',
            color: '#fff',
            borderRadius: 24,
            padding: '12px 24px',
            width: '100%',
            maxWidth: 420,
            fontWeight: 700,
            border: 'none',
            cursor: 'pointer'
        },
        primaryButton: {
            background: '#18c2ee',
            color: '#fff',
            borderRadius: 24,
            padding: '12px 12px',
            width: '100%',
            maxWidth: 420,
            fontWeight: 700,
            fontSize: '12px',
            border: 'none',
            cursor: 'pointer'
        },
        outlineButton: {
            background: '#fff',
            color: '#18c2ee',
            borderRadius: 24,
            padding: '12px 24px',
            width: '100%',
            maxWidth: 420,
            fontWeight: 700,
            border: '2px solid #18c2ee',
            cursor: 'pointer'
        },
        orDivider: {
            display: 'flex',
            alignItems: 'center',
            width: '100%',
            maxWidth: 420,
            margin: '18px auto'
        },
        orLine: {
            flex: 1,
            height: 1,
            background: '#e6e6e6'
        },
        orText: {
            margin: '0 12px',
            color: '#777777',
            fontWeight: 600
        },
        subTextLeft: {
            textAlign: 'left',
            marginBottom: 12,
            color: '#333333',
            fontSize: '14px'
        },
        welcomeGrid: {
            textAlign: "center",
            paddingTop: "10px",
            paddingBottom: "10px"
        },
        welcomeP: {
            fontSize: "20px"
        },
        stepperItem: {
            maxWidth: 420
        },
        marginTop20: {
            marginTop: 20
        },
        subTextMargin: {
            marginTop: 8
        },
        downloadGrid: {
            paddingTop: "10px",
            borderTop: "1px solid rgb(43, 47, 47)",
            marginTop: "165px",
            bottom: "10px"
        },
        downloadLabel: {
            fontSize: "14px",
            margin: "10px",
            textAlign: "center",
            padding: "0em 0em 0 0.5em"
        },
        centerDiv: {
            textAlign: 'center'
        },
        mainItem: {
            width: '100%',
            maxWidth: 420
        },
        flexDiv: {
            display: 'flex',
            alignItems: 'center',
        },
        helpCursor: {
            fontWeight: 700,
            cursor: 'help'
        },
        marginTop8: {
            marginTop: 8
        },
        submitGrid: {
            marginTop: "20px"
        },
        submitButton: {
            fontSize: "12px",
            textAlign: "center",
            width: "100%",
            maxWidth: "384px",
            backgroundColor: "#fff",
            border: "2px solid #18c2ee",
            borderRadius: "25px",
            color: "#000",
            padding: "7px 15px",
            fontWeight: "bolder",
            cursor: "pointer",
            fontFamily: "'Poppins', sans-serif",
            lineHeight: "32px"
        },
        flexDivMargin: {
            display: 'flex',
            alignItems: 'center',
            marginBottom: 8
        },
        boldText: {
            fontWeight: 700
        },
        marginTop8px: {
            marginTop: "8px"
        },
        marginBottom10: {
            marginBottom: 10
        },
        country:{
            textAlign:"left"
        }
}));

const pageTexts = uiTexts.MagicLinkRecovery;


    const MagicLinkRecovery = () => {
    const history = useHistory();
    const location = useLocation();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [phoneNumber, setPhoneNumber] = useState("");
    const [showErrorPopup, setShowErrorPopup] = useState(false);
    const [showInfoPopup, setShowInfoPopup] = useState(false);
    const [showAdvancedRecoveryPopup, setShowAdvancedRecoveryPopup] = useState(false);
    const [notSupported, setNotSupported] = useState(false);
    const classes = useStyles();
    const [showMainContent, setShowMainContent] = useState(false);


    useEffect(() => {
        if (isSafari() || isFirefox()) {
            setNotSupported(true);
        }
        const query = new URLSearchParams(location.search);
        if (query.get('from')) {
            setShowMainContent(true);
        }
        console.log("location.search in MagicLinkRecovery:", location.search);
    }, [location.search]);

    const gettingStarted = () => {
        history.push("/gettingStarted");
    };
    
        const goTODroppRecovery = () => {
            // Always use SPA navigation for webapp and extension
            history.push("/dropprecovery");
        }
    
    const handleRedirection = async (normalizedPhone, hedera_account_id) =>{
            console.log("handleRedirection called");
            navigator.geolocation.getCurrentPosition(
            async (pos) => {
                try {
                await accountRecovered({
                    recoveryMethod: "Web Extension Magic Recovery",
                    device: "web",
                    location: `${pos.coords.latitude},${pos.coords.longitude}`,
                });
                } catch (err) {
                console.error("accountRecovered API failed:", err);
                }
            },
            async () => {
                try {
                await accountRecovered({
                    recoveryMethod: "Web Extension Magic Recovery",
                    device: "web",
                    location: "",
                });
                } catch (err) {
                console.error("accountRecovered API failed:", err);
                }
            },
            { timeout: 5000 }
            );

            history.push({
                pathname: "/validateAccount",
                state: { phoneNumber: normalizedPhone, hedera_account_id: hedera_account_id },
            });
    }

    const handleSubmit = async () => {
        setLoading(true);
        setError("");
        try {
            const normalizedPhone = phoneNumber.startsWith("+") ? phoneNumber : `+${phoneNumber}`;
            localStorage.setItem("phoneNumber", normalizedPhone);

            const validateResponse = await fetchValidateEmailPhone({ phone: normalizedPhone });

            if (validateResponse && validateResponse.responseCode === 0) {
                setError("This phone does not exist. Please use a different phone to recover your account.");
                setShowErrorPopup(true);
                setLoading(false);
                return;
            }

            if (validateResponse && validateResponse.data && validateResponse.data.magicLinkAccount === false) {
                setError("You set up this account with Advanced Recovery. Please use the Advanced Recovery option to continue.");
                setShowErrorPopup(true);
                setLoading(false);
                return;
            }

            const magic = await magicInstance();
            const isLoggedIn = await magic.user.isLoggedIn();
            if (isLoggedIn) {
                await magic.user.logout();
            }
            await magic.auth.loginWithSMS({ phoneNumber: normalizedPhone });
            const userInfo = await magic.user.getInfo();
            const hedera_account_id = userInfo.publicAddress;
               await handleRedirection(normalizedPhone, hedera_account_id);
            // await handleRedirection();
        } catch (err) {
            setError("Failed to send OTP. Please try again.");
            console.error("Failed to send OTP via SMS:", err);
        } finally {
            setLoading(false);
        }
    };

    const getAppDownloadUrl = (url) => {
        chrome.runtime.sendMessage({
            type: "openInNewTab",
            request: {url: url},
        });
    }

    
    return (
        <>
            <Box>
                {!showMainContent ? (
                    <>
                        <Grid item className={classes.welcomeGrid}>
                            <p className={classes.welcomeP}>
                                Welcome to <b>DROPP</b>
                            </p>
                            {/* <p style={{ marginTop: "10px" }}>clicks : {clicks}</p> */}
                        </Grid>

                        <Grid
                            container
                            alignItems="flex-start"
                            justifyContent="center"
                            direction="column"
                            className={classes.customGridPadding}>
                            <Typography
                                variant="body2"
                                className={`${classes.subTextMargin}`}>
                                Instant, secure Pay-By-Bank and Stablecoin payments for everyday
                                purchases.
                            </Typography>
                            <Grid item xs={12} className={classes.stepperItem}>
                                <Stepper activeStep={2} alternativeLabel>
                                    <Step>
                                        <StepLabel StepIconComponent={NumberStepIcon}>
                                            SETUP PROFILE
                                        </StepLabel>
                                    </Step>
                                    <Step>
                                        <StepLabel StepIconComponent={NumberStepIcon}>
                                            VERIFY PHONE
                                        </StepLabel>
                                    </Step>
                                    <Step>
                                        <StepLabel StepIconComponent={NumberStepIcon}>
                                            VERIFY EMAIL
                                        </StepLabel>
                                    </Step>
                                </Stepper>
                            </Grid>
                        </Grid>
                        <Grid
                            container
                            justifyContent="center"
                            className={`${classes.marginTop20} ${classes.customGridPadding}`}>
                            <Grid item xs={12} className={classes.stepperItem}>
                                <button
                                    className={classes.primaryButton}
                                    onClick={() => setShowMainContent(true)}>
                                    I ALREADY HAVE AN ACCOUNT
                                </button>
                            </Grid>
                            <Typography
                                variant="body2"
                                className={`${classes.subTextLeft} ${classes.subTextMargin}`}>
                                Connect your existing account instantly
                            </Typography>
                        </Grid>
                        <Grid item className={classes.downloadGrid}>
                            <Grid>
                                <Grid item>
                                    <label
                                        htmlFor="fname"
                                        className={`${classes.downloadLabel} select-action__button-text-small`}>
                                        {" "}
                                        Download the Dropp mobile wallet to create an account
                                    </label>
                                    <div className={classes.centerDiv}>
                                        {!isSafari() && (
                                            <span
                                                onClick={() =>
                                                    getAppDownloadUrl(
                                                        "https://play.google.com/store/apps/details?id=cc.dropp.wallet"
                                                    )
                                                }>
                                                <img
                                                    height="35px"
                                                    style={{
                                                        marginRight: "20px",
                                                        cursor: "pointer",
                                                    }}
                                                    src="./android-icon.png"
                                                />
                                            </span>
                                        )}
                                        <span
                                            onClick={() =>
                                                getAppDownloadUrl(
                                                    "https://apps.apple.com/app/dropp-cc/id1544894404"
                                                )
                                            }>
                                            <img
                                                height="35px"
                                                style={{ cursor: "pointer" }}
                                                src="./apple-icon.png"
                                            />
                                        </span>
                                    </div>
                                </Grid>
                            </Grid>
                        </Grid>
                    </>
                ) : (
                    <>
                        <Grid
                            container
                            alignItems="flex-start"
                            justifyContent="center"
                            direction="column"
                            className={classes.customGridPadding}>
                            {/* <Grid item xs={2}>
                            <div height="30" width="30"></div>
                        </Grid> */}
                        </Grid>
                        {/* Welcome / Recovery UI */}
                        <Grid
                            container
                            alignItems="flex-start"
                            justifyContent="center"
                            direction="column"
                            className={classes.customGridPadding}>
                            <Grid item xs={12} className={classes.mainItem}>
                                <Typography className={classes.heading}>
                                    {pageTexts.heading}
                                </Typography>
                                <Typography className={classes.subHeading}>
                                    {pageTexts.subHeading}
                                </Typography>
                            </Grid>

                            <Grid item xs={12} className={classes.mainItem}>
                                <div className={classes.flexDiv}>
                                    <Typography
                                        className={classes.helpCursor}
                                        title="If you selected Simple Recovery during signup, you can restore your wallet using your phone number">
                                        {pageTexts.method1Text}
                                    </Typography>
                                    <IconButton onClick={() => setShowInfoPopup(true)} style={{ marginLeft: '8px' }}>
                                        <InfoIcon />
                                    </IconButton>
                                </div>
                                <Typography variant="body2" className={classes.subTextLeft}>
                                    {pageTexts.method1TextInfo}
                                </Typography>

                                <PhoneInput
                                    className={classes.phoneInputContainer}
                                    country={"us"}
                                    forceDialCode={true}
                                    countryCodeEditable={false}
                                    value={phoneNumber}
                                    onChange={setPhoneNumber}
                                    inputClass={styles.phoneInputField}
                                    disabled={notSupported}
                                />

                                <Typography
                                    variant="body2"
                                    className={`${classes.subTextLeft} ${classes.marginTop8}`}>
                                    {pageTexts.magicLinkInfoText}
                                </Typography>
                                {/* Submit Button */}
                                <Grid
                                    container
                                    alignItems="center"
                                    justifyContent="center"
                                    direction="col"
                                    className={classes.submitGrid}>
                                    <button
                                        className={`button-done ${classes.submitButton}`}
                                        disabled={loading || !phoneNumber || notSupported}
                                        onClick={handleSubmit}>
                                        {loading ? "Sending..." : "SUBMIT"}
                                    </button>
                                </Grid>
                            </Grid>

                            <Grid item xs={12} className={classes.orDivider}>
                                <div className={classes.orLine} />
                                <div className={classes.orText}>OR</div>
                                <div className={classes.orLine} />
                            </Grid>

                            <Grid item xs={12} className={classes.mainItem}>
                                <div className={classes.flexDivMargin}>
                                    <Typography className={classes.boldText}>
                                        {pageTexts.method2Text}
                                    </Typography>
                                    <IconButton onClick={() => setShowAdvancedRecoveryPopup(true)} style={{ marginLeft: '8px' }}>
                                        <InfoIcon />
                                    </IconButton>

                                </div>
                                <Typography variant="body2" className={classes.subTextLeft}>
                                    {pageTexts.method2TextInfo}
                                </Typography>
                                <div className={classes.marginBottom10}>
                                    <button
                                        className={classes.primaryButton}
                                        onClick={gettingStarted}>
                                        LOGIN WITH MOBILE APP
                                    </button>
                                </div>
                                <div className={classes.marginBottom10}>
                                    <button
                                        className={classes.primaryButton}
                                        onClick={goTODroppRecovery}>
                                        I HAVE MY RECOVERY QR CODE &amp; PASSWORD
                                    </button>
                                </div>
                                <Typography
                                    variant="body2"
                                    className={`${classes.subTextLeft} ${classes.marginTop8px}`}>
                                    {pageTexts.qrcodeInfoText}
                                </Typography>
                            </Grid>
                        </Grid>

                        {notSupported && (
                            <Grid item xs={12}>
                                <Typography variant="body2" className={classes.errorText}>
                                    This extension is not currently supported for Magic Link
                                    authentication. Please use the Chrome or Edge browser instead.
                                </Typography>
                            </Grid>
                        )}

                        {showErrorPopup && (
                            <div className={classes.popupOverlay}>
                                <div className={classes.popupBox}>
                                    <p style={{ marginBottom: "20px" }}>{error}</p>
                                    <button
                                        className={classes.popupButton}
                                        onClick={() => setShowErrorPopup(false)}>
                                        OK
                                    </button>
                                </div>
                            </div>
                        )}

                        {showInfoPopup && (
                            <div className={classes.popupOverlay}>
                                <div className={classes.popupBox}>
                                    <Typography variant="h6" style={{ fontSize:'14px', textAlign: "left", fontWeight: "bold", marginBottom: "16px" }}>
                                        Simple Recovery
                                    </Typography>
                                    <Typography variant="body2" style={{ fontSize:'12px', textAlign: "left", marginBottom: "12px" }}>
                                        If you selected Simple Recovery during signup, you can restore your wallet using your phone number.
                                    </Typography>
                                    <Typography variant="body2" style={{ fontSize:'12px', textAlign: "left", fontWeight: "bold" }}>
                                        Here's what to expect:
                                    </Typography>
                                    <ol style={{ textAlign: 'left', marginTop:"0px", marginBottom: "16px" }}>
                                        <li style={{marginBottom: "10px"}}>Enter your phone number — you'll receive a verification code by SMS from Magic Link.</li>
                                        <li style={{marginBottom: "10px"}}>Enter the code sent to your email (your registered email address).</li>
                                        <li style={{marginBottom: "10px"}}>Enter your Dropp Account ID to complete the recovery.</li>
                                    </ol>
                                    <Typography variant="body2" style={{ fontSize:'12px', textAlign: "left", marginBottom: "12px" }}>
                                        Once these steps are complete, your wallet will be fully restored.<br />
                                        Dropp never stores your recovery key. Magic Link maintains it.
                                    </Typography>
                                    <Typography variant="body2" style={{ fontSize:'12px', textAlign: "left", fontWeight: "bold" }}>
                                        What is a recovery key?
                                    </Typography>
                                    <Typography variant="body2" style={{ fontSize:'12px', textAlign: "left", marginBottom: "12px" }}>
                                        A recovery key is the secure cryptographic key that unlocks your Dropp account. Only you control it. You can store it yourself using the Advanced Recovery method, or choose Simple Recovery, where Magic Link securely stores it for you. Dropp never holds or has access to your recovery key.
                                    </Typography>
                                    <Typography variant="body2" style={{ fontSize:'12px', textAlign: "left", marginBottom: "16px" }}>
                                        As a self-custody wallet, Dropp ensures you always control your own recovery key.
                                    </Typography>
                                    <button
                                        className={classes.popupButton}
                                        onClick={() => setShowInfoPopup(false)}>
                                        OK
                                    </button>
                                </div>
                            </div>
                        )}

                        {showAdvancedRecoveryPopup && (
                            <div className={classes.popupOverlay}>
                                <div className={classes.popupBox}>
                                    <Typography variant="h6" style={{ fontSize:'14px', textAlign: "left", fontWeight: "bold", marginBottom: "16px" }}>
                                        Advanced Recovery
                                    </Typography>
                                    <Typography variant="body2" style={{ fontSize:'12px', textAlign: "left", marginBottom: "12px" }}>
                                        Use this method if you manage your own recovery keys. You can restore your Dropp account using one of the options below:
                                    </Typography>
                                    
                                    <Typography variant="body2" style={{ fontSize:'12px', textAlign: "left", fontWeight: "bold", marginBottom: "8px" }}>
                                        Recovery QR Code + Password
                                    </Typography>
                                    <Typography variant="body2" style={{ fontSize:'12px', textAlign: "left", marginBottom: "12px" }}>
                                        Select "I HAVE RECOVERY QR CODE AND PASSWORD" if you have your encrypted recovery QR code saved during registration.<br/>
                                        Step 1: Scan your saved encrypted recovery QR code.<br/>
                                        Step 2: Enter the Password to decrypt it.
                                    </Typography>
                                    <button
                                        className={classes.popupButton}
                                        onClick={() => setShowAdvancedRecoveryPopup(false)}>
                                        OK
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* Account Number and Key Recovery Section */}
                        {/* <Grid container
                alignItems="center"
                justifyContent="center"
                direction="col"
                className={classes.customGridPadding}
                style={{ marginTop: "20px" }}>
                <div style={{ margin: "8px", textAlign: "center", width: "100%" }}>
                    <button
                        onClick={handleAccountNumberRecovery}
                        style={{
                            fontSize: "12px",
                            textAlign: "center",
                            width: "100%",
                            maxWidth: "384px",
                            backgroundColor: "#fff",
                            border: "2px solid #18c2ee",
                            borderRadius: "5px",
                            color: "#000",
                            padding: "7px 15px",
                            fontWeight: "bolder",
                            cursor: "pointer"
                        }}>
                        I HAVE ACCOUNT NUMBER AND KEY
                    </button>
                </div>
                <Typography variant="body2" className={styles.mediumSizedText} style={{ textAlign: "center", marginTop: "8px" }}>
                    Select this if you have your account number and either your private key or your 24 word phrase (also called mnemonic)
                    </Typography>
                    </Grid> */}
                    </>
                )}
            </Box>
        </>
    );

};

export default MagicLinkRecovery;
