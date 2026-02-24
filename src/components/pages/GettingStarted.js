import React from "react";
import PropTypes from "prop-types";
import { useHistory } from "react-router-dom";
import { isSafari, isFirefox } from "./../../utils/utils";
import AccountRecover from './AccountRecover';
import DroppRecovery from './DroppRecovery';
import uiTexts from "./../../../configurations/dropp.json";
import { makeStyles } from "@material-ui/core/styles";



import {
    Grid,
    Typography
} from "@material-ui/core";

/* global chrome */

const useStyles = makeStyles(theme => ({
    customGridPadding: {
        padding: "1em 1em 0 1.4em",
    },
    phoneInputContainer: {
        marginTop: "16px",
        marginBottom: "16px",
        width: "100%",
        "& .form-control": {
            width: "100%",
        },
    },
    popupOverlay: {
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: "rgba(0,0,0,0.5)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 9999,
    },
    popupBox: {
        background: "#fff",
        padding: "20px 30px",
        borderRadius: "8px",
        width: "320px",
        textAlign: "center",
    },
    popupButton: {
        background: "#18c2ee",
        color: "#fff",
        padding: "8px 20px",
        borderRadius: "6px",
        border: "none",
        cursor: "pointer",
        fontFamily: "'Poppins', sans-serif",
    },
    errorText: {
        color: "red",
        marginTop: "10px",
    },
    dotBlue: {
        width: 12,
        height: 12,
        borderRadius: 6,
        background: '#18c2ee',
        display: 'inline-block',
        marginRight: 8,
        verticalAlign: 'middle'
    },
    heading: {
        fontSize: '28px',
        fontWeight: 800,
        marginBottom: '6px',
        textAlign: 'left'
    },
    subHeading: {
        color: '#333333',
        fontSize: '14px',
        marginBottom: '18px',
        textAlign: 'left'
    },
    continueButton: {
        background: '#18c2ee',
        color: '#fff',
        borderRadius: 24,
        padding: '12px 24px',
        width: '100%',
        maxWidth: 420,
        fontWeight: 700,
        border: 'none',
        cursor: 'pointer'
    },
    primaryButton: {
        background: '#18c2ee',
        color: '#fff',
        borderRadius: 24,
        padding: '12px 24px',
        width: '100%',
        maxWidth: 420,
        fontWeight: 700,
        border: 'none',
        cursor: 'pointer'
    },
    outlineButton: {
        background: '#fff',
        color: '#18c2ee',
        borderRadius: 24,
        padding: '12px 24px',
        width: '100%',
        maxWidth: 420,
        fontWeight: 700,
        border: '2px solid #18c2ee',
        cursor: 'pointer'
    },
    orDivider: {
        display: 'flex',
        alignItems: 'center',
        width: '100%',
        maxWidth: 420,
        margin: '18px auto'
    },
    orLine: {
        flex: 1,
        height: 1,
        background: '#e6e6e6'
    },
    orText: {
        margin: '0 12px',
        color: '#777777',
        fontWeight: 600
    },
    subTextLeft: {
        textAlign: 'left',
        marginBottom: 12,
        color: '#333333',
        fontSize: '14px'
    },
    backButton: {
        cursor: "pointer"
    },
    logo: {
        pointerEvents: "all"
    },
    headingText: {
        fontSize: "16px",
        marginTop: "6px",
        textAlign: "center"
    },
    labelText: {
        fontSize: "14px",
        margin: "10px",
        marginBottom: "1em",
        textAlign: "center"
    },
    centerDiv: {
        margin: '8px',
        textAlign: 'center'
    },
    centerSpan: {
        margin: '10px',
        textAlign: 'center'
    },
    buttonFont: {
        fontSize: '12px'
    },
    centerItem: {
        textAlign: "center"
    }
}));

