import React from "react";
import ArrowBackOutlinedIcon from '@material-ui/icons/ArrowBackOutlined';
import { makeStyles } from '@material-ui/core/styles';
import Typography from "@material-ui/core/Typography";
import { hederaAccountToString } from "./../../utils/utils";
import Copy from "./Copy";
import QRCode from "react-qr-code";
import styles from "./../../styles/common.module.scss";
import UITexts from "./../../../configurations/dropp.json";
import { Box, Grid } from "@material-ui/core";


const useStyles = makeStyles((theme) => ({
  detailContainer: {
    overflowY:"scroll",
    textAlign:"center",
  },
  keyField: {
    width: "100%",
  },
  multilineInput: {
    '& .MuiInput-multiline': {
      paddingTop: 0
    }
  },
  mainContainer : {
    margin: "60px 20px",
  },
  copyIconContainer: {
    textAlign: "end"
  },
  accIdCopySubHeading : {
    color: "#000",
    fontSize: "25px",
  },
}));

const FundCrypto =({setCurrentScreen, userDetails}) => {
  const classes = useStyles();
  const pageTexts = UITexts.fundCrypto;

  // React.useEffect(() => {
  //   async function getLocalUser() {
  //     const userData = await localstorage.decrypted.get();
  //     if (userData) {
  //       setLocalUserData(userData);
  //     }
  //   }
  //   getLocalUser();
  // }, []);

  return (
    <div style={{marginTop:"33px"}}>
      {/* <div
        style={{
            textAlign: "left",
            marginTop: "6px",
            marginLeft: "20px",
            marginBottom: "10px"
      }}>
        <div style={{ paddingTop: "9px" }}>
            <label style={{ fontWeight: "450", color: "#18C2EE", fontSize: "1.8em" }}>
                DEPOSIT
            </label>
            <br/>
            <label style={{fontSize: "1.3em" }}>
                HEDERA ACCT#
            </label>
            <br/>
            <label style={{fontSize: "1.3em" }}>
              {hederaAccountToString(userDetails.hhAccount)}
            </label>
        </div>
      </div> */}
      <div className={classes.mainContainer}>
        <Typography align="center" className={`${styles.darkBoldText} ${styles.upperCase}`} >Transfer {userDetails.currency} to your Dropp Account</Typography>
        <div className={`${styles.greyListContainer} ${classes.detailContainer}`}>
          <div style={{padding: "15px", textAlign: "center"}}>
            <div style={{padding: "15px", textAlign: "center", backgroundColor: "#fff"}}>
              <QRCode size={220} value={hederaAccountToString(userDetails.hhAccount)} />
            </div>
          </div>
        </div>
        <Box my={2}>
          <Typography align="center">
            Show this QR code to a business or share your account ID
          </Typography>
        </Box>
        <Box my={2}>
          <div className={styles.greyListContainer}>
            <Grid container>
              <Grid item xs={12}>
                <Typography className={`${styles.darkBoldText}`}>
                  {pageTexts.accIdCopySubHeading}
                </Typography>
              </Grid>
              <Grid item xs={8}>
                <Typography className={`${styles.darkBoldText} ${classes.accIdCopySubHeading}`}>
                  {hederaAccountToString(userDetails.hhAccount)}
                </Typography>
              </Grid>
              <Grid item xs={4} className={classes.copyIconContainer}>
                <Copy iconSize={20} iconColor="disabled" toolTipTitle={pageTexts.copyToolTipTitle} copyMessage={pageTexts.copyMessage} text={hederaAccountToString(userDetails.hhAccount)} />
              </Grid>
            </Grid>
          </div>
        </Box>
      </div>
        {/* <div className="footer">
          <div className="backArrow">
            <ArrowBackOutlinedIcon onClick={()=> setCurrentScreen("dashboard")} style={{cursor:"pointer",color:"#18C2EE"}}/>
          </div>
        </div> */}
    </div>
  );
};

export default FundCrypto;
