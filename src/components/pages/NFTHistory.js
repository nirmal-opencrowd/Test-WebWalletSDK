import React from 'react';
import "../../NFTcollections.css";
import ArrowBackOutlinedIcon from '@material-ui/icons/ArrowBackOutlined';
import LaunchOutlinedIcon from '@material-ui/icons/LaunchOutlined';
import { Box, CircularProgress, Grid, Typography, makeStyles } from '@material-ui/core';
import * as api from "../../api/index";
import { getCurrencyDecimal, getCurrencyDecimalPlaces, hederaAccountToString } from '../../utils/utils';
import { renderCurrency } from '../../utils/currency';
import InfiniteScroll from 'react-infinite-scroll-component';
import moment from 'moment';
import commonStyles from "./../../styles/common.module.scss";
import uitexts from "./../../../configurations/dropp.json";

const useStyles = makeStyles({
    footer: {
        backgroundColor: "white",
        bottom: "0px",
        height: "95px",
        padding: "0px 20px",
        position: "fixed",
        width: "100%",
        zIndex: "100",
    },
    transactionBox: {
        alignItems: "center",
        backgroundColor: "#f9f9f9",
        display: "flex",
        justifyContent: "space-between",
        margin: "10px 20px",
        padding: "8px",
    },
    launchIconInBox: {
        float:"right",
        height:"30px",
        marginTop:"10px",
    },
    launchIconInFooter: {
        height:"18px",
        position:"relative",
        top:"4px"
    },
    footerFlex: {
        display: "flex",
        alignItems: "center",
        justifyContent: "space-evenly",
    }
})

