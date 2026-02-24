import React from "react";
import { CircularProgress, Grid } from "@material-ui/core";
import TransactionHistoryListingItem from "./../TransactionHistoryListItem";
import * as utils from "../../utils/utils";
import * as api from "../../api";
import ArrowBackOutlinedIcon from '@material-ui/icons/ArrowBackOutlined';
import FormControl from '@material-ui/core/FormControl';
import InputLabel from '@material-ui/core/InputLabel';
import Select from '@material-ui/core/Select';
import MenuItem from '@material-ui/core/MenuItem';
import {
  makeStyles,
} from '@material-ui/core/styles';


const MerchantTxns = ({ setScreenWithData, setCurrentScreen, data }) => {
    const [history, setHistory] = React.useState([]);
    const [userDetails, setUserDetails] = React.useState({});
    const [duration, setDuration] = React.useState(data.duration);
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
      fontSize: 10,
    },
    durationFilter: {
      margin: "10px 0px",
      padding: "0 1em",
    },
    durationContainer: {
      fontSize: "14px",
      fontWeight: 600,
      marginTop: "10px",
      textAlign: "center",
    },
    durationBox: {
      border: "2px solid #18c2ee",
      borderRadius: "15px",
      cursor: "pointer",
      padding: "5px",
      maxWidth: "75px"
    },
    active: {
      border: "2px solid #18c2ee",
      borderRadius: "15px",
      backgroundColor: "#18c2ee",
      color: "#FFFFFF"
    },
    customGridItem: {
        flexBasis: 'calc(25%)', // 25% width minus the spacing (2*4px = 8px)
        maxWidth: 'calc(25% - 4px)', // Ensure it doesn't exceed the calculated width
    },
  }));

    const classes = useStyles();

    const handleDurationChange = selectedOption => {
        setDuration(selectedOption.target.value);

    };

    React.useEffect(() => {
      async function fetchUserDetails() {
          let userDetails = await api.fetchUserDetails();
          if (userDetails.data) {
              setUserDetails(userDetails.data);
          }
      }
      fetchUserDetails();
    }, []);

    React.useEffect(() => {
        async function fetchPurchaseHistory() {
            setLoading(true);
            let purchaseHistoryDetails = await api.fetchPurchaseHistory({duration: duration, merchantId: data.merchantId});
            if (purchaseHistoryDetails && purchaseHistoryDetails.data) {
                purchaseHistoryDetails.data.sort(
                    (a, b) => parseFloat(b.createTimeEpoch) - parseFloat(a.createTimeEpoch)
                );
                setHistory(purchaseHistoryDetails.data);
            }
            setLoading(false);
        }
        fetchPurchaseHistory();
    }, [duration]);

    const viewPurchaseDetails = (data) => {
      setScreenWithData("details",data)
    }

    const backTOPurchase = () => {
      setScreenWithData("transactions", {duration: duration});
    };

    return (
      <div style={{marginTop:"60px"}}>
        {/* <FormControl size="small" variant="outlined" className={classes.formControl} style={{marginLeft:"209px",marginBottom:"3px"}}>
          <InputLabel id="demo-simple-select-outlined-label">Duration</InputLabel>
          <Select
            style={{width:"107px", height:"36px"}}
            labelId="demo-simple-select-outlined-label"
            id="demo-simple-select-outlined"
            value={duration}
            onChange={handleDurationChange}
            label="Duration"
            size="small"
          >
            <MenuItem value={"30"}>30 Days</MenuItem>
            <MenuItem value={"60"}>60 Days</MenuItem>
            <MenuItem value={"90"}>90 Days</MenuItem>
            <MenuItem value={"All"}>All</MenuItem>
          </Select>
        </FormControl> */}
          <div className={classes.durationFilter}>
            <Grid container justifyContent="space-between" className={classes.durationContainer}>
              <Grid item className={classes.customGridItem}>
                <div className={`${classes.durationBox} ${(duration === "30") ? classes.active : ""}`} onClick={() => setDuration("30")}>
                  30 Days
                </div>
              </Grid>
              <Grid item className={classes.customGridItem}>
                <div className={`${classes.durationBox} ${(duration === "60") ? classes.active : ""}`} onClick={() => setDuration("60")}>
                  60 Days
                </div>
              </Grid>
              <Grid item className={classes.customGridItem}>
                <div className={`${classes.durationBox} ${(duration === "90") ? classes.active : ""}`} onClick={() => setDuration("90")}>
                  90 Days
                </div>
              </Grid>
              <Grid item className={classes.customGridItem}>
                <div className={`${classes.durationBox} ${(duration === "All") ? classes.active : ""}`} onClick={() => setDuration("All")}>
                  All
                </div>
              </Grid>
            </Grid>
          </div>
        <div style={{width:"305px", paddingLeft:"25px", paddingRight:"17px", paddingTop: "10px", fontSize: "1.25em", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap"}}>
          <span title={`Purchases from ${data.merchantOrganiationName}`}>Purchases from {data.merchantOrganiationName}</span>
        </div>
        <div style={{width:"305px",paddingLeft:"17px", paddingRight:"17px", display:"flex",flexDirection:"column", overflowY:"scroll"}}>
          {loading ? <div style={{ margin: "90px auto" }}>
              <Grid container justifyContent={"center"} alignItems={"center"}>
                <Grid item>
                  <CircularProgress />
                </Grid>
              </Grid>
            </div>
            :
            history.map((data, key) => {
              return (
                <TransactionHistoryListingItem key={key}
                  viewPurchaseDetails={viewPurchaseDetails}
                  transaction={{
                    ...data,
                    referrer: utils.hederaAccountToString(userDetails.hhAccount),
                  }}
                />
              );
            })}
        </div>
      </div>
    );
};

export default MerchantTxns;
