import React from "react";
import ArrowBackOutlinedIcon from '@material-ui/icons/ArrowBackOutlined';
import { makeStyles } from '@material-ui/core/styles';
import Box from "@material-ui/core/Box";
import Typography from "@material-ui/core/Typography";
import { hederaAccountToString } from "./../../utils/utils";
import * as localstorage from "./../../utils/local-storage";
import Visibility from '@material-ui/icons/Visibility';
import VisibilityOff from '@material-ui/icons/VisibilityOff';
import Tooltip from "@material-ui/core/Tooltip";
import FormControl from '@material-ui/core/FormControl';
import TextField from '@material-ui/core/TextField';
import InputAdornment from '@material-ui/core/InputAdornment';
import Copy from "./Copy";
import Modal from '@material-ui/core/Modal';
import forge from "node-forge";
import InfoOutlinedIcon from "@material-ui/icons/InfoOutlined";
import classNames from "classnames";
import PassphraseModal from "../PassphraseModal";
import commonStyles from "./../../styles/common.module.scss";
import uiTexts from "./../../../configurations/dropp.json";
import { Grid } from "@material-ui/core";
import { magicInstance } from "./../../components/MagicLink";

var bip39 = require("bip39");

const useStyles = makeStyles((theme) => ({
  detailContainer: {
    marginTop:"30px",
    overflowY:"scroll",
    paddingLeft:"20px",
    paddingRight:"20px",
  },
  keyField: {
    width: "100%",
  },
  multilineInput: {
    '& .MuiInput-multiline': {
      paddingTop: 0
    }
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
  selectField: {
    borderRadius: '20px',
    '& .MuiOutlinedInput-root': {
      borderRadius: '20px',
      color: "grey",
    },
  },
  sendThisToMeBtn: {
    maxWidth: "82%",
  }
}));

const pageTexts = uiTexts.hbarDetails;

const HbarDetails =({setCurrentScreen, userDetails, data}) => {
  const [localUserData, setLocalUserData] = React.useState(null);
  const [showDemoPrivateKey, setShowDemoPrivateKey] = React.useState(true);
  const [showMnemonics, setShowMnemonics] = React.useState(true);
  const [openConfirmModal, setOpenConfirmModal] = React.useState(false);
  const [openPassphraseModal, setOpenPassphraseModal] = React.useState(false);
  const [passphraseMatched, setPassphraseMatched] = React.useState(false);
  const [showType, setShowType] = React.useState("");
  const [clickType, setClickType] = React.useState("");
  const classes = useStyles();

  const toggleShowDemoPrivateKey = () => {
    setShowType("privateKey");
    if (showDemoPrivateKey && !passphraseMatched) {
      setOpenPassphraseModal(true);
    } else {
      setShowDemoPrivateKey(!showDemoPrivateKey);
    }

  }
  const toggleShowMnemonics = () => {
    setShowType("mnemonics");
    if (showMnemonics && !passphraseMatched) {
      setOpenPassphraseModal(true);
    } else {
      setShowMnemonics(!showMnemonics);
    }
  }

  React.useEffect(() => {
    if(passphraseMatched && showDemoPrivateKey && showType == "privateKey"){
      setShowDemoPrivateKey(!showDemoPrivateKey);
    } else {
      setShowDemoPrivateKey(true);
    }
    if(passphraseMatched && showMnemonics && showType == "mnemonics"){
      setShowMnemonics(false);
    } else {
      setShowMnemonics(true);
    }

  }, [passphraseMatched, showType]);

  const getMnemonics = (entropyStr, passphrase) => {
    let decryptedBackupString = forge.util.decode64(entropyStr);
    let byteBufferStringRequiredByForge = forge.util.createBuffer(decryptedBackupString);
    // DERIVED KEY
    try {
        var salt = forge.util.hexToBytes("ff");
        var keygen = forge.pkcs5.pbkdf2(passphrase, salt, 2048, 32, "sha512");
        // AES DECRYPT
        let decipher = forge.cipher.createDecipher("AES-CTR", keygen);
        decipher.start({
            iv: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        });
        decipher.update(byteBufferStringRequiredByForge);
        decipher.finish();
        const utf8DecryptedOpRaw = decipher.output.data;
        const entropyHex = forge.util.bytesToHex(utf8DecryptedOpRaw);
        const mnemonic = bip39.entropyToMnemonic(entropyHex);
        return mnemonic;
    } catch (e) {
        return "";
    }
  };

  const getHederaPrivateKey = async () => {
    const magic = await magicInstance();
    const isLoggedIn = await magic.user.isLoggedIn();

    try {
      if (!isLoggedIn) {
        await magic.auth.loginWithSMS({ phoneNumber: userDetails.mobileNumber });
      }
      const privateKeyHex = await magic.user.revealPrivateKey();
    } catch (err) {
      if (err.message.includes("User canceled action")) {
        setCurrentScreen("manageaccounts");
        return;
      }
      console.error("error in getting private key: ", err);
    }
  };

  React.useEffect(() => {
    async function getLocalUser() {
      let userData = await localstorage.decrypted.get();
      if (userData) {
        if (userData["e"] && userData["p"]) {
          userData['mnemonics'] = getMnemonics(userData["e"], userData["p"]);
        }
        setLocalUserData(userData);
        if (userData.magicUser) {
          await getHederaPrivateKey();
        }
      }
    }
    getLocalUser();
  }, []);


  const sendEmail = () => {
    setShowType("sendEmail");
    if (!passphraseMatched) {
      setOpenPassphraseModal(true);
    }
  };

  React.useEffect (() => {
    if (passphraseMatched && showType == "sendEmail") {
      const mnemonicTxt = localUserData && localUserData.mnemonics ? `Mnemonic:\n${localUserData.mnemonics}` : '';
      const body = `Your Hedera Account Recovery Details: \n\rAccount ID:\n${hederaAccountToString(userDetails.hhAccount)}\n\rPublic Key:\n ${localUserData.publicKey}\n\rPrivate Key:\n${localUserData.privateKey}\n\r${mnemonicTxt}`;
      const emailShareUrl = `mailto:?subject=${encodeURIComponent("Your Hedera Account Recovery Details")}&body=${encodeURIComponent(body)}`;
      chrome.runtime.sendMessage({
          type: "openInNewTab",
          request: {url: emailShareUrl},
      });
      setPassphraseMatched(false);
    }
  }, [passphraseMatched, showType])

  const handleConfirmModalClose = () => {
    setOpenConfirmModal(false);
  };

  const done = () => {
    if (localUserData && localUserData.savedKeys) {
      setCurrentScreen("manageaccounts");
    } else {
      setOpenConfirmModal(true);
    }
  };

  const updateLocalDataAndRedirect = async () => {
    localUserData['savedKeys'] = true;
    await localstorage.decrypted.set(localUserData);
    setCurrentScreen("manageaccounts");
  };

  return (
    <>
      {localUserData && localUserData.magicUser ?
        ""
      :
        <div style={{marginTop:"40px"}}>
          {/* <div
            style={{
                textAlign: "left",
                marginTop: "6px",
                marginLeft: "20px",
                marginBottom: "10px"
          }}>
            <div style={{ paddingTop: "9px" }}>
                <label style={{ fontWeight: "450", color: "#18C2EE", fontSize: "1.8em" }}>
                    CRYPTO ACCOUNT
                </label>
                <br/>
                <label style={{fontSize: "1.3em" }}>
                    DETAILS
                </label>
            </div>
          </div> */}
          <div className={classNames(["hide-scrollbar", classes.detailContainer])}>
            {(userDetails.hhAccount) && (
              <Grid container spacing={2} alignItems="center" justifyContent="space-between">
                <Grid item xs={10}>
                  <Typography>{pageTexts.accountMsg}</Typography>
                  <Typography className={commonStyles.darkBoldText}>
                    {hederaAccountToString(userDetails.hhAccount)}
                  </Typography>
                </Grid>
                <Grid item xs={2} style={{paddingRight: "10px"}}>
                  <Tooltip
                    title={pageTexts.infoText}
                    placement="left bottom"
                    style={{
                      color: "#18c2ee",
                      cursor: "pointer",
                      fontSize: "1.25em",
                      height:"25px",
                      marginBottom: "-4px",
                      paddingLeft: "3px",
                    }}
                  >
                    {/* <InfoOutlinedIcon /> */}
                    <img src="./info_icon.png" alt="info"/>
                  </Tooltip>
                </Grid>
              </Grid>
            )}

            {localUserData ?
              <form>
                <Box my={2}>
                  <FormControl className={classes.keyField}>
                    <Grid container justifyContent="space-between">
                      <Grid item xs={10}>
                        <Typography className={commonStyles.darkBoldText}>{pageTexts.publicKeyHeading}</Typography>
                      </Grid>
                      <Grid item xs={1}>
                        <Copy iconColor="disabled" toolTipTitle="Copy Public Key" text={localUserData && localUserData.publicKey ? localUserData.publicKey : ""} />
                      </Grid>
                    </Grid>
                    <Box py={2}>
                      <TextField
                        className={`${commonStyles.inputFieldWithGreyBg} ${classes.selectField} ${classes.multilineInput}`}
                        multiline
                        variant="outlined"
                        value={localUserData && localUserData.publicKey ? localUserData.publicKey : ""}
                        disabled={true}
                      />
                    </Box>
                  </FormControl>
                </Box>
                <Box my={2}>
                  <FormControl className={classes.keyField}>
                    <Grid container justifyContent="space-between">
                      <Grid item xs={10}>
                        <Typography className={commonStyles.darkBoldText}>{pageTexts.privateKeyHeading}</Typography>
                      </Grid>
                      {
                        !showDemoPrivateKey ?
                          <Grid item xs={1}>
                            <span onClick={() => setClickType("privateKey")}>
                              <Copy
                                iconColor="disabled"
                                openPassphraseModal={openPassphraseModal}
                                passphraseMatched={passphraseMatched}
                                setOpenPassphraseModal={setOpenPassphraseModal}
                                setPassphraseMatched={setPassphraseMatched}
                                clickType={clickType}
                                setClickType={setClickType}
                                currentElem="privateKey"
                                text={localUserData && localUserData.privateKey ? localUserData.privateKey : ""}
                                toolTipTitle="Copy Private Key"
                              />
                            </span>
                          </Grid> : ""
                      }
                    </Grid>
                    <Box py={2}>
                      <TextField
                        className={`${commonStyles.inputFieldWithGreyBg} ${classes.selectField} ${classes.multilineInput}`}
                        variant="outlined"
                        multiline
                        value={localUserData && localUserData.privateKey && !showDemoPrivateKey ? localUserData.privateKey : "XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX"}
                        disabled={true}
                        InputProps={{
                          endAdornment:
                            <InputAdornment position="end">
                              <Tooltip title={<Typography>{showDemoPrivateKey ? pageTexts.showPvtKeyText : pageTexts.hidePvtKeyText}</Typography>}>
                                <span onClick={toggleShowDemoPrivateKey} style={{ cursor: "pointer" }}>
                                  {showDemoPrivateKey ? <Visibility color="disabled" /> : <VisibilityOff color="disabled" />}
                                </span>
                              </Tooltip>
                            </InputAdornment>
                        }}
                      />
                    </Box>
                    {(localUserData && !localUserData.mnemonics) && (<Box my={2}><Typography className={commonStyles.darkBoldText}>
                      {pageTexts.pvtKeyMsg}
                    </Typography></Box>)}
                  </FormControl>
                </Box>
                <Box my={2}>
                  {localUserData && localUserData.mnemonics ?
                    <>
                        <FormControl className={classes.keyField}>
                          <Grid container justifyContent="space-between">
                            <Grid item xs={10}>
                              <Typography className={commonStyles.darkBoldText}>{pageTexts.MnemonicHeadingText}</Typography>
                            </Grid>
                            {
                              !showMnemonics ?
                                <Grid item xs={1}>
                                  <span onClick={() => setClickType("mnemonics")}>
                                    <Copy
                                      iconColor="disabled"
                                      openPassphraseModal={openPassphraseModal}
                                      passphraseMatched={passphraseMatched}
                                      setOpenPassphraseModal={setOpenPassphraseModal}
                                      setPassphraseMatched={setPassphraseMatched}
                                      clickType={clickType}
                                      setClickType={setClickType}
                                      currentElem="mnemonics"
                                      text={localUserData.mnemonics}
                                      toolTipTitle="Copy Mnenomic"
                                    />
                                  </span>
                                </Grid> : ""
                            }
                          </Grid>
                          <Box py={2}>
                            <TextField
                              className={`${commonStyles.inputFieldWithGreyBg} ${classes.selectField} ${classes.multilineInput}`}
                              multiline
                              variant="outlined"
                              value={(localUserData.mnemonics && !showMnemonics) ? localUserData.mnemonics : "xxxxx xxxx xxxx xxxxx xxxxxxx xxx xxxx xxxxxxx xxxxxx xxxxxxxx xxxxxx xxxxxx xxxx xxxxxxx xxxxx xxxxxxx xxxxxx xxxxxx xxxxxxx xxxxxxx xxxx xxxxxx xxxxx xxxxxx"}
                              disabled={true}
                              InputProps={{
                                endAdornment:
                                  <InputAdornment position="end">
                                    <Tooltip title={<Typography>{showMnemonics ? "Show Mnemonic" : "Hide Mnemonic"}</Typography>}>
                                      <span onClick={toggleShowMnemonics} style={{ cursor: "pointer" }}>
                                        {showMnemonics ? <Visibility color="disabled" /> : <VisibilityOff color="disabled" />}
                                      </span>
                                    </Tooltip>
                                  </InputAdornment>,
                              }}
                            />
                          </Box>
                        </FormControl>
                        <Typography className={commonStyles.darkBoldText}>{pageTexts.storeCredNote}</Typography>
                    </>
                  :
                  ""
                  }
                  <Grid container spacing={2} style={{marginTop: "10px"}}>
                    <Grid item xs={4}>
                      <button
                        className={`${commonStyles.circularBtn} ${commonStyles.primaryBtn}`}
                        onClick={done}>
                        {pageTexts.doneText}
                      </button>
                    </Grid>
                    <Grid item xs={8}>
                      <a
                        className={classNames([`${commonStyles.circularBtn} ${commonStyles.secondaryBtn}`, classes.sendThisToMeBtn])}
                        onClick={sendEmail}>
                        {pageTexts.sendThisToMe}
                      </a>
                    </Grid>
                  </Grid>
                </Box>
              </form>
            : ""}
          </div>

          <Modal
            open={openConfirmModal}
            onClose={handleConfirmModalClose}
          >
            <Box className={classes.modalContainer}>
              <Typography id="modal-modal-description" sx={{ mt: 2 }}>
                {pageTexts.cnfModalText}
              </Typography>
              <div className={classes.ctrlBtns}>
                <button className="button-cancel" onClick={handleConfirmModalClose}>
                    {pageTexts.cnfModalNo}
                </button>
                &nbsp;&nbsp;&nbsp;&nbsp;
                <button className="button-done" onClick={updateLocalDataAndRedirect}>
                    {pageTexts.cnfModalYes}
                </button>
              </div>
            </Box>
          </Modal>
          {
            openPassphraseModal ?
            <PassphraseModal
              openPassphraseModal = {openPassphraseModal}
              passphraseMatched= {passphraseMatched}
              setOpenPassphraseModal={setOpenPassphraseModal}
              setPassphraseMatched = {setPassphraseMatched}
              showType = {showType}
              setShowType = {setShowType}
            /> : ""
          }

            {/* <div style={{position:"fixed",bottom:"15px",left:"20px"}}>
              <ArrowBackOutlinedIcon onClick={()=> setCurrentScreen("manageaccounts")} style={{cursor:"pointer",color:"#18C2EE"}}/>
            </div> */}
            {/* <div style={{position:"fixed",bottom:"14px",right:"20px"}}>
              <button
                style={{ marginLeft: "30px", marginTop: "30px" }}
                className="button-done"
                onClick={done}>
                DONE
              </button>
            </div> */}
        </div>
      }
    </>
  );
};

export default HbarDetails;
