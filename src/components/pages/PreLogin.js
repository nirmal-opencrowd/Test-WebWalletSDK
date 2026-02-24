import React from "react";
import { Grid } from "@material-ui/core";
import GettingStarted from './GettingStarted';
import EnvOptions from './EnvOptions';
import MagicLinkRecovery from './MagicLinkRecovery';
import { devEnvConst, qaEnvConst, sandboxEnvConst } from "../../utils/constants";
import { getENV, getReactAppEnv } from "./../../utils/utils";

let userEnv = ''

/* global chrome */
const PreLogin = ({ merchantTxn, forceUpdate  }) => {
    const [clicks, setClicks] = React.useState(0);
    const [showEnvSettings, setShowEnvSettings] = React.useState(false);
    const [isQrCodeScaned, setIsQrCodeScaned] = React.useState(false);
    const [savedENV, setSavedENV] = React.useState("");
    //// Remove New tab and Added it to popup.
    const openNewTab = () => {
        // const baseUrl = chrome.runtime.getURL("index.html");
        // chrome.tabs.create({ url: `${baseUrl}#/gettingStarted` });
        // if (merchantTxn && !merchantTxn.isLoggedIn) {
        //     window.close();
        // }
    };

    let intervalClickFunc = null;

    React.useEffect(() => {
        async function updateAPIEnv() {
            const envData = await getENV();
            if ((!(envData && envData.env)) && process.env && process.env.REACT_APP_ENV_SET) {
                setEnv(process.env.REACT_APP_ENV_SET);
                setSavedENV(process.env.REACT_APP_ENV_SET);
                setLink();
            } else if (envData && envData.env) {
                setSavedENV(getReactAppEnv(envData.env));
            }
        }
        updateAPIEnv();
    }, []);

    const setEnv = (env) => {
        if (env === sandboxEnvConst) {
            userEnv = "sandbox";
        } else if (env === devEnvConst) {
            userEnv = "testnet";
        } else if (env === qaEnvConst) {
            userEnv = "qa";
        } else {
            userEnv = "mainnet";
        }
    };

    const setLink = () => {
        chrome.runtime.sendMessage(
            { type: "link", env: userEnv },
            function (response) {}
        );
    };

    const hideLogo = () => {
        setIsQrCodeScaned(true);
    }

    const checkClickEvent = () => {
        clearInterval(intervalClickFunc);
        if(clicks + 1 >= 5 ) {
           setShowEnvSettings(true);
        } else {
            setClicks(clicks + 1);
            intervalClickFunc = setInterval(() => setClicks(0), 10000);
        }
    }

    const hideEnvSettings = (env) => {
        setShowEnvSettings(false);
        setEnv(env);
        setLink();
    }

    return (
        <Grid
            container
            item
            direction="column"
            alignItems="center"
            style={{
                paddingTop: "10px",
                textAlign: "center",
                justifyContent: "end",
            }}>
            {/* { !isQrCodeScaned ? */}
                <>
                    <Grid item>
                        <img height="40" src="./dropp_logo.png" alt="logo" style={{pointerEvents: "all"}} />
                    </Grid>
                </>
            {/* : '' } */}
            {/* <Grid item>
                <div>
                    <button className="button-done" onClick={openNewTab}>
                        GET STARTED
                    </button>
                </div>
            </Grid> */}
            <Grid item style={{ textAlign: "center" }}>
                { showEnvSettings
                    ?  <EnvOptions hideEnvSettings={hideEnvSettings} savedENV={savedENV} />
                    : <MagicLinkRecovery hideLogo={hideLogo} />
                    // <GettingStarted forceUpdate={forceUpdate} hideLogo={hideLogo} />
                }

            </Grid>
        </Grid>
    );
};

export default PreLogin;
