import React from 'react';
import * as api from "../../api";
import {
  fade,
  ThemeProvider,
  withStyles,
  makeStyles,
  createTheme,
} from '@material-ui/core/styles';
import Loader from "react-loader-spinner";
import TextField from '@material-ui/core/TextField';
import FormControlLabel from '@material-ui/core/FormControlLabel';
import Checkbox from '@material-ui/core/Checkbox';
import Radio from '@material-ui/core/Radio';
import RadioGroup from '@material-ui/core/RadioGroup';
import ArrowBackOutlinedIcon from '@material-ui/icons/ArrowBackOutlined';
import uiTexts from "./../../../configurations/dropp.json";
import commonStyles from "./../../styles/common.module.scss";
import { Box, CircularProgress, Modal, Typography } from '@material-ui/core';

const pageTexts = uiTexts.notifications;

const Profile = ({setCurrentScreen, setFooterObj, userDetails, pageLoading}) => {

  const [lowBalanceNotification, setLowBalanceNotification] = React.useState(false)
  const [purchaseNotification, setPurchaseNotification] = React.useState(false)
  const [replenishedNotification, setReplenishedNotification] = React.useState(false)
  const [contactOption, setContactOption] = React.useState(null);
  const [errorMessage, setErrorMessage] = React.useState("");
  const [successMessage, setSuccessMessage] = React.useState("");
  const [loading, setLoading] = React.useState(false);


  React.useEffect(() => {
    async function fetchUserDetails() {
        // let userDetails = await api.fetchUserDetails();
        if (userDetails.notificationPreferences) {
            setLowBalanceNotification(userDetails.notificationPreferences.lowbalanceNotification);
            setPurchaseNotification(userDetails.notificationPreferences.largePurchaseNotification)
            setReplenishedNotification(userDetails.notificationPreferences.replenishNotification)
            setContactOption(userDetails.notificationPreferences.notificationPreference)
        }
    }
    fetchUserDetails();
  },[userDetails]);

  React.useEffect(() => {
    setFooterObj({primaryBtnText: "Save", primaryFuncToCall: update})
    return () => {
      setFooterObj({})
    }
  }, [lowBalanceNotification, purchaseNotification, replenishedNotification, contactOption])


  function closeErrorAlert() {
      setTimeout(function () {
          setErrorMessage("");
      }, 3000);
  }

  function closeSucessAlert() {
    setTimeout(function () {
        setSuccessMessage("");
    }, 3000);
  }


  const handleChange = (mySetFunction,myValue) => {
      mySetFunction(!myValue)
    }

  const handleContactOptionChange = selectedOption => {
      setContactOption(selectedOption.target.value);
  };

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
    }
  }));


  const update = async () => {
    setLoading(true);
    try{

      let result = await api.updateNotificationPreference({lowBalanceNotification, purchaseNotification, replenishedNotification, contactOption})

      if(result && result.responseCode != 0){
        setLoading(false);
        setErrorMessage(result.errors[0]);
        closeErrorAlert();
      } else {
        api.resetUserDetails();
        setLoading(false);
        setSuccessMessage("Successfully Updated");
        closeSucessAlert();
      }

    }
    catch(e){
      setLoading(false);
      setErrorMessage("Error");
      closeErrorAlert();
    }
    }

  const BlueRadio = withStyles({
    root: {

      '&$checked': {
        color: '#18C2EE',
      },
    },
    checked: {},
  })((props) => <Radio size="small" color="default" {...props} />);

  const BlueCheckbox = withStyles({
    root: {
      '&$checked': {
        color: "#18C2EE",
      },
    },
    checked: {},
  })((props) => <Checkbox color="default" {...props} />);

  const classes = useStyles();


  return (
        <div style={{marginTop:"40px", width:"500px"}}>
          {/* <div
              style={{
                  textAlign: "left",
                  // width: "600px",
                  marginTop: "6px",
                  marginLeft: "20px",
                  marginBottom:"10px"
              }}>
              <div style={{ paddingTop: "9px", marginRight: "180px" }}>
                  <label style={{ fontWeight: "450", color: "#18C2EE", fontSize: "1.8em" }}>
                      NOTIFICATION
                  </label>
                  <br/>
                  <label style={{fontSize: "1.3em" }}>
                      SETTINGS
                  </label>
              </div>
          </div> */}
          <div style={{width:"310px", marginTop:"30px", marginRight:"20px", marginLeft:"20px"}}>
            <FormControlLabel
              control={<BlueCheckbox checked={lowBalanceNotification} onChange={() => handleChange(setLowBalanceNotification,lowBalanceNotification)} name="lowbalance" />}
              label="Notify me when my balance is low"
            />
            <FormControlLabel
              control={<BlueCheckbox checked={purchaseNotification} onChange={() => handleChange(setPurchaseNotification,purchaseNotification)} name="purchase" />}
              label="Notify me of larger purchases (over $5)"
            />
            <FormControlLabel
              control={<BlueCheckbox checked={replenishedNotification} onChange={() => handleChange(setReplenishedNotification,replenishedNotification)} name="replenished" />}
              label="Notify me when my account is replenished"
            />
          <br/>
          <br/>
          <label className={commonStyles.darkBoldText} style={{fontWeight:"500", display:"inline-block",marginBottom:"6px", fontSize: "16px", marginTop:"20px" }}>
              {pageTexts.notificationPrefText}
          </label>
          <RadioGroup aria-label="contactChoice" name="contactChoice" value={contactOption} onChange={handleContactOptionChange} style={{marginTop:"-4px"}}>
            <FormControlLabel style={{marginBottom:"-13px"}} size="small" value="EMAIL" control={<BlueRadio />} label={<Typography className={commonStyles.darkBoldText}>EMAIL</Typography>} />
            <FormControlLabel size="small" value="SMS" control={<BlueRadio />} label={<Typography className={commonStyles.darkBoldText}>SMS</Typography>} />
          </RadioGroup>
          </div>
          {errorMessage && (<div className="alert error extension" style={{textAlign:"center",marginTop:"20px",marginLeft:"20px"}}>
            <strong>{errorMessage}</strong>
          </div>)}
          {successMessage && (<div className="alert success extension" style={{textAlign:"center",marginTop:"20px",marginLeft:"20px"}}>
            <strong>{successMessage}</strong>
          </div>)}
          {
            <div style={{width:"310px", alignItems:"center", align:"center"}}>
              <Loader
                  style={{textAlign:"center",marginTop: "20px" }}
                  type="Oval"
                  color="#00BFFF"
                  height={40}
                  width={40}
                  visible={loading}
              />
            </div>
          }
          <Modal
            open={pageLoading}
          >
            <Box style={{ backgroundColor: "transparent", height: "100vh", width: "100%", display: "flex" }}>
              <div style={{ margin: "auto", textAlign: "center", color: "#18C2EE" }}>
                <CircularProgress color="inherit" />
              </div>
            </Box>
          </Modal>
          {/* <div className='footer'>
            <div className='backArrow' >
              <ArrowBackOutlinedIcon onClick={()=> setCurrentScreen("accountsettings")} style={{cursor:"pointer",color:"#18C2EE"}}/>
            </div>
            <div className='footerRightButtonMedium'>
              <button
                  className="button-done"
                  onClick={() => update()}>
                  UPDATE
              </button>
            </div>
          </div> */}
        </div>
  );
}

export default Profile;
