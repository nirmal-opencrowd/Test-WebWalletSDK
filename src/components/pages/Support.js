import React from "react";
import Loader from "react-loader-spinner";
import * as api from "../../api";
import {
  withStyles,
  makeStyles
} from '@material-ui/core/styles';
import InputLabel from '@material-ui/core/InputLabel';
import FormControlLabel from '@material-ui/core/FormControlLabel';
import TextField from '@material-ui/core/TextField';
import FormControl from '@material-ui/core/FormControl';
import Radio from '@material-ui/core/Radio';
import RadioGroup from '@material-ui/core/RadioGroup';
import Select from '@material-ui/core/Select';
import MenuItem from '@material-ui/core/MenuItem';
import ArrowBackOutlinedIcon from '@material-ui/icons/ArrowBackOutlined';
import { Box, Grid, Typography } from "@material-ui/core";
import getSymbolFromCurrency from 'currency-symbol-map';
import { displayAmount } from "./../../utils/utils";
import uiTexts from "./../../../configurations/dropp.json";
import commonStyles from "./../../styles/common.module.scss";
import { LineWeightOutlined } from "@material-ui/icons";

const pageTexts = uiTexts.support;

/* global chrome */

const Support = ({setCurrentScreen, data, setFooterObj}) => {
    const [reason, setReason] = React.useState("");
    const [contactOption, setContactOption] = React.useState("Email");
    const [userDetails, setUserDetails] = React.useState(null);
    const [email, setEmail] = React.useState("");
    const [message, setMessage] = React.useState("");
    const [mobileNumber, setMobileNumber] = React.useState("");
    const [otherReason, setOtherReason] = React.useState("");
    const [errors, setErrors] = React.useState({});
    const [infoMsg, setInfoMsg] = React.useState({});
    const [loading, setLoading] = React.useState(false);

    React.useEffect(() => {
        async function fetchUserDetails() {
            let userDetails = await api.fetchUserDetails();
            if (userDetails.data) {
                setUserDetails(userDetails.data);
                setEmail(userDetails.data.email)
                setMobileNumber(userDetails.data.mobileNumber)
            }
        }
        fetchUserDetails();
    },[]);

    React.useEffect(() => {
      setFooterObj({primaryBtnText: "Submit", primaryFuncToCall: submit});
      return () => {
        setFooterObj({});
      }
    }, [reason, otherReason, infoMsg, message, contactOption])

    const validate = () => {
      if ((!reason || (reason == "Other" && !otherReason)) || !contactOption || !message) {
          let errObj = {};
          if (!reason) {
            errObj['reason'] = true;
          } else if (reason == "Other" && !otherReason) {
            errObj['otherReason'] = true;
          }
          if (!contactOption) {
            errObj['contactOption'] = true;
          }
          if (!message) {
            errObj['message'] = true;
          }
          if (Object.keys(errObj).length) {
            setErrors(errObj);
          }
          setLoading(false);
          setInfoMsg({type: "error", msg: "Missing Fields"});
          return false;
      }
      setInfoMsg({});
      return true
    };

    const submit = async() => {
      setLoading(true);
      if(validate()){
        setErrors({});
        setInfoMsg({});
        try{

          let result = await api.submitHelpTicket({reason, contactOption, otherReason, message, ...data})

          if(result && result.responseCode != 0){
            setLoading(false);
            setInfoMsg({type: "error", msg: result.errors[0]});
          }
          else{
            setLoading(false);
            setInfoMsg({type: "success", msg: "Support Request Sent"});
          }

        }
        catch(e){
          setLoading(false);
          setInfoMsg({type: "error", msg: "Something went wrong!"});
        }
      }
    };

    const handleReasonChange = selectedOption => {
        setReason(selectedOption.target.value);
    };

    const handleContactOptionChange = selectedOption => {
        setContactOption(selectedOption.target.value);
    };

    const getTransactionTitle = (txnData) => {
      const dateOptions = {year: 'numeric', month: '2-digit', day: '2-digit' };
      return `${(txnData.invoiceCurrency != "HBAR") ? `${txnData.invoiceCurrency == "USDC" ? "USDC " : getSymbolFromCurrency(txnData.invoiceCurrency)}` : 'HBAR'}${displayAmount(txnData.invoiceAmount)} to ${txnData.merchantOrganiationName} on ${new Date(txnData.createTimeEpoch * 1000).toLocaleDateString('en-US', dateOptions)}`;
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
      },
      roundedDropdown: {
        '& .MuiInputBase-root': {
            border: "1px solid #ccc",
            borderRadius: "45px",
            width: "100%",
        },
        '& .MuiSelect-root': {
            padding: "10px",
            textAlign: "left",
        },
      },
      roundedInputField: {
        "& .MuiOutlinedInput-root": {
          borderRadius: "20px"
        }
      },
      darkBoldText: {
        fontWeight: "600",
        fontSize: "12px",
        lineHeight: "3em",
      },
      secondryText: {
        fontSize: "12px",
        textTransform: "uppercase",
        wordBreak: "break-all", 
        display: "flex", 
        alignItems: "center",
        lineHeight: "3em",
      },
      dropdownText: {
        fontSize: "14px",
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

    const classes = useStyles();
    return (
      <div style={{marginTop:"50px", padding:"0 20px"}}>
          {/* <div
              style={{
                  textAlign: "left",
                  width: "600px",
                  marginTop: "6px",
                  marginLeft: "20px",
              }}>
              <div style={{ paddingTop: "9px", marginRight: "180px" }}>
                  <label style={{ fontWeight: "450", color: "#18C2EE", fontSize: "1.8em" }}>
                      CONTACT
                  </label>
                  <br/>
                  <label style={{fontSize: "1.3em" }}>
                      SUPPORT
                  </label>
              </div>
          </div> */}
          <RadioGroup aria-label="contactChoice" name="contactChoice" value={contactOption} onChange={handleContactOptionChange} style={{ marginTop: "-4px" }} error={errors.contactOption == true ? "true" : ""}>
            <Grid container>
              <Grid item xs={6}>
                <FormControlLabel style={{ marginBottom: "-13px" }} size="small" value="Email" control={<BlueRadio />} 
                label={<Typography className={`${commonStyles.darkBoldText} ${classes.darkBoldText}`} variant="body2">
                  {pageTexts.emailMeText}
                </Typography>}/>
              </Grid>
              <Grid item xs={6} >
                <Typography variant="body2" className={classes.secondryText}>
                  {email}
                </Typography>
              </Grid>
              <Grid item xs={6}>
                <FormControlLabel size="small" value="Phone" control={<BlueRadio />} 
                label={<Typography className={`${commonStyles.darkBoldText} ${classes.darkBoldText}`} variant="body2">{pageTexts.callSmsMeText}</Typography> } />
              </Grid>
              <Grid item xs={6} style={{display: "flex", alignItems: "center"}}>
                <Typography variant="body2" className={classes.secondryText}>
                  {mobileNumber}
                </Typography>
              </Grid>
            </Grid>
          </RadioGroup>
          <Box my={3}>
            <div style={{textAlign: "left"}}>
              <FormControl className={`${commonStyles.inputFieldWithGreyBg} ${classes.roundedDropdown}`} size="small" variant="outlined" error={errors.reason == true ? "true" : ""}>
              <InputLabel id="demo-simple-select-outlined-label" className={classes.dropdownText}>{pageTexts.reasonForContactingText}</InputLabel>
              <Select
                labelId="demo-simple-select-outlined-label"
                id="demo-simple-select-outlined"
                value={reason}
                onChange={handleReasonChange}
                label={pageTexts.reasonForContactingText}
                size="small"
              >
                <MenuItem value="">{pageTexts.chooseAReasonText}</MenuItem>
                <MenuItem value={"Amount not credited"}>{pageTexts.amtNotCreditedText}</MenuItem>
                <MenuItem value={"Issues with merchant payment"}>{pageTexts.issWithMerchPaymentText}</MenuItem>
                <MenuItem value={"Unable to complete transaction"}>{pageTexts.unableToCompleteTxnText}</MenuItem>
                <MenuItem value={"Other"}>{pageTexts.other}</MenuItem>

              </Select>
            </FormControl>
          </div>
            <div style={{marginTop:"6px",textAlign: "left"}}>

              {reason && reason == "Other" && (<TextField
                  size="small"
                  value={otherReason}
                  onChange={e => setOtherReason(e.target.value)}
                  className={`${commonStyles.inputFieldWithGreyBg} ${classes.roundedInputField}`}
                  label="Other Reason"
                  variant="outlined"
                  id="custom-css-outlined-input"
                  error={errors.otherReason == true ? "true" : ""}
                />)}
              {data && (<TextField
                  multiline
                  className={`${commonStyles.inputFieldWithGreyBg} ${classes.roundedInputField}`}
                  maxRows={2}
                  size="small"
                  value={getTransactionTitle(data)}
                  label="Transaction"
                  variant="outlined"
                  id="custom-css-outlined-input"
                />)}
              <TextField
                  multiline
                  rows={8}
                  size="small"
                  value={message}
                  onChange={e => setMessage(e.target.value)}
                  className={`${commonStyles.inputFieldWithGreyBg} ${classes.roundedInputField}`}
                  label="Message"
                  variant="outlined"
                  id="custom-css-outlined-input"
                  error={errors.message == true ? "true" : ""}
              />
            </div>
            {/* <div style={{marginTop:"3px",textAlign: "left"}}>
              <label style={{display:"inline-block", fontSize: "16px", marginBottom:"3px", fontWeight:"500" }}>
                  Contact Preference
              </label>
              <RadioGroup aria-label="contactChoice" name="contactChoice" value={contactOption} onChange={handleContactOptionChange} style={{marginTop:"-4px"}} error={errors.contactOption == true ? "true" : ""}>
                <FormControlLabel style={{marginBottom:"-13px"}} size="small" value="Email" control={<BlueRadio />} label={<Typography><span className={`${commonStyles.darkBoldText} ${classes.darkBoldText}`}>EMAIL ME BACK</span><span>{email}</span></Typography>} />
                <FormControlLabel size="small" value="Phone" control={<BlueRadio />} label={<Typography><span className={`${commonStyles.darkBoldText} ${classes.darkBoldText}`}>CALL/SMS ME</span><span>{mobileNumber}</span></Typography>} />
              </RadioGroup>
              {contactOption && <p style={{marginTop:"-3px"}}>{contactOption=="Email" ? email : mobileNumber}</p>}
            </div> */}
            <div style={{marginTop: "15px"}}>
              <Typography><span className={`${commonStyles.darkBoldText} ${classes.darkBoldText}`}>{pageTexts.supportText}:</span>&nbsp;<span className={`${commonStyles.blueText} ${classes.darkBoldText}`}>{pageTexts.supportAddressText}</span></Typography>
            </div>
          </Box>
          {(Object.keys(infoMsg).length > 0) && (
              <div
                  className={`alert ${infoMsg.type === "error" ? "error" : "success"} extension`}
                  style={{ textAlign: "center", marginTop: "23px" }}>
                  <strong>{infoMsg.msg}</strong>
              </div>
          )}
          {
              <Loader
                  style={{ textAlign:"center",marginTop: "20px" }}
                  type="Oval"
                  color="#00BFFF"
                  height={40}
                  width={40}
                  visible={loading}
              />
          }

          {/* <div className="footer">
            <div className="backArrow">
              <ArrowBackOutlinedIcon onClick={()=> setCurrentScreen("dashboard")} style={{cursor:"pointer",color:"#18C2EE"}}/>
            </div>
            <div className="footerRightButtonMedium">
              <button
                  className="button-done"
                  onClick={() => submit()}>
                  SUBMIT
              </button>
            </div>
          </div> */}
      </div>
    );
};

export default Support;
