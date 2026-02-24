import { Accordion, AccordionDetails, AccordionSummary, Box, Divider, Grid, Typography } from '@material-ui/core';
import React from 'react';
import "../../NFTcollections.css";
import { makeStyles } from '@material-ui/core/styles';
import QRCode from 'react-qr-code';
import Copy from "./Copy";
import commonStyles from "./../../styles/common.module.scss";
import { common } from '@material-ui/core/colors';
import CheckCircleOutlineOutlinedIcon from '@material-ui/icons/CheckCircleOutlineOutlined';
import uiTexts from "./../../../configurations/dropp.json";

const pageTexts = uiTexts.nftTradeSubmitted;

const useStyles = makeStyles((theme) => ({
  nftDetails: {
    display: "inline-block",
    fontSize: "14px",
    overflow: "hidden",
    paddingLeft: "15px",
    verticalAlign: "middle",
    width: "125px"

  },
  greyBackground : {
    backgroundColor:"#f9f9f9",
    padding:"8px"
  },
  accordion: {
    backgroundColor: "#f9f9f9",
    border: "1px solid #a9a9a9",
    boxShadow: "none",
    width: "100%",
  },
  accordionDetails: {
    padding: "0 16px 16px",
    marginTop: "-14px",
    display: "block",
  },
  image: {
    width: "100%"
  },
  imageContainer: {
    display: "flex",
    alignItems: "flex-end",
  }
}));

