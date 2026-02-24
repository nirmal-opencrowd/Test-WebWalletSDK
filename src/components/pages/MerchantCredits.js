import React from "react";
import * as api from "../../api";
import ArrowBackOutlinedIcon from '@material-ui/icons/ArrowBackOutlined';
import CreditsListItem from "../CreditsListItem";
import FormControl from '@material-ui/core/FormControl';
import InputLabel from '@material-ui/core/InputLabel';
import Select from '@material-ui/core/Select';
import MenuItem from '@material-ui/core/MenuItem';
import {
  makeStyles,
} from '@material-ui/core/styles';
import { CircularProgress, Grid } from "@material-ui/core";

/* global chrome */
const MerchantCredits =( {setCurrentScreen, setScreenWithData, data}) => {
  const [creditData, setCreditData] = React.useState([]);
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
      fontSize : 10,
    }
  }));

  const classes = useStyles();

  const handleDurationChange = selectedOption => {
      setDuration(selectedOption.target.value);

  };

  React.useEffect(() => {
    async function fetchUserDetails() {
      let userDetailsLocal = await api.fetchUserDetails();
      setUserDetails(userDetailsLocal.data);
    }
    fetchUserDetails();
  }, []);

  React.useEffect(() => {
    async function fetchCreditHistory() {
      setLoading(true);
      let creditHistory = await api.fetchCreditHistory({duration: duration, merchantId: ((data && data.merchantId) ? data.merchantId : "")});
      if (creditHistory.data) {
          setCreditData(creditHistory.data)
      }
      setLoading(false);
    }
    fetchCreditHistory();
  }, [duration]);

  const backTOCredits = () => {
    setScreenWithData("transactions", {duration: duration, tab: "credits"});
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
          <div style={{width:"305px", paddingLeft:"25px", paddingRight:"17px", paddingTop: "10px", fontSize: "1.25em", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap"}}>
            <span title={`Credits from ${data.merchantOrganiationName}`}>Credits from {data.merchantOrganiationName}</span>
          </div>
          <div style={{width:"305px", paddingLeft:"17px", paddingRight:"17px", display:"flex",flexDirection:"column", overflowY:"scroll"}}>
            {
              loading ? <div style={{ margin: "90px auto" }}>
              <Grid container justifyContent={"center"} alignItems={"center"}>
                <Grid item>
                  <CircularProgress />
                </Grid>
              </Grid>
            </div>
            :
            Object.keys(userDetails).length > 0 ?
              <>
                {creditData.map((data, key) => {
                  return (
                    <CreditsListItem
                      key={key}
                      transaction={{
                        ...data,
                        userCurrency: userDetails.currency,
                      }}
                      />
                  );
                })}
              </>
              : ''
            }
          </div>

          {/* <div className="footer">
            <div className="backArrow">
              <ArrowBackOutlinedIcon onClick={backTOCredits} style={{cursor:"pointer",color:"#18C2EE"}}/>
            </div>
          </div> */}
      </div>
    );
};

export default MerchantCredits;
