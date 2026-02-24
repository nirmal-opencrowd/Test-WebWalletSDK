import React, { useRef } from "react";
import { useHistory } from "react-router-dom";
import jsQR from "jsqr";
// import Jimp from 'jimp/browser/lib/jimp'
import {Jimp} from 'jimp'
import forge from "node-forge";
// import { Ed25519PrivateKey } from "@hashgraph/sdk";
import { PrivateKey } from "@hashgraph/cryptography";
import {Mnemonic} from "@hashgraph/sdk";
import { useAlert } from "react-alert";
import {TC} from "./../UserAgreement";
import {PP} from "./../PrivacyPolicy";
import { makeStyles } from '@material-ui/core/styles';
import { sendHintToUser, accountRecovered } from "../../api";
import * as localstorage from "../../utils/local-storage";
import * as p2phelper from "../../utils/p2phelper.js";
import { isFirefox, isSafari, sendMessage } from "../../utils/utils";
import { DEFAULT_DROPP_PIN } from "./../../utils/constants";

import {
    FormControl,
    Grid,
    InputAdornment,
    InputLabel,
    OutlinedInput,
    Modal,
    Typography,
    TextField,
    CircularProgress,
    Box
} from "@material-ui/core";
import classNames from "classnames";
import { Buffer } from 'buffer';
window.Buffer = Buffer;
var bip39 = require("bip39");
var CryptoJS = require("crypto-js");

const ed25519 = forge.pki.ed25519;
const previewStyle = {
    marginTop: "5px",
    height: 150,
    width: 150,
};

const useStyles = makeStyles((theme) => ({
    modalStyle: {
        background: "rgb(255, 255, 255)",
        border: "2px solid rgb(24, 194, 238)",
        borderRadius: "4px",
        inset: "50% auto auto 50%",
        marginRight: "-50%",
        maxHeight: "300px",  //"600px",
        maxWidth: "400px",  //"800px"
        outline: "none",
        overflow: "auto",
        padding: "5px",
        position: "absolute",
        transform: "translate(-50%, -50%)"
    },
    backdropStyle: {
        backgroundColor: "rgba(255, 255, 255, .75) !important"
    },
    greyBackground: {
        backgroundColor: "#f9f9f9",
        borderRadius:"10px",
        marginTop: "10px",
        maxWidth:"384px",
        padding: "10px",
        width:"93%",
    },
    modalAtCenter : {
        alignItems:"center",
        display:"flex",
        justifyContent:"center",
    },
    modalContainer: {
        backgroundColor: '#FFFFFF',
        border: 0,
        padding: "15px",
        width: 250,
    },
    button:{
        cursor:"pointer"
    },
    btnWidth: {
        minWidth:"83px"
    },
    blueBorderedButton:{
        border: "1px solid #18C2EE",
        backgroundColor: "#ffffff",
        color: "#000000",
        width:"100%"
    },
    loader: {
        display:"flex",
        justifyContent:"center",
        alignItems:"center",
        marginTop:"20px",
        color:"#18C2EE"
    },
    zIndexZero: {
        zIndex: 0
    },
    logoDiv: {
        marginTop: "10px",
        textAlign: "center"
    },
    fontWeight600: {
        fontWeight: "600"
    },
    uploadGrid: {
        marginTop: "15px",
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center'
    },
    qrImg: {
        backgroundColor: "#FFFFFF",
        display: 'block'
    },
    qrPlaceholder: {
        fontSize: "1rem",
        position: "absolute",
        textAlign: "center",
        top: "45%",
        width: "150px"
    },
    hiddenInput: {
        display: 'none'
    },
    uploadDiv: {
        marginTop: "8px",
        textAlign: "center"
    },
    passphraseGrid: {
        margin: "10px 0px",
        textAlign: "center"
    },
    textAlignStart: {
        textAlign: "start"
    },
    labelMargin: {
        marginBottom: "7px"
    },
    passphraseField: {
        height: "35px",
        width: "100%",
        backgroundColor: "#ffffff"
    },
    termsTable: {
        margin: "0 10px",
        maxWidth: "384px"
    },
    tdPadding: {
        paddingTop: "3px",
        paddingRight: "8px"
    },
    checkboxError: {
        borderColor: "#f44336"
    },
    textAlignLeft: {
        textAlign: "left"
    },
    linkStyle: {
        cursor: "pointer",
        color: "#18C2EE"
    },
    errorTypography: {
        fontWeight: 600
    },
    okButtonDiv: {
        marginTop: "20px",
        textAlign: "center"
    },
    errorDiv: {
        textAlign: "center",
        marginTop: "10px"
    },
    linkButton: {
        margin: "5px 0 10px",
        maxWidth: "384px",
        width: "90%"
    },
    modalContent: {
        maxWidth: '800px',
        maxHeight: '600px',
        top: '50%',
        left: '50%',
        right: 'auto',
        bottom: 'auto',
        marginRight: '-50%',
        transform: 'translate(-50%, -50%)',
        border: '2px solid rgb(24, 194, 238)'
    },
    backButton: {
        cursor: "pointer"
    },
  }));

