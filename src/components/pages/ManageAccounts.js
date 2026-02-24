import React from "react";
import ArrowBackOutlinedIcon from '@material-ui/icons/ArrowBackOutlined';
import { makeStyles } from '@material-ui/core/styles';
import Grid from "@material-ui/core/Grid";
import Typography from "@material-ui/core/Typography";
import * as api from "./../../api";
import getSymbolFromCurrency from 'currency-symbol-map';
import { hederaAccountToString, displayAmount } from "./../../utils/utils";
import { SUPPORTED_CRYPTO_CURRENCIES } from "../../utils/constants";
import commonStyles from "./../../styles/common.module.scss";
import Loader from "../Loader";
import { Box, CircularProgress, Modal } from "@material-ui/core";
import uiTexts from "./../../../configurations/dropp.json";

const useStyles = makeStyles((theme) => ({
  walletContainer: {
    paddingLeft:"20px",
    paddingRight:"20px",
    marginTop:"30px",
    maxHeight:"500px",
    overflowY:"scroll"
  },
  walletBox: {
    border: "1px solid #000",
    borderRadius: "4px",
    marginBottom: "15px"
  },
  currencyDetail: {
    display: "inline-block",
    padding: "15px 0 15px 15px",
    width: "55%"
  },
  activeLink: {
    display: "inline-block",
    float: "right",
    padding: "15px 15px 15px 0",
    textAlign: "right",
    width: "30%"
  },
  currency: {
    fontWeight: 600,
  },
  country: {
    fontSize: "12px",
    fontWeight: 400
  },
  balance: {
    fontSize: "12px!important",
    fontWeight: 600
  },
  defaultBtn: {
    paddingLeft: "10px",
    paddingRight: "10px"
  },
  active: {
    border: "1px solid #18c2ee"
  }
}));

const pageTexts = uiTexts.manageaccounts;

