import { Box, Button, CircularProgress, Grid, Modal, Switch, Typography } from '@material-ui/core'
import React, { useState } from 'react'
import ArrowBackOutlinedIcon from '@material-ui/icons/ArrowBackOutlined';
import { makeStyles } from '@material-ui/core';
import AccountRecover from './AccountRecover';
import DroppRecovery from './DroppRecovery';

const SandboxRecovery = ({ setCurrentScreen , setScreenWithData, screenData}) => {
    const [qrcodeData, setQrcodeData] = React.useState(null);
    const [isQrCodeScaned, setIsQrCodeScaned] = React.useState(false);

    const switchToSandbox = !!(screenData && screenData.switchToSandbox);

    const getQrcodeData = (data) => {
        setQrcodeData(data);
        setIsQrCodeScaned(true);
    }

    const resetQRCode = () => {
        setQrcodeData(null);
        setIsQrCodeScaned(false);
    }

    return (
        <div style={{ marginTop: "-33px" }}>
            <div
                style={{
                    textAlign: "left",
                    width: "600px",
                    marginTop: "6px",
                    marginLeft: "20px",
                }}
                >
                <div style={{ paddingTop: "9px", marginRight: "180px" }}>
                    <label style={{ fontWeight: "450", color: "#18C2EE", fontSize: "1.8em" }}>
                        Test Account
                    </label>
                    <br />
                    <label style={{ fontSize: "1.3em" }}>
                        Recovery
                    </label>
                </div>
            </div>
            <div style={{margin:"0px 20px"}}>
                <div>
                    <Grid style={{marginTop:"20px"}}>
                        <Grid item>
                          {isQrCodeScaned ?
                            <DroppRecovery switchToSandbox={switchToSandbox} result={qrcodeData} isQrCodeScaned={isQrCodeScaned} setScreenWithData={setScreenWithData} resetQRCode={resetQRCode} />
                          :
                            <AccountRecover switchToSandbox={switchToSandbox} getQrcodeData={getQrcodeData} />
                          }
                        </Grid>
                    </Grid>
                </div>
            </div>
            <div className='footer'>
                <div className='backArrow'>
                    <ArrowBackOutlinedIcon onClick={() => setCurrentScreen("developerSettings")} style={{ cursor: "pointer", color: "#18C2EE" }} />
                </div>
            </div>
        </div>
    )
}

export default SandboxRecovery;