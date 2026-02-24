import React from "react";
import CurrencyToggle from "./../CurrencyToggle";
import * as localstorage from "../../utils/local-storage";
import ArrowBackOutlinedIcon from '@material-ui/icons/ArrowBackOutlined';
import InfoOutlinedIcon from "@material-ui/icons/InfoOutlined";
import Popover from '@material-ui/core/Popover';
import Grid from "@material-ui/core/Grid";
import {
    EmailShareButton,
    FacebookShareButton,
    TwitterShareButton,
    WhatsappShareButton
} from "react-share";
import {
    EmailIcon,
    FacebookIcon,
    TwitterIcon,
    WhatsappIcon
} from "react-share";
import { isSafari, getCurrencyDecimal, isCrypto, displayAmount } from "./../../utils/utils";
import { renderCurrency } from "../../utils/currency";
import styles from "./../../styles/common.module.scss";
import uiText from "./../../../configurations/dropp.json"
import { Box, Typography, makeStyles, Tooltip, IconButton } from "@material-ui/core";
import moment from "moment";
import classNames from "classnames";
import FeeBreakdown from "../FeeBreakdown";
import { getMerchantOrgName } from "../../api";
import Copy from "./Copy";

const useStyles = makeStyles(() => ({
  merchantOrganiationName : {
    wordBreak: "break-word"
  },
  defaultUpperMargin: {
    marginTop: "10px",
  },
  thumbnailContainer: {
    marginTop: "10px",
  },
  parentContainer: {
    backgroundColor: "#FDFDFD",
    padding: "5px",
  },
  thumbnailImg: {
    backgroundPosition: 'center',
    backgroundSize: 'cover',
    borderRadius:"5px",
    height: "100%",
    width: "100%",
  },
  link: {
    cursor: "pointer"
  },
  copyWrapper: {
    "& img": {
      width: "35px",
    }
  },
  tooltip: {
    fontSize: "14px",
  },
}))

