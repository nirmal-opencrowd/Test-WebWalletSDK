import React from 'react';
import "../../NFTcollections.css";
import * as api from '../../api';
import InfiniteScroll from 'react-infinite-scroll-component';
import { CircularProgress, Divider, Grid, Typography, makeStyles } from '@material-ui/core';
import LaunchOutlinedIcon from '@material-ui/icons/LaunchOutlined';
import moment from 'moment';
import classNames from "classnames";
import { getCurrencyDecimal, isCrypto, getCurrencyDecimalPlaces } from '../../utils/utils';
import { renderCurrency } from '../../utils/currency';
import styles from "./../../styles/common.module.scss";
import txnStyles from "./../../styles/transactions.module.scss";

const useStyles = makeStyles({
    footer: {
        backgroundColor: "white",
        bottom: "0px",
        height: "40px",
        padding: "0px 20px",
        position: "fixed",
        width: "100%",
        zIndex: "100",
    },
    // transactionBox: {
    //     // backgroundColor: "#f9f9f9",
    //     borderBottom:"1px solid rgba(0, 0, 0, 0.12)",
    //     display: "flex",
    //     justifyContent: "space-between",
    //     margin: "10px 0px",
    //     padding: "8px",
    //     width:"290px",
    // },
    launchIconInBox: {
        float:"right",
        height:"18px",
    },
    launchIconInFooter: {
        height:"18px",
        position:"relative",
        top:"4px",
    },
    mainTitle:{
        fontSize: "14px",
        fontWeight: "bold",
        whiteSpace: "nowrap",  /* stay on one line */
        overflow: "hidden",     /* hide extra text */
        textOverflow: "ellipsis", /* show ... */
        margin: "5px 0px",
    },
    divider: {
        marginTop: "2px",
        marginBottom: "5px",
        clear: "both !important",
        width: "100%",
        background:"#e1dada!important",
    }
})


