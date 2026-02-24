import React from "react";
import { makeStyles } from '@material-ui/core/styles';
import { Typography, Grid, Box, Modal,IconButton } from "@material-ui/core";
import AddIcon from '@material-ui/icons/Add';
import moment from 'moment'
import AddCircleOutlineIcon from '@material-ui/icons/AddCircleOutline';
import getSymbolFromCurrency from "currency-symbol-map";
import { displayAmount } from "../utils/utils";
import CloseIcon from "@material-ui/icons/Close";



const useStyles = makeStyles((theme) => ({
  greyBackground: {
    backgroundColor: "#f9f9f9",
    cursor: "pointer",
    marginTop: "10px",
    padding: "10px",
    borderRadius: "10px",
    marginBottom: "25px"
  },
  thumbnailBox: {
    float: "left",
    marginTop: "30px",
    overflow: "hidden",
    width: "50px",
  },
  thumbnail: {
    backgroundRepeat: "no-repeat",
    backgroundSize: "contain",
    height: "30px",
    width: "100%",
  },
  detailBox: {
    float: "left",
    paddingLeft: "5px",
    textAlign: "left",
    width: "200px",
  },
  detail: {
    fontSize: "1em",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap"
  },
  activateBox: {
    float: "right",
    marginTop: "30px",
  },
  greyText: {
    color: "#888B8E",
    paddingLeft: "15px",
    fontSize: "11px",
    letterSpacing: "-0.3px",
  },
  merchantText: {
    marginLeft: "14px",
    fontSize: "14px",
  },
  backgroundImage: {
    backgroundSize: 'contain',
    backgroundRepeat: 'no-repeat',
    backgroundPosition: 'center',
    borderRadius: "5px",
    height: '100px',
    width: '100%',
  },
  textWithEllipsis: {
    overflow: 'hidden',
    whiteSpace: 'nowrap',
    textOverflow: 'ellipsis',
  },
  value: {
    fontWeight: 600,
    fontSize: "16px",
    paddingLeft: "15px",
  },
  horizontalLine: {
    height: "1px",
    backgroundColor: "#888B8E",
    width: "90%",
    border: "none",
  },
  horizontalLinecolor:{
    height: "1px",
    backgroundColor: "#1bc3ef",
    width: "100%",
    border: "none",
  },
  addIcon: {
    cursor: "pointer",
  },
  offerDetails: {
    padding: "0 0px",
  },
  link: {
    cursor: "pointer",
  },
  linkText: {
    color: "#18c2ee",
    cursor: "pointer",
  },
  truncatedText: {
    display: "-webkit-box",
    wordWrap: 'break-word',
    "white-space-collapse": "break-spaces",
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
    fontSize: "14px!important",
  },
  imageContainer: {
    height: "120px",
    overflow: "hidden",
    // position: "relative",
    width: "100%",
    display:"flex",
    alignItems:"self-start",
    justifyContent:"center",
  },
  dashboardImage:{
    width: "30%",
  },
  image: {
    height: "100%",
    objectFit: "cover",
    width: "100%",
  },
  descriptionOverlay: {
    // background: "rgba(255, 255, 255, 0.8)",
    bottom: "50px",
    boxSizing: "border-box",
    color: "black",
    textAlign: "center",
    width: "100%",
    marginTop: "10px",
  },
  modalContainer: {
    backgroundColor: '#FFFFFF',
    border: 0,
    bottom: 0,
    left: 0,
    overflowY: 'scroll',
    position: 'absolute',
    right: 0,
    top: '20%',
    borderRadius: '16px 16px 0 0',
    width: '100%',
  },
   modalHeader: {
    position: "relative",
    textAlign: "center",
    padding: "10px 16px",
    borderTopLeftRadius: "16px",
    borderTopRightRadius: "16px",
  },
  closeButton: {
    position: "absolute",
    right: 8,
    top: "22px",
    transform: "translateY(-50%)",
    color: "#000",
  },
  offerImage: {
    width: '80%',
  },
  image: {
    width: '100%',
  },
  greyBackgroundDetails: {
    backgroundColor: "#f9f9f9",
    marginTop: "10px",
    padding: "10px",
    borderRadius: "10px",
    marginBottom: "25px"
  },
  imageContainer:{
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
  }
}));

