import React from "react";
import ArrowBackOutlinedIcon from '@material-ui/icons/ArrowBackOutlined';
import { makeStyles } from '@material-ui/core/styles';
import classNames from "classnames";
import { Typography } from "@material-ui/core";

const useStyles = makeStyles((theme) => ({
  container: {
    paddingLeft:"20px",
    paddingRight:"20px",
    paddingTop: "10px",
    maxHeight:"640px",
    overflowY:"scroll"
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
  },
  greyBackground: {
    backgroundColor: "#f9f9f9",
    borderRadius: "10px",
    height: "fit-content",
    margin: "100 auto 10",
    padding: "10px 20px",
    textAlign: "left",
    width: "80%",
  },
}));

const WalletConnect = ({ setCurrentScreen }) => {
  
    const classes = useStyles();

    return (
      <div style={{marginTop:"-33px"}}>
        <div
          style={{
              textAlign: "left",
              marginTop: "6px",
              marginLeft: "20px",
              marginBottom: "10px"
        }}>
          <div style={{ paddingTop: "9px", width: "290px" }}>
              <label style={{ fontWeight: "450", color: "#18C2EE", fontSize: "1.8em" }}>
                  WALLET
              </label>
              <br/>
              <label style={{fontSize: "1.3em" }}>
                  CONNECT
              </label>
          </div>
        </div>

        <div className={classNames([classes.container, "hide-scrollbar"])}>
            <table onClick={()=>setCurrentScreen("connectWithDapps")} className={classes.item}>
              <tbody>
                <tr>
                  {/* <td className={classes.icon}><img src="./profile.png"/></td> */}
                  <td style={{fontSize:"1.25em", display:"inline-block", marginLeft:"9px"}}>
                    <div style={{fontWeight:"750"}}>Connect with App</div>
                    <div>Connect with any WalletConnect supported App using a pair string.</div>
                  </td>
                </tr>
              </tbody>
            </table>

            <table onClick={()=>setCurrentScreen("connectedDapps")} className={classes.item}>
              <tbody>
                <tr>
                  {/* <td className={classes.icon}><img src="./profile.png"/></td> */}
                  {/* <td className={classes.icon}><FavoriteBorderIcon style={{color: "#7C7C7C", fontSize: "35px", marginLeft: "-5px"}} /></td> */}
                  <td style={{fontSize:"1.25em", display:"inline-block", marginLeft:"9px"}}>
                    <div style={{fontWeight:"750"}}>Connected Apps</div>
                    <div>List of all connected Apps</div>
                  </td>
                </tr>
              </tbody>
            </table>
        </div>
        <div className={classes.greyBackground}>
          <Typography variant="body2">
            WalletConnect support is currently in Community Beta and some implementation details may change.
          </Typography>
        </div>
        <div className="footer">
          <div className="backArrow">
              <ArrowBackOutlinedIcon onClick={()=> setCurrentScreen("dashboard")} style={{cursor:"pointer",color:"#18C2EE"}}/>
          </div>
        </div>
    </div>
    );
};
export default WalletConnect;
