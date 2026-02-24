import React from "react";
import ArrowBackOutlinedIcon from '@material-ui/icons/ArrowBackOutlined';
import * as api from "./../../api";
import { makeStyles } from '@material-ui/core/styles';
import USDCHistoryRow from "./USDCHistoryRow";
import { Grid, Typography } from "@material-ui/core";
import Loader from "../Loader";

const useStyles = makeStyles((theme) => ({
  walletContainer: {
    paddingLeft:"20px",
    paddingRight:"20px",
    marginTop:"30px",
    maxHeight:"500px",
    overflowY:"scroll"
  }
}));

const USDCHistory =({setCurrentScreen}) => {
  const [history, setHistory] = React.useState([]);
  const [loading, setLoading] = React.useState(true);

  const classes = useStyles();

  React.useEffect(() => {
      async function getTransferHistory() {
          let result = await api.getTransferHistory({status: "COMPLETE"});
          if (result && result.responseCode == 0) {
            setHistory(result.data);
          }
          setLoading(false);
      }
      getTransferHistory();
  }, []);

  return (
        <div style={{marginTop:"33px"}}>
          {/* <div
            style={{
                textAlign: "left",
                marginTop: "6px",
                marginLeft: "20px",
                marginBottom: "10px"
          }}>
            <div style={{ paddingTop: "9px" }}>
                <label style={{ fontWeight: "450", color: "#18C2EE", fontSize: "1.8em" }}>
                  FUNDING
                </label>
                <br/>
                <label style={{fontSize: "1.3em" }}>
                  HISTORY
                </label>
            </div>
          </div> */}
          {
            loading ? <Loader /> :
              <div className={classes.walletContainer}>
                {history.length ? history.map((data, key) =>
                  <USDCHistoryRow history={data} />
                  // return (
                  //   <div>
                  //     <div className={classes.walletBox} style={{display: "block"}}>
                  //       <div className={classes.leftContent}>
                  //         <Typography style={{marginBottom: "5px"}}>{moment(data.createTime).format("MM/DD/YYYY")}</Typography>
                  //         <Typography>{data.status}</Typography>
                  //       </div>
                  //       <div className={classes.rightContent}>
                  //         <Typography>USDC {displayAmount(data.amount)}</Typography>
                  //       </div>
                  //     </div>
                  //   </div>
                  // );
                ) : <div style={{ textAlign: "center", paddingTop: "50px" }}>
                  <Typography style={{ fontSize: "12px" }}>No Funding History</Typography>
                </div>
                }
              </div>
          }
          {/* <div className="footer">
            <div className="backArrow">
              <ArrowBackOutlinedIcon onClick={()=> setCurrentScreen("dashboard")} style={{cursor:"pointer",color:"#18C2EE"}}/>
            </div>
          </div> */}
        </div>
    );
};

export default USDCHistory;
