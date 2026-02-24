import React, { useEffect, useState, } from "react";
import {
    Box,
    Typography,
    Grid,
    TextField,
    Link,
    RadioGroup,
    FormControlLabel,
    Radio,
    Modal
} from "@material-ui/core";
import { useHistory,useLocation } from "react-router-dom";
import commonStyles from "./../../styles/common.module.scss";
import { makeStyles } from "@material-ui/core/styles";
import uiTexts from "./../../../configurations/dropp.json";
import { PrivateKey } from "@hashgraph/sdk";
import * as localstorage from "../../utils/local-storage";
import {
    fetchRecoveryOptions,
    resendEmailVerification,
    verifyEmail,
    verifyRecoveryOptions,
} from "../../api";
import styles from "../../styles/common.module.scss";
import OtpInput from "react-otp-input";
import { COMMON_ERROR_MSG, DEFAULT_DROPP_PIN } from "../../utils/constants";
import { sendMessage, getDeviceId } from "../../utils/utils";
import { Buffer } from "buffer";
import classNames from "classnames";

var CryptoJS = require("crypto-js");

const pageTexts = uiTexts.ValidateAccount;

const useStyles = makeStyles(theme => ({
    root: {
        display: "flex",
        flexWrap: "wrap",
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
    roundedInputField: {
        "& .MuiOutlinedInput-root": {
            borderRadius: "20px",
        },
    },
    customGridPadding: {
        padding: "1em 1em 0 1.4em",
    },
    customMarginSidesTop: {
        marginLeft:" 16px",
        marginRight: "16px",
        marginTop: "10px",
    },
    customTextField: {
          marginLeft: "2px",
          marginTop: "16px",
          marginBottom: "5px",
    },
    notValidatedMsg: {
        fontWeight: "400" ,
        marginLeft: "218px",
    },
    customOtpInput: {
        width: "3rem !important",
        height: "3rem",
        margin: "16px 0.5rem 16px 0", /* top & bottom 16px, right 0.5rem, left 0 */
        fontSize: "1.5rem",
        paddingLeft: "0 !important" ,
        borderRadius: "8px",
        border: "1px solid #ccc",
        textAlign: "center",
        outline: "none",
        transition: "border-color 0.2s ease, box-shadow 0.2s ease",
        backgroundColor: "#fff",
        cursor: "text",
        "&:focus": {
            borderColor: "#00bafc",
            boxShadow: "0 0 8px #00bafc88",
            outline: "none",
        },
    },
    customTextStyle: {
        color: "#00bafc",
        fontWeight: "700",
        marginBottom: "16px" ,
    },
    customLeftAlignMarginTop: {
        textAlign: "left",
        marginTop: "16px" ,
    },
    customMarginWidth: {
        marginLeft:" 2px",
        marginTop:" 8px",
        marginBottom:" 5px",
        width: "100%",
    },
    customClickableText: {
        fontSize: "14px",
        marginTop: "10px",
        textAlign: "center",
        cursor: "pointer",
        color: "#18c2ee",
    },
    submitBtn:{
        width: "90%",
        marginLeft: "5%"
    },
    buttonDisabled: {
        cursor: "not-allowed",
        opacity: ".35",
    },
    ctrlBtns: {
        marginTop: "10px",
        display :"flex",
        justifyContent:"space-around"
    },
    btnWidth: {
        minWidth:"83px"
    },
}));

export default function ValidateAccount({ publicKey,  }) {


    // const [otp, setOtp] = useState(["", "", "", ""]);
    const [otp, setOtp] = useState("");
    const [accountOption, setAccountOption] = useState("dropp");
    const [apiResponse, setApiResponse] = useState(null);
    const history = useHistory();
    const classes = useStyles();
    const location = useLocation();
    const phoneNumber = location.state?.phoneNumber;
    const accountId = location.state?.hedera_account_id;
    const [options, setOptions] = useState([]);
    const [errorMsg, setErrorMsg] = useState(null);
    const [keys, setKeys] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isOTPVerified, setIsOTPVerified] = useState(false);
    const [isValidOTP, setIsValidOTP] = useState(false);
    const [showValidationMsg, setShowValidationMsg] = useState(true);
    const [canResendOTP, setCanResendOTP] = useState(false);
    const [inputValues, setInputValues] = useState({
        bankAcctLast4Digits: "",
        cardLast4Digits: "",
        accountId: "",
        });
    const [validationErrors, setValidationErrors] = useState({});
    const [isResending, setIsResending] = useState(false);
    const [openErrModal, setOpenErrModal] = useState(false);
    const [backendErr, setBackendErr] = useState("");

    const handleModalClose = async () => {
        setOpenErrModal(false);
        return;
    }

    const navigateToLinkAcctSuccess = () => {
        setTimeout(() => {
            history.push("/firsttimeflow");
        }, 300);
    };

    const generateKeyPair = async () => {
         const privateKey = PrivateKey.generateED25519();
         const publicKey = privateKey.publicKey;

         const privateKeyBytes = privateKey.toBytesRaw(); // Uint8Array(32)
         const publicKeyBytes = publicKey.toBytesRaw();

         const privateKeyHex = Buffer.from(privateKeyBytes).toString("hex");
         const publicKeyHex = Buffer.from(publicKeyBytes).toString("hex");

         setKeys({ privateKey: privateKeyHex, publicKey: publicKeyHex });


    // Prepare user data object matching DroppRecovery.js structure
        let usrData = {
            publicKey: publicKeyHex,
            privateKey: privateKeyHex,
            magicUser: true,
            droppDeviceId: getDeviceId(),
        };

        await localstorage.decrypted.set({...usrData});
    };

    // Handlers for Back button
    const handleBack = () => {
        history.push("/gettingStarted");
    };

    //works
    const handleFetchRecoveryOptions = async () => {
        try {
            const response = await fetchRecoveryOptions({
                accountId,
                phone: phoneNumber || "",
            });
            let options = [];
            if (response?.responseCode == 0) {
                const dataToStore = response.data;
                if (dataToStore !== undefined) {
                    if (dataToStore.bankAcctLast4Digits) {
                        options.push({ value: "bank", label: "Verify ACH" });
                    }
                    if (dataToStore.cardLast4Digits) {
                        options.push({ value: "card", label: "Verify CC Card" });
                    }
                    if (dataToStore.accountId && dataToStore.accountId.length > 0) {
                        options.push({ value: "accountId", label: "Verify Dropp Acct ID" });
                    }
                    setOptions(options);
                    setApiResponse(dataToStore);
                    if (dataToStore.userId) {
                        const currentStorage = await localstorage.decrypted.get();
                        await localstorage.decrypted.set({
                            ...currentStorage,
                            userId: dataToStore.userId
                        });
                    }
                }
            }
            setErrorMsg(null);
            return { response, options };
        } catch (error) {
            console.error("Error fetching recovery options:", error);
            setErrorMsg(error.message || "Unknown error occurred");
        }
    };


    //works
    const handleResendVerification = async (responseData) => {
    try {
            if (!responseData || !responseData.email) {
                throw new Error("Response data or email not available");
            }
            const userEmail = responseData.email;
            const userId = responseData.userId;


            const response = await resendEmailVerification(userEmail, userId);
            return response;
        } catch (error) {
            console.error("Failed to resend verification email:", error);
        }
    };

    const sendOTPOnEmail = async () => {
        try {
            await handleResendVerification(apiResponse);
        } catch (error) {
            console.error("Failed to send OTP on email:", error);
        }
    };

    //works
    const onResendClick = async () => {
        if (!canResendOTP || isResending) return;

        setIsResending(true);
        await sendOTPOnEmail();
        setTimeout(() => setIsResending(false), 1500); // feel free to tweak timing
     };

    // newcode for useEffect etch the recovery options first, get the userId from response.data.userId
    useEffect(() => {
        async function generateKeys() {
            await generateKeyPair();
            await handleFetchRecoveryOptions();//setApiResponse object with userId
        }
        generateKeys();
    }, []);

    // useEffect(() => {
    //     // if (apiResponse && apiResponse.userId) {
    //     //     sendOTPOnEmail();
    //     // }
    // }, [apiResponse]);

    const handleVerifyEmail = async code => {
        try {
            const userId = apiResponse.userId;
            const response = await verifyEmail(code, userId);
            // Now you can use `response` for validation logic/UI updates
            if (response.responseCode === 0) {
                setIsOTPVerified(true);
                setIsValidOTP(true);
                setShowValidationMsg(false);
            } else {
                setOtp("");
                setIsOTPVerified(false);
                setIsValidOTP(false);
                setShowValidationMsg(true);
                setCanResendOTP(true);
            }
        // return response;
        } catch (error) {
            console.error("Failed to verify email:", error);
            setOtp("");
            setIsOTPVerified(false);
            setIsValidOTP(false);
            setShowValidationMsg(true);
            setCanResendOTP(true);
        }
    };

    const handleChangeInputChange = (event) => {
        const { name, value } = event.target;
        setInputValues(prev => ({ ...prev, [name]: value }));
    };
    // const handleChangeInputChange = (event) => {
    //     const { name, value } = event.target;
    //     setInputValues(prev => ({ ...prev, [name]: value }));

    //     // Validate only if we have API data and the field is not empty
    //     if (apiResponse && value.trim() !== "") {
    //         validateInput(name, value);
    //     }
    // };

    const handleSubmit = async () => {
        try {
            const response = await verifyRecoveryOptions({
                cardLast4Digits: inputValues.accountId ? false : apiResponse.cardLast4Digits,
                bankAcctLast4Digits: inputValues.accountId ? false : apiResponse.bankAcctLast4Digits,
                accountId: inputValues.accountId ? inputValues.accountId : apiResponse.accountId,
                last4Digits: apiResponse.cardLast4Digits ? (inputValues.cardLast4Digits ? parseInt(inputValues.cardLast4Digits, 10) : "") : (inputValues.bankAcctLast4Digits ? parseInt(inputValues.bankAcctLast4Digits, 10) : ""),
                userId:  apiResponse.userId,
            });
            if (response && response.responseCode == 0) {
                // Handle UI logic/validation here
                let localstorageData = await localstorage.decrypted.get();
                let usrData = {
                    ...localstorageData,
                    savedKeys: true,
                    isTokensAssociated: false,
                    activeNetwork: "main",
                    magicUser: true,
                };
                usrData = { ...usrData, mainnet: usrData };


                let encryptedData = CryptoJS.AES.encrypt(JSON.stringify({...usrData}), DEFAULT_DROPP_PIN).toString();
                await sendMessage(encryptedData, navigateToLinkAcctSuccess);
            } else {
                setBackendErr(response && response.errors ? response.errors[0] : COMMON_ERROR_MSG);
                setOpenErrModal(true);
            }
        } catch (error) {
            console.error("Recovery verification failed:", error);
            setBackendErr(COMMON_ERROR_MSG);
            setOpenErrModal(true);
            // Handle error display here
        }
        finally {
            setIsSubmitting(false);
  }
    };

//    useEffect(() => {
//             if (otp.length === 4) {
//               handleVerifyEmail(otp);
//             }
//             else  {
//               setIsOTPVerified(false);
//               setIsValidOTP(false); // mark invalid if incomplete OTP
//               setShowValidationMsg(false);
//     }
//      }, [otp]);

    //  const validateInput = (name, value) => {
    //     if (!apiResponse) return true; // No API data to validate against

    //     let isValid = true;

    //     switch (name) {
    //         case 'bankAcctLast4Digits':
    //             isValid = value.length === 4;
    //             break;
    //         case 'cardLast4Digits':
    //             isValid = value.length === 4;
    //             break;
    //         case 'accountId':
    //             // For accountId, check if it exists in the array
    //             isValid = apiResponse.accountId && apiResponse.accountId.includes(value);
    //             break;
    //         default:
    //             isValid = true;
    //     }

    //     setValidationErrors(prev => ({
    //         ...prev,
    //         [name]: !isValid
    //     }));

    //     return isValid;
    // };

    const getErrorMessage = (fieldName) => {
        switch (fieldName) {
            case 'bankAcctLast4Digits':
                return "Bank account last 4 digits don't match our records";
            case 'cardLast4Digits':
                return "Card last 4 digits don't match our records";
            case 'accountId':
                return "Account ID not found in our records";
            default:
                return "Value doesn't match our records";
        }
    };

    return (
        <Grid container mx= {2}>
            <Grid
                container
                alignItems="center"
                justifyContent="center"
                direction="row"
                className={classes.customGridPadding}>
                <Grid item xs={1}>
                    <img
                        src="./arrowBack.png"
                        alt="back"
                        onClick={handleBack}
                        style={{ cursor: "pointer" }}
                    />
                </Grid>
                <Grid item xs={11}>
                    <Typography
                        variant="h2"
                        className={`${styles.pageHeading} ${styles.darkBoldText}`}>
                        {pageTexts.heading}
                    </Typography>
                </Grid>
            </Grid>
                {errorMsg && (
                    <Typography color="error" variant="body2"  className={classes.customMarginSidesTop}>
                        {errorMsg}
                    </Typography>
                )}
            {/* <Grid
                container
                alignItems="center"
                justifyContent="center"
                direction="col"
                className={classes.customGridPadding}>
                <TextField
                    size="small"
                    className={`${commonStyles.inputFieldWithGreyBg} ${classes.roundedInputField} ${classes.customTextField}`}
                    label="Enter your email"
                    value={apiResponse?.email || ""}
                    disabled
                    variant="outlined"
                />
               <Typography
                    variant="body2"
                    color={isValidOTP ? "primary" : "error"}
                    fontWeight={400}
                    className={classes.notValidatedMsg}
                     >
                    {isValidOTP ? "Validated" : pageTexts.notValidatedMsg}
                </Typography>
            </Grid> */}
            <Grid
                container
                alignItems="center"
                justifyContent="center"
                direction="col"
                className={classes.customGridPadding}>
                {/* <Typography variant="body2" fontWeight={700}>
                    {pageTexts.subHeading}
                </Typography> */}
                {/* <Grid container direction="column" justifyContent="center" alignItems="center">
                    <OtpInput
                        value={otp}
                        onChange={(value) => {
                            if (/^\d*$/.test(value)) setOtp(value);
                        }}
                        numInputs={4}
                        inputType="password"
                        shouldAutoFocus
                        renderInput={(props) => (
                            <input
                                {...props}
                                className={classes.customOtpInput}
                                onFocus={(e) => (e.target.style.borderColor = "#00bafc")}
                                onBlur={(e) => (e.target.style.borderColor = "#ccc")}
                            />
                        )}
                    />

                    {showValidationMsg && !isValidOTP && otp.length === 0 && (
                        <Typography variant="body2" color="error" style={{ marginTop: 2 }}>
                            Invalid OTP
                        </Typography>
                    )}


                    <Grid item sx={{ mb: 2 }}>
                        <Link
                            to="#"
                            onClick={(e) => {
                                e.preventDefault();
                                    onResendClick();
                            }}
                            underline="none"
                            className={classes.customTextStyle}
                            style={{
                                pointerEvents: canResendOTP && !isResending ? "auto" : "none",
                                color: canResendOTP && !isResending ? "#18c2ee" : "#ccc",
                                transition: "opacity 0.3s",
                                opacity: isResending ? 0.6 : 1,
                            }}
                        >
                            {isResending ? "SENDING..." : "RESEND CODE"}
                        </Link>
                    </Grid>
                </Grid> */}
                <Grid container direction="column" justifyContent="center" alignItems="left">
                    {options.length > 2 && (
                            <Typography
                            variant="subtitle2"
                            className={classes.customLeftAlignMarginTop}
                            >
                            {pageTexts.verificationOptionText}
                            </Typography>
                        )}

                        {options.length > 0 && (
                            <Typography
                            variant="subtitle2"
                            className={classes.customLeftAlignMarginTop}
                            >
                            Choose verification option
                            </Typography>
                        )}

                    <RadioGroup
                        sx={{ mb: 2, mt: 1 }}
                        value={accountOption}
                        onChange={e => setAccountOption(e.target.value)}>
                        {options.length > 0 ? (
                            options.map(opt => (
                                <FormControlLabel
                                    key={opt.value}
                                    value={opt.value}
                                    control={<Radio color="primary" />}
                                    label={opt.label}
                                />
                            ))
                        ) : (
                            <div>{pageTexts.noRecovery}</div>
                        )}
                    </RadioGroup>
                </Grid>

                {accountOption === "bank" && (
                    <TextField
                        name="bankAcctLast4Digits"
                        type="tel"
                        inputProps={{ maxLength: 4, pattern: "[0-9]*" }}
                        value={inputValues.bankAcctLast4Digits}
                        onChange={handleChangeInputChange}
                        size="small"
                        className={`${commonStyles.inputFieldWithGreyBg} ${classes.roundedInputField} ${classes.customMarginWidth}`}
                        label="Enter Your Bank Account Last 4 Digits"
                        variant="outlined"
                        margin="dense"
                        fullWidth
                        error={validationErrors.bankAcctLast4Digits}
                        helperText={validationErrors.bankAcctLast4Digits ? getErrorMessage('bankAcctLast4Digits') : ""}

                    />
                )}
                {accountOption === "card" && (
                    <TextField
                        name="cardLast4Digits"
                        type="tel"
                        inputProps={{ maxLength: 4, pattern: "[0-9]*" }}
                        value={inputValues.cardLast4Digits}
                        onChange={handleChangeInputChange}
                        size="small"
                        className={`${commonStyles.inputFieldWithGreyBg} ${classes.roundedInputField} ${classes.customMarginWidth}`}
                        label="Enter Your Card Last 4 Digits"
                        variant="outlined"
                        margin="dense"
                        fullWidth
                         error={validationErrors.cardLast4Digits}
                         helperText={validationErrors.cardLast4Digits ? getErrorMessage('cardLast4Digits') : ""}
                    />
                )}
                {accountOption === "accountId" && (
                        <TextField
                            name="accountId"
                            value={inputValues.accountId}
                            onChange={handleChangeInputChange}
                            label="Enter Your Account Id"
                            variant="outlined"
                            size="small"
                            className={`${commonStyles.inputFieldWithGreyBg} ${classes.roundedInputField} ${classes.customMarginWidth}`}
                            fullWidth
                            margin="dense"

                             error={
                                (inputValues.accountId !== "" &&
                                !/^(0|(?:[1-9]\d*))\.(0|(?:[1-9]\d*))\.(([1-9]\d*))$/.test(inputValues.accountId)) ||
                                validationErrors.accountId
                            }
                            helperText={
                                inputValues.accountId !== "" &&
                                !/^(0|(?:[1-9]\d*))\.(0|(?:[1-9]\d*))\.(([1-9]\d*))$/.test(inputValues.accountId)
                                    ? "Invalid Account ID . Use format: 0.0.0"
                                    : validationErrors.accountId
                                    ? getErrorMessage('accountId')
                                    : ""
                            }
                        />
                )}
                <Box mt={3} mb={2} display="flex" justifyContent="center">
                    <Link
                        href="mailto:support@dropp.cc"
                        className={classes.customClickableText}>
                        {pageTexts.contact}
                    </Link>
                </Box>
            </Grid>
             <Grid item xs={12}>
                <div className="footer">
                <button
                    className={`${styles.circularBtn} ${styles.primaryBtn} ${classes.submitBtn} ${(isSubmitting) ? classes.buttonDisabled : ""}`}
                     onClick={handleSubmit}
                      disabled={isSubmitting}
                >
                      {isSubmitting ? "Submitting..." : "SUBMIT"}
                </button>
                </div>
            </Grid>
            <Modal open={openErrModal} className={styles.modalAtCenter} >
                <Box className={styles.modalContainer}>
                    <Typography>
                        {backendErr}
                    </Typography>
                    <div className={classes.ctrlBtns} >
                        <button className={classNames(["button-done", classes.btnWidth])} onClick={handleModalClose}>OK</button>
                    </div>
                </Box>
            </Modal>
        </Grid>
    );
}
