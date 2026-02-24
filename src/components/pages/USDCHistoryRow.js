import React from "react";
import { displayAmount } from "../../utils/utils";
import { makeStyles } from '@material-ui/core/styles';
import Typography from "@material-ui/core/Typography";
import moment from "moment";
import styles from "./../../styles/common.module.scss";

const useStyles = makeStyles((theme) => ({
  // walletBox: {
  //   border: "1px solid #000",
  //   borderRadius: "4px",
  //   marginBottom: "15px"
  // },
  leftContent: {
    display: "inline-block",
    padding: "15px 0 15px 15px",
    width: "55%"
  },
  rightContent: {
    display: "inline-block",
    float: "right",
    padding: "15px 15px 15px 0",
    textAlign: "right",
    width: "30%"
  },
}));

const USDCHistoryRow =({history}) => {
  const classes = useStyles();

  return (
    <div>
      <div className={styles.greyListContainer} style={{display: "block"}}>
        <div className={classes.leftContent}>
          <Typography className={styles.mediumSizedText} style={{marginBottom: "5px"}}>{moment(history.createTime).format("MMM DD YYYY hh:mm A")}</Typography>
          <Typography className={styles.mediumSizedText}>{history.status}</Typography>
        </div>
        <div className={classes.rightContent}>
          <Typography className={styles.darkBoldText}>{displayAmount(history.amount)} USDC</Typography>
        </div>
      </div>
    </div>
  );
};

export default USDCHistoryRow;
