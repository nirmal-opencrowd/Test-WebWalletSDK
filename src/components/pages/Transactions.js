import React from "react";
import ArrowBackOutlinedIcon from '@material-ui/icons/ArrowBackOutlined';
import Tabs from '@material-ui/core/Tabs';
import Tab from '@material-ui/core/Tab';
import { Grid, Tooltip, Typography } from "@material-ui/core";
import { makeStyles } from '@material-ui/core/styles';
import PurchasesCredits from "./PurchasesCredits";
import MyRecurringPayments from "./MyRecurringPayments";
import TxnHistory from "./../TxnHistory";
import AllTransactions from "./AllTransactions";
import classNames from "classnames";
import UITexts from "../../../configurations/dropp.json";
import styles from "../../styles/common.module.scss";
import Select from '@material-ui/core/Select';
import MenuItem from '@material-ui/core/MenuItem';
import FormControl from '@material-ui/core/FormControl';
import InputLabel from '@material-ui/core/InputLabel';

const useStyles = makeStyles((theme) => ({
    transactionsContainer: {
      marginTop:"10px",
    //   maxHeight:"475px",
      overflowY:"scroll",
      padding: "1em",
      textAlign: "left",
      padding: "15px 20px",
    },
    tabHeader: {
      fontSize: "14px",
      padding: "0 8px",
    },
    durationFilter: {
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
        maxWidth:"75px"
    },
    active: {
        border: "2px solid #18c2ee",
        borderRadius: "15px",
        backgroundColor: "#18c2ee",
        color: "#FFFFFF"
    },
    loaderAtcenter: {
        display:"flex",
        justifyContent:"center",
    },
    authorizedPaymentTab : {
        lineHeight: "15px",
        wordBreak:"break-word",
    },
    root: {
        '& .MuiInputBase-root': {
            border: "1px solid #ccc",
            borderRadius: "45px",
            width: "100%",
        },
        '& .MuiSelect-root': {
            padding: "10px",
            textAlign: "left",
        },
    },
    customGridItem: {
        flexBasis: 'calc(25%)', // 25% width minus the spacing (2*4px = 8px)
        maxWidth: 'calc(25% - 4px)', // Ensure it doesn't exceed the calculated width
    },
}));

const Transactions = ({ setCurrentScreen, setScreenWithData, data, userDetails }) => {
    // const [value, setValue] = React.useState((data && data.tab && data.tab == "credits") ? 1 : 0);
    const [value, setValue] = React.useState("purchases");
    const [successMessage, setSuccessMessage] = React.useState("");
    const [errorMessage, setErrorMessage] = React.useState("");
    const [duration, setDuration] = React.useState(data && data.duration ? data.duration : "30");
    const classes = useStyles();

    const pageTexts = UITexts.transactions;

    function TransactionPanel(props) {
        const { children, value, target, className, ...other } = props;

        return (
            <div
            className={className}
            role="tabpanel"
            hidden={value !== target}
            id={`simple-tabpanel-${target}`}
            aria-labelledby={`simple-tab-${target}`}
            {...other}>
                {value === target && (
                    <div>{children}</div>
                )}
            </div>
        );
    }

    const handleChange = (event, newValue) => {
        // setValue(newValue);
        setValue(event.target.value);
    };

    function closeErrorAlert() {
        setTimeout(function () {
            setErrorMessage("");
        }, 3000);
    }

    function closeSucessAlert() {
        setTimeout(function () {
            setSuccessMessage("");
        }, 3000);
    }

    return (
        <div style={{marginTop:"-33px", textAlign: "center" }}>
            <div style={{marginTop: "20px"}}>
              <div style={{position: "relative", paddingTop: "70px"}}>
                    <Grid container justifyContent="center">
                        <FormControl
                            className={`${styles.dropdownFormControl} ${classes.root}`}
                        >
                            <Select
                                labelId="dropdown-label"
                                value={value}
                                onChange={handleChange}
                                aria-label="dropdown"
                                variant="outlined"
                            >
                                <MenuItem value="purchases" className={classes.tabHeader}>Purchases</MenuItem>
                                <MenuItem value="credits" className={classes.tabHeader}>Credits</MenuItem>
                                <MenuItem value="authorizedPayments" className={classNames(classes.tabHeader, classes.authorizedPaymentTab)}>
                                    Authorized Payments
                                </MenuItem>
                                <MenuItem value="all" className={classes.tabHeader}>All</MenuItem>
                            </Select>
                        </FormControl>
                    </Grid>
                  {(value != "authorizedPayments" && value != "all") && (
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
                  )}

                  <TransactionPanel value={value} target={"purchases"} className={classes.transactionsContainer}>
                      <Grid container className={styles.droppScrollableSection}>
                        <TxnHistory userDetails={userDetails} setScreenWithData={setScreenWithData} data={data} setCurrentScreen={setCurrentScreen} duration={duration} setDuration={setDuration} />
                      </Grid>
                  </TransactionPanel>
                  <TransactionPanel value={value} target={"credits"} className={classes.transactionsContainer}>
                      <Grid container className={styles.droppScrollableSection}>
                        <PurchasesCredits setCurrentScreen={setCurrentScreen} userDetails={userDetails} setScreenWithData={setScreenWithData} duration={duration} setDuration={setDuration}  />
                      </Grid>
                  </TransactionPanel>
                  <TransactionPanel value={value} target={"authorizedPayments"} className={classes.transactionsContainer}>
                      <Grid container className={styles.droppScrollableSection}>
                        <MyRecurringPayments setCurrentScreen={setCurrentScreen} userDetails={userDetails} duration={duration} setDuration={setDuration}  />
                      </Grid>
                  </TransactionPanel>
                  <TransactionPanel value={value} target={"all"} className={classNames([classes.loaderAtcenter, classes.transactionsContainer])}>
                      <Grid container className={styles.droppScrollableSection}>
                        <AllTransactions setCurrentScreen={setCurrentScreen} userDetails={userDetails} duration={duration} setDuration={setDuration}  />
                      </Grid>
                  </TransactionPanel>
                  {errorMessage && (<div className="alert error extension" style={{textAlign:"center",marginLeft:"25px",position: "absolute", top:"415px"}}>
                      <strong>{errorMessage}</strong>
                  </div>)}
                  {successMessage && (<div className="alert success extension" style={{textAlign:"center",marginLeft:"25px",position: "absolute", top:"415px"}}>
                      <strong>{successMessage}</strong>
                  </div>)}
              </div>
            </div>
        </div>
    );
};
export default Transactions;
