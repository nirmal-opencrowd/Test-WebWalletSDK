import React from 'react';
import { displayAmount } from '../../utils/utils';
import ArrowBackOutlinedIcon from '@material-ui/icons/ArrowBackOutlined';
import QRCode from "react-qr-code";
import { makeStyles } from '@material-ui/core/styles';
import Typography from "@material-ui/core/Typography";
import ErrorIcon from '@material-ui/icons/Error';
import MoreVertIcon from '@material-ui/icons/MoreVert';
import Copy from './Copy';
import Box from '@material-ui/core/Box';
import Modal from '@material-ui/core/Modal';
import CircularProgress from "@material-ui/core/CircularProgress";
import * as api from "../../api/index"
import styles from "./../../styles/common.module.scss";
import UITexts from "./../../../configurations/dropp.json";
import { Grid } from '@material-ui/core';


const useStyles = makeStyles((theme) => ({
    modal: {
        alignItems:"center",
        display:"flex",
        justifyContent:"center",
    },
    modalContainer: {
      backgroundColor: '#FFFFFF',
      border: 0,
      padding: "15px",
      position: 'absolute',
      width: 250,
    },
    qrBox: {
      margin: "10px 0",
      textAlign: "center"
    },
    greyBackground: {
        backgroundColor: "#f9f9f9",
        margin: "0px 20px",
        padding: "8px",
    },
    redText: {
        color:"#E82040",
        fontWeight:"600",
    },
    footer: {
        backgroundColor:"#ffffff",
        bottom: "0",
        padding:"0px 20px 10px 20px",
        position:"fixed",
        zIndex:1,
    },
    icons : {
        color: "#18C2EE",
        fontWeight:"600",
    },
    copyIconContainer: {
        textAlign: "end"
    },
    accIdCopySubHeading: {
        color: "#000",
        fontSize: "25px",
    },
  }));