const ManageAccounts =( {setCurrentScreen, setScreenWithData, userDetails, data, workingEnv, updateUserDetails}) => {
  const [currencyWallets, setCurrencyWallets] = React.useState([]);
  const [hbarBalance, setHbarBalance] = React.useState(null);
  const [showHbarBalanceLink, setShowHbarBalanceLink] = React.useState(false);
  const [usdcBalance, setUsdcBalance] = React.useState(null);
  const [showUsdcBalanceLink, setShowUsdcBalanceLink] = React.useState(false);
  const [caratBalance, setCaratBalance] = React.useState(null);
  const [showCaratBalanceLink, setShowCaratBalanceLink] = React.useState(false);
  const [loading, setLoading] = React.useState(true);

  const classes = useStyles();

  React.useEffect(() => {
    getUserWalletList();
  }, []);

  const fetchCryptoBalance = async (currency) => {
    const balanceData = await api.getCryptoBalance({hhAccountID: hederaAccountToString(userDetails.hhAccount), currency: currency});
    if (balanceData && (balanceData.data || balanceData.data == 0)) {
      if (currency == "HBAR") {
        setHbarBalance(balanceData.data);
        setShowHbarBalanceLink(false);
      } else if (currency == "USDC") {
        setUsdcBalance(balanceData.data);
        setShowUsdcBalanceLink(false);
      } else if (currency == "CARAT") {
        setCaratBalance(balanceData.data);
        setShowCaratBalanceLink(false);
      }
    }
  };

  // const fetchHbarBalance = async () => {
  //   const balanceData = await api.getHbarBalance({hhAccountID: hederaAccountToString(userDetails.hhAccount)});
  //   if (balanceData && (balanceData.data || balanceData.data == 0)) {
  //     setHbarBalance(balanceData.data);
  //     setShowHbarBalanceLink(false);
  //   }
  // };

  // const fetchUsdcBalance = async () => {
  //   const balanceData = await api.getUsdcBalance({hhAccountID: hederaAccountToString(userDetails.hhAccount)});
  //   if (balanceData || balanceData == 0) {
  //     setUsdcBalance(balanceData.data);
  //     setShowUsdcBalanceLink(false);
  //   }
  // };

  const setWalletAsDefault = async (countryCode, currencyCode, operatorId) => {
    try{
      let result = await api.setWalletAsDefault({countryCode, currencyCode, operatorId});
      if (result && result.responseCode == 0) {
        Promise.all([getUserWalletList(), fetchLatestUserDetails()]);
      }
    }
    catch(e) {
      console.log("Error in marking it active : ", e);
    }
  };

  const fetchLatestUserDetails = async () => {
    const latestUserDetails = await api.fetchUserDetails(true);
    updateUserDetails(latestUserDetails);
  };

  const getUserWalletList = async () => {
    setLoading(true);
    let walletList = await api.fetchUserWalletList();
    if (walletList && walletList.data && walletList.data.length) {
      let hbarBalanceLink = true;
      let usdcBalanceLink = true;
      let caratBalanceLink = true;
      for(let i = 0; i < walletList.data.length; i++) {
        if (walletList.data[i].active && walletList.data[i].walletId.currencyCode == "HBAR") {
          hbarBalanceLink = false;
        } else if (walletList.data[i].active && walletList.data[i].walletId.currencyCode == "USDC") {
          usdcBalanceLink = false;
        } else if (walletList.data[i].active && walletList.data[i].walletId.currencyCode == "CARAT") {
          caratBalanceLink = false;
        }
      }
      setShowHbarBalanceLink(hbarBalanceLink);
      setShowUsdcBalanceLink(usdcBalanceLink);
      setShowCaratBalanceLink(caratBalanceLink);
      setCurrencyWallets(walletList.data);
    }
    setLoading(false);
  };

  return (
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
                PROFILE
            </label>
            <br/>
            <label style={{fontSize: "1.3em" }}>
                MANAGE CURRENCY ACCOUNTS
            </label>
        </div>
      </div> */}
      <div className={classes.walletContainer}>
        {currencyWallets && currencyWallets.length > 0 && currencyWallets.map((data, key) => {
          return (
            <div>
              <div className={`${commonStyles.greyListContainer} ${data.active ? classes.active : ""}`} style={{display: "block" }}>
                <Grid container spacing={1} alignItems="center">
                  <Grid item xs={6}>
                    <Typography variant="body2" className={commonStyles.darkBoldText}>{data.walletId.currencyCode == "USDC" ? "USDC (CIRCLE)" : data.walletId.currencyCode}</Typography>
                    <Typography variant="body2" className={classes.country}>{data.walletId.countryCode == "GLOBAL" ? "DIGITAL CURRENCY" : data.walletId.countryCode}</Typography>
                  </Grid>

                  <Grid item xs={6}>
                    {data.walletId.currencyCode == "HBAR" ?
                      <Typography variant="body2" align="right" className={classes.balance}>
                        {(showHbarBalanceLink && userDetails && userDetails.hhAccount) ?
                          <a
                            className={`${commonStyles.blueBoldLink} ${classes.balance}`}
                            onClick={() => fetchCryptoBalance("HBAR")}>
                            {pageTexts.showBalanceText}
                          </a>
                        :
                          <span>
                            {pageTexts.balanceText}:
                            <img
                            height="14"
                            width="8"
                            src="./hbar_icon.png"
                            className={classes.balance}
                            />{displayAmount((hbarBalance ? hbarBalance : data.balance)/Math.pow(10, 8), 4)}
                          </span>
                        }
                      </Typography>
                    :
                      <>
                        {data.walletId.currencyCode == "USDC" ?
                          <Typography variant="body2" align="right" className={classes.balance}>
                            {(showUsdcBalanceLink && userDetails && userDetails.hhAccount) ?
                              <a
                                className={`${commonStyles.blueBoldLink} ${classes.balance}`}
                                onClick={() => fetchCryptoBalance("USDC")}>
                                {pageTexts.showBalanceText}
                              </a>
                            :
                              <>
                              {pageTexts.balanceText}: {displayAmount((usdcBalance ? usdcBalance : data.balance) / Math.pow(10, 6), 2)} USDC
                              </>
                            }
                          </Typography>
                        :
                        ""
                        // {/* <Typography variant="body2" className={classes.balance}>Balance: {getSymbolFromCurrency(data.walletId.currencyCode)}{data.balance}</Typography> */}
                        }
                        {data.walletId.currencyCode == "CARAT" ?
                          <Typography variant="body2" align="right" className={classes.balance}>
                            {(showCaratBalanceLink && userDetails && userDetails.hhAccount) ?
                              <a
                                className={`${commonStyles.blueBoldLink} ${classes.balance}`}
                                onClick={() => fetchCryptoBalance("CARAT")}>
                                {pageTexts.showBalanceText}
                              </a>
                            :
                              <>
                              {pageTexts.balanceText}: {displayAmount((caratBalance ? caratBalance : data.balance) / Math.pow(10, 2), 2)} CARAT
                              </>
                            }
                          </Typography>
                        :
                          ""
                        }
                        {
                          data.walletId.currencyCode == "USD" ?
                            <Typography variant="body2" align="right" className={classes.balance}>
                            {pageTexts.balanceText}: ${displayAmount(data.balance || 0, 2)}
                            </Typography> : ""
                        }
                      </>
                    }

                  </Grid>
                </Grid>
                <Grid container spacing={1} alignItems="center">
                  <Grid item xs={6}>
                    <div style={{fontSize: "12px"}}>
                        {data.active ? <Typography variant="body2" className={`${classes.balance} ${commonStyles.boldGreyText}`}>{pageTexts.currentlyActiveText}</Typography> :
                          <a
                            className={`${commonStyles.blueBoldLink} ${classes.balance}`}
                            onClick={() => {setWalletAsDefault(data.walletId.countryCode, data.walletId.currencyCode, data.walletId.operatorId);}}>
                            {pageTexts.setToActiveText}
                          </a>
                        }
                    </div>
                  </Grid>
                  <Grid item xs={6}>
                    <div style={{ fontSize: "12px"}}>
                        {data.showDetails ?
                          <Typography variant="body2" align="right">
                            <a
                              className={`${commonStyles.blueBoldLink} ${classes.balance}`}
                              onClick={() => {setScreenWithData("hbarDetails", {currencyCode: data.walletId.currencyCode})}}>
                              {pageTexts.viewDetailsText}
                            </a>
                          </Typography>
                        : ""}
                    </div>
                  </Grid>
                </Grid>
              </div>
            </div>
          );
        })}
        <Box my={2}>
          <Typography variant="body2" >
            <a
              className={`${commonStyles.blueBoldLink} ${classes.balance}`}
              onClick={() => setScreenWithData("addcurrencywallet", currencyWallets)}>
              {pageTexts.addCurrText}
            </a>
          </Typography>
        </Box>
      </div>
        {/* <div className="footer" style={{paddingLeft:"18px", height:workingEnv === "test" ? "70px" : "45px"}}>
          <div className="backArrow">
            <ArrowBackOutlinedIcon onClick={()=> setCurrentScreen(data && data.fromScreen ? data.fromScreen : "profile")} style={{cursor:"pointer",color:"#18C2EE"}}/>
          </div>
          <div className="footerRightButtonLarge" style={{left: "170px", bottom: workingEnv === "test" ? "6px" : ""}}>

          </div>
        </div> */}
      <Modal
        open={loading}
      >
        <Box style={{ backgroundColor: "transparent", height: "100vh", width: "100%", display: "flex" }}>
          <div style={{ margin: "auto", textAlign: "center", color: "#18C2EE" }}>
            <CircularProgress color="inherit" />
          </div>
        </Box>
      </Modal>
    </div>
  );
};

export default ManageAccounts;
