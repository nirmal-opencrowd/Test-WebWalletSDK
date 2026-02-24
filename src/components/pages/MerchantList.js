import React from "react";
import * as api from "./../../api";
import ArrowBackOutlinedIcon from '@material-ui/icons/ArrowBackOutlined';
import CircularProgress from '@material-ui/core/CircularProgress';
import { Grid } from "@material-ui/core";
import { makeStyles } from '@material-ui/core/styles';
import MerchantListCell from "./MerchantListCell";
import uiTexts from "./../../../configurations/dropp.json";
import commonStyles from "./../../styles/common.module.scss";

const useStyles = makeStyles((theme) => ({
    merchantListcontainer: {
      // maxHeight:"500px",
      overflowY:"scroll",
      padding: "1em"
    }
  }));

const MerchantList = ({ setCurrentScreen }) => {
    const [merchants, setMerchants] = React.useState([]);
    const [loading, setLoading] = React.useState(true);
    const [noResult, setNoResult] = React.useState(null);
    const classes = useStyles();

    React.useEffect(() => {
      async function getMerchantList() {
        let response = await api.fetchMerchantList();
        if (response && response.data && response.data.length) {
          setMerchants(response.data);
          setNoResult(false);
        } else {
          setNoResult(true);
        }
        setLoading(false);
      }
      getMerchantList();
    }, []);

    return (
        <div style={{marginTop:"40px" }}>
            {/* <div
                style={{
                    textAlign: "left",
                    marginTop: "6px",
                    marginLeft: "20px",
                    marginBottom:"10px"
                }}>
                <div style={{ paddingTop: "9px", marginRight: "180px" }}>
                    <label style={{ fontWeight: "450", color: "#18C2EE", fontSize: "1.8em" }}>
                      DROPP MERCHANTS
                    </label>
                </div>
            </div> */}
            <div style={{marginTop: "20px"}}>
                {loading ? <Grid container justifyContent={"center"} alignItems={"center"}>
                        <Grid item>
                            <CircularProgress />
                        </Grid>
                    </Grid>
                :
                    <div className={classes.merchantListcontainer}>
                      <div>
                          {(noResult != null && noResult) ?
                            'No Merchant Found'
                          :
                            <>
                              {(merchants && merchants.length > 0) && (
                                <>
                                  {merchants.map((merchant) =>
                                    <MerchantListCell merchantDetail={merchant} />
                                  )}
                                </>
                              )}
                            </>
                          }
                      </div>
                    </div>
                }
            </div>
            {/* <div className="footer">
              <div className="backArrow backArrowOnly">
                <ArrowBackOutlinedIcon onClick={()=> setCurrentScreen("dashboard")} style={{cursor:"pointer",color:"#18C2EE"}}/>
              </div>
            </div> */}
        </div>
    );
};
export default MerchantList;
