import React, { Component } from "react";
import { CircularProgress, Grid, Typography } from "@material-ui/core";
import { createTheme } from "@material-ui/core/styles";
import { ThemeProvider } from "@material-ui/styles";
import "./App.css";
import Routes from "./Routes.js";
import * as localstorage from "./utils/local-storage";
import * as api from "./api/index";
import NetworkConnection from "./components/NetworkConnection";
import { DEFAULT_IPQS_DEVICE_ID } from "./utils/constants";
import { droppConfig } from "./utils/utils";

const theme = createTheme({
    palette: {
        primary: {
            main: "#61dafb",
        },
    },
});

const App = () => {
    const [deviceId, setDeviceId] = React.useState(window.ipqsDeviceId);

    React.useEffect(() => {
        droppConfig();
    },[]);

    React.useEffect(()=> {
        window.ipqsDeviceId = DEFAULT_IPQS_DEVICE_ID; // Disable IPQS for now
        // async function setIPQS(tries) {
            // if (tries > 3) {
            //     return;
            // }
            // try {
            //     let localUserData = await localstorage.decrypted.get();
            //     let deviceInfo = localUserData && localUserData.deviceInfo ? localUserData.deviceInfo : {};
            //     if ((!deviceInfo.deviceId || deviceInfo.expiry < new Date().getTime())) {
            //         const existingScript = document.querySelectorAll(`script[src*="https://www.ipqualityscore.com/api/dropp.cc/3opnKlCCCA0JU49oLKKs8fTIMMZKF2gX8yvNNHBOUSWCqrGsphJwoivPALzraUZoYgkUaFRUc6KK9LDQ1vpYH2SOyOAgQV4zKH9Cp8NvCKJ4sJ7NA3W3DWxp2PGmsvu0wNqHiSDIeHAwGMU8yMFZWnCiDQW4BvDsDo6t88zeuHHUdt7BpbHSNWlsUxbcrgpMEDlKodaAwLp9tTkWjwUjzzlQP6DOmsUJacaflc4NzPaOZsYFi3enEifhgnJvpQ2A/learn.js"]`);
            //         if (existingScript && existingScript.length == 0) {
            //             let scriptElem = document.createElement("script");
            //             scriptElem.src = "https://www.ipqualityscore.com/api/dropp.cc/3opnKlCCCA0JU49oLKKs8fTIMMZKF2gX8yvNNHBOUSWCqrGsphJwoivPALzraUZoYgkUaFRUc6KK9LDQ1vpYH2SOyOAgQV4zKH9Cp8NvCKJ4sJ7NA3W3DWxp2PGmsvu0wNqHiSDIeHAwGMU8yMFZWnCiDQW4BvDsDo6t88zeuHHUdt7BpbHSNWlsUxbcrgpMEDlKodaAwLp9tTkWjwUjzzlQP6DOmsUJacaflc4NzPaOZsYFi3enEifhgnJvpQ2A/learn.js";
            //             scriptElem.crossOrigin = "anonymous";

            //             let noScriptElem = document.createElement("noscript");
            //             let imgElem = document.createElement("img");
            //             imgElem.src = "https://www.ipqualityscore.com/api/dropp.cc/3opnKlCCCA0JU49oLKKs8fTIMMZKF2gX8yvNNHBOUSWCqrGsphJwoivPALzraUZoYgkUaFRUc6KK9LDQ1vpYH2SOyOAgQV4zKH9Cp8NvCKJ4sJ7NA3W3DWxp2PGmsvu0wNqHiSDIeHAwGMU8yMFZWnCiDQW4BvDsDo6t88zeuHHUdt7BpbHSNWlsUxbcrgpMEDlKodaAwLp9tTkWjwUjzzlQP6DOmsUJacaflc4NzPaOZsYFi3enEifhgnJvpQ2A/pixel.png";
            //             noScriptElem.appendChild(imgElem);

            //             let pauseScriptElem = document.createElement("script");
            //             pauseScriptElem.innerHTML = `if (typeof Startup !== "undefined") {
            //                 Startup.Pause();
            //             }`;

            //             document.body.appendChild(scriptElem);
            //             document.body.appendChild(noScriptElem);
            //             document.body.appendChild(pauseScriptElem);
            //         }
            //         const intervalId = setInterval(() => {
            //             if (typeof window.Startup !== "undefined") {
            //                 if (intervalId) {
            //                     clearInterval(intervalId);
            //                 }
            //                 window.Startup.Init();
            //                 let setCustomVars = false;
            //                 if (deviceInfo.deviceId && deviceInfo.expiry < new Date().getTime()) {
            //                     setCustomVars = true;
            //                     window.Startup.Store('userID', localUserData.userId);
            //                     window.Startup.Store('deviceID', deviceInfo.deviceId);
            //                 }

            //                 window.Startup.AfterResult(function(res) {
            //                     if (res.device_id) {
            //                         window.ipqsDeviceId = res.device_id;
            //                         let currDate = new Date();
            //                         localUserData['deviceInfo'] = {
            //                             deviceId: res.device_id,
            //                             expiry: localUserData.userId && setCustomVars ? currDate.setSeconds(24 * 60 * 60) : currDate.getTime()
            //                         };
            //                         localstorage.decrypted.set(localUserData);
            //                         if (!deviceInfo.deviceId) {
            //                             window.location.reload();
            //                         }
            //                     } else {
            //                         setIPQS((tries + 1));
            //                     }
            //                 });
            //                 window.Startup.AfterFailure(function(reason) {
            //                     window.ipqsDeviceId = DEFAULT_IPQS_DEVICE_ID;
            //                     setIPQS((tries + 1));
            //                 });
            //                 window.Startup.Resume();
            //             }
            //         }, 100);
            //     } else if (localUserData && localUserData.deviceInfo && localUserData.deviceInfo.deviceId) {
            //         window.ipqsDeviceId = localUserData.deviceInfo.deviceId;
            //     }
            // } catch(e) {
            //     setIPQS((tries + 1));
            //     window.ipqsDeviceId = DEFAULT_IPQS_DEVICE_ID;
            // }
        // }

        // setIPQS(1);

        const interval = setInterval(() => {
            if (window.ipqsDeviceId && !deviceId) {
                setDeviceId(window.ipqsDeviceId);
                if (interval) {
                    clearInterval(interval);
                }
            }
           }, 100);
    }, [])
        return (
            deviceId ?
            <Grid container direction="column" className="App">
                <ThemeProvider theme={theme}>
                    <NetworkConnection/>
                    <Routes />
                </ThemeProvider>
            </Grid>
            :
            <Grid container direction="column" className="App">
                <NetworkConnection/>
                <div className="loader">
                    <CircularProgress color="inherit" />
                </div>
            </Grid>
        );

}

export default App;
