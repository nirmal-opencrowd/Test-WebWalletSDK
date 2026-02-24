import { Box, Button, CircularProgress, Divider, Grid, Modal, Switch, Typography } from '@material-ui/core'
import React, { useState } from 'react'
import ArrowBackOutlinedIcon from '@material-ui/icons/ArrowBackOutlined';
import { makeStyles } from '@material-ui/core';
import InfoIcon from '@material-ui/icons/Info';
import classNames from 'classnames';
import * as localstorage from "./../../utils/local-storage";
import { checkIfValidUser } from '../../api';
import { COMMON_ERROR_MSG } from '../../utils/constants';
import commonStyles from "./../../styles/common.module.scss";
import uiTexts from "./../../../configurations/dropp.json";

const pageTexts = uiTexts.developerSettings;

const useStyles = makeStyles(() => ({
    toggleLables: {
        display: "Inline-block",
        fontWeight: "600",
    },
    greyBackground: {
        backgroundColor: "#f9f9f9",
        borderRadius:"5px",
        marginBottom:"25px",
        marginTop: "10px",
        padding: "10px",
        textAlign:"left",
    },
    modalAtCenter : {
        alignItems:"center",
        display:"flex",
        justifyContent:"center",
    },
    ctrlBtns: {
        marginTop: "10px",
        display :"flex",
        justifyContent:"space-around"
    },
    modalContainer: {
        backgroundColor: '#FFFFFF',
        border: 0,
        padding: "15px",
        width: 250,
    },
    InfoIcon: {
        opacity:0.4,
    },
    toggleContainer : {
        backgroundColor:"#e9e9e9",
        margin:"20px auto",
    },
    btnWidth: {
        minWidth:"83px"
    },
    loader: {
        display:"flex",
        justifyContent:"center",
        alignItems:"center",
        marginTop:"20px",
        color:"#18C2EE"
    }
}))

