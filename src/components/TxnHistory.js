import React from "react";
import TransactionHistoryListingItem from "./TransactionHistoryListItem";
import * as utils from "../utils/utils";
import * as api from "../api";
import { makeStyles } from '@material-ui/core/styles';
import { CircularProgress, Grid } from "@material-ui/core";

const TxnHistory = ({ setScreenWithData, setCurrentScreen, data, duration, setDuration, userDetails}) => {
    const [history, setHistory] = React.useState([]);
    const [noRecord, setNoRecord] = React.useState(null);
    const [loading, setLoading] = React.useState(true);
    const useStyles = makeStyles((theme) => ({
      root: {
        display: 'flex',
        flexWrap: 'wrap',
      },
      selectEmpty: {
        marginTop: theme.spacing(2),
      },
      margin: {
        margin: theme.spacing(1),
      },
      input: {
        fontSize : 10,
      },
      txnHistoryContainer: {
        display:"flex",
        flexDirection:"column",
        maxHeight:"560px",
        overflowY:"scroll",
        fontSize: "12px",
        width: "100%"
      }
    }));

    const classes = useStyles();

    const handleDurationChange = selectedOption => {
        setDuration(selectedOption.target.value);

    };

    React.useEffect(() => {
        async function fetchPurchaseHistory() {
            setLoading(true);
            let purchaseHistoryDetails = await api.fetchGroupedPurchaseHistory({duration: duration});
            if (purchaseHistoryDetails && purchaseHistoryDetails.data && purchaseHistoryDetails.data.length) {
                purchaseHistoryDetails.data.sort(
                    (a, b) => parseFloat(b.createTimeEpoch) - parseFloat(a.createTimeEpoch)
                );
                setHistory(purchaseHistoryDetails.data);
                setNoRecord(false);
            } else {
              setNoRecord(true);
            }
            setLoading(false);
        }
        fetchPurchaseHistory();
    }, [duration]);

    const viewPurchaseDetails = (data) => {
      setScreenWithData("details",data)
    }

    const viewMerchantTxns = (data) => {
      setScreenWithData("merchantTxns", {...data, duration: duration});
    };

    return (
      <>
        <div className={classes.txnHistoryContainer}>
          {loading ? <div style={{ margin: "90px auto" }}>
            <Grid container justifyContent={"center"} alignItems={"center"}>
              <Grid item>
                <CircularProgress />
              </Grid>
            </Grid>
          </div>
            :
            (noRecord ? <>
              <div style={{ paddingTop: "100px", textAlign: "center" }}>
                No purchases available
              </div>
            </>
              :
              <>
                {history.map((item, key) => {
                  return (
                    <TransactionHistoryListingItem key={key}
                      viewPurchaseDetails={viewPurchaseDetails}
                      viewMerchantTxns={viewMerchantTxns}
                      transaction={{
                        ...item,
                        referrer: utils.hederaAccountToString(userDetails.hhAccount),
                      }}
                    />
                  );
                })}
              </>
            )
          }
        </div>
      </>
    );
};
export default TxnHistory;