/* global chrome */
const PurchaseDetails = props => {

  const classes = useStyles();
  const pageTexts = uiText.details;
  const uuid = props.data.qrCodeUUID

  const [shareURL, setShareURL] = React.useState();
  const [purchaseURL, setPurchaseURL] = React.useState();
  const [params, setParams] = React.useState({});
  const [popoverOpen, setPopoverOpen] = React.useState(false);
  const [details, setDetails] = React.useState({});
  const [anchorEl, setAnchorEl] = React.useState(null);
  const [receiptData, seReceiptData] = React.useState(null);

  React.useEffect(() => {
      setDetails(props.data)
  }, []);



  React.useEffect(() => {
      let p = {};
      if (details.shareURL) {
          if (details.shareURL.indexOf("?") !== -1) {
              const queryString = details.shareURL.split("?")[1];
              p = Object.fromEntries(new URLSearchParams(queryString).entries());
              setShareURL(`${details.shareURL}&referrer=${details.referrer}`);
          } else {
              setShareURL(`${details.shareURL}?referrer=${details.referrer}`);
          }
      }
      if (details.purchaseURL) {
          const queryString = details.purchaseURL.split("?")[1];
          p = { ...p, ...Object.fromEntries(new URLSearchParams(queryString).entries()) };
          localstorage.decrypted.get().then(decrypted => {
              setPurchaseURL(`${details.purchaseURL}`);
          });
      }
      if (details.thumbnail) {
        p = {...p, thumbnail: details.thumbnail};
      }
      if (Object.entries(p).length > 0) {
          setParams(p);
      }
      if(uuid && Object.keys(details).length) {
       getMerchOrgName(uuid)
      }
  }, [details]);

  async function getMerchOrgName(uuid) {
    const res = await getMerchantOrgName({uuId: uuid});
    const data = JSON.parse(res.data[0].data);
    seReceiptData(data.data);
  }
    const openPurchasedContent = () => {
        chrome.tabs.create({ url: purchaseURL });
    };

    const takeToMerchantSite = () => {
      if (details.merchantDisplayUrl) {
        chrome.tabs.create({url: details.merchantDisplayUrl});
      }
    };

    const handlePopoverOpen = (event) => {
      setAnchorEl(event.target)
      setPopoverOpen(true)
    }

    const handlePopoverClose = () => {
      setAnchorEl(null)
      setPopoverOpen(false)
    }

    const shareEmail = (data) => {
        const emailShareUrl = `mailto:?subject=${encodeURIComponent(data.subject)}&body=${encodeURIComponent(data.body)}`;
        chrome.runtime.sendMessage({
            type: "openInNewTab",
            request: {url: emailShareUrl},
        });
    };

    return (
          <div style={{padding:"20px", marginTop: "50px"}}>
              <div>
                <Grid container spacing={2} className={classNames([classes.parentContainer, styles.commonMainContainer])}>
                    <Box component={Grid} item xs={12} my={1} py={0} className={styles.greyListContainer}>
                      {/* <Grid item xs={12}> */}
                        <Box p={1}>
                          {details.merchantDisplayUrl ?
                            <Typography variant="h6" className={classNames([styles.darkBoldText, classes.merchantOrganiationName, styles.upperCase, classes.link])} onClick={takeToMerchantSite}>{details.merchantOrganiationName}</Typography>
                          :
                            <Typography variant="h6" className={classNames([styles.darkBoldText, classes.merchantOrganiationName, styles.upperCase])}>{details.merchantOrganiationName}</Typography>
                          }
                        </Box>
                      {/* </Grid> */}
                    </Box>
                    <Box my={1} component={Grid} item xs={12} py={0} className={styles.greyListContainer}>
                        <Box p={1}>
                          <Grid container>
                            <Grid item xs={6}>
                              <Typography className={classNames([styles.darkBoldText, classes.merchantOrganiationName, styles.upperCase])}>
                                {pageTexts.totalText}
                              </Typography>
                            </Grid>
                            <Grid item xs={6}>
                              <div style={{textAlign: "right", width: "100%"}}>
                                  {details.offerCode ?
                                      <>
                                          {(details.invoiceAmount == details.discountedAmount) ?
                                              <CurrencyToggle style={{float:"right"}} hbarImageWidth="9px" hbarImageHeight="14px" fontSize="1.4em" {...props.data} />
                                          :
                                              <Typography>
                                                  <span className={styles.boldGreyText} style={{textDecoration: "line-through"}}>{renderCurrency(details.invoiceAmount, details.invoiceCurrency, null, null, isCrypto(details.invoiceCurrency))} </span>
                                                  <span className={styles.darkBoldText} style={{paddingLeft: "3px"}}>{renderCurrency(details.discountedAmount, details.invoiceCurrency, null, null,  isCrypto(details.invoiceCurrency))}</span>
                                              </Typography>
                                          }
                                      </>
                                  :
                                      <CurrencyToggle style={{float:"right"}} hbarImageWidth="9px" hbarImageHeight="14px" fontSize="1.4em" {...props.data} />
                                  }
                              </div>
                            </Grid>
                            <Grid item xs={12}>
                              <Typography
                              >
                                {moment(details.createTimeEpoch * 1000).format("MMMM DD YYYY, h:mm a")}
                                {/* {new Date(
                                    details.createTimeEpoch * 1000
                                  ).toLocaleString()} */}
                              </Typography>
                            </Grid>
                            <Grid item xs={12} className={classes.defaultUpperMargin}>
                              {isCrypto(details.currency) ?
                                <>
                                  {(details.cryptoAmount > 0) ?
                                    <Typography className={styles.darkBoldText}>
                                      Used {renderCurrency(details.cryptoAmount, details.currency, null, null,  isCrypto(details.currency))} from Wallet
                                    </Typography>
                                    : ""}
                                </>
                                :
                                <>
                                  {(details.amount > 0) ?
                                    <Typography className={styles.darkBoldText}>
                                      Used {renderCurrency(details.amount, details.invoiceCurrency, null, null, isCrypto(details.invoiceCurrency))} from Wallet
                                    </Typography>
                                    : ""}
                                </>
                              }
                            </Grid>
                            {(details.droppCredits && details.droppCredits > 0) ?
                              <Grid item xs={12} className={classes.defaultUpperMargin}>
                                <Typography className={styles.darkBoldText}>
                                  Used ${displayAmount(details.droppCredits / getCurrencyDecimal("DCT"))} Dropp Credit{details.droppCredits == 1 ? "" : "s"} in {details.currency}
                                </Typography>
                              </Grid>
                            : ""}
                            {params.thumbnail ? (
                              <Grid item xs={12} className={classes.thumbnailContainer}>
                                <div style={{ display: "flex", height: "200px", justifyContent: "center", alignItems: "center" }}>
                                  {/* <img className={classes.thumbnailImg} src={decodeURIComponent(params.thumbnail)} /> */}
                                  <div
                                    className={classes.thumbnailImg}
                                    style={{
                                      backgroundImage: `url(${decodeURIComponent(params.thumbnail)})`,
                                    }}
                                  ></div>
                                </div>
                              </Grid>
                            ) : (<div></div>)
                            }
                            <Grid item xs={12}>
                              <Box my={1}>
                                <label style={{display:"inline-block", fontSize:"1.4em", fontWeight:"400"}}>{details.itemId}</label>
                              </Box>
                            </Grid>
                          </Grid>
                        </Box>
                    </Box>
                    <Box my={1} py={0} component={Grid} item xs={12} className={styles.greyListContainer}>
                      <FeeBreakdown showAccordion={true} {...details} pageTexts={pageTexts} heading={"Details"} receiptData={receiptData}/>
                    </Box>
                    <Grid item xs={12}>
                      <Box>
                        <div style={{clear: "both", wordBreak:"break-word" }}>
                          <Grid container spacing={2}>
                            {
                              purchaseURL &&
                              <Box component={Grid} className={styles.upperCase} item xs={12}>
                                <><a onClick={()=> openPurchasedContent()} style={{fontSize:"14px", textDecoration:"none", color:"rgb(24, 194, 238)",cursor: "pointer",display:"inline-block",paddingBottom:"8px"}}><b>{pageTexts.accessContentMsg}</b></a></>
                              </Box>
                            }
                            {
                              shareURL &&
                              <Box component={Grid} className={styles.upperCase} item xs={12}>
                                 <span style={{ display: "flex", alignItems: "center", gap: "1px" }}>
                                    <a  onClick={handlePopoverOpen} style={{fontSize:"14px", textDecoration:"none", cursor: "pointer",display:"inline-block", wordBreak: "normal"}}><b>{pageTexts.sharePurchaseMsg}</b></a>
                                    <Tooltip
                                    classes={{ tooltip: classes.tooltip }}
                                     title="Share your unique payment link and earn rewards when someone completes their first payment using it.">
                                      <IconButton size="small">
                                        <InfoOutlinedIcon fontSize="small" />
                                      </IconButton>
                                    </Tooltip>
                                 </span>
                              </Box>
                            }
                            <Box component={Grid} className={styles.upperCase} item xs={12}>
                              <a onClick={()=> props.setScreenWithData("txnsupport",props.data)} style={{fontSize:"14px", textDecoration:"none", cursor: "pointer",display:"inline-block",paddingBottom:"8px"}}><b>{pageTexts.issueReportMsg}</b></a>
                            </Box>
                          </Grid>
                          <Popover
                            style={{marginLeft:"7px"}}
                            open={popoverOpen}
                            onClose={handlePopoverClose}
                            anchorOrigin={{
                              vertical: 'bottom',
                              horizontal: 'right',
                            }}
                            transformOrigin={{
                              vertical: 'top',
                              horizontal: 'left',
                            }}
                            anchorEl={anchorEl}
                          >
                            <div style={{padding:"0.6em"}}>

                              <span className={classes.copyWrapper} style={{float:"left", marginRight:"0.5em"}}>
                                <Copy iconColor="primary" toolTipTitle="Copy" text={shareURL} iconSize={35}/>
                              </span>
                              {isSafari() ?
                                  <EmailShareButton style={{float:"left", marginRight:"0.5em"}} onClick={()=> shareEmail({subject: details.itemId, body: shareURL})}>
                                      <EmailIcon round={true} size={35} />
                                  </EmailShareButton>
                              :
                                  <EmailShareButton style={{float:"left", marginRight:"0.5em"}} url={shareURL} subject={details.itemId}>
                                      <EmailIcon round={true} size={35} />
                                  </EmailShareButton>
                              }

                              <FacebookShareButton style={{float:"left", marginRight:"0.5em"}} url={shareURL}>
                                  <FacebookIcon round={true} size={35} />
                              </FacebookShareButton>
                              <TwitterShareButton url={shareURL} style={{float:"left", marginRight:"0.5em"}}>
                                  <TwitterIcon round={true} size={35} />
                              </TwitterShareButton>
                              <WhatsappShareButton url={shareURL}>
                                  <WhatsappIcon round={true} size={35} />
                              </WhatsappShareButton>
                            </div>
                          </Popover>
                        </div>
                      </Box>
                    </Grid>
                </Grid>
                {/* <div style={{marginLeft:"20px",marginRight:"20px",width:"294px",float:"left", marginBottom:"-6px"}}>
                  <h2 style={{wordBreak:"break-word",width:"200px",float:"left"}}>{details.merchantOrganiationName}</h2>
                  <div style={{float:"right",marginTop:"17.2px",fontSize: "1.25em", fontWeight: 500}}>
                      {details.offerCode ?
                          <>
                              {(details.invoiceAmount == details.discountedAmount) ?
                                  <CurrencyToggle style={{float:"right"}} hbarImageWidth="9px" hbarImageHeight="14px" fontSize="1.4em" {...props.data} />
                              :
                                  <>
                                      <span style={{textDecoration: "line-through"}}>{renderCurrency(details.invoiceAmount, details.invoiceCurrency)} </span>
                                      <span style={{paddingLeft: "3px"}}>{renderCurrency(details.discountedAmount, details.invoiceCurrency)}</span>
                                  </>
                              }
                          </>
                      :
                          <CurrencyToggle style={{float:"right"}} hbarImageWidth="9px" hbarImageHeight="14px" fontSize="1.4em" {...props.data} />
                      }
                  </div>
                </div> */}
              </div>
          </div>
    );
};

export default PurchaseDetails;