const ChainAddress = ({ screenData, setScreenWithData, setCurrentScreen, setFooterObj, setFunctionCallOnBack}) => {
    const classes = useStyles();
    const chain = screenData.chain;

    const availableChains = ["ETH", "AVAX", "MATIC"];
    // const depositData =  availableChains.includes(chain) ? screenData.depositData : "";
    const depositData = chain != "HBAR" ? screenData.depositData : "";
    const depositAddress = chain != "HBAR" ? depositData.depositAddress : screenData.depositAddress
    const expirationTime = depositData.expirationTime ? new Date(depositData.expirationTime): "";
    const maxTransferAmt = depositData.amountLimit ? depositData.amountLimit : "";
    const chainTitle = screenData.chainTitle;

    const [openModal, setOpenModal] = React.useState(false);
    const [loading, setLoading] = React.useState(false);
    const [newPendingAddress, setNewPendingAddress] = React.useState(true);
    const [backendErr, setBackendErr] = React.useState(null);
    const [usdcFees, setUsdcFees] = React.useState(null);
    const pageTexts = UITexts.chainAddress;

    const options = {
        weekday: 'short',
        month: 'long',
        day: 'numeric',
        year: 'numeric',
        hour: 'numeric',
        minute: 'numeric',
        timeZoneName: 'short',
        timeZone: 'America/New_York'
    };

    const formattedExpiryTime = expirationTime.toLocaleString('en-US', options);

    React.useEffect(() => {
        if(!newPendingAddress) {
            setLoading(false);
            setOpenModal(false);
            setScreenWithData("createDepositeAddress", {waiting : true, chain , chainTitle})
        }
    }, [newPendingAddress])

    React.useEffect(() => {
        const getUSDCFees = async () => {
            let res = await api.getUSDCFees({amount:0 , chain: chain , type:"FUNDING"})
            if(res && res.responseCode == 0) {
                if(res.data && (res.data.totalFee || res.data.totalFee == 0 )) {
                    setUsdcFees(res.data.totalFee);
                }
            }
        }

        // setFooterObj({
        //     footerTxt: `Send only ${chainTitle} USDC from the {chainTitle} network to this
        //                 network. ${
        //                     chain !="HBAR" ? "Sending anything else will result in permanent loss of funds" : ""
        //                 }`
        // })
        setFunctionCallOnBack(() => backBtnHandler);

        Promise.all([getUSDCFees()]);

        return () => {
            setFunctionCallOnBack(null);
        }
    }, [])



    const createNewAddress = async () => {
        setLoading(true);
        try {
            let cancelRes = await api.cancelPaymentIntents({chain : chain });
            if (cancelRes && cancelRes.responseCode == 0) {
                let createRes = await api.createPaymentIntent({chain : chain});
                if (createRes && createRes.responseCode == 0) {
                    setNewPendingAddress(false);
                } else {
                    setBackendErr("Unable to create new deposit address, although the old one is deleted")
                }
            } else {
                setBackendErr("Cancellation Failed")
            }
        } catch (error) {
            setBackendErr("Invalid request");
        }
    }

    const closeModalHandler = () => {
        setBackendErr(null);
        if ( loading ) {
            setScreenWithData("createDepositeAddress", {waiting : true, chain : chain, chainTitle: chainTitle});
        }
        setLoading(false);
        setOpenModal(false);
    }

    const backBtnHandler = () => {
        setScreenWithData("transferUSDC", {qrGenerated : depositAddress ? true : false})
    }

    return (
        <div style={{ marginTop: "33px", padding: "0px 20px" }}>
            {/* <div
                style={{
                    margin: "6px 20px 10px 20px",
                    textAlign: "left",
                }}>
                <div>
                    <label style={{ fontWeight: "450", color: "#18C2EE", fontSize: "1.8em"  }}>
                    USDC ({chainTitle})
                    </label>
                </div>
                <div>
                    <Typography variant='subtitle2'>
                        Transfer USDC from your {chainTitle} wallet
                        to the address shown below.
                    </Typography>
                </div>
            </div> */}
            <div style={{overflowY:"scroll"}}>
                {/* <div className={classes.greyBackground}>
                    <div className={classes.qrBox}>
                        <QRCode size={150} value={depositAddress} />
                    </div>
                </div> */}
                <Box my={2} sx={{textTransform: chainTitle ? "uppercase" : ""}}>
                    <Typography align="center" className={`${styles.mediumSizedText} ${styles.darkBoldText}`}>
                        Transfer {chainTitle != "Hedera" ? chainTitle : ""} USDC from your {chainTitle} wallet
                        to the address shown below.
                    </Typography>
                </Box>
                <div className={`${styles.greyListContainer}`}>
                    <div style={{ padding: "15px", textAlign: "center" }}>
                        <div style={{ padding: "15px", textAlign: "center", backgroundColor: "#fff" }}>
                            <QRCode size={220} value={depositAddress} />
                        </div>
                    </div>
                </div>
                <Box my={2}>
                    <Typography align="center">
                        {pageTexts.showQRTxt}
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
                                    {/* {hederaAccountToString(userDetails.hhAccount)} */}
                                    {depositAddress}
                                </Typography>
                            </Grid>
                            <Grid item xs={4} className={classes.copyIconContainer}>
                                <Copy iconSize={20} iconColor="disabled" toolTipTitle={pageTexts.copyToolTipTitle} copyMessage={pageTexts.copyMessage} text={depositAddress} />
                            </Grid>
                        </Grid>
                    </div>
                </Box>
                {
                    chain != "HBAR" ? <>
                        <div
                            className={classes.greyBackground} style={{
                            marginTop: "5px" ,
                            display:"flex",
                            justifyContent:"space-between",
                            alignItems:"center",
                            fontSize:"27px",
                            color:"#707070",
                            cursor:"pointer"
                            }}
                            onClick={() => setOpenModal(true)}
                        >
                            <div>
                                <Typography variant='subtitle2' className={classes.redText}>
                                    This is a temporary address.
                                    <br />
                                    Available till {formattedExpiryTime}
                                </Typography>
                                <Typography variant='subtitle2'>
                                    Max allowed transfer amount is {maxTransferAmt}
                                </Typography>
                            </div>
                            <div>
                                <MoreVertIcon/>
                            </div>
                        </div>
                    </> : ""
                }
                {/* <div style={{ margin: "0px 20px" }}>
                    <Typography variant='subtitle1' style={{fontWeight:"600"}}>
                        {chainTitle} Deposit Address
                    </Typography>
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                        <Typography style={{ wordBreak: "break-word" }}>
                            {depositAddress}
                        </Typography>
                        <div style={{ marginLeft: "5px" }}>
                            <Copy iconSize={"25px"} iconColor="disabled" toolTipTitle={`Copy your ${chainTitle} Deposit Address`} copyMessage={`${chainTitle} Deposit Address copied to clipboard`} text={depositAddress} />
                        </div>
                    </div>
                    {chain != "HEDERA" ? <div style={{marginTop:"8px", color:"#808080"}}>
                        <Typography variant='caption text'>
                            Address generated by Circle
                        </Typography>
                    </div> : ""}
                </div> */}
                <div  style={{ margin: "20px 0px" }}>
                {
                    usdcFees || usdcFees == 0  ? <>
                        <Typography>
                            <strong>
                                {pageTexts.estimatedFeesTxt}
                            </strong>
                        </Typography>
                        <Typography style={{ paddingBottom: "5px" }}>
                            Fees including Network fees: {displayAmount(usdcFees)} USDC
                        </Typography>
                    </> : ""
                }
                </div>
            </div>
            {/* <div style={{width:"90%", margin:"auto"}}>
                <hr />
                <div style={{ display: "flex" }}>
                    <ErrorIcon className={classes.icons} />
                    <Typography variant="caption text">
                        Send only {chainTitle} USDC from the {chainTitle} network to this
                        network. {
                            chain !="HBAR" ? "Sending anything else will result in permanent loss of funds" : ""
                        }
                    </Typography>
                </div>
                <div className='footer' style={{paddingLeft:"0"}}>
                    <div className='backArrow'>
                        <ArrowBackOutlinedIcon onClick={backBtnHandler} style={{ cursor: "pointer", color: "#18C2EE" }} />
                    </div>
                </div>
            </div> */}
            <Modal className={classes.modal} open={openModal} onClose={closeModalHandler}>
                <Box className={classes.modalContainer}>
                    {
                        backendErr ? <>
                            <div>
                                <Typography variant='h5'>
                                    Error
                                </Typography>
                                <div className="errMsg extension" style={{marginBottom:"10px"}}>
                                    <strong>{backendErr}</strong>
                                </div>
                            </div>
                        </> :<>
                                <Typography variant='subtitle2' style={{ fontWeight: "600" }}>
                                    {pageTexts.newDepositAddress}
                                </Typography>
                                {loading?
                                <div className='loader' style={{ marginTop: "10px" }}>
                                    <CircularProgress color='inherit' />
                                </div>

                                :
                                <Typography variant='body2'>
                                    {pageTexts.oldDepositAddressWarning}
                                </Typography>
                                }
                        </>
                    }
                        <div style={{paddingTop:"15px"}}>
                            <button style={{width:"100%", opacity: loading ? "0.5" : "" }} onClick={createNewAddress} disabled={loading} className='button-done'>
                                {pageTexts.createNewAddress}
                            </button>
                            <button style={{width:"100%", marginTop:"5px"}} onClick={closeModalHandler} className='button-cancel'>
                                {pageTexts.closeBtnTxt}
                            </button>
                        </div>
                </Box>
            </Modal>
        </div>
    )
}

export default ChainAddress