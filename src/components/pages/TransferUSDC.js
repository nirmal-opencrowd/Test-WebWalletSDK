import React, { useState } from "react";
import ArrowBackOutlinedIcon from '@material-ui/icons/ArrowBackOutlined';
import { makeStyles } from '@material-ui/core/styles';
import Typography from "@material-ui/core/Typography";
import * as api from "./../../api";
import NavigateNextIcon from '@material-ui/icons/NavigateNext';
import { displayAmount, hederaAccountToString } from "../../utils/utils";
import { getCurrencyDecimal } from "../../utils/utils";
import FiberManualRecordIcon from '@material-ui/icons/FiberManualRecord';
import { Box, CircularProgress, Divider } from "@material-ui/core";
import styles from "./../../styles/common.module.scss";
import UITexts from "./../../../configurations/dropp.json";

const useStyles = makeStyles((theme) => ({
  detailContainer: {
    paddingLeft:"20px",
    paddingRight:"20px",
    marginTop:"30px",
    overflowY:"scroll"
  },
  margin: {
    margin: theme.spacing(1),
  },
  modalContainer: {
    backgroundColor: '#FFFFFF',
    border: 0,
    padding: "15px",
    position: 'absolute',
    left: '10%',
    top: '30%',
    width: 250,

  },
  ctrlBtns: {
    marginTop: "5px",
    textAlign: "right",
  },
  content: {
    fontSize: "14px",
  },
  step: {
    color: "#18C2EE",
    fontWeight: 800,
  },
  stepHeading: {
    fontWeight: 600,
    padding: "10px 0",
    lineHeight: "18px",
  },
  qrBox: {
    margin: "10px 0",
    textAlign: "center"
  },
  chain: {
    cursor:"pointer",
    display: "flex",
    justifyContent:"space-between",
    padding:"10px 15px 10px 0px",
  },
  chainContainer: {
    paddingTop:"20px",
  },
  subHeadings : {
    fontSize:"20px"
  },
  icons : {
    color: "#18C2EE"
  },
  footer: {
    bottom: "0",
    padding:"0px 20px 10px 20px",
    position:"fixed",
  },
  balance: {
    color: "#000",
    fontSize: "25px",
  },
  balanceContainer: {
    padding: "20px"
  }
}));

