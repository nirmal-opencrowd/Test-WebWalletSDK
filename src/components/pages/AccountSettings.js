import React from "react";
import PersonOutlineOutlinedIcon from '@material-ui/icons/PersonOutlineOutlined';
import LockOpenIcon from '@material-ui/icons/LockOpen';
import MailOutlineOutlinedIcon from '@material-ui/icons/MailOutlineOutlined';
import VpnKeyOutlinedIcon from '@material-ui/icons/VpnKeyOutlined';
import ArrowBackOutlinedIcon from '@material-ui/icons/ArrowBackOutlined';
import FavoriteBorderIcon from '@material-ui/icons/FavoriteBorder';
import InfoOutlinedIcon from '@material-ui/icons/InfoOutlined';
import SwapHorizontalCircleOutlinedIcon from '@material-ui/icons/SwapHorizontalCircleOutlined';
import CodeIcon from '@material-ui/icons/Code';
import { makeStyles } from '@material-ui/core/styles';
import classNames from "classnames";
import uiTexts from "./../../../configurations/dropp.json";

const pageTexts = uiTexts.accountsettings;

const useStyles = makeStyles((theme) => ({
  container: {
    paddingLeft:"20px",
    paddingRight:"20px",
    paddingTop: "10px",
    maxHeight:"650px",
    overflow:"scroll"
  },
  item: {
    cursor: "pointer",
    marginTop:"25px",
    textAlign:"left",
    width:"297px",
  },
  icon: {
    fontSize: "37px",
    width: "40px"
  }
}));

const AccountSettings = ({ setCurrentScreen, setScreenWithData }) => {
    const classes = useStyles();

    return (
      <div style={{marginTop:"40px"}}>
        {/* <div
          style={{
              textAlign: "left",
              marginTop: "6px",
              marginLeft: "20px",
              marginBottom: "10px"
        }}>
          <div style={{ paddingTop: "9px", width: "290px" }}>
              <label style={{ fontWeight: "450", color: "#18C2EE", fontSize: "1.8em" }}>
                  ACCOUNT
              </label>
              <br/>
              <label style={{fontSize: "1.3em" }}>
                  SETTINGS
              </label>
          </div>
        </div> */}

        <div className={classNames([classes.container, "hide-scrollbar"])}>
            <table onClick={()=> setScreenWithData ? setScreenWithData("profile", { fromScreen: "accountsettings" }) : setCurrentScreen("profile")} className={classes.item}>
              <tbody>
                <tr>
                  <td className={classes.icon}><img height="30px" width="30px"  src="/menuIcons/profileImage.png" alt="profile"/></td>
                  <td style={{fontSize:"1.25em", display:"inline-block", marginLeft:"9px"}}>
                    <div style={{fontWeight:"750"}}>{pageTexts.profileText}</div>
                    <div>{pageTexts.updateNameAndCurrMsg}</div>
                  </td>
                </tr>
              </tbody>
            </table>

            {/* <table onClick={()=>setCurrentScreen("favorites")} className={classes.item}>
              <tbody>
                <tr>
                  <td className={classes.icon}><FavoriteBorderIcon style={{color: "#7C7C7C", fontSize: "35px", marginLeft: "-5px"}} /></td>
                  <td style={{fontSize:"1.25em", display:"inline-block", marginLeft:"9px"}}>
                    <div style={{fontWeight:"750"}}>Favorites</div>
                    <div>List of Favorite Merchants</div>
                  </td>
                </tr>
              </tbody>
            </table> */}

            <table onClick={()=> setScreenWithData ? setScreenWithData("changepin", { fromScreen: "accountsettings" }) : setCurrentScreen("changepin")} className={classes.item}>
              <tbody>
                <tr>
                  <td className={classes.icon}><img height="30px" width="30px" src="/menuIcons/lock.square@4x@3x.png" alt="pin" /></td>
                  <td style={{fontSize:"1.25em",display:"inline-block", marginLeft:"12px"}}>
                    <div style={{fontWeight:"750"}}>{pageTexts.walletPinText}</div>
                    <div>{pageTexts.setOrChangeWalletPinText}</div>
                  </td>
                </tr>
              </tbody>
            </table>

            <table onClick={()=> setScreenWithData ? setScreenWithData("notifications", { fromScreen: "accountsettings" }) : setCurrentScreen("notifications")} className={classes.item}>
              <tbody>
                <tr>
                  <td className={classes.icon}><img src="./notification.png"/></td>
                  <td style={{fontSize:"1.25em",display:"inline-block", marginLeft:"9px", width:"239px"}}>
                    <div style={{fontWeight:"750"}}>{pageTexts.notificationText}</div>
                    <div>{pageTexts.customiseNotificationText}</div>
                  </td>
                </tr>
              </tbody>
            </table>

            {/* <table onClick={()=>setCurrentScreen("recovery")} className={classes.item}>
              <tbody>
                <tr>
                  <td className={classes.icon}><img src="./profile.png"/></td>
                  <td style={{fontSize:"1.25em", display:"inline-block", marginLeft:"9px"}}>
                    <div style={{fontWeight:"750"}}>Recovery</div>
                    <div></div>
                  </td>
                </tr>
              </tbody>
            </table> */}
            <table onClick={()=> setScreenWithData ? setScreenWithData("developerSettings", { fromScreen: "accountsettings" }) : setCurrentScreen("developerSettings")} className={classes.item}>
              <tbody>
                <tr>
                  {/* <td className={classes.icon}><img src="./profile.png"/></td> */}
                  <td className={classes.icon}><i style={{color: "#7C7C7C", fontSize: "35px", marginLeft: "-5px"}} className="fa fa-code" aria-hidden="true"></i></td>
                  <td style={{fontSize:"1.25em", display:"inline-block", marginLeft:"9px"}}>
                    <div style={{fontWeight:"750"}}>{pageTexts.developerOptionsText}</div>
                    <div>{pageTexts.enableDisableText}</div>
                  </td>
                </tr>
              </tbody>
            </table> 

            {/* <table onClick={()=>setCurrentScreen("about")} className={classes.item}>
              <tbody>
                <tr>
                  <td className={classes.icon}><InfoOutlinedIcon style={{color: "#7C7C7C", fontSize: "35px", marginLeft: "-5px"}} /></td>
                  <td style={{fontSize:"1.25em", display:"inline-block", marginLeft:"9px"}}>
                    <div style={{fontWeight:"750"}}>About</div>
                    <div>About Dropp</div>
                  </td>
                </tr>
              </tbody>
            </table> */}
        </div>
        {/* <div className="footer">
          <div className="backArrow ">
              <ArrowBackOutlinedIcon onClick={()=> setCurrentScreen("dashboard")} style={{cursor:"pointer",color:"#18C2EE"}}/>
          </div>
        </div> */}
    </div>
    );
};
export default AccountSettings;
