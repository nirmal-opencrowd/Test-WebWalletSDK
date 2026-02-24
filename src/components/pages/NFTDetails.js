import ArrowBackOutlinedIcon from '@material-ui/icons/ArrowBackOutlined';
import React, { useEffect, useState } from 'react';
import "../../NFTcollections.css";
import { fetchNFTDetails, getNFTFees } from '../../api';
import { getCleanNFTUrl, decodeBase64, stringToHederaAccount, displayAmount, getCurrencyDecimal, getDGEndPoint } from '../../utils/utils';
import moment from "moment";
import CircularProgress from "@material-ui/core/CircularProgress";
import { Accordion, AccordionDetails, AccordionSummary, Divider, Grid, makeStyles, Table, TableBody, TableCell, TableRow } from '@material-ui/core';
import classNames from 'classnames';
import Box from '@material-ui/core/Box';
import Modal from '@material-ui/core/Modal';
import Typography from '@material-ui/core/Typography/Typography';
import InfoOutlinedIcon from "@material-ui/icons/InfoOutlined";
import LinkCryptoWalletModal from './LinkCryptoWalletModal';
import styles from "./../../styles/nft.module.scss";
import commonStyles from "./../../styles/common.module.scss";
import uiTexts from "./../../../configurations/dropp.json"
import { getENV } from "./../../utils/utils";