let userEnv = ''


const DroppRecovery = props => {
    const [result, setResult] = React.useState("");
    const [image, setImage] = React.useState(null)
    const [passphrase, setPassphrase] = React.useState("");
    const [pin, setPin] = React.useState("");
    const [renterPin, setRenterPin] = React.useState("");
    const [userData, setUserData] = React.useState({});
    const [errorMessage, setErrorMessage] = React.useState("");
    const [net, setNet] = React.useState("");
    const [modalIsOpen1,setIsOpen1] = React.useState(false);
    const [modalIsOpen2,setIsOpen2] = React.useState(false);
    const [checkbox,setCheckbox] = React.useState(false);
    const [passphraseError,setPassphraseError] = React.useState(false);
    const [pinError,setPinError] = React.useState(false);
    const [reenterPinError,setReenterPinError] = React.useState(false);
    const [acceptTermsError,setAcceptTermsError] = React.useState(false);
    const [sendHintMsg, setSendHintMsg] = React.useState({});
    const [openErrModal, setOpenErrModal] = React.useState(false);
    const [qrErr, setQrErr] = React.useState(null);
    const history = useHistory();

    const qrReaderRef = useRef(null);
    const alert = useAlert();
    var subtitle;


    const classes = useStyles();


    React.useEffect(() => {
        async function restoreSandbox() {
            const localstorageData = await localstorage.decrypted.get();
            if (localstorageData && localstorageData.p) {
            //    setPassphrase(localstorageData.p);
               setCheckbox(true);
            //    await linkAccount();
            }
        }

        const qrData = props.result;
        setResult(qrData);
        if (qrData) {
            setEnv(JSON.parse(qrData)?.env);
        }

        if (props.switchToSandbox) {
            if (userEnv == "sandbox" || userEnv == "qa") {
                restoreSandbox();
            }
        } else {
            if (userEnv == "sandbox") {
                props.resetQRCode();
            } else {
                sendMessage({});
            }
        }
    }, []);
        React.useEffect(() => {
        if (!passphrase) return;

        const timer = setTimeout(() => {
            if (passphrase.trim().length >= 4) {
            setPassphraseError(false);

            // only clear message if it was about passphrase
            if (
                errorMessage === "Please enter your recovery password" ||
                errorMessage === "Password must be at least 4 characters long" ||
                errorMessage === "Please enter a valid recovery password"
            ) {
                setErrorMessage("");
            }
            }
        }, 1000); // debounce delay

        return () => clearTimeout(timer);
        }, [passphrase]);

    // React.useEffect(() => {
    //     async function linkTestAccount() {
    //         if(props.switchToSandbox && result && passphrase && checkbox) {
    //            await linkAccount();
    //         }
    //     }
    //     linkTestAccount();
    // }, [result, passphrase, checkbox])

    function openModal1() {
      setIsOpen1(true);
    }

    function openModal2() {
      setIsOpen2(true);
    }

    function afterOpenModal() {
      // references are now sync'd and can be accessed.
      subtitle.style.color = '#f00';
    }

    function closeModal(){
      setIsOpen1(false);
      setIsOpen2(false);
    }

    function clearSendHintMsg() {
        setTimeout(function () {
            setSendHintMsg({});
        }, 5000);
    }





    const validate = () => {
        if (!result) {
            setErrorMessage("Enter a valid QR");
            return false;
        }
        if (passphrase && passphrase.trim().length<4) {
            setErrorMessage("Password must be at least 4 characters long");
            setPassphraseError(true);
            return false;
        }
        if (!passphrase) {
            setErrorMessage("Please enter your recovery password");
            setPassphraseError(true);
            return false;
        }
        if(!checkbox){
          setErrorMessage("Please Agree to Privacy Policy & User Agreement");
          setAcceptTermsError(true);
          return false;
        }
        return true;
    };

    const getDecryptedUserData = async (data, skipPassphrase) => {
        if (data.slice(0, 1) === "@") {
            return await decryptOld(data);
        } else {
            return await decryptNew(data, skipPassphrase);
        }
    };

    function resetErrors() {
        setErrorMessage("");
        setPassphraseError(false);
        setPinError(false);
        setReenterPinError(false);
        setAcceptTermsError(false);
        setSendHintMsg({});
    }

    // const sendMessage = (encryptedData, cb) => {
    //     let decrypted = "";
    //     if (encryptedData) {
    //         try {
    //             decrypted = JSON.parse(
    //                 CryptoJS.AES.decrypt(encryptedData, DEFAULT_DROPP_PIN).toString(CryptoJS.enc.Utf8)
    //             );
    //         } catch(err) {
    //             decrypted = "";
    //         }
    //     }

    //     try {
    //         chrome.runtime.sendMessage(
    //             { type: "link", _encrypted: encryptedData, _decrypted: decrypted, port: net, env: userEnv },
    //             function (response) {
    //                 cb?.() // eslint-disable-line
    //             }
    //         );
    //     } catch (e) {
    //         cb?.(); // eslint-disable-line
    //     }
    // };

    const showSandboxRecoveryModal = () => {
        props.setScreenWithData("sandboxRecoveryModal", {showSandboxRecoveryModal : true});
    }

    const navigateToLinkAcctSuccess = async () => {
            navigator.geolocation.getCurrentPosition(
            async (pos) => {
                try {
                await accountRecovered({
                    recoveryMethod: "Web Extension Advance Recovery",
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
                    recoveryMethod: "Web Extension Advance Recovery",
                    device: "web",
                    location: "",
                });
                } catch (err) {
                console.error("accountRecovered API failed:", err);
                }
            },
            { timeout: 5000 }
            );

            props.history.push("/dashboard");
    };

    const handleCheckboxChange = () => {
      setCheckbox(!checkbox)
    }

    const handleResendHint = async () => {
        if (result) {
            let data;
            if (props.switchToSandbox) {
                const localData = await localstorage.decrypted.get();
                data = localData.mainnet;
            } else {
                data = await getDecryptedUserData(result, true);
            }

            if (data) {
                let response = await sendHintToUser(data);
                if (response && response.responseCode === 0) {
                    setSendHintMsg({type: "success", msg: "Passphrase hint sent successfully!"});
                    clearSendHintMsg();
                } else if (response && response.errors && response.errors.length) {
                    setSendHintMsg({type: "error", msg: response.errors[0] ? response.errors[0] : "Unable to send hint"});
                    clearSendHintMsg();
                }
            } else {
                setSendHintMsg({type: "error", msg: "Invalid QR"});
                clearSendHintMsg();
            }
        }
    };

    const openImageDialog = () => {
        qrReaderRef.current.click();
    };

    const getQRCode = () => {
        const img = qrReaderRef.current.files[0]
        const reader = new FileReader();
        reader.addEventListener("load", async function() {

            const image = await Jimp.read(this.result)
                .catch(console.error);

            const imageData = new Uint8ClampedArray(image.bitmap.data.buffer)

            const code = jsQR(imageData, image.bitmap.width, image.bitmap.height)

            if (code?.data) {
                 console.log("QR code scanned, data:", code.data);
                if(JSON.parse(code.data)?.env !== "SB"){
                    setEnv(JSON.parse(code.data)?.env);
                    setResult(code.data)
                    await sendMessage({})
                } else {
                    setQrErr("We have streamlined support for test accounts. As such, older test accounts are not supported.");
                    setOpenErrModal(true);
                }
            }
        });

        reader.readAsArrayBuffer(img);

        const readerForUrl = new FileReader()

        readerForUrl.onload = function(e) {
            setImage(e.target.result)
        }

        readerForUrl.readAsDataURL(img)
    }

    const setEnv = (env) => {
        if (env === "SB") {
            userEnv = "sandbox";
        } else if (env === "D") {
            userEnv = "testnet";
        } else if (env === "QA") {
            userEnv = "qa";
        } else {
            userEnv = "mainnet";
        }
    };

    const decryptNew = async (backupString, skipPassphrase) => {
        let encryptedBackupString = backupString;
        let encryptedBackupJson = {};
        try {
            encryptedBackupJson = JSON.parse(backupString);
              console.log("decryptNew: Parsed backup JSON", encryptedBackupJson);
        } catch(err) {
            encryptedBackupJson = {};
             console.error("decryptNew: Could not parse backupString", backupString, err);
        }
        let entropyStr = encryptedBackupJson["e"];
        if (!entropyStr) {
            entropyStr = encryptedBackupJson["eds"];
        }
         console.log("decryptNew: entropyStr", entropyStr);
        if (entropyStr) {
            let encryptedEntropy = forge.util.decode64(entropyStr);
            let entropyHashString = encryptedBackupJson["h"];
            let entropyHash = forge.util.decode64(entropyHashString);
            let userId = encryptedBackupJson["u"];


            //AES
            let decryptedBackupString = forge.util.decode64(entropyStr);
            let byteBufferStringRequiredByForge = forge.util.createBuffer(decryptedBackupString);

            // DERIVED KEY

            try {
                var salt = forge.util.hexToBytes("ff");
                var keygen = forge.pkcs5.pbkdf2(passphrase, salt, 2048, 32, "sha512");
                //var keygen = forge.pkcs5.pbkdf2('test', salt, 2048, 32,'sha512');

                // AES DECRYPT
                let decipher = forge.cipher.createDecipher("AES-CTR", keygen);
                decipher.start({
                    iv: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
                });
                decipher.update(byteBufferStringRequiredByForge);
                decipher.finish();

                let utf8DecryptedOpRaw = decipher.output.data;
                 console.log("decryptNew: Decrypted output raw", utf8DecryptedOpRaw);
                let md = forge.md.md5.create();
                md.update(utf8DecryptedOpRaw);
                console.log("decryptNew: salt, passphrase, keygen", salt, passphrase, keygen);
                if ((md.digest().toHex().toLowerCase() == forge.util.bytesToHex(entropyHash).toLowerCase()) || skipPassphrase) {
                    // let decoded64Entropy = forge.util.decode64(utf8DecryptedOpRaw);
                    let entropyHex = forge.util.bytesToHex(utf8DecryptedOpRaw);
                    let DerivedEd25519KeyPair;
                    if (encryptedBackupJson["e"]) {
                        let mnemonic = bip39.entropyToMnemonic(entropyHex);
                        const recoveredMnemonic = await Mnemonic.fromString(mnemonic.toString());
                        const recoveredRootKey = await recoveredMnemonic.toPrivateKey();
                        DerivedEd25519KeyPair = await recoveredRootKey.derive(0);
                        // var Ed25519KeyPair = await Ed25519PrivateKey.fromMnemonic(mnemonic, "");
                        // DerivedEd25519KeyPair = await PrivateKey.fromMnemonic(mnemonic, "");
                        // DerivedEd25519KeyPair = await Ed25519KeyPair.derive2(0);
                    } else if (encryptedBackupJson["eds"]) {
                        DerivedEd25519KeyPair = await PrivateKey.fromString(entropyHex);
                    }

                    const publicKey = DerivedEd25519KeyPair._key && DerivedEd25519KeyPair._key._key ? DerivedEd25519KeyPair._key._key._keyPair.publicKey : DerivedEd25519KeyPair._key._keyPair.publicKey;
                    const publicKeyHex = p2phelper.bytesToHex(publicKey);
                    const privateKey = DerivedEd25519KeyPair._key && DerivedEd25519KeyPair._key._key ? DerivedEd25519KeyPair._key._key._keyPair.secretKey : DerivedEd25519KeyPair._key._keyPair.secretKey;
                    const privateKeyHex = p2phelper.bytesToHex(privateKey);

                    let randomBytes = forge.util.createBuffer("KeyPairTest");
                    let sig = signWithKeyAndVerify(randomBytes, privateKeyHex, publicKeyHex);

                    if (sig) {
                        let usrData = {
                            publicKey: publicKeyHex,
                            privateKey: privateKeyHex,
                            userId: userId,
                            e: encryptedBackupJson["e"],
                            p: passphrase,
                            eds: encryptedBackupJson["eds"],
                            savedKeys: true,
                            isTokensAssociated: false,
                            activeNetwork: props.switchToSandbox ? "test" : "main",
                            env: userEnv,
                        }
                        if(props.switchToSandbox) {
                            let localstorageData = await localstorage.decrypted.get();
                            delete localstorageData["configInfo"];
                            return {
                                ...usrData,
                                testnet: {...usrData},
                                mainnet: {...localstorageData.mainnet}
                            }
                        }
                        return { ...usrData, mainnet: usrData };
                    } else {
                        return undefined;
                    }
                    // return {
                    //     entropy: utf8DecryptedOpRaw,
                    //     userId: userId,
                    // };
                } else {
                    return undefined;
                }
            } catch (e) {
                setErrorMessage("Please enter a valid recovery password");
                setPassphraseError(true);
            }
        } else {
            setErrorMessage("Enter a valid QR");
        }
    };

    const decryptOld = async backupString => {
        // BACKUP STRING
        let encryptedBackupString = backupString.slice(1);
        // let encryptedBackupString = backupString

        //AES
        let decryptedBackupString = forge.util.decode64(encryptedBackupString);

        let bytes = new Uint8Array(decryptedBackupString.length);
        for (let i = 0; i < decryptedBackupString.length; i++) {
            bytes[i] = decryptedBackupString.charCodeAt(i);
        }

        let byteBufferStringRequiredByForge = forge.util.createBuffer(decryptedBackupString);

        // DERIVED KEY
        var salt = forge.util.hexToBytes("ff");
        var keygen = forge.pkcs5.pbkdf2(passphrase, salt, 2048, 32, "sha512");
        //var keygen = forge.pkcs5.pbkdf2('123456', salt, 2048, 32,'sha512');

        let decipher = forge.cipher.createDecipher("AES-CTR", keygen);
        decipher.start({
            iv: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        });
        decipher.update(byteBufferStringRequiredByForge);
        decipher.finish();
        let combine = decipher.output.getBytes();

        let entropy = combine.slice(0, 32);
        let entropyHex = forge.util.bytesToHex(entropy);
        let publickKey = combine.slice(32, 64);
        let publickKeyHex = forge.util.bytesToHex(publickKey);
        let emailData = combine.slice(64, combine.length - 48);
        let randomBytes = forge.util.createBuffer("KeyPairTest");
        let mnemonic = bip39.entropyToMnemonic(entropyHex);

        // var Ed25519KeyPair = await Ed25519PrivateKey.fromMnemonic(mnemonic, "");
        // var Ed25519KeyPair = await PrivateKey.fromMnemonic(mnemonic, passphrase);
        // var privateKey = (await Ed25519KeyPair.derive2(0))._keyData;
        const recoveredMnemonic = await Mnemonic.fromString(mnemonic.toString());
        const recoveredRootKey = await recoveredMnemonic.toPrivateKey();
        var Ed25519KeyPair = await recoveredRootKey.derive(0);
        var privateKey = Ed25519KeyPair._keyPair.secretKey;
        var privateKeyHex = p2phelper.bytesToHex(privateKey);

        let sig = signWithKeyAndVerify(randomBytes, privateKeyHex, publickKeyHex);

        if (sig) {
            return {
                publicKey: publickKeyHex,
                privateKey: privateKeyHex,
                email: emailData,
            };
        } else {
            return undefined;
        }
    };

    const signWithKeyAndVerify = (txBodyBytes, privateKeyHex, publicKeyHex) => {
        let message = txBodyBytes;
        let encoding = "utf8";
        let privateKey = forge.util.hexToBytes(privateKeyHex);
        let publicKey = forge.util.hexToBytes(publicKeyHex);
        let signature = ed25519.sign({
            message,
            encoding,
            privateKey,
        });

        let verified = ed25519.verify({
            message,
            encoding,
            signature,
            publicKey,
        });
        if (verified === false) {
            return undefined;
        }
        return signature;
    };

    const linkAccount = async () => {
        resetErrors();
            if (validate()) {
                let data = await getDecryptedUserData(result);

                if (data) {
                    setUserData(data);
                    let localstorageData = await localstorage.decrypted.get();
                    let encryptedData = CryptoJS.AES.encrypt(JSON.stringify({...data, deviceInfo: localstorageData.deviceInfo}), DEFAULT_DROPP_PIN).toString();
                    await sendMessage(encryptedData, props.switchToSandbox ? showSandboxRecoveryModal : navigateToLinkAcctSuccess, userEnv);
                } else if (!errorMessage) {
                    setErrorMessage("Please enter a valid recovery password");
                    setPassphraseError(true);
            }
        }
        return true;
    };

    const handleErrModalClose = () => {
        setQrErr(null);
        setOpenErrModal(false);
        props.resetQRCode();
    }

const goToMagicLinkRecovery = () => {
  try {
    console.log("Navigating to Magic Link Recovery", history.push("/magiclinkrecovery?from=gettingStarted"));
    history.push("/magiclinkrecovery?from=gettingStarted");
  } catch (error) {
    console.error("Error navigating to Magic Link Recovery:", error);
  }
};

    return (
        <>
                        <Grid item xs={12}>
                            <img
                                src="./arrowBack.png"
                                alt="back"
                                onClick={goToMagicLinkRecovery}
                                className={classes.backButton}
                            />
                        </Grid>
        
            <Grid className={classNames(classes.zIndexZero, (isFirefox() || isSafari()) ? "linkAccount" : "")} container item direction="column" alignContent="center" alignItems="center">
                {!props.switchToSandbox ?
                    <div className={classes.logoDiv}>
                        <img height="40px" width="96px" src="./dropp_logo.png" />
                    </div>
                : ""}
                {!props.switchToSandbox ?
                    <div className={classes.greyBackground}>
                        <div className={classes.textAlignStart}>
                            <Typography variant="body2" className={classes.fontWeight600}>
                                Link your dropp Account
                            </Typography>
                        </div>
                        <div className={classes.textAlignStart}>
                            <Typography variant="body2">
                                Upload the QR code you saved earlier and enter the QR code passphrase you had set.
                            </Typography>
                        </div>
                    </div>
                : ""}
                <div className={classes.greyBackground}>
                    {!props.switchToSandbox && !props.isQrCodeScaned ?
                        <Grid item className={classes.uploadGrid}>
                            <div style={{position: "relative"}}>
                                <img src={image} height={150} width={150} className={classes.qrImg} />
                                {!result && <div className={classes.qrPlaceholder}>QR Code</div>}
                            </div>
                            <input
                                ref={qrReaderRef}
                                onChange={getQRCode}
                                type="file"
                                id="imgupload"
                                className={classes.hiddenInput}
                            />

                            <div className={classes.uploadDiv}>
                                <button
                                    className={classNames(["button-cancel", classes.button, classes.blueBorderedButton])}
                                    onClick={openImageDialog}
                                >
                                    Upload
                                </button>
                                {/* <label style={{ color: "#18C2EE", fontSize: "15px" }} onClick={openImageDialog}>
                                    <u>
                                        <b>Upload</b>
                                    </u>
                                </label> */}
                            </div>
                        </Grid>
                        : ''
                    }


                    {/* <Grid item style={{ marginTop: "30px", textAlign: "left", width: "250px" }}>
                    <FormControl variant="outlined" className="" style={{ width: "100%" }}>
                        <InputLabel id="network-label">Network</InputLabel>
                        <Select
                            labelId="network-label"
                            id="network"
                            value={net}
                            onChange={e => {
                                setNet(e.target.value);
                            }}
                            label="Network">
                            <MenuItem value={7100}>Main net</MenuItem>
                            <MenuItem value={6001}>Test net</MenuItem>
                        </Select>
                    </FormControl>
                </Grid> */}

                    <Grid item className={classes.passphraseGrid}>
                        <br />
                        <FormControl
                            error={passphraseError}
                            className={classes.textAlignStart}
                            variant="outlined">
                            <label className={classes.labelMargin}><Typography variant="body2" >{!props.switchToSandbox ? "Enter QR Code Passphrase" : "Enter Passphrase"}</Typography></label>
                            <TextField
                                className={classes.passphraseField}
                                type="password"
                                variant="outlined"
                                size="small"
                                id="passphrase"
                                value={passphrase}
                                onChange={e => setPassphrase(e.target.value)}
                            />
                        </FormControl>
                    </Grid>
                    {/* {result && <div style={{ marginTop: "7px", fontSize: "12px", textAlign: "center" }}>
                        <div><span style={{ color: "#18C2EE", cursor: "pointer", textDecoration: "underline", }} onClick={handleResendHint}>Send passphrase hint to my mobile</span></div>
                        {(Object.keys(sendHintMsg).length > 0) ? <div style={{ color: `${sendHintMsg.type === "success" ? "#2c662d" : "#FF5858"}` }}><strong>{sendHintMsg.msg}</strong></div> : ''}
                    </div>} */}

                    {/* <Grid item style={{ marginTop: "25px" }}>
                        <Grid item container direction="column">
                            <Grid item style={{ width: "200px", marginRight: "1em" }}>
                                <FormControl
                                    error={pinError}
                                    fullWidth
                                    style={{
                                        color: "",
                                    }}
                                    variant="outlined">
                                    <InputLabel htmlFor="pin">Protect your Wallet</InputLabel>
                                    <OutlinedInput
                                        placeholder="PIN"
                                        type="password"
                                        id="pin"
                                        value={pin}
                                        onChange={e => setPin(e.target.value)}
                                        startAdornment={
                                            <InputAdornment position="start">
                                                <i
                                                    style={{ color: "#aaa" }}
                                                    className="fa fa-lock fa-lg fa-fw"
                                                    aria-hidden="true"
                                                />
                                            </InputAdornment>
                                        }
                                        labelWidth={135}
                                    />
                                </FormControl>
                            </Grid>
                            <Grid item style={{ width: "200px", marginRight: "1em", marginTop: "1em" }}>
                                <FormControl
                                    error={reenterPinError}
                                    fullWidth
                                    style={{
                                        color: "",
                                    }}
                                    variant="outlined">
                                    <InputLabel htmlFor="reenterpin">Protect your Wallet</InputLabel>
                                    <OutlinedInput
                                        placeholder="Re-enter PIN"
                                        type="password"
                                        id="reenterpin"
                                        value={renterPin}
                                        onChange={e => setRenterPin(e.target.value)}
                                        startAdornment={
                                            <InputAdornment position="start">
                                                <i
                                                    style={{ color: "#aaa" }}
                                                    className="fa fa-lock fa-lg fa-fw"
                                                    aria-hidden="true"
                                                />
                                            </InputAdornment>
                                        }
                                        labelWidth={135}
                                    />
                                </FormControl>
                            </Grid>
                        </Grid>
                    </Grid> */}
                </div>
                {!props.switchToSandbox ?
                    <table className={classes.termsTable}>
                        <tbody>
                            <tr>
                                <td className={classes.tdPadding}>
                                    <label className="checkbox-label">
                                        <input type="checkbox" onClick={handleCheckboxChange}/>
                                        <span className={classNames("checkbox-custom rectangular", acceptTermsError && classes.checkboxError)} />
                                    </label>
                                </td>
                                <td>
                                    <div className="input-title">
                                        <h4 className={classes.textAlignLeft}>I have read and agree to both <u className={classes.linkStyle} onClick={openModal2}>privacy policy</u> and <u className={classes.linkStyle} onClick={openModal1}>user agreement</u></h4>
                                        <Modal
                                        open={modalIsOpen1}
                                        onRendered={afterOpenModal}
                                        onClose={closeModal}
                                        BackdropProps={{className: classes.backdropStyle}}
                                        >

                                            <div
                                            className={classes.modalContent}
                                            ref={_subtitle => (subtitle = _subtitle)}
                                            dangerouslySetInnerHTML={{
                                                __html: TC
                                            }}></div>

                                        </Modal>
                                        <Modal
                                        open={modalIsOpen2}
                                        onRendered={afterOpenModal}
                                        onClose={closeModal}
                                        BackdropProps={{className: classes.backdropStyle}}
                                        >

                                            <div
                                            className={classes.modalContent}
                                            ref={_subtitle => (subtitle = _subtitle)}
                                            dangerouslySetInnerHTML={{
                                                __html: PP
                                            }}></div>

                                        </Modal>
                                        <Modal
                                            open={openErrModal}
                                            onClose={handleErrModalClose}
                                            className={classes.modalAtCenter}
                                        >
                                            <Box className={classes.modalContainer}>
                                                <Typography className={classes.errorTypography}>
                                                    Error
                                                </Typography>
                                                <Typography variant='subtitle2'>
                                                    {qrErr}
                                                </Typography>
                                                <div className={classes.okButtonDiv}>
                                                    <button className={classNames([ "button-done", classes.btnWidth])} onClick={handleErrModalClose}>OK</button>
                                                </div>
                                            </Box>
                                        </Modal>
                                    </div>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                : ""}
                {errorMessage && (
                    <div
                        className={classNames("alert error browser", classes.errorDiv)}>
                        <strong>{errorMessage}</strong>
                    </div>
                )}
                <button className={classNames("button-done", classes.linkButton)} onClick={linkAccount}>
                    LINK ACCOUNT
                </button>
            </Grid>
        </>
    );
};

export default DroppRecovery;
