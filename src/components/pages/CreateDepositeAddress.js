import React from 'react';
// import ArrowBackOutlinedIcon from '@material-ui/icons/ArrowBackOutlined';
import { makeStyles } from '@material-ui/core/styles';
import Typography from "@material-ui/core/Typography";
import RefreshIcon from '@material-ui/icons/Refresh';
import * as api from "../../api/index";
import Box from '@material-ui/core/Box';
import Modal from '@material-ui/core/Modal';
import CircularProgress from "@material-ui/core/CircularProgress";
import "../../NFTcollections.css";
import CountDownTimer from '../CountDownTimer';
import styles from "./../../styles/common.module.scss";
import UITexts from "./../../../configurations/dropp.json";

const useStyles = makeStyles(() => ({
    modal: {
        alignItems:"center",
        display:"flex",
        justifyContent:"center",
    },
    detailContainer: {
        marginTop: "50px",
        maxHeight: "420px",
        overflowY: "scroll"
    },
    subContainer: {
        paddingTop: "35px",
    },
    modalContainer: {
        backgroundColor: '#FFFFFF',
        border: 0,
        padding: "15px",
        position: 'absolute',
        width: 250,
    },
    loaderContainer : {
        alignItems:"center",
        display:"flex",
        height:"100vh",
        justifyContent:"center",
    }
}))