const GettingStarted = (props) => {
    const [qrcodeData, setQrcodeData] = React.useState(null);
    const [isQrCodeScaned, setIsQrCodeScaned] = React.useState(false);
    const [isQrCodeUpload, setIsQrCodeUpload] = React.useState(false);
      const history = useHistory();
    const classes = useStyles();

    //   console.log("location:", props.location);
    //   console.log("location state in getting started:", location);
    // const forType = (location && location.state && location.state['for']) ? location.state['for'] : "Mobile";
    const switchToSandbox = props.screenData && props.screenData.switchToSandbox ? props.screenData.switchToSandbox : false;

    const pageTexts = uiTexts.gettingStarted;

    const getQrcodeData = (data) => {
        setQrcodeData(data);
        setIsQrCodeScaned(true);
        props.hideLogo();
    }

    const resetQRCode = () => {
        setQrcodeData(null);
        setIsQrCodeScaned(false);
        setIsQrCodeUpload(false);
    }

    const goTODroppRecovery = () => {
        if (isFirefox() || isSafari()) {
            const baseUrl = chrome.runtime.getURL("index.html");
            chrome.tabs.create({ url: `${baseUrl}#/dropprecovery` });
            window.close();
        } else {
            setIsQrCodeUpload(true);
            props.hideLogo();
        }
    }

const goToMagicLinkRecovery = () => {
  try {
    console.log("Navigating to Magic Link Recovery", history.push("/magiclinkrecovery?from=gettingStarted"));
    history.push("/magiclinkrecovery?from=gettingStarted");
  } catch (error) {
    console.error("Error navigating to Magic Link Recovery:", error);
  }
};

    // const getAppDownloadUrl = (url) => {
    //     chrome.runtime.sendMessage({
    //         type: "openInNewTab",
    //         request: {url: url},
    //     });
    // }

    return ( <>
        { (!isQrCodeScaned && !isQrCodeUpload) ?
            <Grid>
                <Grid item xs={12}>
                    <img
                        src="./arrowBack.png"
                        alt="back"
                        onClick={goToMagicLinkRecovery}
                        className={classes.backButton}
                    />
                </Grid>
                
                <Grid item>
                    <Grid>
                            <Grid item className={classes.centerItem}>
                                <img height="40" src="./dropp_logo.png" alt="logo"
                                    className={classes.logo}
                                    />
                            </Grid> 
                        <Grid item>
                            <Typography className={classes.headingText}>
                                {pageTexts.heading}
                            </Typography>
                        </Grid>
                    </Grid>

            <Grid>
            <Grid item>
                            <AccountRecover switchToSandbox={switchToSandbox} getQrcodeData={getQrcodeData} forceUpdate={props.forceUpdate}/>
            </Grid>
            </Grid>

                    {/* <Grid>
                        <Grid item>
                            <Typography style={{ fontSize: "16px", marginTop: "10px", marginBottom: "10px", textAlign: "center", }}>
                                OR
                            </Typography>
                        </Grid>
                    </Grid> */}

                            {/* <Grid>
                                <Grid item className={classes.centerItem}>
                                    <label htmlFor="fname" className={`${classes.labelText} select-action__button-text-small`} > Use recovery file to link your account</label>
                                    <div className={classes.centerDiv}>
                                        <span className={classes.centerSpan}>
                                            <button className={`button-done ${classes.buttonFont}`} onClick={goTODroppRecovery}>DROPP RECOVERY</button>
                                        </span>
                                    </div>
                                </Grid>
                            </Grid> */}
                        {/* <Grid>
                            <Grid item>
                                <Typography style={{ fontSize: "16px", marginTop: "10px", marginBottom: "10px", textAlign: "center", }}>
                                    OR
                                </Typography>
                            </Grid>
                        </Grid>
                        <Grid item>
                                <Typography style={{ fontSize: "14px", marginTop: "10px", textAlign: "center",cursor:"pointer", color:"#18C2EE", }}
                                    onClick={goToMagicLinkRecovery}>
                                {pageTexts.magicLinkText}
                                </Typography>
                        </Grid> */}
                </Grid>

                {/* <Grid item style={{paddingTop: "10px"}}>
                    <Grid>
                        <Grid item>
                            <Typography style={{ fontSize: "16px", marginTop: "10px", marginBottom: "10px", textAlign: "center", }}>
                                {pageTexts.subHeading}
                            </Typography>
                        </Grid>
                    </Grid>

                    <Grid>
                        <Grid item>
                            <label htmlFor="fname" style={{ fontSize: "14px", margin: "10px", textAlign: "center"}}
                                    className="select-action__button-text-small" > Download the Dropp mobile wallet to create an account</label>
                            <div style={{margin: '8px', textAlign: 'center'}}>
                                {!isSafari() && <span onClick={() => getAppDownloadUrl("https://play.google.com/store/apps/details?id=cc.dropp.wallet")} ><img height="35px" style={{ marginRight: "20px",cursor:"pointer" }} src = "./android-icon.png"/></span>}
                                <span onClick={() => getAppDownloadUrl("https://apps.apple.com/app/dropp-cc/id1544894404")}><img height="35px" style={{ cursor:"pointer" }} src = "./apple-icon.png"/></span>
                            </div>
                        </Grid>
                    </Grid>
                </Grid> */}
            </Grid>

        : <DroppRecovery switchToSandbox={switchToSandbox} result={qrcodeData} isQrCodeScaned={isQrCodeScaned} resetQRCode={resetQRCode} forceUpdate={props.forceUpdate} {...props}  />
        }
        {/* <div className="gettingStarted">
            <div className="select-action__body">
                <div style={{ fontSize: "30px", marginTop: "60px", marginBottom: "60px" }}>
                    <label>
                        Welcome to <b>DROPP</b>
                    </label>
                </div>
                <div className="select-action__select-buttons">
                    <div style = {{width:"300px" , height: "500px"}} className="select-action__select-button">
                        <div
                            style={{ marginTop: "-35px" }}
                            className="select-action__button-content">
                            <div style={{ fontSize: "20px" }}>I have an account</div>
                            <div
                                style={{ marginTop: "16px", fontSize: "14px" }}
                                className="select-action__button-text-small">
                                Please scan the QR from your Dropp Mobile app
                            </div>
                            <AccountRecover forceUpdate={props.forceUpdate}/>
                            <div
                                style={{ marginTop: "16px", fontSize: "14px" }}
                                className="select-action__button-text-small">
                                Use recovery file to link your account
                            </div>
                        </div>
                        <div style={{ marginTop: "-70px" }}>
                        <Link to="/dropprecovery" style={{ float:"left" , marginRight:"20px"}}>
                            <button className="button-done">DROPP RECOVERY</button>
                        </Link>
                        <Link to="/advancedhbarrecovery" >
                            <button className="button-done" style={{"backgroundColor": "#e9f2f5", "border": "2px solid #e9f2f5"}} disabled>ADVANCED HBAR RECOVERY</button>
                        </Link>
                        </div>
                    </div>
                    <div style={{marginRight:"20px"}}className="select-action__select-button">
                        <div
                            style={{ marginTop: "-29px" }}
                            className="select-action__button-content">
                            <div style={{ fontSize: "20px" }}>I need an account</div>
                            <div
                                style={{ marginTop: "16px", fontSize: "14px" }}
                                className="select-action__button-text-small">
                                Download the Dropp mobile wallet to create an account
                            </div>
                        </div>
                        <div  style={{ marginTop: "-68px" }}>
                          {!isSafari() && <a href="https://play.google.com/apps/internaltest/4700139186887334223"><img height="35px" style={{ marginRight: "20px",cursor:"pointer" }} src = "./android-icon.png"/></a>}
                          <a href="https://apps.apple.com/app/dropp-cc/id1544894404"><img height="35px" style={{ cursor:"pointer" }} src = "./apple-icon.png"/></a>
                        </div>
                    </div>
                </div>
                <div>
                    <img
                        style={{ marginTop: "100px" }}
                        height="60"
                        src="./dropp_logo.png"
                        className="">
                    </img>
                </div>
            </div>


        </div> */}
        </>
    );
};

export default GettingStarted;