const useStyles = makeStyles((theme) => ({
    table: {
        border: 'none',
        borderCollapse: 'collapse',
    },
    cell: {
        border: 'none',
        padding:"5px 0px"
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
    replenishContainer: {
      flexDirection:"column",
      marginTop:"15px",
      maxHeight: "410px",
      overflowY:"scroll",
      padding: "1em",
      textAlign: "left"
    },
    disabledText: {
        color: "#ccc"
    },
    greyText:{
        color:"#888B8E"
    },
    btnContainer : {
        // margin: "0px 20px"
    },
    marginX20: {
        margin: "0 20px",
    },
    accordion: {
        backgroundColor: "#f9f9f9",
        border: "1px solid #a9a9a9",
        boxShadow: "none",
        margin:"0 20px !important",
        width: "100%",
    },
    accordionDetails: {
        padding: "0 16px 16px",
        marginTop: "-14px",
        display: "block",
    },
    root: {
        display: 'flex',
        flexWrap: 'wrap',
    },
    tokenDetails: {
        marginTop: "20px",
        width: "100%",
    },
    value: {
        fontWeight: 600
    }
  }));

const pageTexts = uiTexts.nftDetails;

const NFTDetails = ({ setCurrentScreen, setScreenWithData, data , workingEnv}) => {
    const classes = useStyles();
    const [dataDetails, setDataDetails] = useState(null);
    const [show, setShow] = useState(true);
    const [imageUrl, setImageUrl] = useState(data.imgUrl);
    const [imgLoading, setImgLoading] = useState(true);
    const [openFeeModal, setOpenFeeModal] = useState(false);
    const [nftFees, setNftFees] = useState(null);
    const [fallbackFees, setFallbackFees] = useState([]);
    const [showFees, setShowFees] = useState(true);
    const [showAtrributes, setShowAttributes] = useState(true);
    const [transferErr, setTransferErr] = useState(null);
    const [screen, setScreen] = useState("");
    const [openLinkCryptoModal, setOpenLinkCryptoModal] = useState(false);

    const cryptoWallets = data.cryptoWallets;

    const showDetails = () => {
        setShow(true);
    }

    const hideDetails = () => {
        setShow(false);
    }

    const showFeesDetails = () => {
        setShowFees(true);
    }

    const hideFeesDetails = () => {
        setShowFees(false);
    };

    const showAttributeDetails = () => {
        setShowAttributes(true);
    }
    const hideAttributeDetails = () => {
        setShowAttributes(false);
    }

    const imageLoaded = () => {
        setImgLoading(false);
    };

    const handleCloseFeeModal = () => {
        setOpenFeeModal(false);
    };

    const goToExplorer = async (tokenId, serialNumber) => {
        const localEnv = await getENV();
        let baseUrl = "https://hashscan.io/testnet";
        if (localEnv.env == "mainnet" ) {
            baseUrl = "https://hashscan.io/mainnet";
        }
        baseUrl += `/token/${tokenId}/${serialNumber}/transactions`;

        chrome.runtime.sendMessage({
            type: "openInNewTab",
            request: {url: baseUrl},
        });
    };

    useEffect(()=> {
        if(nftFees && nftFees.custom_fees && nftFees.custom_fees.royalty_fees){
            nftFees.custom_fees.royalty_fees.map((item)=>{
                if( item.fallback_fee && item.fallback_fee.amount){
                    setFallbackFees([...fallbackFees, item.fallback_fee.amount])
                }
            })
        }
    }, [nftFees])

    useEffect(()=>{
        if(fallbackFees && fallbackFees.length > 0){
            setTransferErr("This NFT has a fallback fee. Please use the Trade option to transfer or sell.");
        }
    },[fallbackFees])

    useEffect(() => {
        async function nftDetails() {
            let response;
            try {
                response = await fetchNFTDetails(getCleanNFTUrl(decodeBase64(data.object.metaData)));
                if (response && response.data) {
                    setDataDetails(response.data);
                    if (response.data.image && response.data.image != getCleanNFTUrl(response.data.image)) {
                        setImageUrl(getCleanNFTUrl(response.data.image));
                    }
                }
            } catch (err) {
                console.log(err);
            }

        }

        async function fetchNFTFees() {
            let response;
            try {
                response = await getNFTFees({hhAccountID:  stringToHederaAccount(data.object.token)});
                if (response && response.data && response.data.data && response.data.data.custom_fees) {
                    setNftFees(response.data.data);
                }
            } catch(err) {
                console.log(err);
            }
        }
        if (data.object.metaData) {
            Promise.all([nftDetails(), fetchNFTFees()]);
        }
    }, []);

    const opencryptomodal = (screen) => {
        setScreen(screen);
        setOpenLinkCryptoModal(true)
    }

    const openFeesInfoModal = (e) => {
        e.stopPropagation();
        setOpenFeeModal(true);
    }

    return (
        <div style={{ marginTop: "33px" }}>
            {/* <div
                style={{
                    textAlign: "left",
                    width: "600px",
                    marginTop: "6px",
                    marginLeft: "20px",
                }}
                >
                <div style={{ paddingTop: "9px", marginRight: "180px" }}>
                    <label style={{ fontWeight: "450", color: "#18C2EE", fontSize: "1.8em" }}>
                        NFT Details
                    </label>
                    <br />
                    <label style={{ fontSize: "1.3em" }}>
                        HEDERA NFTS
                    </label>
                </div>
            </div> */}
            {dataDetails ?
                <div className="NFTDetail">
                    {/* <div className="NFTName">
                        <h2>{dataDetails.name}</h2>
                    </div> */}
                    <div className={styles.nftImageDetail} style={{ display: `${imgLoading ? "none" : "block"}`, paddingBottom:"20px" }}>
                        <img className={styles.nftImage} src={imageUrl} alt="NFT" onLoad={imageLoaded} />
                    </div>
                    <Grid container justifyContent="center">
                        <Grid item xs={10}>
                            <Grid container spacing={2} className={classes.btnContainer}>
                                <Grid item xs={6}>
                                    <div>
                                        {
                                            dataDetails && imageUrl ?
                                                <button
                                                    className={classNames([commonStyles.secondaryBtn, commonStyles.circularBtn, (!nftFees || !cryptoWallets) ? commonStyles.buttonDisabled : "" ])}
                                                    onClick={cryptoWallets && cryptoWallets.length ? () => setScreenWithData("nftTrade", { data, dataDetails, nftFees, cryptoWallets }) : () => opencryptomodal("nftTrade")}
                                                    disabled={!nftFees || !cryptoWallets}
                                                    >
                                                    {pageTexts.tradeText}
                                                </button>
                                                :
                                                ""
                                        }
                                    </div>
                                </Grid>
                                <Grid item xs={6}>
                                    <div>
                                        {
                                            dataDetails && imageUrl ?
                                                <button
                                                    className={classNames([commonStyles.secondaryBtn, commonStyles.circularBtn, (!nftFees || !dataDetails) ? commonStyles.buttonDisabled : "" ])}
                                                    // className={fallbackFees && fallbackFees.length && fallbackFees.length > 0 ? "disabledgetNFTBtn" : "button-done"}
                                                    disabled={(fallbackFees && fallbackFees.length && fallbackFees.length > 0) || (!nftFees || !dataDetails)}
                                                    onClick={cryptoWallets && cryptoWallets.length ? () => setScreenWithData("nftTransfer", { data, dataDetails, nftFees }) : () => opencryptomodal("nftTransfer")}>
                                                    {pageTexts.transferText}
                                                </button>
                                                :
                                                ""
                                        }
                                    </div>
                                </Grid>
                            </Grid>
                        </Grid>
                    </Grid>
                    <div className={classes.marginX20}>
                        <Divider className={commonStyles.divider}/>
                    </div>
                    <div className="NFTImageHolder" style={{ display: `${imgLoading ? "block" : "none"}` }}>
                        <div className="loader">
                            <CircularProgress color="inherit" />
                        </div>
                    </div>
                    <Box my={2}>
                        <Grid container>
                            <Grid item xs={12}>
                                <div className={classes.root}>
                                    <Accordion defaultExpanded className={classes.accordion} aria-setsize={"large"}>
                                        <AccordionSummary
                                            expandIcon={<img src="./arrowDown.png" alt="show" />}
                                            aria-controls="panel1a-content"
                                            id="panel1a-header"
                                        >
                                            <Typography className={`${commonStyles.darkBoldText} ${commonStyles.largeSizedText}`}>{pageTexts.tokenInfoText}</Typography>
                                        </AccordionSummary>
                                        <AccordionDetails className={`${commonStyles.mediumSizedText} ${classes.accordionDetails}`}>
                                            <div className={classes.tokenDetails}>
                                                {data.object.name ?
                                                    <>
                                                        <div style={{ padding: "2px 0px" }}>
                                                            <div style={{ width: "50%", display: "inline-block", verticalAlign: "top" }}>
                                                                <h5 className={styles.NFTKeys}>{pageTexts.nameKeyText}</h5>
                                                            </div>
                                                            <div style={{ width: "50%", display: "inline-block", verticalAlign: "top" }}>
                                                                <p className={classes.value} style={{ fontSize: "15px" }}>{data.object.name}</p>
                                                            </div>
                                                        </div>
                                                        {/* <div style={{ clear: "both" }}>
                                                            <hr className='dashedLine' />
                                                        </div> */}
                                                    </>
                                                    : ""}
                                                {data.mapping[data.object.token] ?
                                                    <>
                                                        <div style={{ padding: "2px 0px" }}>
                                                            <div style={{ width: "50%", display: "inline-block", verticalAlign: "top" }}>
                                                                <h5 className={styles.NFTKeys}>{pageTexts.collectionKeyText}</h5>
                                                            </div>
                                                            <div style={{ width: "50%", display: "inline-block", verticalAlign: "top" }}>
                                                                <p className={classes.value} style={{ fontSize: "15px" }}>{data.mapping[data.object.token]}</p>
                                                            </div>
                                                        </div>
                                                        {/* <div style={{ clear: "both" }}>
                                                            <hr className='dashedLine' />
                                                        </div> */}
                                                    </>
                                                    : ""}

                                                {data.object.serialNumber ?
                                                    <>
                                                        <div style={{ padding: "2px 0px" }}>
                                                            <div style={{ width: "50%", display: "inline-block", verticalAlign: "top" }}>
                                                                <h5 className={styles.NFTKeys}>{pageTexts.srNumberKeyText}</h5>
                                                            </div>
                                                            <div style={{ width: "50%", display: "inline-block", verticalAlign: "top" }}>
                                                                <p className={classes.value} style={{ fontSize: "15px" }}>{data.object.serialNumber}</p>
                                                            </div>
                                                        </div>
                                                        {/* <div style={{ clear: "both" }}>
                                                            <hr className='dashedLine' />
                                                        </div> */}
                                                    </>
                                                    : ""}

                                                {data.object.token ?
                                                    <>
                                                        <div style={{ padding: "2px 0px" }}>
                                                            <div style={{ width: "50%", display: "inline-block", verticalAlign: "top" }}>
                                                                <h5 className={styles.NFTKeys}>{pageTexts.tokenIdKeyText}</h5>
                                                            </div>
                                                            <div style={{ width: "50%", display: "inline-block", verticalAlign: "top" }}>
                                                                <p className={classes.value} style={{ fontSize: "15px" }}>{data.object.token}</p>
                                                            </div>
                                                        </div>
                                                        {/* <div style={{ clear: "both" }}>
                                                            <hr className='dashedLine' />
                                                        </div> */}
                                                    </>
                                                    : ""}
                                                {data.object.createdOn ?
                                                    <>
                                                        <div style={{ padding: "2px 0px" }}>
                                                            <div style={{ width: "50%", display: "inline-block", verticalAlign: "top" }}>
                                                                <h5 className={styles.NFTKeys}>{pageTexts.createdOnKeyText}</h5>
                                                            </div>
                                                            <div style={{ width: "50%", display: "inline-block", verticalAlign: "top" }}>
                                                                <p className={classes.value} style={{ fontSize: "15px" }}>{moment(data.object.createdOn).format("MMM DD, YYYY") }</p>
                                                            </div>
                                                        </div>
                                                        {/* <div style={{ clear: "both" }}>
                                                            <hr className='dashedLine' />
                                                        </div> */}
                                                    </>
                                                    : ""}
                                                {data.object.description ?
                                                    <>
                                                        <div style={{ padding: "2px 0px" }}>
                                                            <div style={{ width: "50%", display: "inline-block", verticalAlign: "top" }}>
                                                                <h5 className={styles.NFTKeys}>{pageTexts.descriptionKeyText}</h5>
                                                            </div>
                                                            <div style={{ width: "50%", display: "inline-block", verticalAlign: "top" }}>
                                                                <p className={classes.value} style={{ fontSize: "15px" }}>{data.object.description}</p>
                                                            </div>
                                                        </div>
                                                        {/* <div style={{ clear: "both" }}>
                                                            <hr className='dashedLine' />
                                                        </div> */}
                                                    </>
                                                    : ""}
                                                <Box my={1}>
                                                    <div>
                                                        <a
                                                            className={commonStyles.blueBoldLink}
                                                            onClick={async (e) => { e.preventDefault(); goToExplorer(data.object.token, data.object.serialNumber) }}
                                                        >
                                                            {pageTexts.viewTradeHistoryText}
                                                        </a>
                                                    </div>
                                                </Box>
                                                {/* <div style={{ clear: "both" }}>
                                                    <hr className='dashedLine' />
                                                </div> */}
                                                {/* <div>
                                                    <Typography style={{ fontSize: "17px" }}>{dataDetails.description}</Typography>
                                                </div> */}
                                                {dataDetails.creator ?
                                                    <><div className="NFTProperty">
                                                        <div style={{ padding: "2px 0px" }}>
                                                            <div style={{ width: "50%", display: "inline-block", verticalAlign: "top" }}>
                                                                <h5 className={styles.NFTKeys}>{pageTexts.creatorText}</h5>
                                                            </div>
                                                            <div style={{ width: "50%", display: "inline-block", verticalAlign: "top" }}>
                                                                <p className={classes.value} style={{ fontSize: "15px" }}>{dataDetails.creator}</p>
                                                            </div>
                                                        </div>
                                                        {/* <div style={{ padding: "5px 0px" }}>
                                                            <Table className={classes.table} style={{ display: "inline-block", width: "100%", verticalAlign: "top" }}>
                                                                <TableBody style={{ display: "flex", flexDirection: "column" }}>
                                                                    <TableRow style={{ width: "100%", display: "inline-block", padding: "0px", float: "left" }}>
                                                                        <TableCell className={classNames([classes.cell, styles.NFTKeys])} style={{ display: "inline", fontSize: "15px", padding: "0px", color: "#18c2ee" }}>{pageTexts.creatorText}</TableCell>
                                                                    </TableRow>
                                                                    <TableRow style={{ width: "100%", display: "inline-block", padding: "0px 0px", float: "left" }}>
                                                                        <TableCell className={classes.cell} style={{ padding: "0" }}>{dataDetails.creator}</TableCell>
                                                                    </TableRow>
                                                                </TableBody>
                                                            </Table>
                                                        </div> */}
                                                    </div>
                                                    </>
                                                    : ""}
                                            </div>
                                        </AccordionDetails>
                                    </Accordion>
                                </div>
                            </Grid>
                        </Grid>
                    </Box>



                    {(dataDetails && dataDetails.properties && !Array.isArray(dataDetails.properties) && Object.keys(dataDetails.properties).length) ?
                            <Box my={2}><div className={classes.root}>
                                <Accordion defaultExpanded className={classes.accordion} aria-setsize={"large"}>
                                    <AccordionSummary
                                        expandIcon={<img src="./arrowDown.png" alt="show" />}
                                        aria-controls="panel1a-content"
                                        id="panel1a-header"
                                    >
                                        <Typography className={`${commonStyles.darkBoldText} ${commonStyles.largeSizedText}`}>{pageTexts.propertiesText}</Typography>
                                    </AccordionSummary>
                                    <AccordionDetails className={`${commonStyles.mediumSizedText} ${classes.accordionDetails}`}>
                                                {/* <Table className={classes.table} style={{ display: "inline-block", verticalAlign: "top" }}>
                                                    <TableBody style={{ display: "flex", flexDirection: "column" }}> */}
                                                    {Object.keys(dataDetails.properties).map((key, index) => {
                                                        return (
                                                            <div key={index} style={{ padding: "2px 0px" }}>
                                                                <div style={{ width: "50%", display: "inline-block", verticalAlign: "top" }}>
                                                                    <h5 className={styles.NFTKeys}>{key}</h5>
                                                                </div>
                                                                <div style={{ width: "50%", display: "inline-block", verticalAlign: "top" }}>
                                                                    <p className={classes.value} style={{ fontSize: "15px" }}>{dataDetails.properties[key]}</p>
                                                                </div>
                                                            </div>
                                                        )
                                                    })}
                                                        {/* <TableRow style={{ width: "100%", display: "inline-block", padding: "0px", float: "left" }}>
                                                            <TableCell className={classNames([classes.cell, styles.NFTKeys])} style={{ display: "inline", padding: "0px"}}>{key}</TableCell>
                                                            <TableCell className={classes.cell} style={{ padding: "0" }}>{dataDetails.properties[key]}</TableCell>
                                                        </TableRow>
                                                    </TableBody>
                                                </Table> */}
                                    </AccordionDetails>
                                </Accordion>
                            </div>
                        {/* <div className="NFTProperty">
                            <p>PROPERTIES</p>
                            {show ?
                                <>
                                    <h5 className={styles.NFTKeys} onClick={hideDetails} style={{ paddingLeft: "10px" }}>
                                        Hide
                                    </h5>
                                    <div style={{ padding: "10px 0px" }}>
                                        {Object.keys(dataDetails.properties).map((key, index) => {
                                            return (
                                                <Table className={classes.table} style={{ display: "inline-block", width: "50%", verticalAlign: "top" }}>
                                                    <TableBody style={{ display: "flex", flexDirection: "column" }}>
                                                        <TableRow style={{ width: "100%", display: "inline-block", padding: "0px", float: "left" }}>
                                                            <TableCell className={classNames([classes.cell, styles.NFTKeys])} style={{ display: "inline", fontSize: "15px", padding: "0px", color: "#18c2ee" }}>{key}</TableCell>
                                                        </TableRow>
                                                        <TableRow style={{ width: "100%", display: "inline-block", padding: "7px 0px", float: "left" }}>
                                                            <TableCell className={classes.cell} style={{ padding: "0" }}>{dataDetails.properties[key]}</TableCell>
                                                        </TableRow>
                                                    </TableBody>
                                                </Table>
                                            )
                                        })}
                                    </div>
                                </>
                                :
                                <h5 className={styles.NFTKeys} onClick={showDetails} style={{ paddingLeft: "10px" }}>
                                    Show
                                </h5>
                            }

                            <div style={{ clear: "both" }}>
                                <hr className='dashedLine' />
                            </div>
                        </div> */}</Box>
                    : ""}
                    {(dataDetails && dataDetails.attributes && Array.isArray(dataDetails.attributes) && dataDetails.attributes.length) ?
                        <Box my={2}>
                            <div className={classes.root}>
                                <Accordion defaultExpanded className={classes.accordion} aria-setsize={"large"}>
                                    <AccordionSummary
                                        expandIcon={<img src="./arrowDown.png" alt="show" />}
                                        aria-controls="panel1a-content"
                                        id="panel1a-header"
                                    >
                                        <Typography className={`${commonStyles.darkBoldText} ${commonStyles.largeSizedText}`}>{pageTexts.attributesText}</Typography>
                                    </AccordionSummary>
                                    <AccordionDetails className={`${commonStyles.mediumSizedText} ${classes.accordionDetails}`}>
                                        {dataDetails.attributes?.map((traits, index) => {
                                            return (<div key={index} style={{ padding: "2px 0px" }}>
                                                <div style={{ width: "50%", display: "inline-block", verticalAlign: "top" }}>
                                                    <h5 className={styles.NFTKeys}>
                                                        {traits.trait_type}
                                                    </h5>
                                                </div>
                                                <div style={{ width: "50%", display: "inline-block", verticalAlign: "top" }}>
                                                    <p className={classes.value} style={{ fontSize: "15px" }}>
                                                        {traits.value}{traits.display === "percentage" ? '%' : ''}
                                                    </p>
                                                </div>
                                            </div>);
                                        })}
                                    </AccordionDetails>
                                </Accordion>
                            </div>
                            {/* <div className="NFTProperty">
                                <p>ATTRIBUTES</p>
                                {showAtrributes ?
                                    <>
                                        <h5 className={styles.NFTKeys} onClick={hideAttributeDetails} style={{ paddingLeft: "10px" }}>
                                            Hide
                                        </h5>
                                        <div style={{ padding: "10px 0px" }}>
                                            {dataDetails.attributes?.map((traits, index) => {
                                                return (<div key={index} style={{ width: "50%",paddingBottom: "8px", display: "inline-block" }}>
                                                            <h5 className={styles.NFTKeys}>
                                                                {traits.trait_type}
                                                            </h5>
                                                            <p style={{ fontSize: "15px" }}>
                                                                {traits.value}{traits.display==="percentage" ? '%': ''}
                                                            </p>
                                                        </div>);
                                            })}
                                        </div>
                                    </>
                                :
                                    <h5 className={styles.NFTKeys} onClick={showAttributeDetails} style={{ paddingLeft: "10px" }}>
                                        Show
                                    </h5>
                                }
                                <div>
                                    <hr className='dashedLine' />
                                </div>
                            </div> */}
                        </Box>
                    : ""}
                    <div className={classes.root}>
                        <Accordion defaultExpanded className={classes.accordion} aria-setsize={"large"}>
                            <AccordionSummary
                                expandIcon={<img src="./arrowDown.png" alt="show" />}
                                aria-controls="panel1a-content"
                                id="panel1a-header"
                            >
                                <Typography className={`${commonStyles.darkBoldText} ${commonStyles.largeSizedText}`}>
                                    {pageTexts.nftFeesText}
                                    {/* <InfoOutlinedIcon style={{fontSize: "20px", paddingLeft: "5px", verticalAlign: "top"}} onClick={openFeesInfoModal} /> */}
                                </Typography>
                            </AccordionSummary>
                            <AccordionDetails className={`${commonStyles.mediumSizedText} ${classes.accordionDetails}`}>
                                <div style={{ padding: "5px 0px" }}>
                                    <h5 className={styles.NFTKeys}>{pageTexts.fixedFeesText}</h5>
                                    {(nftFees && nftFees.custom_fees && nftFees.custom_fees.fixed_fees && nftFees.custom_fees.fixed_fees.length > 0) ?
                                        <Table className={classes.table}>
                                            <TableBody>
                                                {Object.keys(nftFees.custom_fees.fixed_fees).map((index) => {
                                                    return (
                                                        <TableRow key={index}>
                                                            <TableCell className={classes.cell}>
                                                                <Typography variant="body2">
                                                                    {displayAmount(nftFees.custom_fees.fixed_fees[index].denominating_token_id ? nftFees.custom_fees.fixed_fees[index].amount : (nftFees.custom_fees.fixed_fees[index].amount / getCurrencyDecimal("HBAR")))} {nftFees.custom_fees.fixed_fees[index].denominating_token_id ? "" : "HBAR"}
                                                                    {nftFees.custom_fees.fixed_fees[index].denominating_token_id ? `${(nftFees.custom_fees.fixed_fees[index].amount == 1 ? "Token" : "Tokens")} (${nftFees.custom_fees.fixed_fees[index].denominating_token_id})` : ""}&nbsp;
                                                                </Typography>
                                                            </TableCell>
                                                            <TableCell className={classes.cell}>
                                                                <Typography variant="body2">
                                                                    Paid to {nftFees.custom_fees.fixed_fees[index].collector_account_id}
                                                                </Typography>
                                                            </TableCell>
                                                        </TableRow>
                                                    )
                                                })}
                                            </TableBody>
                                        </Table>
                                        :
                                        <Table className={classes.table}>
                                            <TableBody>
                                                <TableRow>
                                                    <TableCell className={classes.cell}>
                                                        <Typography
                                                        variant="body2"
                                                        // className={classes.disabledText}
                                                        >
                                                        None
                                                        </Typography>
                                                    </TableCell>
                                                </TableRow>
                                            </TableBody>
                                        </Table>
                                    }
                                    {/* <div>
                                        <hr className='dashedLine' />
                                    </div> */}
                                    <h5 className={styles.NFTKeys}>{pageTexts.royaltyFeesText}</h5>
                                    {(nftFees && nftFees.custom_fees && nftFees.custom_fees.royalty_fees && nftFees.custom_fees.royalty_fees.length > 0) ?
                                        <Table className={classes.table}>
                                            <TableBody>
                                                {Object.keys(nftFees.custom_fees.royalty_fees).map((index) => {
                                                    return (
                                                        <TableRow key={index}>
                                                            <TableCell className={classes.cell}>
                                                                <Typography variant="body2">
                                                                    Royalty: {displayAmount((nftFees.custom_fees.royalty_fees[index].amount.numerator / nftFees.custom_fees.royalty_fees[index].amount.denominator) * 100)}%
                                                                </Typography>
                                                            </TableCell>
                                                            {nftFees.custom_fees.royalty_fees[index].fallback_fee ?
                                                                <TableCell className={classes.cell}>
                                                                    <Typography variant="body2">
                                                                        Fallback: {displayAmount(nftFees.custom_fees.royalty_fees[index].fallback_fee.denominating_token_id ? nftFees.custom_fees.royalty_fees[index].fallback_fee.amount : (nftFees.custom_fees.royalty_fees[index].fallback_fee.amount / getCurrencyDecimal("HBAR")))}
                                                                        {nftFees.custom_fees.royalty_fees[index].fallback_fee.denominating_token_id ?
                                                                            ""
                                                                            :
                                                                            <span>{"HBAR"}</span>
                                                                        }
                                                                        {nftFees.custom_fees.royalty_fees[index].denominating_token_id ? `${(nftFees.custom_fees.royalty_fees[index].amount == 1 ? "Token" : "Tokens")} (${nftFees.custom_fees.royalty_fees[index].denominating_token_id})` : ""}
                                                                    </Typography>
                                                                </TableCell>
                                                                : ""}
                                                            <TableCell className={classes.cell}>
                                                                <Typography variant="body2">
                                                                    Paid to {nftFees.custom_fees.royalty_fees[index].collector_account_id}
                                                                </Typography>
                                                            </TableCell>
                                                        </TableRow>
                                                    )
                                                })}
                                            </TableBody>
                                        </Table>
                                        :
                                        <Table className={classes.table}>
                                            <TableBody>
                                                <TableRow>
                                                    <TableCell className={classes.cell}>
                                                        <Typography
                                                        variant="body2"
                                                        // className={classes.disabledText}
                                                        >
                                                            {pageTexts.noneText}
                                                        </Typography>
                                                    </TableCell>
                                                </TableRow>
                                            </TableBody>
                                        </Table>
                                    }
                                </div>
                                <Box py={2}>
                                    <Typography variant="body2" className={commonStyles.lightGreyText}>
                                        {pageTexts.fixedFeeDetail}
                                    </Typography>
                                    <Typography variant="body2" className={commonStyles.lightGreyText}>
                                        {pageTexts.royaltyFeeDetails}
                                    </Typography>
                                    <Typography variant="body2" className={commonStyles.lightGreyText}>
                                        {pageTexts.fallbackFeeDetails}
                                    </Typography>
                                </Box>
                            </AccordionDetails>
                        </Accordion>
                    </div>
                        {/* <div className="NFTProperty">
                            <p>NFT FEES
                                <InfoOutlinedIcon style={{fontSize: "20px", paddingLeft: "5px", verticalAlign: "top"}} onClick={() => setOpenFeeModal(true)} />
                            </p>
                            {showFees ?
                                <>
                                    <h5 className={styles.NFTKeys} onClick={hideFeesDetails} style={{ paddingLeft: "10px" }}>
                                        Hide
                                    </h5>

                                </>
                                :
                                <h5 className={styles.NFTKeys} onClick={showFeesDetails} style={{ paddingLeft: "10px" }}>
                                    Show
                                </h5>
                            }
                        </div> */}
                        <>
                        {/* <div className="NFTProperty">
                            <p>NFT INFO</p>
                            <div style={{padding:"5px 0px"}}>
                                {data.mapping[data.object.token] ?
                                    <>
                                        <div style={{ padding: "2px 0px" }}>
                                            <div style={{ width: "50%", display: "inline-block", verticalAlign: "top" }}>
                                                <h5 className={styles.NFTKeys}>COLLECTION</h5>
                                            </div>
                                            <div style={{ width: "50%", display: "inline-block", verticalAlign: "top" }}>
                                                <p style={{ fontSize: "15px" }}>{data.mapping[data.object.token]}</p>
                                            </div>
                                        </div>
                                        <div style={{ clear: "both" }}>
                                            <hr className='dashedLine' />
                                        </div>
                                    </>
                                : ""}

                                {data.object.serialNumber ?
                                    <>
                                        <div style={{ padding: "2px 0px" }}>
                                            <div style={{ width: "50%", display: "inline-block", verticalAlign: "top" }}>
                                                <h5 className={styles.NFTKeys}>SERIAL NUMBER</h5>
                                            </div>
                                            <div style={{ width: "50%", display: "inline-block", verticalAlign: "top" }}>
                                                <p style={{ fontSize: "15px" }}>{data.object.serialNumber}</p>
                                            </div>
                                        </div>
                                        <div style={{ clear: "both" }}>
                                            <hr className='dashedLine' />
                                        </div>
                                    </>
                                : ""}

                                {data.object.token ?
                                    <>
                                        <div style={{ padding: "2px 0px" }}>
                                            <div style={{ width: "50%", display: "inline-block", verticalAlign: "top" }}>
                                                <h5 className={styles.NFTKeys}>TOKEN ID</h5>
                                            </div>
                                            <div style={{ width: "50%", display: "inline-block", verticalAlign: "top" }}>
                                                <p style={{ fontSize: "15px" }}>{data.object.token}</p>
                                            </div>
                                        </div>
                                        <div style={{ clear: "both" }}>
                                            <hr className='dashedLine' />
                                        </div>
                                    </>
                                : ""}

                                {data.object.createdOn ?
                                    <>
                                        <div style={{ padding: "2px 0px" }}>
                                            <div style={{ width: "50%", display: "inline-block", verticalAlign: "top" }}>
                                                <h6 className={styles.NFTKeys}>CREATED ON</h6>
                                            </div>
                                            <div style={{ width: "50%", display: "inline-block", verticalAlign: "top" }}>
                                                <p style={{ fontSize: "15px" }}>{moment(data.object.createdOn).format("MMM DD, YYYY")}</p>
                                            </div>
                                        </div>
                                        <div style={{ clear: "both" }}>
                                            <hr className='dashedLine' />
                                        </div>
                                    </>
                                : ""}
                            </div>
                        </div> */}
                        </>
                </div>
                :
                <div className="loader">
                    <CircularProgress color="inherit" />
                </div>
            }

            {/* <Modal
              open={openFeeModal}
              onClose={handleCloseFeeModal}
            >
              <Box className={classes.modalContainer}>
                <Typography>
                    Fixed fees are paid by the sender/seller.
                </Typography>
                <div style={{ clear: "both" }}>
                    <hr className='dashedLine' />
                </div>
                <Typography>
                    Royalty fees are paid by the seller from the amount received.
                </Typography>
                <div style={{ clear: "both" }}>
                    <hr className='dashedLine' />
                </div>
                <Typography>
                    Fallback fees are paid by the receiver if no HBAR is exchanged.
                </Typography>

                <div className={classes.ctrlBtns}>
                    <button className="button-done" onClick={handleCloseFeeModal}>
                        Ok
                    </button>
                </div>
              </Box>
            </Modal> */}

            {transferErr && dataDetails && (<div className="errMsg extension" style={{ color: "#FF5858", margin:"0px 20px"}}>
                <p>{transferErr}</p>
            </div>)}
            {/* <div className="footer" style={{height: workingEnv === "test" ? "70px" : ""}}>
                <div className='backArrow' style={{top: workingEnv === "test" ? "10px" : ""}}>
                    <ArrowBackOutlinedIcon onClick={() => setCurrentScreen("nftcollections")} style={{ cursor: "pointer", color: "#18C2EE" }} />
                </div>

            </div> */}
            <LinkCryptoWalletModal
                open={openLinkCryptoModal}
                setOpen={setOpenLinkCryptoModal}
                setCurrentScreen={setCurrentScreen}
                screen={screen}
                setScreenWithData={setScreenWithData}
                screenData={{data, dataDetails, nftFees, cryptoWallets}}
            />
        </div>
    )
}

export default NFTDetails
