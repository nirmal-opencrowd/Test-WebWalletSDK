import React from "react";
import { makeStyles } from '@material-ui/core/styles';
import { Box, Grid, Typography } from "@material-ui/core";
import commonStyles from "./../../styles/common.module.scss";

const useStyles = makeStyles((theme) => ({
  merchantBox: {
    borderRadius: "4px",
    boxShadow: "0 0 2px",
    clear: "both",
    cursor: "pointer",
    marginBottom: "15px",
    padding: "5px",
    width: "100%"
  },
  thumbnailBox: {
    float: "left",
    marginTop: "10px",
    marginRight: "10px",
    overflow: "hidden",
    width: "27%",
  },
  thumbnail: {
    backgroundRepeat: "no-repeat",
    backgroundSize: "contain",
    height: "50px",
    width: "100%",
  },
  detailBox: {
    float: "right",
    padding: "0 5px",
    textAlign: "left",
    width: "65%",
  },
  detail: {
    fontSize: "1em",
    wordBreak: "break-word",
    // overflow: "hidden",
    // textOverflow: "ellipsis",
    // whiteSpace: "nowrap"
  },
}));

const MerchantListCell = ({ merchantDetail }) => {
  const classes = useStyles();

    const validThumbnail = (url) => {
      if (url) {
        return (url.match(/^https?:\/\/.+\/.+$/) != null);
      }
      return false;
    }

    const openSite = (url) => {
      chrome.runtime.sendMessage({
          type: "openInNewTab",
          request: {url: url},
      });
    };

    return (
        <Box my={2} p={2} className={commonStyles.greyListContainer} key={merchantDetail.merchantId} onClick={()=> {openSite(merchantDetail.websiteUrl)}}>
          <Grid spacing={2} container alignItems="center">
            <Grid item xs={4}>
              {validThumbnail(merchantDetail.logoUrl) ?
                <div className={classes.thumbnail} style={{backgroundImage: `url('${merchantDetail.logoUrl}')`}}></div>
              : ""}
            </Grid>
            <Grid item xs={8}>
              <Typography className={commonStyles.darkBoldText}>{merchantDetail.displayName}</Typography>
              <Typography>{merchantDetail.displayDescription}</Typography>
            </Grid>
          </Grid>
        </Box>
    );
};
export default MerchantListCell;