const AllTransactions = ({setCurrentScreen, userDetails}) => {
    const classes = useStyles();
    const PER_PAGE_ITEM = 10;

    const [transactionsData, setTransactionsData] = React.useState([]);
    const [startIndex, setStartIndex] = React.useState(0);
    const [endIndex, setEndIndex] = React.useState(PER_PAGE_ITEM);
    const [hasMore, setHasMore] = React.useState(true);
    const [backendErr, setBackendErr] = React.useState(null);
    const [noTransactions, setNoTransactions] = React.useState(false);
    const [nextLink, setNextLink] = React.useState(null);
    const [lastUsedLink, setLastUsedLink] = React.useState(null);
    const [isLoading, setIsLoading] = React.useState(false);

    const goToTransactionUrl = (transactionUrl) => {
        chrome.runtime.sendMessage({
            type: "openInNewTab",
            request: {url: transactionUrl},
        });
    };

    // async function getAllTransactionsHistory() {
    //     try {
    //         let res = await api.getAllTransactionsHistory({ startIndex: startIndex, endIndex: endIndex, })

    //         console.log("getAllTransactionsHistory res", res.data.data.txDetailsObj);
    //         console.log("getAllTransactionsHistory res", res);
    //         if (res && res.data && res.data.responseCode == 0) {
    //             if (res.data && res.data.data.txDetailsObj && res.data.data.txDetailsObj.length == 0) {
    //                 console.log("No Transactions available");
    //                 setNoTransactions(true);
    //                 setHasMore(false);
    //             } else if (res.data && res.data.data.txDetailsObj && res.data.data.txDetailsObj.length) {
    //                 console.log("Transactions fetched");
    //                 let transactions = [...transactionsData];
    //                 setTransactionsData(transactions.concat(res.data.data.txDetailsObj));
    //                 setStartIndex((startIndex + PER_PAGE_ITEM));
    //                 setEndIndex(endIndex + PER_PAGE_ITEM);
    //                 setHasMore(true);
    //             } else {
    //                 setHasMore(false);
    //             }
    //         } else {
    //             const errorMsg = (res && res.errors && res.errors.length > 0) ? res.errors[0] : "Unable to fetch history, Please try again later.";
    //             setBackendErr(errorMsg);
    //             setHasMore(false);
    //         }
    //     } catch (error) {
    //         console.log(error);
    //     }
    // }
    async function getAllTransactionsHistory() {

    if (isLoading) return;

    try {
        setIsLoading(true);
        const payload =
        nextLink && nextLink !== lastUsedLink
            ? { link: nextLink }
            : { startIndex: startIndex, endIndex: endIndex };

        let res = await api.getAllTransactionsHistory(payload);

        if (res?.data?.responseCode === 0) {
        const txList = res?.data?.data?.txDetailsObj || [];
        const linkFromApi = res?.data?.data?.link;

        if (txList.length === 0) {
            console.log("No Transactions available");
            setNoTransactions(true);
            setHasMore(false);
            return;
        }

        console.log("Transactions fetched");
        setTransactionsData(prev => [...prev, ...txList]);
        if (linkFromApi && linkFromApi !== lastUsedLink) {
            console.log("Next Link Found:", linkFromApi);
            setLastUsedLink(linkFromApi);
            setNextLink(linkFromApi);
            setHasMore(true);
        }
        else if (!linkFromApi) {
            setStartIndex(prev => prev + PER_PAGE_ITEM);
            setEndIndex(prev => prev + PER_PAGE_ITEM);
            setHasMore(true);
        }
        else {
            console.warn("Same link received again. Stopping pagination.");
            setHasMore(false);
        }
        } else {
        const errorMsg =
            res?.errors?.length > 0
            ? res.errors[0]
            : "Unable to fetch history, Please try again later.";

        setBackendErr(errorMsg);
        setHasMore(false);
        }
    } catch (error) {
        console.log("API Error:", error);
        setHasMore(false);
    } finally {
        setIsLoading(false);
    }
    }



    React.useEffect(() => {
        getAllTransactionsHistory();
    }, []);

    return (
        <>
            <div>
                {transactionsData && transactionsData.length > 0 ?
                    <>
                        <InfiniteScroll
                            dataLength={transactionsData.length}
                            next={getAllTransactionsHistory}
                            hasMore={hasMore}
                            loader={<div className="infiniteSrollLoader"><CircularProgress color="inherit" /></div>}
                            height={470}
                            endMessage={<Typography style={{ textAlign: "center" }}></Typography>}>
                            {Object.keys(transactionsData).map((key) => {
                                const item = transactionsData[key];
                                return (
                                    <div key={key} className={classNames([styles.greyListContainer])}>
                                        <Grid container alignItems="center">
                                            <Grid item xs={8}>
                                                <h3 className={classes.mainTitle}>{item.typeLabel}</h3>
                                                {/* <Typography className={styles.mediumSizedText}>{moment(item.consensusTime).format("MMM DD YYYY hh:mm A")}</Typography> */}
                                                <Typography className={styles.smallSizeText}>
                                                    {(() => {
                                                        if (!item?.consensusTime) return "";

                                                        let dateMoment;
                                                        if (!isNaN(item.consensusTime)) {
                                                        dateMoment = moment.unix(parseFloat(item.consensusTime));
                                                        }
                                                        else {
                                                        dateMoment = moment(item.consensusTime);
                                                        }
                                                        return dateMoment.isValid()
                                                        ? dateMoment.format("MMM DD YYYY hh:mm A")
                                                        : "";
                                                    })()}
                                                    </Typography>
                                            </Grid>
                                            <Grid item xs={4}>
                                                <Grid container alignItems="center">
                                                    <Grid item xs={item.transactionURL? 9 : 12} className={txnStyles.amountContainer}>
                                                        {isCrypto(userDetails.currency) ?
                                                            <span className={txnStyles.amount}>
                                                                {renderCurrency((item.amount / getCurrencyDecimal(item.settlementCurrency)), item.settlementCurrency, "14px", getCurrencyDecimalPlaces(item.settlementCurrency), true)}
                                                            </span>
                                                            :
                                                            <span className={txnStyles.amount}>
                                                                {renderCurrency(item.amount, userDetails.currency, "14px", 2)}
                                                            </span>
                                                        }
                                                    </Grid>
                                                    {
                                                        item.transactionURL ?
                                                            <Grid item xs={3}>
                                                                <a style={{ cursor: "pointer" }} onClick={(e) => { e.preventDefault(); goToTransactionUrl(item.transactionURL); }}>
                                                                    <LaunchOutlinedIcon className={classes.launchIconInBox} />
                                                                </a>
                                                            </Grid>
                                                            : ""
                                                    }
                                                </Grid>
                                            </Grid>
                                            { item && item.properties && item.properties.length && item.properties[0].value && <Divider className={classes.divider} /> }
                                            {item.properties.map((data, index) => (
                                                data.label && data.value ?
                                                    <React.Fragment key={index}>
                                                        <Typography className={styles.smallSizeText} variant='body2'>{data.label}: {data.value}&nbsp;&nbsp;</Typography>
                                                    </React.Fragment> : ""
                                            ))}
                                        </Grid>
                                        {/* <div style={{paddingTop :"5px", width:"174px"}}>
                                                <Typography variant='body2'>{moment(item.consensusTime).format("MMMM DD [at] hh:mm A")}</Typography>
                                                {item.properties.map((data, index) => (
                                                    data.label && data.value ?
                                                        <React.Fragment key={index}>
                                                            <Typography variant='body2'>{data.label}: {data.value}</Typography>
                                                        </React.Fragment> : ""
                                                ))}
                                            </div> */}
                                    </div>
                                );
                            })}
                        </InfiniteScroll>
                        {backendErr ? <div> {backendErr} </div> : ""}
                    </> :
                        noTransactions ? <div>
                                <div style={{ paddingTop: "100px", textAlign: "center", fontSize:"12px" }}>
                                    No Transactions available
                                </div>
                            </div> :
                            <div className="loader" style={{margin :"0px",justifyContent:"center", alignItems:"center"}}>
                                <CircularProgress color="inherit" />
                            </div>
                }
            </div>
        </>
    )
}

export default AllTransactions;