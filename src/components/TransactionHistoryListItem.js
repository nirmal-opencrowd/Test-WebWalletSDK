import React from "react";

import SpeedDial from "@material-ui/lab/SpeedDial";
import SpeedDialIcon from "@material-ui/lab/SpeedDialIcon";
import SpeedDialAction from "@material-ui/lab/SpeedDialAction";
// import MoreHorizIcon from "@material-ui/icons/MoreHoriz";
import LinkRoundedIcon from "@material-ui/icons/LinkRounded";
import ShareIcon from "@material-ui/icons/Share";
import { CopyToClipboard } from "react-copy-to-clipboard";
// import { useAlert } from "react-alert";
import { Grid, Typography, makeStyles } from "@material-ui/core";
import Divider from '@material-ui/core/Divider';
import ArrowForwardIosIcon from '@material-ui/icons/ArrowForwardIos';
import styles from "./../styles/common.module.scss";
import txnStyles from "./../styles/transactions.module.scss";
import { renderCurrency } from "../utils/currency";
import Tooltip from '@material-ui/core/Tooltip';
import classNames from "classnames";

import {
    EmailShareButton,
    FacebookShareButton,
    // InstapaperShareButton,
    // LinkedinShareButton,
    // PinterestShareButton,
    // RedditShareButton,
    // TumblrShareButton,
    TwitterShareButton,
    // WhatsappShareButton,
} from "react-share";
import {
    EmailIcon,
    FacebookIcon,
    // InstapaperIcon,
    // LinkedinIcon,
    // PinterestIcon,
    // RedditIcon,
    // TumblrIcon,
    TwitterIcon,
    // WhatsappIcon,
} from "react-share";
import CurrencyToggle from "./CurrencyToggle";
import * as utils from "../utils/utils";
import * as p2phelper from "../utils/p2phelper";
import * as localstorage from "../utils/local-storage";
import moment from "moment";

const useStyles = makeStyles(() => ({
   
    txnDate: {
        fontSize: "12px",
        color:"#3f4143",
    },
    mainTitle: {
        fontSize: "14px",
        whiteSpace: "nowrap",  /* stay on one line */
        overflow: "hidden",     /* hide extra text */
        textOverflow: "ellipsis", /* show ... */
        fontWeight: 600,
    },
    more: {
        fontSize: "12px",
        color: "#18c2ee",
        cursor: "pointer",
        textTransform: "uppercase",
        fontWeight: 600,
    },
    dividerLine: {
        marginTop: '5px',
        marginBottom: '10px',
    },
}))