const TransferUSDC =({setCurrentScreen, userDetails, setScreenWithData, screenData}) => {
  const [depositAddress, setDepositAddress] = useState("");
  const [noDepositAddress, setNoDepositAddress] = useState(false);
  const [lastTransfer, setLastTransfer] = useState(null);
  const [disableConfirmBtn, setDisableConfirmBtn] = useState(false);
  const [depositAmt, setDepositAmt] = useState(null);
  const [depositAmtErr, setDepositAmtErr] = useState("");
  const [backendErr, setBackendErr] = useState("");
  const [pendingTransfers, setPendingTransfers] = React.useState([]);
  const [transfersLoading, setTransfersLoading] = React.useState(false);
  const [networkChains, setNetworkChains] = React.useState([]);
  const [chain, setChain] = React.useState(screenData && screenData.chain ? screenData.chain : null);
  const [chainTitle, setChainTitle] = React.useState(null);
  const [waitingPaymentAddress, setWaitingPaymentAddress] = React.useState(screenData && screenData.waiting == true ? true : false);
  const [activePaymentAddress, setActivePaymentAddress] = React.useState(false);
  const [depositData, setdepositData] = React.useState([]);
  const [activeChains, setActiveChains] = useState([]);
  const [qrGenerated, setQrGenerated] = React.useState(screenData && screenData.qrGenerated ? true : false);
  const classes = useStyles();
  const pageTexts = UITexts.transferUSDC;

  const updateLatestTransferInfo = (data) => {
    setLastTransfer(data);
    setDisableConfirmBtn(data.status == "PENDING");
  };

  const getTransferHistory = async () => {
    setTransfersLoading(true);
    let result = await api.getTransferHistory({status: "PENDING"});
    if (result && result.responseCode == 0) {
      setPendingTransfers(result.data);
    }
    setTransfersLoading(false);
  };

  React.useEffect(() => {

    async function fetchDepositeAddress() {
      try {
          let hasDepositAddress = false;
          let res = await api.fetchDepositeAddress();
          if (res && res.responseCode == 0) {
              if(res.data && res.data.depositAddress) {
                  setdepositData(res.data);
                  setWaitingPaymentAddress(false);
                  hasDepositAddress = true;
                  return hasDepositAddress;
              }
          } else {
              setBackendErr(res.messages[0]);
          }
      } catch (error) {
          setBackendErr("Internal Server Error");
      }
  }

    async function activePaymentIntents() {
      let res = await api.activePaymentIntents();
      if(res && res.responseCode == 0 && res.data.length && res.data[0].depositAddress) {
        setActivePaymentAddress(true);
        setdepositData(res.data);
        setActiveChains(res.data)
        let dataArray = res.data;
        const latestObject = dataArray.reduce((prev, current) => {
          const prevTime = new Date(prev.createTime).getTime();
          const currentTime = new Date(current.createTime).getTime();
          return currentTime > prevTime ? current : prev;
        });

        let chains = await api.getNetworkChains();
        let index = chains.data.findIndex((item) => item.chain == latestObject.chain);
        const elementToShift = chains.data[index];
        chains.data.splice(index, 1);
        chains.data.unshift(elementToShift);
        setNetworkChains(chains.data);
        setDepositAddress(res.data[0].depositAddress);
        setWaitingPaymentAddress(false);
      } else if (res.data.length === 0) {
        let chains = await api.getNetworkChains();
        setNetworkChains(chains.data);
      }
    }

    Promise.all([getTransferHistory(), activePaymentIntents()]);
  }, []);

  const generateEthereumAddress = async () => {
    const result = await api.generateEthereumAddress();
    if (result && result.responseCode == 0) {
      if (result.data) {
        setDepositAddress(result.data);
        setNoDepositAddress(false);
      }
    }
  };

  const validate = () => {
    let hasError = false;

    if (depositAmt) {
      if (!(depositAmt.match(/^[+]?\d+(\.\d+)?$/) != null && parseFloat(depositAmt) != NaN)) {
        setDepositAmtErr("Invalid Amount");
        hasError = true;
      } else {
        setDepositAmtErr("");
      }
    } else {
      setDepositAmtErr("Amount cannot be empty");
      hasError = true;
    }
    return !hasError;
  };

  const fundUSDC = (chainData) => {
    setChain(chainData.chain);
    setChainTitle(chainData.chainTitle);
    if (chainData.chain === "HBAR"){
      setDepositAddress(hederaAccountToString(userDetails.hhAccount));
    }
    setQrGenerated(false);
  }

  React.useEffect(() => {
    if (screenData && screenData.backWhileWaiting) {
      setChain(null);
    }
  }, [])

  React.useEffect(()=>{
    if( chain && chain != "HBAR" && qrGenerated != true) {
      if(activeChains.length >0 && activeChains.some((obj) => obj.chain === chain) && depositData) {
        let index = depositData.findIndex((obj) => obj.chain === chain);
        setScreenWithData("chainAddress", {chain, depositData: depositData[index], activePaymentAddress, chainTitle})
      } else if(screenData && screenData.waiting) {
        setScreenWithData("createDepositeAddress", {chain, chainTitle, activePaymentAddress, waiting: screenData && screenData.waiting});
      } else {
        setScreenWithData("createDepositeAddress", {chain, chainTitle, activePaymentAddress});
      }
    } else if (chain == "HBAR" && depositAddress) {
      setScreenWithData("chainAddress", {chain, depositAddress, chainTitle})
    }
  }, [chain, depositAddress, qrGenerated]);

  return (
    <div style={{marginTop:"33px"}}>
      <div className={classes.detailContainer}>
        <div className={`${styles.greyListContainer} ${classes.balanceContainer}`}>
          <Typography variant="subtitle2" style={{fontWeight:"600"}}>
            {pageTexts.balanceHeading}
          </Typography>
          <Typography className={`${styles.darkBoldText} ${classes.balance}`}>
            {displayAmount(userDetails.cryptoBalance/getCurrencyDecimal("USDC"))}
          </Typography>
        </div>
        <Typography style={{marginTop: "5px"}}>
          {pageTexts.transferUSDCTxt}
        </Typography>
        <div className={classes.chainContainer}>
          <div>
            <label className={`${classes.subHeadings} ${styles.darkBoldText}`}>
              {pageTexts.from}
            </label>
          </div>
          <Box my={2}>
            {
              networkChains && networkChains.length ? networkChains.map((item, index) => {
                return (<>
                  <div key={item.chainTitle} className={classes.chain} onClick={() => fundUSDC(item)}>
                    <div style={{ display: "flex", alignItems: "center" }}>
                      {
                        (!waitingPaymentAddress && !activePaymentAddress) || (activeChains.length > 0 && !activeChains.some((obj) => obj.chain === item.chain)) ? <FiberManualRecordIcon style={{ color: "#ffffff" }} /> : <FiberManualRecordIcon
                          style={{ color: screenData && screenData.waiting && !activeChains.some((obj) => obj.chain === item.chain) ? "#FFD700" : "#21B501" }}
                        />
                      }
                      <Typography style={{ fontWeight: "600" }} variant="h6">
                        {item.chainTitle}
                      </Typography>
                      {
                        index == 0 && activeChains && activeChains.length ? <Typography style={{paddingLeft:"6px"}}>
                          ({pageTexts.lastUsed})
                        </Typography> : ""
                      }
                    </div>
                    <NavigateNextIcon className={classes.icons} />
                  </div>
                  <Divider className={styles.divider} />
                </>)
              }) : <div className="loader" style={{ margin: "9px auto auto" }}>
                <CircularProgress color="inherit" />
              </div>
            }
          </Box>
          <div>
            <Typography style={{ opacity: "0.4", fontWeight: "600" }} variant="subtitle2">
              {pageTexts.OtherNetworksSoonTxt}
            </Typography>
          </div>
        </div>
      </div>
      {/* <div className="footer">
        <div className="backArrow">
          <ArrowBackOutlinedIcon onClick={()=> setCurrentScreen("dashboard")} style={{cursor:"pointer",color:"#18C2EE"}}/>
        </div>
      </div> */}
    </div>
  );
};

export default TransferUSDC;
