import React, {useState} from "react";
import { Grid, Typography } from "@material-ui/core";
import * as localstorage from "./../utils/local-storage";
import * as api from "./../api";
import { getQueryParams, hederaAccountToString, droppConfig } from "../utils/utils";
import TestModeText from "./TestModeText";
import { getSdkError } from "@walletconnect/utils";
// import Loader from "./Loader";
// import { CheckBox } from "@material-ui/icons";
// import { WalletConnector } from '@hashgraph/hedera-wallet-connect';
// import WalletConnectSigner from "./../helpers/walletSigner";

/* global chrome */

const WCApproval = ({ setCurrentScreen, responseCallback, merchantTxnBody = {} }) => {
    const [userDetails, setUserDetails] = React.useState({});
    const [signatures, setSignatures] = React.useState({});
    const [userSuspendedErr, setUserSuspendedErr] = React.useState(null);
    const queryParams = getQueryParams(window.location.href, true);
    const [merchantTx, setMerchantTx] = React.useState(queryParams);
    const [proposerDetails, setProposerDetails] = useState(JSON.parse(queryParams.proposerDetails));
    // const [uri, setUri] = useState("");
    const [proposerId, setProposerId] = useState(queryParams.proposerId);
    const [requiredNamespaces, setRequiredNamespaces] = useState(JSON.parse(queryParams.requiredNamespaces));
    const [proposal, setProposal] = useState(queryParams.proposal);
    const [testModeActive, setTestModeActive] = React.useState(false);

    React.useEffect(() => {
        const testMode = async () => {
            let userData = await localstorage.decrypted.get();
            if (userData && userData.activeNetwork === "test") {
                setTestModeActive(true);
            }
        }
        testMode();
    }, [])


    React.useEffect(() => {
      // async function walletConnection () {
      //   try {
      //     const ProposalCallback = (res) => {
      //       if (res && res.params && res.params.proposer);
      //       setProposerId(res.id);
      //       setProposerDetails(res.params.proposer);
      //       setRequiredNamespaces(res.params.requiredNamespaces);
      //     };

      //     try {
      //       await walletConnecter.init(ProposalCallback);
      //     } catch(error) {
      //     }

      //     try {
      //       const pairingResult = await walletConnecter.client.pair({uri : `${merchantTx.uri}&symKey=${merchantTx.symKey}`});
      //     }catch(error) {
      //     }
      //   } catch (error) {
      //   }
      // }

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
      // Promise.all([fetchUserDetails(), getSignatures(), droppConfig(), walletConnection()]);
      Promise.all([fetchUserDetails(), getSignatures(), droppConfig()]);
    }, []);

    const approve = async () => {
      chrome.runtime.sendMessage({
        type: "WCApprovalResponse",
        request: {proposerId: parseInt(proposerId, 10), proposal: proposal, requiredNamespaces: JSON.stringify(requiredNamespaces), proposerDetails: JSON.stringify(proposerDetails), accountId: hederaAccountToString(userDetails.hhAccount), publicKey: signatures.publicKey}
      });
      setTimeout(() => {
        window.close();
      }, 1000);
    };

    const reject = async () => {
      chrome.runtime.sendMessage({
        type: "WCApprovalResponse",
        request: {id: parseInt(proposerId, 10), reason: getSdkError('USER_REJECTED_METHODS')}
      });
      setTimeout(() => {
        window.close();
      }, 1000);
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

    const siteUrl = showHostName(proposerDetails && proposerDetails.metadata ? proposerDetails.metadata.url : "");
    const renderGetConfirmation = () => {
        return (
            <React.Fragment>
                <Grid container direction="column" style={{ padding: "0.25em 1em 1em 1em" }}>
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
                            <div style={{backgroundColor: "#DEF8FF", fontWeight: 600, marginTop: "30px", padding: "15px 40px"}}>
                                <span>
                                  Dropp Account ID ({hederaAccountToString(userDetails.hhAccount)})
                                </span>
                            </div>
                          </div>
                        </Grid>


                        <div className={testModeActive ? "footer" : ""} style={testModeActive ? {height:"100px"}: {position: "fixed", bottom: "60px", right: 0, textAlign: "center", margin: "0 auto", width: "100%", borderBottom: "1px solid #ccc"}}>
                            <Grid container item direction="row" justifyContent="center">
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
                                  <button style={{marginRight: "10px",width: testModeActive ? "160px" : "145px"}} className="button-cancel" onClick={reject}>
                                      Reject
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
                        <TestModeText testModeActive = {testModeActive}/>
                    </Grid>
                  : ""}
                </>
            }
        </>
    );
};

export default WCApproval;