const TransactionHistoryListingItem = ({ transaction, viewPurchaseDetails, data, viewMerchantTxns }) => {
    const [open, setOpen] = React.useState(false);
    const [shareURL, setShareURL] = React.useState();
    const [purchaseURL, setPurchaseURL] = React.useState();
    const [params, setParams] = React.useState({});
    const [actions, setActions] = React.useState([]);
    const classes = useStyles();
    React.useEffect(() => {
        let p = {};
        if (transaction.shareURL) {
            if (transaction.shareURL.indexOf("?") !== -1) {
                const queryString = transaction.shareURL.split("?")[1];
                p = Object.fromEntries(new URLSearchParams(queryString).entries());
                setShareURL(`${transaction.shareURL}&referrer=${transaction.referrer}`);
            } else {
                setShareURL(`${transaction.shareURL}?referrer=${transaction.referrer}`);
            }
        }
        if (transaction.purchaseURL) {
            const queryString = transaction.purchaseURL.split("?")[1];
            p = { ...p, ...Object.fromEntries(new URLSearchParams(queryString).entries()) };
            localstorage.decrypted.get().then(decrypted => {
                setPurchaseURL(`${transaction.purchaseURL}`);
            });
        }
        if (transaction.thumbnail) {
            p = {...p, thumbnail: transaction.thumbnail};
        }
        if (Object.entries(p).length > 0) {
            setParams(p);
        }
    }, [transaction]);

    React.useEffect(() => {
        setActions([
            {
                icon: (
                    <EmailShareButton url={shareURL} subject={transaction.itemId}>
                        <EmailIcon round={true} size={42} />
                    </EmailShareButton>
                ),
                name: "Email",
            },
            {
                icon: (
                    <FacebookShareButton url={shareURL}>
                        <FacebookIcon round={true} size={42} />
                    </FacebookShareButton>
                ),
                name: "Facebook",
            },
            {
                icon: (
                    <TwitterShareButton url={shareURL}>
                        <TwitterIcon round={true} size={42} />
                    </TwitterShareButton>
                ),
                name: "Twitter",
            },
            {
                icon: (
                    <CopyToClipboard text={shareURL} onCopy={copyShareURL}>
                        <LinkRoundedIcon />
                    </CopyToClipboard>
                ),
                name: "Copy share link",
            },
        ]);
    }, [shareURL]);

    const copyShareURL = () => {
    };

    const txnsFromMerchant = (event) => {
        event.stopPropagation();
        viewMerchantTxns(transaction);
    };

    return (
        <div>
            {(transaction.numOfTxns && transaction.numOfTxns > 1) ?
                <Grid container>
                    <Grid item xs={9}>
                        <Typography variant="subtitle2" className={classNames([classes.txnDate, styles.upperCase, styles.numOfTxnContainer])}>{transaction.merchantOrganiationName}</Typography>
                    </Grid>
                    <Grid item xs={3} onClick={txnsFromMerchant}>
                        <Typography align="right" className={classNames([classes.more, styles.upperCase])}>+{(transaction.numOfTxns - 1)} more</Typography>
                    </Grid>
                </Grid>
            : null}
            <div className={styles.greyListContainer} onClick={()=> viewPurchaseDetails(transaction)} style={{cursor: "pointer"}}>
                <Grid container alignItems="center">
                    <Grid item xs={7}>
                        <Tooltip title={transaction.merchantOrganiationName} arrow>
                            <Typography variant="subtitle2" className={classes.mainTitle}>
                                {transaction.merchantOrganiationName}
                            </Typography>
                        </Tooltip>
                        <Typography className={classes.txnDate}>{moment(transaction.createTimeEpoch * 1000).format("MMM DD YYYY hh:mm A")}</Typography>
                    </Grid>
                    <Grid item xs={5}>
                        <Grid container spacing={1} alignItems="center">
                            <Grid item xs={9}>
                                <div className={txnStyles.amountContainer}>
                                    {transaction.offerCode ?
                                        <>
                                            {(transaction.invoiceAmount == transaction.discountedAmount) ?
                                                <CurrencyToggle hbarImageWidth="9px" hbarImageHeight="13px" fontSize="14px" fontWeight={600} style={{float:"right"}} {...transaction} />
                                            :
                                                utils.isCrypto(transaction.invoiceCurrency) ?
                                                <span>
                                                    <span className={`${styles.linedThroughText} ${txnStyles.amount} ${styles.boldGreyText}`}>{renderCurrency(transaction.invoiceAmount, transaction.invoiceCurrency, "14px", null, true)} </span>
                                                    <span className={txnStyles.amount} style={{paddingLeft: "3px"}}>{renderCurrency(transaction.discountedAmount, transaction.invoiceCurrency, "14px", null, true)}</span>
                                                </span>
                                                :
                                                <span>
                                                    <span className={`${styles.linedThroughText} ${txnStyles.amount} ${styles.boldGreyText}`}>{renderCurrency(transaction.invoiceAmount, transaction.invoiceCurrency, "14px", null, true)} </span>
                                                    <span className={txnStyles.amount} style={{paddingLeft: "3px"}}>{renderCurrency(transaction.discountedAmount, transaction.invoiceCurrency, "14px", null, true)}</span>
                                                </span>
                                            }
                                        </>
                                    :
                                        <CurrencyToggle maxDecimalPlace={utils.isCrypto(transaction.invoiceCurrency) ? 4 : 2} hbarImageWidth="9px" hbarImageHeight="13px" fontSize="14px" fontWeight={600} style={{float:"right"}} {...transaction} />
                                    }
                                </div>
                            </Grid>
                            <Grid item xs={3}>
                                <img width={30} src="./arrowForward.png" alt="detail"/>
                            </Grid>
                        </Grid>
                    </Grid>
                </Grid>
                <Divider className={classes.dividerLine}/>
                <Grid container>
                    <Grid item xs={12}>
                        <Typography className={`${classes.txnDate} ${txnStyles.detail}` } title={transaction.itemId}>{transaction.itemId}</Typography>
                    </Grid>
                </Grid>
                {/* <>
                <div style={{clear: "both", marginBottom: "-18px"}}>
                    <React.Fragment>
                        {params.thumbnail ? (
                            <>
                            <div style={{width:"175px", float: "left"}}>
                                <p style={{textOverflow:"ellipsis", overflow:"hidden", display:"inline-block",  maxHeight:"53px", fontSize:"1.15em", whiteSpace:"nowrap", width:"100%"}} title={transaction.itemId}>{transaction.itemId}</p>
                                <div style={{display:"inline-block", marginBottom: "5px", marginTop:"5px"}}>
                                    <i
                                        style={{
                                            fontWeight: "300",
                                            verticalAlign: "baseline",
                                        }}>
                                        {new Date(
                                            transaction.createTimeEpoch * 1000
                                        ).toLocaleString()}
                                    </i>
                                </div>
                            </div>
                            <div style={{overflow:"hidden", display:"flex", justifyContent:"center",alignItems:"center",marginLeft:"10px", float:"right", marginBottom:"5px"}}>
                                <div style={{height: "50px", width: "90px", backgroundPosition: "right", backgroundRepeat: "no-repeat", backgroundSize: "contain", backgroundImage: `url(${decodeURIComponent(params.thumbnail)})`}}></div>
                            </div>
                            </>
                        ) :
                        (
                        <div style={{width:"175px", float: "left"}}>
                            <p style={{textOverflow:"ellipsis", overflow:"hidden", display:"inline-block", marginBottom:"2px", maxHeight:"50px", fontSize:"1.15em", whiteSpace:"nowrap", width:"100%"}} title={transaction.itemId}>{transaction.itemId}</p>
                            <div style={{marginBottom: "5px", marginTop:"5px", width:"220px"}}>
                                <i
                                    style={{
                                        fontWeight: "300",
                                        verticalAlign: "baseline",
                                    }}>
                                    {new Date(
                                        transaction.createTimeEpoch * 1000
                                    ).toLocaleString()}

                                </i>
                            </div>
                        </div>
                        )
                    }
                    </React.Fragment>
                </div>
                </> */}
                {/* <Divider style={{ marginTop:"12px", clear: "both"}}/> */}
            </div>
        </div>
    );
};

export default TransactionHistoryListingItem;
