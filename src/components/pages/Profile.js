import React from 'react';
import QrReader from 'react-qr-reader'
import * as api from "../../api";
import { hederaAccountToString } from "../../utils/utils";
import Loader from "react-loader-spinner";
import {
  fade,
  ThemeProvider,
  withStyles,
  makeStyles,
  createTheme,
} from '@material-ui/core/styles';
import TextField from '@material-ui/core/TextField';
import FormControlLabel from '@material-ui/core/FormControlLabel';
import Checkbox from '@material-ui/core/Checkbox';
import Radio from '@material-ui/core/Radio';
import RadioGroup from '@material-ui/core/RadioGroup';
import commonStyles from "./../../styles/common.module.scss";
import { Box, Divider, Grid, Typography } from '@material-ui/core';
import Copy from './Copy';
import uiTexts from "./../../../configurations/dropp.json";

const pageTexts = uiTexts.profile;

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
  roundedInputField: {
    "& .MuiOutlinedInput-root": {
      borderRadius: "20px"
    }
  },
  dividerLine: {
    marginTop: '5px',
    marginBottom: '10px',
  },
  mainTitle:{
    fontSize: "12px",
    fontWeight: "bold",
  }
}));

const Profile = ({setCurrentScreen, setScreenWithData, setFooterObj}) => {
  // const classes = useStyles();

  const [firstName, setFirstName] = React.useState("");
  const [lastName, setLastName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [mobileNumber, setMobileNumber] = React.useState("");
  const [operateAccount, setOperateAccount] = React.useState(null);
  const [userDetails, setUserDetails] = React.useState({});
  const [errorMessage, setErrorMessage] = React.useState("");
  const [successMessage, setSuccessMessage] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [operatorName, setOperatorName] = React.useState(null);

  React.useEffect(() => {
    async function fetchUserDetails() {
        setLoading(true);
        let userDetails = await api.fetchUserDetails();
        if (userDetails.data) {
            setUserDetails(userDetails.data);
            setMobileNumber(userDetails.data.mobileNumber);
            setEmail(userDetails.data.email);
            setFirstName(userDetails.data.firstName);
            setLastName(userDetails.data.lastName);
            setOperateAccount(userDetails.data.currency);
            setOperatorName(userDetails.data.operatorName);
        }
        setLoading(false);
    }
    fetchUserDetails();
  },[]);

  React.useEffect(() => {
    setFooterObj({primaryBtnText: "Update", primaryFuncToCall: update, disabledPrimaryBtn: loading});
    return () => {
      setFooterObj({});
    }
  }, [firstName, lastName, errorMessage, loading])




  const BlueRadio = withStyles({
    root: {
      '&$checked': {
        color: '#18C2EE',
      },
    },
    checked: {},
  })((props) => <Radio size="small" color="default" {...props} />);

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

  const validate = () => {
    if(firstName == "" || lastName == ""){
      setLoading(false);
      setErrorMessage("Empty Fields")
      closeErrorAlert();
      return false;
    }
    return true;
  };


  const update = async () => {
    setLoading(true);
    if(validate()){
      try{
        let result = await api.updateUserName(firstName, lastName)
        if(result && result.responseCode != 0){
          setLoading(false);
          setErrorMessage(result.errors[0]);
          closeErrorAlert();
        }
        else{
          setLoading(false);
          setSuccessMessage("Successfully Updated");
          api.resetUserDetails();
          closeSucessAlert();
        }

      }
      catch(e){
        setLoading(false);
        setErrorMessage("Error");
        closeErrorAlert();
      }
    }
  }

  const openCircleLinks = (type) => {
    let url;
    if (type == "policy") {
      url = "https://www.circle.com/en/legal/privacy-policy";
    } else if (type == "terms") {
      url = "https://www.circle.com/en/legal/usdc-terms";
    }
    if (type) {
      chrome.runtime.sendMessage({
        type: "openInNewTab",
        request: {url: url},
      });
    }
  }

  const handleFirstName = (e) => {
    setFirstName(e.target.value);
  }

  const handleLastName = (e) => {
    setLastName(e.target.value);
  }

  const classes = useStyles();

  return (
        <div style={{marginTop:"50px"}}>
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
                      PROFILE
                  </label>
                  <br/>
                  <label style={{fontSize: "1.3em" }}>
                      {hederaAccountToString(userDetails.hhAccount)}
                  </label>
              </div>
          </div> */}
          <div style={{width:"310px", marginTop:"30px", marginRight:"20px", marginLeft:"20px"}}>
            <Grid container justifyContent="space-between" className={commonStyles.greyListContainer}>
              <Grid item xs={12}>
                <Typography className={`${commonStyles.darkBoldText} ${classes.mainTitle}`}>
                  {pageTexts.accIdText}
                </Typography>
              </Grid>
              <Grid item xs={10}>
                <Typography variant='h5' className={commonStyles.darkBoldText}>
                  {hederaAccountToString(userDetails.hhAccount)}
                </Typography>
              </Grid>
              <Grid item xs={2}>
                <Copy iconColor="disabled" toolTipTitle="Copy Account Id" text={hederaAccountToString(userDetails.hhAccount)} />
              </Grid>
                <Divider className={`${commonStyles.divider} ${classes.dividerLine}`}/>
              <Grid item xs={12}>
                <Typography className={`${commonStyles.darkBoldText} ${classes.mainTitle}`}>
                  {pageTexts.activeCurrText}
                </Typography>
                <Typography variant='h5' className={commonStyles.darkBoldText}>
                  {operateAccount}
                </Typography>
              </Grid>
              <Grid item xs={12}>
                <Grid container alignItems="center" justifyContent="space-between">
                  <Grid item xs={6}>
                    <Typography variant="body2" className={`${commonStyles.darkBoldText} ${commonStyles.upperCase}`}>
                      ({userDetails.countryCode == "GLOBAL" ? "DIGITAL CURRENCY" : userDetails.countryCode})
                    </Typography>
                  </Grid>
                  <Grid item xs={6} onClick={e => setScreenWithData("manageaccounts", {fromScreen: "profile"})}>
                    <Typography align="center" variant="body2" className={`${commonStyles.blueBoldLink} ${classes.mainTitle}`}>
                      {pageTexts.manageCurrText}
                    </Typography>
                  </Grid>
                </Grid>
              </Grid>
            </Grid>
            <TextField
                style={{marginLeft:"2px"}}
                size="small"
                className={`${commonStyles.inputFieldWithGreyBg} ${classes.roundedInputField}`}
                label="First Name"
                value={firstName}
                onChange={handleFirstName}
                variant="outlined"
                id="custom-css-outlined-input-1"
              />
            <TextField
                style={{marginLeft:"2px", marginTop:"8px"}}
                size="small"
                className={`${commonStyles.inputFieldWithGreyBg} ${classes.roundedInputField}`}
                label="Last Name"
                value={lastName}
                onChange={handleLastName}
                variant="outlined"
                id="custom-css-outlined-input-2"
              />
              <TextField
                style={{marginLeft:"2px", marginTop:"8px"}}
                size="small"
                className={`${commonStyles.inputFieldWithGreyBg} ${classes.roundedInputField}`}
                label="Phone"
                value={mobileNumber}
                variant="outlined"
                id="custom-css-outlined-input-3"
              />
              <TextField
                style={{marginLeft:"2px", marginTop:"8px"}}
                size="small"
                className={`${commonStyles.inputFieldWithGreyBg} ${classes.roundedInputField}`}
                label="Email"
                value={email}
                variant="outlined"
                id="custom-css-outlined-input-3"
              />
              {/* <label style={{marginLeft:"2px", fontWeight:"500", display:"inline-block",marginBottom:"6px", fontSize: "16px", marginTop:"20px" }}>
                  Operate Account In
              </label>
              { operateAccount && <RadioGroup aria-label="contactChoice" name="contactChoice" value={operateAccount} style={{marginLeft:"3px", marginTop:"-4px"}}>
                <FormControlLabel style={{marginBottom:"-13px"}} size="small" value={operateAccount} control={<BlueRadio/>} label={`${operateAccount} (${userDetails.countryCode})`} />
                // <FormControlLabel size="small" value="HBAR" control={<BlueRadio />} label= "HBAR" disabled={operateAccount === "USD"} />
                </RadioGroup>
              }

              <div style={{marginTop: "20px"}}>
                <a onClick={e => setScreenWithData("manageaccounts", {fromScreen: "profile"})} style={{fontSize:"1.2em", cursor: "pointer", color: "#18C2EE" }}>
                  Manage Currency Accounts
                </a>
              </div>

              {(userDetails && userDetails.currency == "USDC") && (
                <div style={{marginTop: "10px"}}>
                  <div>
                    <a onClick={e => openCircleLinks("policy")} style={{cursor: "pointer", color: "#18C2EE", fontSize:"1.2em", lineHeight: "20px"}}>
                      USDC (Circle) Privacy Policy
                    </a>
                  </div>
                  <div>
                    <a onClick={e => openCircleLinks("terms")} style={{cursor: "pointer", color: "#18C2EE", fontSize:"1.2em", lineHeight: "20px"}}>
                      USDC (Circle) Terms
                    </a>
                  </div>
                </div>
              )} */}
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
          {/* <div className='footer'>
            <div className='backArrow'>
              <ArrowBackOutlinedIcon onClick={()=> setCurrentScreen("dashboard")} style={{cursor:"pointer",color:"#18C2EE"}}/>
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
