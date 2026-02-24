import React from "react";
import { Grid } from "@material-ui/core";
import CurrencyToggle from "./../CurrencyToggle";
import * as localstorage from "../../utils/local-storage";
import ArrowBackOutlinedIcon from '@material-ui/icons/ArrowBackOutlined';
import * as api from "./../../api";
import Divider from '@material-ui/core/Divider';
import { displayAmount } from "../../utils/utils";
import getSymbolFromCurrency from 'currency-symbol-map';

/* global chrome */
const FundingHistory =( {setCurrentScreen}) => {
  const [shareURL, setShareURL] = React.useState();
  const [purchaseURL, setPurchaseURL] = React.useState();
  const [params, setParams] = React.useState({});
  const [history, setHistory] = React.useState([]);
  const [userDetails, setUserDetails] = React.useState({});
  const [noRecords, setNoRecords] = React.useState(null);

    React.useEffect(() => {
        async function fetchReplenishHistory() {
            let replenishHistoryDetails = await api.fetchReplenishHistory();
            replenishHistoryDetails.data.sort(
                (a, b) =>
                    parseFloat(b.creationTimeInEpochSec) - parseFloat(a.creationTimeInEpochSec)
            );
            setHistory(replenishHistoryDetails.data);
            setNoRecords(!(replenishHistoryDetails && replenishHistoryDetails.data && replenishHistoryDetails.data.length > 0))
        }
        fetchReplenishHistory();

        async function fetchUserDetails() {
            let userDetailsLocal = await api.fetchUserDetails();
            setUserDetails(userDetailsLocal.data);

        }
        fetchUserDetails();

    }, []);



    return (

          <div style={{marginTop:"-33px"}}>
              <div
                  style={{
                      textAlign: "left",
                      width: "600px",
                      marginTop: "6px",
                      marginLeft: "20px",
                      marginBottom: "10px"
                  }}>
                  <div style={{ paddingTop: "9px", marginRight: "180px" }}>
                      <label style={{ fontWeight: "450", color: "#18C2EE", fontSize: "1.8em" }}>
                          FUNDING
                      </label>
                      <br/>
                      <label style={{fontSize: "1.3em" }}>
                          HISTORY
                      </label>
                  </div>
              </div>
              <div className="hide-scrollbar" style={{marginTop:"10px", maxHeight:"452px", minHeight: "400px", overflowY:"scroll"}}>
              {(noRecords != null && noRecords) ?
                <div style={{width: "100%", margin: "200px auto", textAlign: "center"}}>
                  No Record Found
                </div>
              :
                <>
                  {history.map((data, key) => {
                    return (
                      <div>
                        <div style={{float:"left", marginBottom:"-9px"}}>
                          <h3 style={{fontWeight:"unset", fontSize:"1.25em", wordBreak:"break-word",width:"220px",marginLeft:"20px",float:"left"}}>
                              {new Date(
                                data.creationTimeInEpochSec * 1000
                            ).toLocaleDateString()}
                          </h3>
                          <div style={{float:"right",marginTop:"13px"}}>
                            <span
                                style={{
                                    fontSize: "1.25em",
                                    fontWeight: "500",
                                }}>
                                {data.replenishType == "REDEEM" ?
                                  <>
                                    ({getSymbolFromCurrency(data.currency)}{displayAmount(data.amount)})
                                  </>
                                :
                                  <>
                                    {getSymbolFromCurrency(data.currency)}{displayAmount(data.amount)}
                                  </>
                                }

                            </span>
                          </div>
                        </div>

                        <div style={{clear: "both", marginTop:"5px", marginLeft:"20px",marginRight:"20px"}}>
                          {/* {data.paymentType == "AUTOREPLENISHMENT" ? (<p style={{fontSize:"1.2em"}}>Automatic Replenishment</p>) :
                          (<p style={{fontSize:"1.2em"}}>Funds added to Dropp account</p>)} */}
                          <p style={{fontSize: "1.2em"}}>{data.message}</p>
                      </div>
                      <div style={{marginTop:"5px", marginLeft:"20px",marginRight:"20px"}}>
                        {(data.replenishType != "REFERRAL") && (
                          <>
                            {(data.replenishType == "CARDMANUAL" || data.replenishType == "CARDAUTO") ?
                              <p style={{fontSize:"1.2em"}}>Credit Card (....{data.lastFourDigits})</p>
                            :
                              <p style={{fontSize:"1.2em"}}>Bank Account (....{data.lastFourDigits})</p>
                            }
                          </>
                        )}

                      </div>
                      <Divider style={{ marginLeft:"20px", marginRight:"20px", marginBottom:"-7px", marginTop:"12px"}}/>
                    </div>
                    );
                  })}
                </>
              }
              </div>
              <div className="footer">
                <div className="backArrow">
                  <ArrowBackOutlinedIcon onClick={()=> setCurrentScreen("fundaccount")} style={{cursor:"pointer",color:"#18C2EE"}}/>
                </div>
              </div>
          </div>


    );
};

export default FundingHistory;