const OfferCell = ({ offer, activateOffer, selectedOffer, applyOffer, forHomeScreen }) => {
  const [openOfferDetailsModal, setOpenOfferDetailsModal] = React.useState(false);
  const classes = useStyles();

  const activeOffer = offer.customerOfferStatus == "ACTIVE"

  const validThumbnail = (url) => {
    if (url) {
      return (url.match(/^https?:\/\/.+\/.+$/) != null);
    }
    return false;
  }

  const launchMerchantWebsite = (url) => {
    if (url) {
      chrome.runtime.sendMessage({
        type: "openInNewTab",
        request: { url },
      });
    }
  }

  const showOfferDetails = (offer) => {
    // setSelectedOffer(offer);
    setOpenOfferDetailsModal(true);
  };

  const handleOfferDetailsModalClose = async () => {
    setOpenOfferDetailsModal(false);
  };

  return (
    <>
      {
        forHomeScreen ?
         <Box className={classes.imageContainer} onClick={() => { showOfferDetails(offer); }}>
          <img src={offer.thumbnail} alt="thumbnail" className={classes.dashboardImage} />
          <Box className={classes.descriptionOverlay}>
            <Grid container justifyContent="space-between" className={classes.offerDetails}>
            <Grid
              container
              justifyContent="space-between"
              alignItems="center"
            >
               <Grid item xs={4}>
                  <Typography
                    title={offer.value && (
                      offer.discountType === "PERCENTAGE" ?
                      `${offer.value}% OFF. Expires ${moment(offer.expiry).format('MMM DD YYYY')}`
                      :
                      `${offer.currency === "USD" ? getSymbolFromCurrency("USD") : ""}${displayAmount(offer.value, offer.currency !== "USD" ? 4 : 2)} ${offer.currency !== "USD" ? offer.currency : ""} OFF.
                      Expires ${moment(offer.expiry).format('MMM DD YYYY')}`)}
                    className={`${classes.value} ${classes.textWithEllipsis}`}
                    variant="h6"
                    align="left"
                  >
                    {offer.value && (offer.discountType === "PERCENTAGE" ? `${offer.value}%` : `${offer.currency === "USD" ? getSymbolFromCurrency("USD") : ""}${displayAmount(offer.value, offer.currency !== "USD" ? 4 : 2)} ${offer.currency !== "USD" ? offer.currency : ""}`)} OFF
                  </Typography>
                </Grid>

                <Grid item xs={8}>
                  <Typography align="left" className={`${classes.truncatedText}`} variant="body1">
                    {offer.details}
                  </Typography>
                </Grid>
                {offer.expiry && <Grid item xs={12}>
                  <Typography align="left" variant="body2"  className={`${classes.greyText} `}>
                    Valid until {moment(offer.expiry).format('MMM DD YYYY')}
                  </Typography>
                </Grid>}

              </Grid>
              <hr className={classes.horizontalLine} />
              {/* offer.merchantName */}
              <Grid item xs={12}>
                <div
                  className={offer?.merchantWebsiteUrl ? classes.link : undefined}
                  onClick={
                    offer?.merchantWebsiteUrl
                      ? (e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          launchMerchantWebsite(offer.merchantWebsiteUrl);
                        }
                      : undefined
                  }
                >
                  <Typography align="center">
                    {offer && offer.merchantName && offer.merchantName.toUpperCase()}
                  </Typography>
                </div>
              </Grid>
            </Grid>
          </Box>
        </Box>
        :
        <Grid container spacing={2} className={classes.greyBackground} style={forHomeScreen ? { marginBottom: 0, marginTop: 0, padding: 0 } : {}} key={offer.id} onClick={() => { showOfferDetails(offer); }}>
          <Grid item xs={12}>
            {validThumbnail(offer.thumbnail) && <div className={classes.backgroundImage} style={{ backgroundImage: `url('${offer.thumbnail}')` }}></div>}
          </Grid>
          <Grid item xs={12}>

            <Grid container justifyContent="space-between" className={classes.offerDetails}>
               <Grid item xs={5}>
                  <Typography
                    title={offer.value && (offer.discountType === "PERCENTAGE" ? `${offer.value}%` : `${offer.currency === "USD" ? getSymbolFromCurrency("USD") : ""}${displayAmount(offer.value, offer.currency !== "USD" ? 4 : 2)} ${offer.currency !== "USD" ? offer.currency : ""}`)}
                    className={`${classes.value} ${classes.textWithEllipsis}`}
                    variant="h6"
                    align="left"
                  >
                    {offer.value && (offer.discountType === "PERCENTAGE" ? `${offer.value}%` : `${offer.currency === "USD" ? getSymbolFromCurrency("USD") : ""}${displayAmount(offer.value, offer.currency !== "USD" ? 4 : 2)} ${offer.currency !== "USD" ? offer.currency : ""}`)} OFF
                  </Typography>
                </Grid>

                <Grid item xs={7}>
                  <Typography align="left" title={offer.tagLine} className={`${classes.truncatedText}`} variant="body1">
                    {offer.tagLine}
                  </Typography>
                </Grid>
                {offer.expiry && <Grid item xs={12}>
                  <Typography align="left" variant="body2"  className={`${classes.greyText} `}>
                    Valid until {moment(offer.expiry).format('MMM DD YYYY')}
                  </Typography>
                </Grid>}


              <hr className={classes.horizontalLine} />
              <Grid item xs={12}>
                <Grid container justifyContent="space-between">
                  <Grid item xs={!activeOffer || applyOffer ? 9 : 12}>
                    <Typography align={!activeOffer || applyOffer ? "left" : "center"} className={!activeOffer || applyOffer ? `${classes.merchantText} ` : ""}>
                      {offer && offer.merchantName && offer.merchantName.toUpperCase()}
                    </Typography>
                    <div onClick={(e) => { e.preventDefault(); e.stopPropagation(); launchMerchantWebsite(offer.merchantWebsiteUrl); }}>
                      <Typography
                        title={offer && offer.merchantWebsiteUrl && offer.merchantWebsiteUrl.split("/")[2]}
                        className={`${classes.greyText} ${classes.textWithEllipsis} ${classes.link}`}
                        align={!activeOffer || applyOffer ? "left" : "center"}
                      >
                        {offer && offer.merchantWebsiteUrl && offer.merchantWebsiteUrl.split("/")[2]}
                      </Typography>
                    </div>
                  </Grid>
                  {(activateOffer && !activeOffer && <Grid item xs={2}>
                    <AddCircleOutlineIcon className={classes.addIcon} onClick={(e) => { e.preventDefault(); e.stopPropagation(); activateOffer(offer); }} />
                  </Grid>) || (applyOffer && <Grid item xs={3}>
                    <div onClick={() => applyOffer(offer)}>
                      {
                        selectedOffer && selectedOffer.id == offer.id ?
                          <Typography align="right">
                            APPLIED
                          </Typography> :
                          <Typography align="right" className={classes.linkText}>
                            APPLY
                          </Typography>
                      }
                    </div>
                  </Grid>)
                  }
                </Grid>
              </Grid>
            </Grid>
          </Grid>
          {/* {validThumbnail(offer.thumbnail) &&
                <div className={classes.thumbnailBox}>
                  <div className={classes.thumbnail} style={{backgroundImage: `url('${offer.thumbnail}')`}}></div>
                </div>
              }
              <div className={classes.detailBox} style={{width: (validThumbnail(offer.thumbnail) ? "200px" : "250px")}}>
                <Typography className={classes.detail} title={offer.merchantName}>{offer.merchantName}</Typography>
                <Typography className={classes.detail} title={offer.tagLine} style={{fontWeight: 600}}>{offer.tagLine}</Typography>
                <Typography className={classes.detail} title={`Valid ${((new Date(offer.start)).getMonth() + 1)}/${(new Date(offer.start)).getDate()}/${(new Date(offer.start)).getFullYear()} - ${((new Date(offer.expiry)).getMonth() + 1)}/${(new Date(offer.expiry)).getDate()}/${(new Date(offer.expiry)).getFullYear()}`}>Valid {((new Date(offer.start)).getMonth() + 1)}/{(new Date(offer.start)).getDate()}/{(new Date(offer.start)).getFullYear()} - {((new Date(offer.expiry)).getMonth() + 1)}/{(new Date(offer.expiry)).getDate()}/{(new Date(offer.expiry)).getFullYear()}</Typography>
              </div>
              {(offer.customerOfferStatus != "ACTIVE") &&
                <div className={classes.activateBox}>
                  <p><span style={{cursor: "pointer"}} onClick={() => activateOffer(offer)}><AddIcon style={{fontSize: "25px"}} /></span></p>
                </div>
              } */}
        </Grid>
      }

      <Modal
        open={openOfferDetailsModal}
        onClose={handleOfferDetailsModalClose}
      >
        <Box className={classes.modalContainer}>
              <Box className={classes.modalHeader}>
                    <Typography variant="h6" className={`${classes.value}`}>
                      OFFER DETAILS
                    </Typography>

                    <IconButton
                      aria-label="close"
                      onClick={handleOfferDetailsModalClose}
                      className={classes.closeButton}
                    >
                     <CloseIcon/>
                    </IconButton>
                   <hr className={classes.horizontalLinecolor} />
                </Box>
          {offer && (
            <Grid container className={classes.greyBackgroundDetails} key={offer.id} >
              <Grid item xs={12} className={classes.imageContainer}>
                {validThumbnail(offer.thumbnail) && <div className={classes.offerImage}>
                  <img width={"100%"} src={offer.thumbnail} alt="thumbnail" className={classes.image} />
                </div>}
              </Grid>
              <Grid item xs={12}>
                <Grid container justifyContent="space-between" className={classes.offerDetails}>
               <Grid item xs={5}>
                  <Typography
                    title={offer.value && (offer.discountType === "PERCENTAGE" ? `${offer.value}%` : `${offer.currency === "USD" ? getSymbolFromCurrency("USD") : ""}${displayAmount(offer.value, offer.currency !== "USD" ? 4 : 2)} ${offer.currency !== "USD" ? offer.currency : ""}`)}
                    className={`${classes.value} ${classes.textWithEllipsis}`}
                    variant="h6"
                    align="left"
                  >
                    {offer.value && (offer.discountType === "PERCENTAGE" ? `${offer.value}%` : `${offer.currency === "USD" ? getSymbolFromCurrency("USD") : ""}${displayAmount(offer.value, offer.currency !== "USD" ? 4 : 2)} ${offer.currency !== "USD" ? offer.currency : ""}`)} OFF
                  </Typography>
                </Grid>

                <Grid item xs={7}>
                  <Typography align="left" title={offer.tagLine} className={`${classes.truncatedText}`} variant="body1">
                    {offer.tagLine}
                  </Typography>
                </Grid>
                {offer.expiry && <Grid item xs={12}>
                  <Typography align="left" variant="body2"  className={`${classes.greyText} `}>
                    Valid until {moment(offer.expiry).format('MMM DD YYYY')}
                  </Typography>
                </Grid>}
                  <hr className={classes.horizontalLine} />
                  <Grid item xs={12}>
                    <Grid container justifyContent="space-between">
                      <Grid item xs={!activeOffer || applyOffer ? 9 : 12}>
                        <Typography align={!activeOffer || applyOffer ? "left" : "center"}>
                          {offer && offer.merchantName && offer.merchantName.toUpperCase()}
                        </Typography>
                        <div onClick={(e) => { e.preventDefault(); e.stopPropagation(); launchMerchantWebsite(offer.merchantWebsiteUrl); }}>
                          <Typography
                            title={offer && offer.merchantWebsiteUrl && offer.merchantWebsiteUrl.split("/")[2]}
                            className={`${classes.greyText} ${classes.textWithEllipsis} ${classes.link}`}
                            align={!activeOffer || applyOffer ? "left" : "center"}
                          >
                            {offer && offer.merchantWebsiteUrl && offer.merchantWebsiteUrl.split("/")[2]}
                          </Typography>
                        </div>
                      </Grid>
                    </Grid>
                  </Grid>
                </Grid>
              </Grid>
            </Grid>
          )}
        </Box>
      </Modal>
    </>

  );
};
export default OfferCell;
