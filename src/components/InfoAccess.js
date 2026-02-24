import React from "react";
import { Grid, Typography } from "@material-ui/core";
import * as localstorage from "./../utils/local-storage";
import * as api from "./../api";
import { getQueryParams, hederaAccountToString, droppConfig, updateBadgeText } from "../utils/utils";
import Loader from "./Loader";
import { CheckBox } from "@material-ui/icons";
import TestModeText from "./TestModeText";

const InfoAccess = ({ setCurrentScreen, responseCallback, merchantTxnBody = {} }) => {
    const [userDetails, setUserDetails] = React.useState({});
    const [signatures, setSignatures] = React.useState({});
    const [userSuspendedErr, setUserSuspendedErr] = React.useState(null);
    const [merchantTx, setMerchantTx] = React.useState(getQueryParams(window.location.href));
    const [testModeActive, setTestModeActive] = React.useState(false);

    React.useState(() => {
      async function fetchTestMode() {
          let userData = await localstorage.decrypted.get();
          if (userData && userData.activeNetwork === "test") {
          setTestModeActive(true);
          }
      }
      fetchTestMode();
  }, [])

    React.useEffect(() => {
      async function fetchUserDetails() {
          let userDetailsLocal = await api.fetchUserDetails(true);
          if (userDetailsLocal && userDetailsLocal.data) {
              setUserDetails(userDetailsLocal.data);
              if(typeof window.Startup !== "undefined" && !window.droppUserId) {
                window.droppUserId = userDetailsLocal.data.userId;
                window.Startup.Store('userID', userDetailsLocal.data.userId);
              }
          } else if (userDetailsLocal.responseCode != 0) {
            setUserSuspendedErr((userDetailsLocal.errors && userDetailsLocal.errors.length) ? userDetailsLocal.errors[0] : "Something went wrong!!");
          }
      }

      async function getSignatures() {
          let signatures = await localstorage._get("_decrypted");
          setSignatures(signatures._decrypted);
      }
      Promise.all([fetchUserDetails(), getSignatures(), droppConfig()]);
    }, []);

    const approve = async () => {
        let ptp = {
          hederaAccount: hederaAccountToString(userDetails.hhAccount),
          publicKey: signatures.publicKey
        };
        if (merchantTx.url) {
          ptp['url'] = merchantTx.url;
        }
        if (merchantTx.tabId) {
          ptp['tabId'] = merchantTx.tabId;
        }
        let views = chrome.extension.getViews({ type: "popup" });
        if (views && views.length === 0) {
            chrome.runtime.sendMessage({
                type: "approveAccess",
                ptp: ptp,
            });
            updateBadgeText();
            window.close();
        } else {
            updateBadgeText();
            responseCallback({ ptp });
            window.close();
        }
    };

    const cancel = () => {
        let views = chrome.extension.getViews({ type: "popup" });
        if (views && views.length === 0) {
            window.close();
            updateBadgeText();
        } else {
            setCurrentScreen("dashboard");
            updateBadgeText()
        }
    };

    const showEncryptAccount = () => {
      let accNo = userDetails.hhAccount.accountNumber.toString();
      let totalChars = accNo.length;
      accNo = accNo.slice(0, Math.floor(totalChars / 2));
      for (let i = 0; i < Math.floor(totalChars / 2); i++) {
        accNo += "X";
      }
      return [userDetails.hhAccount.realm, userDetails.hhAccount.shard, accNo].join(".");
    };

    const showHostName = (siteUrl) => {
      let url = {};
      try {
        url = new URL(siteUrl);
      } catch (err) {
        url = {};
      }
      return url.host ? url.host : "";
    };

    const siteUrl = showHostName(merchantTx.siteUrl);
    const renderGetConfirmation = () => {
        return (
            <React.Fragment>
              <div style={{maxHeight:"500px", overflow:"scroll"}}>
                <Grid container direction="column" style={{ padding: "0.25em 1em 1em 1em" }}>
                    {/* {merchantTx.siteUrl ?
                      <Grid container item justifyContent="center">
                          <Grid item>
                            <div style={{width: "100%", padding: "10px", border: "1px solid #ccc", borderRadius: "15px", marginBottom: "25px"}}>
                              <div>
                                {merchantTx.faviconUrl ? <span style={{verticalAlign: "middle"}}><img style={{verticalAlign: "middle"}} src={merchantTx.faviconUrl} /></span> : ""}
                                <span style={{verticalAlign: "middle"}}>{merchantTx.faviconUrl ? " | " : ""}{ merchantTx.siteUrl}</span>
                              </div>
                            </div>
                          </Grid>
                      </Grid>
                    : ""} */}
                    {siteUrl ?
                      <Grid container item justifyContent="center">
                          <Grid item>
                            <div style={{fontSize: "1.25em", fontWeight: 600, marginBottom: "25px", padding: "10px", width: "100%"}}>
                              <div>
                                <span style={{verticalAlign: "middle"}}>{siteUrl}</span>
                              </div>
                            </div>
                          </Grid>
                      </Grid>
                    : ""}

                    <Grid container item justifyContent="center" style={{textAlign: "center"}}>
                        <Grid item>
                            <Typography variant="h6" style={{fontWeight: 600}}>
                              Share info with this site?
                            </Typography>
                            <p style={{
                              lineHeight: "20px",
                              margin: "10px 20px",
                              fontSize: "1.25em",
                            }}>
                              Clicking "Approve" grants the site access to view only your Dropp Account ID.
                            </p>
                        </Grid>
                        <Grid item>
                          <div>
                            <div style={{backgroundColor: "#ccf5ff", fontWeight: 600, marginTop: "30px", padding: "15px 40px"}}>
                                <span>
                                  Dropp Account ID ({hederaAccountToString(userDetails.hhAccount)})
                                </span>
                            </div>
                          </div>
                        </Grid>

                        <div className={testModeActive ? "footer" : ""} style={testModeActive ? {height:"100px"}: {position: "fixed", bottom: "60px", right: 0, textAlign: "center", margin: "0 auto", width: "100%"}}>
                          <Grid container item direction="row" justifyContent="center" style={{borderBottom: "1px solid #ccc"}}>
                              <Grid item>
                                  <p style={{
                                    lineHeight: "20px",
                                    margin: "10px 0",
                                    fontSize: "1.25em",
                                  }}>
                                    Only connect with sites you trust.
                                  </p>
                              </Grid>
                          </Grid>
                          <Grid container item direction="row" style={testModeActive ? {marginTop:"10px"} : {position:"fixed",bottom:"14px",right:"20px", width:"89%"}} >
                              <Grid item>
                                  <button style={{marginRight: "10px",width: testModeActive ? "160px" : "145px"}} className="button-cancel" onClick={cancel}>
                                      CANCEL
                                  </button>
                              </Grid>
                              <Grid item>
                                <button
                                    style={{
                                        marginRight: "5px",
                                        marginBottom: "5px",
                                        width:testModeActive ? "160px" : "145px"
                                    }}
                                    className="button-done"
                                    onClick={approve}
                                    >
                                    Approve
                                </button>
                              </Grid>
                          </Grid>
                        </div>
                    </Grid>
                </Grid>
              </div>
              <TestModeText testModeActive={testModeActive} />
            </React.Fragment>
        );
    };

    const renderErrorText = text => {
        return (
            <h3
                style={{
                    marginLeft: "70px",
                    fontWeight: "bold",
                    color: "#18C2EE",
                    fontSize: "26px",
                }}>
                {text}
            </h3>
        );
    };

    return (
        <>
            {userSuspendedErr ?
                <Grid container justifyContent={"center"} alignItems={"center"}>
                    <Grid item style={{marginTop: "50%", padding: "1em"}}>
                        {userSuspendedErr}
                    </Grid>
                </Grid>
            :
                <>
                  {userDetails && userDetails.hhAccount ?
                    <Grid
                        container
                        item
                        direction="column"
                        style={{
                            textAlign: "left",
                            justifyContent: "end",
                    }}>
                        {chrome.extension.getViews({ type: "popup" }).length === 0 && (
                            <Grid item style={{textAlign: "center", marginBottom: "25px"}}>
                                <img
                                    style={{ cursor: "pointer", padding: "1em" }}
                                    height="50"
                                    width="120"
                                    src="./dropp_logo.png"
                                />
                            </Grid>
                        )}
                        {renderGetConfirmation()}
                    </Grid>
                  : ""}
                </>
            }
        </>
    );
};

export default InfoAccess;