const CreateDepositeAddress = ({ setCurrentScreen, setScreenWithData, userDetails , screenData, setFunctionCallOnBack}) => {
    const classes = useStyles();
    const pageTexts = UITexts.createDepositeAddress;

    // const [waitingPaymentAddress, setWaitingPaymentAddress] = React.useState(screenData.waiting ? screenData.waiting  : false);
    const [waitingPaymentAddress, setWaitingPaymentAddress] = React.useState(screenData.waiting);
    const [depositData, setdepositData] = React.useState(null);
    const [noDepositAddress, setNoDepositAddress] = React.useState(screenData.waiting === false ? false : true);
    const [err, setErr] = React.useState(null);
    const [timeIsUp, setTimeIsUp] = React.useState(screenData.waiting == false ? true : false);
    const [loading, setLoading] = React.useState(false);
    const [openModal, setOpenModal] = React.useState(false);

    const depositDataRef  = React.useRef(depositData);
    const fetchInterval = React.useRef(null);
    const chain = screenData.chain;
    const chainTitle = screenData.chainTitle;

    React.useEffect(() => {
        if(waitingPaymentAddress) {
            setTimeIsUp(true);
        }
        setFunctionCallOnBack(() => movedBackWhileWaiting)
        return () => {
            setFunctionCallOnBack(null);
        }
    }, [])


    async function createPaymentIntent(chain) {
        try {
            setNoDepositAddress(false);
            let res = await api.createPaymentIntent({chain : chain});
            if (res && res.responseCode == 0) {
                setWaitingPaymentAddress(true);
                let i = 0;
                fetchInterval.current = setInterval(async () => {
                    i+=1;
                    if(i > 6) {
                        clearInterval(fetchInterval.current);
                    } else {
                        let response = await fetchDepositeAddress(chain )
                        if((response && depositDataRef.current) ) {
                            setScreenWithData("chainAddress", {chain, chainTitle,  depositData: depositDataRef.current})
                            clearInterval(fetchInterval.current);
                        }
                    }
                }, 5000)
                setTimeout(()=> {
                    setWaitingPaymentAddress(false);
                    setTimeIsUp(true);
                }, 31000)
            } else {
                setErr(res.messages[0]);
                setOpenModal(true);
            }
        } catch (error) {
            setErr("Error in creating deposit address");
            setOpenModal(true);
        }
    }

    async function fetchDepositeAddress(chain) {
        try {
            let hasDepositAddress = false;
            if (!screenData.waiting) {
                setWaitingPaymentAddress(true);
            }
            if (timeIsUp) {
                setLoading(true);
                setTimeout(() => {
                    setLoading(false);
                }, 5000)
            }
            let res = await api.fetchDepositeAddress({chain : chain});
            if (res && res.responseCode == 0) {
                if (res.data && res.data.depositAddress) {
                    setdepositData(res.data);
                    setWaitingPaymentAddress(false);
                    hasDepositAddress = true;
                    return hasDepositAddress;
                }
            } else {
                setErr(res.messages[0]);
                setOpenModal(true);
            }
        } catch (error) {
            setErr("Internal Server Error");
            setOpenModal(true);
        }
    }

    React.useEffect(() => {
        depositDataRef.current = depositData;
        if (screenData.waiting && depositData && noDepositAddress ) {
            setScreenWithData("chainAddress", {chain: chain, depositData})
        }
    }, [depositData]);

    const createAddress = async () => {
        await createPaymentIntent(chain);
    };

    const fetchAddress = async () => {
        await fetchDepositeAddress(chain);
    };

    const movedBackWhileWaiting = () => {
        clearInterval(fetchInterval.current)
        setScreenWithData("transferUSDC", {waiting : waitingPaymentAddress, backWhileWaiting: true})
    };

    const closeModalHandler = () => {
        setErr(null);
        setNoDepositAddress(true);
        setOpenModal(false);
    };

    return (
        <div style={{ marginTop: "33px" }}>
            <div
                style={{
                    textAlign: "left",
                    margin: "6px 20px 10px 20px"
                }}>
                {/* <div style={{ paddingTop: "9px" }}>
                    <label style={{ fontWeight: "450", color: "#18C2EE", fontSize: "1.8em" }}>
                        USDC ({chainTitle})
                    </label>
                </div> */}
                <div className={classes.detailContainer}>
                    <Typography>
                        Transfer {chainTitle} USDC from your {chainTitle} wallet to the address shown below.
                    </Typography>
                    <div className={classes.subContainer}>
                        <Typography style={{ fontWeight: "600" }} variant="h6">
                            {chainTitle} Deposit Address
                        </Typography>
                        {
                            loading ? <>
                                <div className='loader' style={{ marginTop: "10px" }}>
                                    <CircularProgress color='inherit' />
                                </div>
                            </> :
                            noDepositAddress && !screenData.waiting ? <>
                                <Typography>
                                    {pageTexts.newAddressCreateTxt}
                                </Typography>
                                <button className={`${styles.primaryBtn} ${styles.circularBtn}`} style={{marginTop:"25px", width: "auto"}} onClick={createAddress}>
                                    {pageTexts.createBtnTxt}
                                </button>
                            </> : <>
                                <Typography>
                                    {pageTexts.creatingDepAddTxt}
                                </Typography>
                                {
                                    (!screenData.waiting && !timeIsUp )? <div style={{display:"flex", justifyContent:"center", marginTop:"30px"}}>
                                        <CountDownTimer timerDuration={30}/>
                                    </div> : <button
                                            className='button-done'
                                            style={{marginTop:"25px", display:"flex", alignItems:"center"}}
                                            onClick={fetchAddress}
                                            >
                                                <RefreshIcon/><span style={{paddingLeft:"5px"}}>Check now</span>
                                            </button>
                                }
                            </>
                        }
                    </div>
                </div>
            </div>
            {/* <div className='footer'>
                <div className='backArrow'>
                    <ArrowBackOutlinedIcon onClick={ movedBackWhileWaiting} style={{ cursor: "pointer", color: "#18C2EE" }} />
                </div>
            </div> */}
            <Modal className={classes.modal} open={openModal} onClose={closeModalHandler}>
                <Box className={classes.modalContainer}>
                {
                        err ? <>
                            <div>
                                <Typography variant='h5'>
                                    Error
                                </Typography>
                                <div className="errMsg extension" style={{marginBottom:"10px"}}>
                                    <strong>{err}</strong>
                                </div>
                            </div>
                            <div style={{paddingTop:"15px"}}>
                            <button style={{width:"100%", marginTop:"5px"}} onClick={closeModalHandler} className='button-cancel'>
                                Close
                            </button>
                        </div>
                        </> :<></>
                }
                </Box>
            </Modal>
        </div>
    )
}

export default CreateDepositeAddress;