const NFTTradeSubmitted = ({ screenData, setCurrentScreen, setFooterObj}) => {
  const NFTDataDetails = screenData.dataDetails;
  const imageUrl = screenData.imageUrl;
  const NFTDataInObject = screenData.data && screenData.data.object ? screenData.data.object : {};
  const toAccount = screenData.toAccount;
  const tradePrice = screenData.tradePrice;
  const tradeCurrency = screenData.tradeCurrency;
  const tradeId = screenData.tradeId;
  const classes = useStyles();

  React.useEffect(() => {
    window.scroll(0,0);
  }, []);

  React.useEffect(() => {
    setFooterObj({primaryBtnText: "Done", primaryFuncToCall: handleDone})
  }, [])

  const handleDone = () => {
    setCurrentScreen("nftcollections")
  }

  return (
    <div style={{ marginTop: "40px" }}>
      {/* <div
        style={{
          textAlign: "left",
          width: "600px",
          marginTop: "6px",
          marginLeft: "20px",
          zIndex: "100"
        }}
        className="header">
        <div style={{ paddingTop: "9px", marginRight: "180px" }}>
          <label style={{ fontWeight: "450", color: "#18C2EE", fontSize: "1.8em" }}>
            TRADE
          </label>
          <br />
          <label style={{ fontSize: "1.3em" }}>
            NFT
          </label>
        </div>
      </div> */}
      <div style={{ padding: "10px 17px" }}>

        <Grid container style={{ fontSize: "15px", fontWeight: "700" }}>
          <Grid item xs={8}>
            <Typography className={commonStyles.darkBoldText}>
              {pageTexts.nftTradeSubmittedText}
            </Typography>
          </Grid>
          <Grid item xs={3}>
            <CheckCircleOutlineOutlinedIcon color="primary"/> 
          </Grid>
        </Grid>
        <Box p={2} className={commonStyles.greyListContainer}>
          <Grid container >
            <Grid item xs={8}>
              <Grid container>
                <Grid item xs={6}>
                  <Typography variant="body2">
                    {pageTexts.titleText}:
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" className={commonStyles.darkBoldText}>
                    {NFTDataDetails.name}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2">
                    {pageTexts.tokenIdText}: 
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" className={commonStyles.darkBoldText}>
                    {NFTDataInObject.token}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2">
                    {pageTexts.serialNumText}:
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" className={commonStyles.darkBoldText}>
                    {NFTDataInObject.serialNumber}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2">
                    {pageTexts.to}:
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" className={commonStyles.darkBoldText}>
                    {toAccount}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" style={{letterSpacing: "-0.5px"}}>
                    {pageTexts.tradePriceText}:
                  </Typography>
                </Grid>
                <Grid item xs={6} variant="body2">
                  <Typography variant="body2" className={commonStyles.darkBoldText}>
                    {tradePrice} {tradeCurrency ? tradeCurrency : ""}
                  </Typography>
                </Grid>
              </Grid>
            </Grid>
            <Grid className={classes.imageContainer} item xs={4}>
              <img className={classes.image} src={imageUrl} alt={NFTDataDetails.name} />
            </Grid>
          </Grid>
        </Box>
        {/* <div className="transactionBetween">
          <div id="from">
            <Typography fontSize={14} className="NFTKeys" style={{ padding: "7px 0px" }}>TO</Typography>
            <p style={{ fontSize: "15px" }}>{toAccount}</p>
          </div>
        </div>
        <div>
          <div id="tradePrice">
            <Typography fontSize={14} className="NFTKeys" style={{ padding: "7px 0px" }}>TRADE PRICE</Typography>
            <p style={{ fontSize: "15px" }}>{tradePrice} {tradeCurrency ? tradeCurrency : ""}</p>
          </div>
        </div> */}
        <Accordion defaultExpanded className={classes.accordion} aria-setsize={"large"}>
          <AccordionSummary
            expandIcon={<img src="./arrowDown.png" alt="show" />}
            aria-controls="panel1a-content"
            id="panel1a-header"
          >
            <Typography className={`${commonStyles.darkBoldText} ${commonStyles.largeSizedText} errMsg`}> ACTION REQUIRED</Typography>
          </AccordionSummary>
          <AccordionDetails className={`${commonStyles.mediumSizedText} ${classes.accordionDetails}`}>
            <Box my={1}>
              <Typography>
                {pageTexts.provideBelowTradeIdText}
              </Typography>
            </Box>
            <Typography className={commonStyles.darkBoldText}>
              {pageTexts.warningText}
            </Typography>
          </AccordionDetails>
        </Accordion>
        {/* <div>
          <div style={{marginTop: "10px"}}>
            <Typography style={{color: "red"}}>ACTION REQUIRED</Typography>
          </div>
          <div>
            <Typography>Provide the trade ID shown below to the buyer of this NFT or have them scan this QR code. They need to sign and confirm the trade from their wallet to complete this transaction.</Typography>
          </div>
          <div>
            <Typography>
              <strong>
                If not confirmed within 30 minutes, the trade will expire automatically and no transfer of NFT or HBAR will happen.
              </strong>
            </Typography>
          </div>

          <div style={{textAlign: "center"}} className={classes.greyBackground}>
            <div>
              <Typography fontSize={14} className="NFTKeys" style={{ padding: "7px 0px" }}>TRADE ID</Typography>
              <p style={{ fontSize: "15px" }}><span style={{verticalAlign: "middle", marginRight: "5px"}}>{tradeId}</span><span style={{verticalAlign: "middle"}}><Copy iconColor="disabled" toolTipTitle="Copy Trade ID" copyMessage="Trade ID Copied to clipboard" text={tradeId} /></span></p>
            </div>
            <div style={{padding: "15px 0"}}>
              <QRCode value={tradeId} size={130} />
            </div>
          </div>
          <div style={{paddingTop:"25px"}}>
            <Typography>
              We have also emailed you the Trade ID and the details of this trade.
            </Typography>
          </div>
          <div style={{ clear: "both" }}>
            <hr style={{backgroundColor:"#B4B4B4", height:"1px", border:"none"}}/>
          </div>
        </div> */}
        <Box p={2} className={commonStyles.greyListContainer}>
          <Grid container justifyContent='center'>
            <Grid item xs={12} className={commonStyles.textCenter}>
              <div>
                <Typography fontSize={14} style={{ padding: "7px 0px" }}>{pageTexts.tradeIdText}:&nbsp;
                  <span className={commonStyles.darkBoldText} >{tradeId}</span>&nbsp;&nbsp;
                  <span style={{verticalAlign: "middle"}}><Copy iconColor="disabled" toolTipTitle="Copy Trade ID" copyMessage="Trade ID Copied to clipboard" text={tradeId} /></span>
                </Typography>
                {/* <p style={{ fontSize: "15px" }}><span style={{verticalAlign: "middle", marginRight: "5px"}}>{tradeId}</span></p> */}
              </div>
              <QRCode value={tradeId} size={130} />
            </Grid>
          </Grid>
        </Box>
        <div style={{ paddingTop: "25px" }}>
          <Typography>
            {pageTexts.emailedYouText}
          </Typography>
        </div>
        <Divider className={commonStyles.divider}/>
      </div>

      {/* <div className="footer">
        <div style={{bottom: "10px", position: "fixed",right: 0}}>
          <div>
            <button
              className="getNFTBtn"
              style={{ position: "relative", right: "25px" }}
              onClick={()=> setCurrentScreen("nftcollections")}
              >
              DONE
            </button>
          </div>
        </div>
      </div> */}
    </div>
  )
}

export default NFTTradeSubmitted;