const pageTexts = uitexts.nftHistory;
const NFTHistory = ({ setCurrentScreen, workingEnv, setFooterObj }) => {

    const classes = useStyles();
    const PER_PAGE_ITEM = 10;

    const [nftHistory, setNftHistory] = React.useState([]);
    const [backendErr, setBackendErr] = React.useState(null);
    const [startIndex, setStartIndex] = React.useState(0);
    const [uptoIndex, setUptoIndex] = React.useState(PER_PAGE_ITEM);
    const [hasMore, setHasMore] = React.useState(true);
    const [loading, setLoading] = React.useState(false);

    const goToTransactionUrl = (transactionUrl) => {
        chrome.runtime.sendMessage({
            type: "openInNewTab",
            request: {url: transactionUrl},
        });
    };

    async function getPayerNFTHistory() {
        setLoading(true);
        let res = await api.getPayerNFTHistory({ startIndex: startIndex, endIndex: uptoIndex });
        if (res && res.responseCode == 0) {
            if (res.data && res.data.length) {
                let transactions = [...nftHistory];
                setNftHistory(transactions.concat(res.data));
                setStartIndex((startIndex + PER_PAGE_ITEM));
                setUptoIndex(uptoIndex + PER_PAGE_ITEM);
                setHasMore(true);
            } else {
                setHasMore(false);
            }
        } else if (res && res.responseCode == 142) {
            const errorMsg = (res && res.errors && res.errors.length > 0) ? res.errors[0] : "Unable to fetch history, Please try again later.";
            setBackendErr(errorMsg);
            setHasMore(false);
        } else {
            const errorMsg = (res && res.errors && res.errors.length > 0) ? res.errors[0] : "Unable to fetch history, Please try again later.";
            setBackendErr(errorMsg);

        }
        setLoading(false);
    }

    React.useEffect(()=>{
        getPayerNFTHistory();
        setFooterObj({footerText: (
            <div className={`${commonStyles.footerContainer} ${classes.footerFlex}`}>
              <img
                src='./exchange.png'
                alt='launch'
                className={commonStyles.footerIconLeft}
              />
              <span>
              {pageTexts.viewTxnOnDragonGlassMsg}
              </span>
            </div>
          )});
          return () => {
            setFooterObj({})
          }
    }, []);

    return (
        <>
            <div style={{ marginTop: "33px" }}>
                {/* <div
                    style={{
                        textAlign: "left",
                        margin: "10px 20px",
                    }}>
                    <div style={{ padding: "10px 0px" }}>
                        <label style={{ fontWeight: "450", color: "#18C2EE", fontSize: "1.8em" }}>
                            NFT HISTORY
                        </label>
                    </div>
                    <div style={{ clear: "both" }}>
                        <hr style={{ backgroundColor: "#B4B4B4", height: "1px", border: "none" }} />
                    </div>
                </div> */}
                <div>
                    {nftHistory && nftHistory.length > 0 ?
                        <>
                            <InfiniteScroll
                                dataLength={nftHistory.length}
                                next={getPayerNFTHistory}
                                hasMore={hasMore}
                                loader={<div className="infiniteSrollLoader"><CircularProgress color="inherit" /></div>}
                                >
                                {Object.keys(nftHistory).map((key) => {
                                    const item = nftHistory[key];
                                    // let time = new Date(item.consensusTime);
                                    return (
                                        <div key={key} className={classes.transactionBox}>
                                            <div style={{width : "260px"}}>
                                                <Typography className={`${commonStyles.darkBoldText} ${commonStyles.upperCase}`}>{item.typeLabel}</Typography>
                                                {/* <div style={{paddingTop: "5px"}}> */}
                                                    {/* <Typography variant='body2' className={commonStyles.lightGreyText}>{moment(time).format("MMMM DD [at] hh:mm A")}</Typography> */}
                                                        <Grid container>
                                                            {/* {item.properties.map((data, index) => (
                                                                    <Grid key={index} item xs={index === 0 ? 12 : 4}>
                                                                        <Box pt={1}>
                                                                            <Typography className={commonStyles.upperCase} variant='body2'>{data.label}: <span className={commonStyles.darkBoldText}>{data.value}</span></Typography>
                                                                        </Box>
                                                                    </Grid>
                                                            ))} */}
                                                            <Grid item xs="auto">
                                                                <Box pt={1} display="inline">
                                                                    <Typography component="span" className={commonStyles.upperCase} variant='body2'>
                                                                        {pageTexts.cost}: {" "}
                                                                        <span className={commonStyles.darkBoldText}>
                                                                        {renderCurrency(item.amount / getCurrencyDecimal(item.settlementCurrency), item.settlementCurrency, "14px", getCurrencyDecimalPlaces(item.settlementCurrency), true)}</span>
                                                                    </Typography>
                                                                </Box>
                                                            </Grid>
                                                        </Grid>
                                                {/* </div> */}
                                            </div>
                                            <div>
                                                {/* <Typography variant='body2'>
                                                    {renderCurrency(item.amount / getCurrencyDecimal(item.settlementCurrency), item.settlementCurrency, "14px", getCurrencyDecimalPlaces(item.settlementCurrency), true)}
                                                </Typography> */}
                                                <a href='transaction' style={{cursor: "pointer"}} onClick={(e) => {e.preventDefault(); goToTransactionUrl(item.transactionURL);}}>
                                                    {/* <LaunchOutlinedIcon className={classes.launchIconInBox} /> */}
                                                    <img src='./exchange.png' alt='launch' className={classes.launchIconInBox}/>
                                                </a>
                                            </div>
                                        </div>
                                    );
                                })}
                            </InfiniteScroll>
                            {backendErr ? <div> {backendErr} </div> : ""}
                        </> : loading ?
                            <div className="loader">
                                <CircularProgress color="inherit" />
                            </div> : <div style={{margin: "auto", marginTop: "200px", textAlign: "center"}}>
                                 <div>{pageTexts.noHistoryMsg}</div>
                            </div>

                    }
                </div>
            </div>
            {/* <div className='footer' style={{bottom : workingEnv === "test" ? "45px" :"", height:"100px"}}>
                    <div style={{ clear: "both", width:"88%" }}>
                        <hr className='dashedLine' />
                    </div>
                    <div>
                        <Typography variant="body2" style={{width:"90%"}}>
                            Tap this icon
                            <div style={{display:"inline-block"}}>
                                <LaunchOutlinedIcon className={classes.launchIconInFooter} />
                            </div>
                            above to view details of the transaction in DragonGlass Hedera Explorer.
                        </Typography>
                    </div>
                    <div className='backArrow' style={{top: "5px"}}>
                        <ArrowBackOutlinedIcon onClick={() => setCurrentScreen("nftcollections")} style={{ cursor: "pointer", color: "#18C2EE" }} />
                    </div>
            </div> */}
        </>
    )
}

export default NFTHistory