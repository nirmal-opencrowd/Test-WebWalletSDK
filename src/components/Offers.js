import React from "react";
import * as api from "./../api";
import ArrowBackOutlinedIcon from '@material-ui/icons/ArrowBackOutlined';
import {hederaAccountToString} from "./../utils/utils";
import Paper from '@material-ui/core/Paper';
import Tabs from '@material-ui/core/Tabs';
import Tab from '@material-ui/core/Tab';
import CircularProgress from '@material-ui/core/CircularProgress';
import { Grid, Box, Typography } from "@material-ui/core";
import OfferCell from "./OfferCell";
import { makeStyles } from '@material-ui/core/styles';
import uiTexts from "./../../configurations/dropp.json"

const useStyles = makeStyles((theme) => ({
    offersContainer: {
      maxHeight:"500px",
      overflowY:"scroll"
    }
  }));

const pageTexts = uiTexts.offers;

const Offers = ({ setCurrentScreen, data }) => {
    const [offers, setOffers] = React.useState([]);
    const [userDetails, setUserDetails] = React.useState(null);
    const [activeOffers, setActiveOffers] = React.useState([]);
    const [newOffers, setNewOffers] = React.useState([]);
    const [offerFailed, setOfferFailed] = React.useState(null);
    const [value, setValue] = React.useState(data && data.showActiveTab ? 1 : 0);
    const [loading, setLoading] = React.useState(true);
    const [successMessage, setSuccessMessage] = React.useState("");
    const [errorMessage, setErrorMessage] = React.useState("");
    const classes = useStyles();

    React.useEffect(() => {
        async function fetchUserDetails() {
            let userDetailsLocal = await api.fetchUserDetails();
            setUserDetails(userDetailsLocal.data);
        }
        fetchUserDetails();
    }, []);

    async function getOffers() {
        try {
            let offers = await api.getCustomerOffers({userId: hederaAccountToString(userDetails.hhAccount), currency: userDetails.currency, countryCode: userDetails.countryCode, statuses: ["ACTIVE"]});
            setActiveOffers(offers);
        } catch (e) {
            setOfferFailed(true);
            setLoading(false);
        }
    }

    async function fetchGeneratedOffers() {
        let userId = hederaAccountToString(userDetails.hhAccount);
        let offers = await api.getGeneratedOffers({userId: userId, currency: userDetails.currency, countryCode: userDetails.countryCode});
        let currentOffers = [];
        for (let i = 0; i < offers.length; i++) {
            let offer = offers[i];
            let isActive = false
            if (activeOffers && activeOffers.length) {
                for (let j = 0; j < activeOffers.length; j++) {
                    let id = activeOffers[j].id.replace(`${userId}:`, '');
                    if (id == offer.id) {
                        isActive = true;
                        break;
                    }
                }
            }
            if (!isActive) {
                currentOffers.push(offer);
            }
        }
        setNewOffers(currentOffers);
        setLoading(false);
    }

    React.useEffect(() => {
        if (activeOffers != null) {
            fetchGeneratedOffers();
        }
    }, [activeOffers])

    React.useEffect(() => {
        if (userDetails) {
            getOffers();
            // fetchGeneratedOffers();
        }
    }, [userDetails])

    function TabPanel(props) {
        const { children, value, index, className, ...other } = props;

        return (
            <div
            className={className}
            role="tabpanel"
            hidden={value !== index}
            id={`simple-tabpanel-${index}`}
            aria-labelledby={`simple-tab-${index}`}
            {...other}>
                {value === index && (
                    <Box p={2}>
                        <Typography>{children}</Typography>
                    </Box>
                )}
            </div>
        );
    }

    const handleChange = (event, newValue) => {
        setValue(newValue);
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

    const activateOffer = async (data) => {
        let activated = await api.activateOffer({userId: hederaAccountToString(userDetails.hhAccount), currency: userDetails.currency, countryCode: userDetails.countryCode, merchantId: data.merchantId, offerCode: data.offerCode });
        if (activated) {
            getOffers();
            setSuccessMessage("Offer Activated Successfully!");
            closeSucessAlert();
        } else {
            setErrorMessage("Something went wrong!");
            closeErrorAlert();
        }
    };

    return (
        <div style={{marginTop:"40px", textAlign: "center" }}>
            {/* <div
                style={{
                    textAlign: "left",
                    marginTop: "6px",
                    marginLeft: "20px",
                    marginBottom:"10px"
                }}>
                <div style={{ paddingTop: "9px", marginRight: "180px" }}>
                    <label style={{ fontWeight: "450", color: "#18C2EE", fontSize: "1.8em" }}>
                        OFFERS
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
                    <div style={{position: "relative"}}>
                        <Tabs
                            value={value}
                            indicatorColor="primary"
                            textColor="primary"
                            onChange={handleChange}
                            aria-label="tabs"
                        >
                            <Tab label={`Browse (${newOffers.length})`} style={{padding: "0 40px"}} />
                            <Tab label={`Active (${activeOffers.length})`} style={{padding: "0 40px"}} />
                        </Tabs>
                        <TabPanel value={value} index={0} className={classes.offersContainer}>
                            <Grid container justifyContent="center" alignItems="center">
                                {(newOffers && newOffers.length > 0) ?
                                    <>
                                        {newOffers.map((newOffer, index) =>
                                            <OfferCell offer={newOffer} activateOffer={activateOffer} />
                                        )}
                                    </>
                                : `${offerFailed ? pageTexts.failedToFetchMsg : pageTexts.noNewOfferText }`}
                            </Grid>
                        </TabPanel>
                        <TabPanel value={value} index={1} className={classes.offersContainer}>
                            <Grid container justifyContent="center" alignItems="center">
                                {(activeOffers && activeOffers.length > 0) ?
                                    <>
                                        {activeOffers.map((activeOffer, index) =>
                                            <OfferCell offer={activeOffer} />
                                        )}
                                    </>
                                : `${offerFailed ? pageTexts.failedToFetchMsg : pageTexts.noActiveOfferText}`}
                            </Grid>
                        </TabPanel>
                        {errorMessage && (<div className="alert error extension" style={{textAlign:"center",marginLeft:"25px",position: "absolute", top:"415px"}}>
                            <strong>{errorMessage}</strong>
                        </div>)}
                        {successMessage && (<div className="alert success extension" style={{textAlign:"center",marginLeft:"25px",position: "absolute", top:"415px"}}>
                            <strong>{successMessage}</strong>
                        </div>)}
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
export default Offers;
