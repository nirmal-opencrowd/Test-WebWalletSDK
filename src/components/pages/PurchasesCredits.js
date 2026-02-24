import React from "react";
import * as api from "../../api";
import CreditsListItem from "../CreditsListItem";
import FormControl from '@material-ui/core/FormControl';
import InputLabel from '@material-ui/core/InputLabel';
import Select from '@material-ui/core/Select';
import MenuItem from '@material-ui/core/MenuItem';
import {
  ThemeProvider,
  withStyles,
  makeStyles,
  createMuiTheme,
} from '@material-ui/core/styles';
import { CircularProgress, Grid } from "@material-ui/core";

/* global chrome */
const PurchasesCredits =( {setCurrentScreen, setScreenWithData, duration, userDetails}) => {
  const [creditData, setCreditData] = React.useState([]);
  // const [userDetails, setUserDetails] = React.useState({});
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
    creditDataContainer: {
      display:"flex",
      flexDirection:"column",
      maxHeight:"560px",
      overflowY:"scroll",
      fontSize: "12px",
      width: "100%"
    }
  }));

  const classes = useStyles();

  React.useEffect(() => {
    // async function fetchUserDetails() {
    //   let userDetailsLocal = await api.fetchUserDetails();
    //   setUserDetails(userDetailsLocal.data);
    // }
    // fetchUserDetails();

    // async function fetchCreditHistory() {
    //     let creditHistory = await api.fetchGroupedCreditHistory();
    //     if (creditHistory.data && creditHistory.data.length) {
    //         setCreditData(creditHistory.data)
    //         setNoRecord(false);
    //     } else {
    //       setNoRecord(true);
    //     }
    // }
    // fetchCreditHistory();
  }, []);

  React.useEffect(() => {
    async function fetchCreditHistory() {
        setLoading(true);
        let creditHistory = await api.fetchGroupedCreditHistory({duration: duration});
        if (creditHistory.data && creditHistory.data.length) {
            setCreditData(creditHistory.data)
            setNoRecord(false);
        } else {
          setNoRecord(true);
        }
        setLoading(false);
    }
    fetchCreditHistory();
}, [duration]);


  const viewMerchantCredits = (data) => {
    setScreenWithData("merchantCredits", {...data, duration: duration});
  };

  // const handleDurationChange = selectedOption => {
  //   setDuration(selectedOption.target.value);
  // };


    return (
      <>
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
        </FormControl>
        <br/> */}
        <div className={classes.creditDataContainer}>
          {
            loading ? <div style={{margin: "90px auto"}}>
          <Grid container justifyContent={"center"} alignItems={"center"}>
              <Grid item>
                <CircularProgress />
              </Grid>
          </Grid>
        </div> : 
              Object.keys(userDetails).length > 0 ?
                <>
                  {noRecord ?
                    <div style={{paddingTop: "100px", textAlign: "center"}}>
                      You don’t have any credits available right now.
                    </div>
                  : <>
                    {creditData.map((data, key) => {
                      return (
                        <CreditsListItem
                          key={key}
                          viewMerchantCredits={viewMerchantCredits}
                          transaction={{
                            ...data,
                            userCurrency: userDetails.currency,
                          }}
                          />
                      );
                    })}
                  </>}
                </>
              : ''
          }
        </div>
      </>
    );
};

export default PurchasesCredits;
