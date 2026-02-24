import React from 'react';
import QrReader from 'react-qr-reader'
import * as localstorage from "./../utils/local-storage";
import '../inputbutton.css';
import {
  fade,
  ThemeProvider,
  withStyles,
  makeStyles,
  createTheme,
} from '@material-ui/core/styles';
import TextField from '@material-ui/core/TextField';
import ArrowBackOutlinedIcon from '@material-ui/icons/ArrowBackOutlined';
import { Box, Modal, Typography } from '@material-ui/core';
import classNames from 'classnames';
import { DEFAULT_DROPP_PIN } from '../utils/constants';
import WalletPinInput from './WalletPinInputField';
import uiTexts from "./../../configurations/dropp.json";
var CryptoJS = require("crypto-js");

const pageTexts = uiTexts.changepin;

const ChangePin = ({setCurrentScreen, data, forceUpdate, workingEnv, setFooterObj}) => {

  const [newpin, setNewPin] = React.useState("");
  const [confirmnewpin, setConfirmNewPin] = React.useState("");
  const [currentpin, setCurrentPin] = React.useState("");
  const [errorMessage, setErrorMessage] = React.useState("");
  const [successMessage, setSuccessMessage] = React.useState("");
  const [openInfoModal, setOpenInfoModal] = React.useState(false);
  const [existingPin, setExistingPin] = React.useState(null);
  const [openSuccessModal, setOpenSuccessModal] = React.useState(false);

  React.useEffect(() => {
    async function getLocalData() {
      const localData = await localstorage.decrypted.get();
      setExistingPin(localData && localData.pin);
    }
    getLocalData();
  }, []);

  React.useEffect(() => {
    setFooterObj({primaryBtnText: existingPin ? "Update" : "Save", primaryFuncToCall: changepin})
    return () => {
      setFooterObj({});
    }
  }, [currentpin, newpin, confirmnewpin, existingPin, errorMessage])

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
      fontSize : 10,
    },
    descriptionText: {
      fontSize: "14px",
    },
    greyBackground: {
      backgroundColor: "#f9f9f9",
      marginTop: "10px",
      padding: "10px",
      borderRadius:"10px",
      marginBottom:"25px"
    },
    buttonContainer: {
      display: "flex",
      justifyContent: "space-between",
      marginTop: "10px",
      width:"90%",
    },
    button: {
      width: "45%"
    },
    modalContainer: {
      backgroundColor: '#FFFFFF',
      border: 0,
      padding: "15px",
      width: 250,

    },
    ctrlBtns: {
      marginTop: "5px",
      textAlign: "right",
    },
    modalAtCenter : {
      display:"flex",
      justifyContent:"center",
      alignItems:"center"
    }
  }));

  const CssTextField = withStyles({
    root: {
      '& .MuiInput-underline:after': {
        borderBottomColor: '#18C2EE',
      },
      '& .MuiOutlinedInput-root': {

        '&:hover fieldset': {
          borderColor: '#18C2EE',
        },
        '&.Mui-focused fieldset': {
          borderColor: '#18C2EE',
        },
      },
    },

  })(TextField);

  const validate = () => {
      if ((existingPin && currentpin == "") || newpin == "" || confirmnewpin == "") {
          setErrorMessage("Incomplete Fields");
          setOpenSuccessModal(true);
          return false;
      }
      if (newpin != confirmnewpin) {
          setErrorMessage("Pins did not match");
          setOpenSuccessModal(true);
          return false;
      }
      return true;
  };

  const changepin = async () => {
    if(validate()) {
      let resultDecrypted = await localstorage.decrypted.get();
      let resultEncrypted = await localstorage._get('_encrypted');
      try {
        JSON.parse(CryptoJS.AES.decrypt(resultEncrypted._encrypted, existingPin ? currentpin : DEFAULT_DROPP_PIN).toString(CryptoJS.enc.Utf8));
        resultDecrypted['pin'] = true;
        let encryptedData = CryptoJS.AES.encrypt(JSON.stringify(resultDecrypted), newpin).toString();
        await localstorage._set({'_encrypted':encryptedData});
        await localstorage.decrypted.set(resultDecrypted);
        setSuccessMessage("PIN Saved!");
        setOpenSuccessModal(true);
      }
      catch(e){
        console.log("error is ", e.message);
        setErrorMessage("Incorrect PIN")
        setOpenSuccessModal(true);
      }
    }
  }

  const handleNewPinChange = (value) => {
    if(errorMessage) {
      setErrorMessage(null)
    }
    setNewPin(value);
  };

  const handleCurrentPinChange = (value) => {
    if(errorMessage) {
      setErrorMessage(null)
    }
    setCurrentPin(value)
  };

  const handleConfirmNewPinChange = (value) => {
    if(errorMessage) {
      setErrorMessage(null)
    }
    setConfirmNewPin(value)
  };

  const showInfoModal = () => {
    setOpenInfoModal(true);
  }

  const handleInfoModalClose = () => {
    setOpenInfoModal(false);
  };

  const handleSuccessModalClose = async () => {
    setOpenSuccessModal(false);
    if (data && data.dashboard) {
      await localstorage._remove("_decrypted");
      forceUpdate();
    } else {
      setCurrentScreen("accountsettings");
    }
  };

  const handleError = () => {
    setOpenSuccessModal(false);
  };

  const classes = useStyles();

  return (
        <div style={{marginTop:"40px"}}>
        <div>
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
                      SECURITY
                  </label>
                  <br/>
                  <label style={{fontSize: "1.3em" }}>
                    {
                      existingPin ? "CHANGE PIN" : "SET PIN"
                    }
                  </label>
              </div>
          </div> */}
          <div style={{ marginTop:"30px", marginRight:"20px", marginLeft:"20px", maxHeight: workingEnv === "test" ? "420px" : "", overflow:  workingEnv === "test" ? "scroll" : ""}}>
          {
            existingPin ?
            <div className={classes.greyBackground}>
              <label style={{ marginBottom: "7px" }}>
                <Typography variant="body1" >
                  {pageTexts.currWalletPinText}
                </Typography>
              </label>
              {/* <TextField
                style={{ marginLeft: "2px", marginTop: "25px", width: "253px", backgroundColor:"#ffffff" }}
                size="small"
                className={classes.margin}
                label="PIN can be alphanumeric"
                type="password"
                value={currentpin}
                onChange={handleCurrentPinChange}
                variant="outlined"
                id="custom-css-outlined-input-1"
              /> */}
              <Box my={1}>
                <WalletPinInput setValue={handleCurrentPinChange}/>
              </Box>
              <label style={{ marginBottom: "7px" }}>
                <Typography variant="body1" >
                  {pageTexts.newWalletPinText}
                </Typography>
              </label>
              {/* <TextField
                style={{ marginLeft: "2px", marginTop: "8px", width: "253px", backgroundColor: "#ffffff" }}
                size="small"
                className={classes.margin}
                label="PIN can be alphanumeric"
                type="password"
                value={newpin}
                onChange={handleNewPinChange}
                variant="outlined"
                id="custom-css-outlined-input-2"
              /> */}
              <Box my={1}>
                <WalletPinInput setValue={handleNewPinChange}/>
              </Box>
              {/* <TextField
                style={{ marginLeft: "2px", marginTop: "8px", width: "253px", backgroundColor: "#ffffff" }}
                size="small"
                className={classes.margin}
                label="Enter new PIN again to confirm"
                type="password"
                value={confirmnewpin}
                onChange={handleConfirmNewPinChange}
                variant="outlined"
                id="custom-css-outlined-input-3"
              /> */}
              <label style={{ marginBottom: "7px" }}>
                <Typography variant="body1" >
                  {pageTexts.pinTextToCnf}
                </Typography>
              </label>
              <Box my={1}>
                <WalletPinInput setValue={handleConfirmNewPinChange}/>
              </Box>
            </div>
            : <div>
              <div className={classes.greyBackground}>
                <Typography className={classes.descriptionText}>
                  {pageTexts.setPinReasonText}
                </Typography>
              </div>
              <div className={classes.greyBackground}>
              <label style={{ marginBottom: "7px" }}>
                <Typography variant="body1" >
                  {pageTexts.newWalletPinText}
                </Typography>
              </label>
              {/* <TextField
                style={{ marginLeft: "2px", marginTop: "8px", width: "253px", backgroundColor: "#ffffff" }}
                size="small"
                className={classes.margin}
                label="PIN can be alphanumeric"
                type="password"
                value={newpin}
                onChange={handleNewPinChange}
                variant="outlined"
                id="custom-css-outlined-input-2"
              /> */}
              <Box my={1}>
                <WalletPinInput setValue={handleNewPinChange}/>
              </Box>
              {/* <TextField
                style={{ marginLeft: "2px", marginTop: "8px", width: "253px", backgroundColor: "#ffffff" }}
                size="small"
                className={classes.margin}
                label="Enter PIN again to confirm"
                type="password"
                value={confirmnewpin}
                onChange={handleConfirmNewPinChange}
                variant="outlined"
                id="custom-css-outlined-input-3"
              /> */}
              <label style={{ marginBottom: "7px" }}>
                <Typography variant="body1" >
                  {pageTexts.pinTextToCnf}
                </Typography>
              </label>
              <Box my={1}>
                <WalletPinInput setValue={handleConfirmNewPinChange}/>
              </Box>
              </div>
              <div>
                <Typography className={classes.descriptionText} style={{marginBottom:"8px"}}>
                  {pageTexts.usePinText}
                </Typography>
                <Typography className={classes.descriptionText} style={{marginBottom:"8px"}}>
                  {pageTexts.aboutThisPin}
                </Typography>
              </div>
            </div>
          }
            <div>
              <div>
                <Typography
                  style={{
                          color: "#18C2EE",
                          cursor: "pointer",
                          textDecoration: "underline" }}
                  onClick={showInfoModal}>
                  {pageTexts.forgotPinText}
                </Typography>
              </div>
            </div>
          </div>
        </div>
          {/* <div className='footer' style={{height: workingEnv === "test" ? "78px" : ""}}>
            <div className={classes.buttonContainer}>
              <button
                className={classNames(["button-done", classes.button])}
                onClick={changepin}>
                Save
              </button>
              <button
                style={{ border: "1px solid #18C2EE", backgroundColor: "#ffffff", color: "#000000" }}
                className={classNames(["button-cancel", classes.button])}
                // onClick={() => {data && data.dashboard ? setCurrentScreen("dashboard") : setCurrentScreen("accountsettings")}}>
                onClick={() => setCurrentScreen("dashboard")}>
                Cancel
              </button>
            </div>
          </div> */}
          <Modal
            open={openSuccessModal}
            onClose={errorMessage ? () => setOpenSuccessModal(false) : handleSuccessModalClose}
            className={classes.modalAtCenter}
          >
            <Box className={classes.modalContainer}>
              {errorMessage ?
                <>
                  <Typography sx={{ mt: 2 }}>
                    <strong>{pageTexts.modalErrHeading}</strong>
                  </Typography>
                  <Typography sx={{ mt: 2 }} style={{ wordBreak: "break-word" }}>
                    {errorMessage}
                  </Typography>
                </>
                :
                <Typography sx={{ mt: 2 }}>
                  {successMessage ? successMessage : "PIN Saved!"}
                </Typography>
              }
              <div className={classes.ctrlBtns}>
                {
                  errorMessage ?
                    <button className="button-done" onClick={handleError}>
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
            open={openInfoModal}
            onClose={handleInfoModalClose}
            className={classes.modalAtCenter}
          >
            <Box className={classes.modalContainer}>
              <Typography
                variant="subtitle1"
                style={{ fontWeight: "600" }}
                id="modal-modal-description"
                sx={{ mt: 2 }}
              >
                {pageTexts.forgotPinText}
              </Typography>
              <div style={{ paddingTop: "15px" }}>
                <Typography variant="subtitle2">
                  By design, your PIN is not recoverable.
                </Typography>
              </div>
              <div style={{ paddingTop: "15px" }}>
                <Typography variant="subtitle2">
                  If you forget your PIN, you will have to unlink your account from this wallet extension, and link your account again using the backup QR code and passphrase.
                </Typography>
              </div>
              <div style={{ paddingTop: "15px" }}>
                <Typography variant="subtitle2">
                  You can then setup a new PIN.
                </Typography>
              </div>
              <div style={{ paddingTop: "15px" }}>
                <Typography variant="subtitle2">
                  If you ever forget your PIN, you can click on ‘Forgot PIN?’ link in the unlock screen and we will guide you along.
                </Typography>
              </div>
              <div style={{ display: "flex", justifyContent: "center", marginTop: "40px" }}>
                <button
                  style={{ border: "1px solid #18C2EE", backgroundColor: "#ffffff", color: "#000000" }}
                  className={classNames(["button-cancel", classes.button])}
                  onClick={handleInfoModalClose}>
                  {pageTexts.closeBtnTxt}
                </button>
              </div>
            </Box>
          </Modal>
        </div>
  );
}

export default ChangePin;
