import React from "react";
import ArrowBackOutlinedIcon from '@material-ui/icons/ArrowBackOutlined';
import { makeStyles } from '@material-ui/core/styles';
import AccountBalanceOutlinedIcon from '@material-ui/icons/AccountBalanceOutlined';
import { isCrypto } from "../../utils/utils";

const useStyles = makeStyles((theme) => ({
  icon: {
    fontSize: "37px",
    width: "40px"
  }
}));

const FundAccount = ({ setCurrentScreen, setScreenWithData, userDetails }) => {
    const classes = useStyles();
    return (
        <div style={{marginTop:"-33px", width: "500px", textAlign: "center" }}>
            <div
                style={{
                    textAlign: "left",
                    width: "600px",
                    marginTop: "6px",
                    marginLeft: "20px",
                    marginBottom:"10px"
                }}>
                <div style={{ paddingTop: "9px", marginRight: "180px" }}>
                    <label style={{ fontWeight: "450", color: "#18C2EE", fontSize: "1.8em" }}>
                        FUND
                    </label>
                    <br/>
                    <label style={{fontSize: "1.3em" }}>
                        ACCOUNT
                    </label>
                </div>
            </div>



            { (["HBAR", "CARAT"].includes(userDetails.currency)) ?
            <>
              <table onClick={()=>setCurrentScreen("fundCrypto")} style={{cursor:"pointer", marginTop:"25px",marginLeft:"20px",marginRight:"20px",width:"297px",textAlign:"left"}}>
                <tr>
                  <td className={classes.icon}><img src="./fund-now.png"></img></td>
                  <td style={{fontSize:"1.25em", display:"inline-block", marginLeft:"9px"}}>
                    <tr style={{fontWeight:"750"}}>Deposit</tr>
                    <tr>Transfer {userDetails.currency} to your Dropp Account</tr>
                  </td>
                </tr>
              </table>
            {
              userDetails.currency == "CARAT" && <table onClick={() => setCurrentScreen("redeemCrypto")} style={{ cursor: "pointer", marginTop: "17px", marginLeft: "20px", marginRight: "20px", width: "297px", textAlign: "left" }}>
                <tr>
                  <td className={classes.icon}><img src="./history.png" /></td>
                  <td style={{ fontSize: "1.25em", display: "inline-block", marginLeft: "12px", width: "239px", wordBreak: "break-all" }}>
                    <tr style={{ fontWeight: "750" }}>Transfer Out</tr>
                    <tr style={{ wordBreak: "break-word" }}>Transfer your CARAT into another account</tr>
                  </td>
                </tr>
              </table>
            }
            </>
            :
              <>
                {(userDetails.currency == "USDC" && userDetails.operatorId == "0") ?
                  <>
                    <table onClick={()=>setCurrentScreen("transferUSDC")} style={{cursor:"pointer", marginTop:"17px",marginLeft:"20px",marginRight:"20px",width:"297px",textAlign:"left"}}>
                      <tr>
                        <td className={classes.icon}><img src="./fund-now.png" /></td>
                        <td style={{fontSize:"1.25em",display:"inline-block", marginLeft:"12px", width:"239px", wordBreak:"break-all"}}>
                          <tr style={{fontWeight:"750"}}>Deposit</tr>
                          <tr style={{wordBreak: "break-word"}}>Transfer USDC (Circle) from your external Wallet</tr>
                        </td>
                      </tr>
                    </table>

                    <table onClick={()=>setCurrentScreen("redeemCrypto")} style={{cursor:"pointer", marginTop:"17px",marginLeft:"20px",marginRight:"20px",width:"297px",textAlign:"left"}}>
                      <tr>
                        <td className={classes.icon}><img src="./history.png" /></td>
                        <td style={{fontSize:"1.25em",display:"inline-block", marginLeft:"12px", width:"239px", wordBreak:"break-all"}}>
                          <tr style={{fontWeight:"750"}}>Transfer Out</tr>
                          <tr style={{wordBreak: "break-word"}}>Transfer your USDC (Circle) into another account</tr>
                        </td>
                      </tr>
                    </table>
                  </>
                :
                  <table onClick={()=>setCurrentScreen("fundnow")} style={{cursor:"pointer", marginTop:"25px",marginLeft:"20px",marginRight:"20px",width:"297px",textAlign:"left"}}>
                    <tr>
                      <td className={classes.icon}><img src="./fund-now.png"></img></td>
                      <td style={{fontSize:"1.25em", display:"inline-block", marginLeft:"9px"}}>
                        <tr style={{fontWeight:"750"}}>Fund Now</tr>
                        <tr>Add funds to your Dropp wallet</tr>
                      </td>
                    </tr>
                  </table>
                }
              </>
            }

            {userDetails.currency == "USD" &&
              <div>
                <table onClick={()=>setCurrentScreen("fundingAccount")} style={{cursor:"pointer", marginTop:"17px",marginLeft:"20px",marginRight:"20px",width:"297px",textAlign:"left"}}>
                  <tr>
                    <td className={classes.icon}><AccountBalanceOutlinedIcon style={{fontSize:"2rem", opacity:"0.7"}}/></td>
                    <td style={{fontSize:"1.25em",display:"inline-block", marginLeft:"12px", width:"239px", wordBreak:"break-all"}}>
                      <tr style={{fontWeight:"750"}}>Funding Accounts</tr>
                      <tr>
                        Add or update bank account or credit
                        card used to fund your Dropp wallet.
                      </tr>
                    </td>
                  </tr>
                </table>
              </div>
            }

            {!isCrypto(userDetails.currency) &&
              <table onClick={()=>setCurrentScreen("fundinghistory")} style={{cursor:"pointer", marginTop:"17px",marginLeft:"20px",marginRight:"20px",width:"297px",textAlign:"left"}}>
                <tr>
                  <td className={classes.icon}><img src="./history.png"/></td>
                  <td style={{fontSize:"1.25em",display:"inline-block", marginLeft:"12px", width:"239px", wordBreak:"break-all"}}>
                    <tr style={{fontWeight:"750"}}>History</tr>
                    <tr>View funding and auto-replenishment history</tr>
                  </td>
                </tr>
              </table>
            }

              {(userDetails.currency == "USDC") &&
              <table onClick={()=>setCurrentScreen("usdcHistory")} style={{cursor:"pointer", marginTop:"17px",marginLeft:"20px",marginRight:"20px",width:"297px",textAlign:"left"}}>
                <tr>
                  <td className={classes.icon}><img src="./history.png"/></td>
                  <td style={{fontSize:"1.25em",display:"inline-block", marginLeft:"12px", width:"239px", wordBreak:"break-all"}}>
                    <tr style={{fontWeight:"750"}}>History</tr>
                    <tr>View funding history</tr>
                  </td>
                </tr>
              </table>}

            {(userDetails.currency == "USD" && userDetails.operatorName && userDetails.operatorName.toLowerCase().startsWith("dropp")) &&
              <table onClick={()=>setCurrentScreen("redeemnow")} style={{cursor:"pointer", marginTop:"17px",marginLeft:"20px",marginRight:"20px",width:"297px",textAlign:"left"}}>
                <tr>
                  <td className={classes.icon}><img src="./history.png"/></td>
                  <td style={{fontSize:"1.25em",display:"inline-block", marginLeft:"12px", width:"239px", wordBreak:"break-all"}}>
                    <tr style={{fontWeight:"750"}}>Redeem Now</tr>
                    <tr>Redeem your Dropp balance</tr>
                  </td>
                </tr>
              </table>}
            {(userDetails.currency == "HBAR" && userDetails.operatorId == "0") &&
              <table onClick={()=>setCurrentScreen("redeemCrypto")} style={{cursor:"pointer", marginTop:"17px",marginLeft:"20px",marginRight:"20px",width:"297px",textAlign:"left"}}>
                <tr>
                  <td className={classes.icon}><img src="./history.png"/></td>
                  <td style={{fontSize:"1.25em",display:"inline-block", marginLeft:"12px", width:"239px", wordBreak:"break-all"}}>
                    <tr style={{fontWeight:"750"}}>Transfer Now</tr>
                    <tr style={{wordBreak: "break-word"}}>Transfer your HBAR into another account</tr>
                  </td>
                </tr>
              </table>}

              {/* {(userDetails.currency == "USDC" && userDetails.operatorId == "0") &&
                <table style={{cursor:"pointer", marginTop:"17px",marginLeft:"20px",marginRight:"20px",width:"297px",textAlign:"left", opacity: 0.3}}>
                  <tr>
                    <td className={classes.icon}><img src="./fund-now.png"></img></td>
                    <td style={{fontSize:"1.25em",display:"inline-block", marginLeft:"12px", width:"239px", wordBreak:"break-all"}}>
                      <tr style={{fontWeight:"750"}}>Buy (Coming Soon)</tr>
                      <tr style={{wordBreak: "break-word"}}>Transfer USDC (Circle) to your Dropp Hedera Account</tr>
                    </td>
                  </tr>
                </table>} */}
            <div className="footer">
              <div className="backArrow backArrowOnly">
                <ArrowBackOutlinedIcon onClick={()=> setCurrentScreen("dashboard")} style={{cursor:"pointer",color:"#18C2EE"}}/>
              </div>
            </div>
        </div>
    );
};
export default FundAccount;