const DeveloperSettings = ({ setCurrentScreen , setScreenWithData}) => {
    const classes = useStyles();
    const [networkMode, setNetworkMode] = useState("");
    const [openConfirmModal, setOpenConfirmModal] = useState(false);
    const [backendErr, setBackendErr] = useState(null);
    const [loading, setLoading] = useState(false);

    React.useEffect(() => {
        async function fetchUserNetwork() {
            let userData = await localstorage.decrypted.get();
            if(userData && userData.activeNetwork) {
                setNetworkMode(userData.activeNetwork);
            }
        }

        fetchUserNetwork();
    },[])

    const handleModeChange = async (mode) => {
        setNetworkMode(mode);
        setOpenConfirmModal(true);
    }

    const confirmModeChange = async () => {
        let userData = await localstorage.decrypted.get();
        if (networkMode === "test") {
            setLoading(true);
            try {
                if(userData.testnet) {
                    let res = await checkIfValidUser();
                    if (res && res.responseCode == 0) {
                        if (res.data) {
                            delete userData["configInfo"];
                            userData = { ...userData, ...userData.testnet }
                            await localstorage.decrypted.set(userData);
                            chrome.storage.local.set({ env: userData.testnet.env }, function (data) {});
                            setOpenConfirmModal(false);
                            setScreenWithData("sandboxRecoveryModal", {showSandboxRecoveryModal : true});
                            return;
                        } else {
                            setBackendErr("Your previous test account is no longer available. We created a new one for you.");
                            setOpenConfirmModal(true);
                            setScreenWithData("sandboxRecovery", {switchToSandbox : true})
                        }
                    } else {
                        setBackendErr(COMMON_ERROR_MSG);
                        setOpenConfirmModal(true);
                    }
                    setLoading(false);
                } else {
                    setScreenWithData("sandboxRecovery", {switchToSandbox : true})
                }
            } catch (error) {
                setBackendErr(error ? error : COMMON_ERROR_MSG);
                setOpenConfirmModal(true);
                setLoading(false);
            }
        } else {
            delete userData["configInfo"];
            userData = { ...userData, ...userData.mainnet }
            await localstorage.decrypted.set(userData);
            chrome.storage.local.set({ env: userData.mainnet.env }, function (data) {});
            setOpenConfirmModal(false);
            setScreenWithData("sandboxRecoveryModal", {showSandboxRecoveryModal : true});
            return;
        }
    }

    const handleConfirmModalClose = () => {
        setNetworkMode(networkMode === "main" ? "test" : "main");
        setOpenConfirmModal(false);
        setBackendErr(null);
    }

    return (
        <div style={{ marginTop: "60px" }}>
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
                        DEVELOPER
                    </label>
                    <br />
                    <label style={{ fontSize: "1.3em" }}>
                        Option
                    </label>
                </div>
            </div> */}
            <div style={{margin:"0px 20px"}}>
                <div>
                    <Grid style={{marginTop:"20px"}}>
                        <Grid item>
                            <Typography style={{fontWeight:"600"}}>
                                {pageTexts.testModeSetting}
                            </Typography>
                            <Grid item className={classes.greyBackground}>
                                <Typography>
                                    {pageTexts.testModeUsageText}
                                </Typography>
                                <Typography style={{marginTop:"20px"}}>
                                    {pageTexts.testRecommendedText}
                                </Typography>
                            </Grid>
                        </Grid>
                    </Grid>
                </div>
                <Divider className={commonStyles.divider}/>
                <div>
                    <Box mt={4}>
                        <Typography>
                            {pageTexts.nowActiveText}: <strong>{networkMode === "test" ? "TEST" : "MAIN"}</strong>
                        </Typography>
                    </Box>
                    <Grid container className={classes.toggleContainer} >
                        <Grid item xs={6}>
                            <Button
                                variant="outlined"
                                style={{boxShadow:"none",  backgroundColor: networkMode === "main" ? '#18C2EE80' : '#fff' }}
                                color={networkMode === "main" ? 'primary' : 'transparent'}
                                onClick={() => handleModeChange("main")}
                                disabled={networkMode === "main"}
                                fullWidth
                            >
                                <Typography style={{color: networkMode === "main" ? "#ffffff":""}}>
                                    {pageTexts.btnTextMain}
                                </Typography>
                            </Button>
                        </Grid>
                        <Grid item xs={6}>
                            <Button
                                variant="outlined"
                                style={{boxShadow:"none",  backgroundColor: networkMode === "test" ? '#18C2EE80' : '#fff' }}
                                color={networkMode === "test" ? 'primary' : 'transparent'}
                                onClick={() => handleModeChange("test")}
                                disabled={networkMode === "test"}
                                fullWidth
                            >
                                <Typography style={{color: networkMode ==="test" ? "#ffffff":""}}>
                                    {pageTexts.btnTextTest}
                                </Typography>
                            </Button>
                        </Grid>
                    </Grid>
                    {
                        networkMode === "test" ?  <Grid className={classes.greyBackground} style={{display:"flex", alignItems:"center", marginTop:"30px"}}>
                                        <span style={{marginRight:"7px"}}><InfoIcon className={classes.InfoIcon} /></span>
                                        <Typography variant='subtitle2'>
                                            {pageTexts.aboutTestMode}
                                        </Typography>
                                    </Grid> : ""
                    }
                </div>
                <Modal
                open={openConfirmModal}
                onClose={handleConfirmModalClose}
                className={classes.modalAtCenter}
              >
                <Box className={classes.modalContainer}>
                { loading ? <div className={classes.loader}>
                        <CircularProgress color='inherit' />
                    </div> :
                    (backendErr ? <>
                            <Typography style={{fontWeight:600}}>
                                {pageTexts.modalErrHeading}
                            </Typography>
                            <Typography variant='subtitle2'>
                                {backendErr}
                            </Typography>
                            <div style={{marginTop:"20px", textAlign:"center"}}>
                                <button className={classNames([ "button-cancel", classes.btnWidth])} onClick={handleConfirmModalClose}>{pageTexts.cnfModalNo}</button>
                            </div>
                    </> : <>
                        <Typography style={{fontWeight:600}}>
                            {pageTexts.cnfModalYes}
                        </Typography>
                        <Typography variant='subtitle2'>
                            Switch to {networkMode === "test" ? "Test mode" : "Main"}?
                        </Typography>
                        <div className={classes.ctrlBtns}>
                            <button className={classNames([ "button-cancel", classes.btnWidth])}onClick={handleConfirmModalClose}>Cancel</button>
                            <button className={classNames(["button-done", classes.btnWidth])} onClick={confirmModeChange}>OK</button>
                        </div>
                    </>)
                }
                </Box>
              </Modal>
            </div>
            {/* <div className='footer'>
                <div className='backArrow'>
                    <ArrowBackOutlinedIcon onClick={() => setCurrentScreen("accountsettings")} style={{ cursor: "pointer", color: "#18C2EE" }} />
                </div>
            </div> */}
        </div>
    )
}

export default DeveloperSettings;