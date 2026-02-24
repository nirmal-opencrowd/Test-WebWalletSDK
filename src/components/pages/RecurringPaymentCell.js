import React from "react";
import { makeStyles } from "@material-ui/core/styles";
import { Box, Grid, Typography } from "@material-ui/core";
import moment from "moment";
import { displayAmount, isCrypto } from "./../../utils/utils";
import { renderCurrency } from "../../utils/currency";
import styles from "./../../styles/common.module.scss";
import txnStyles from "./../../styles/transactions.module.scss";
import UITexts from "./../../../configurations/dropp.json";
import classNames from "classnames";

const useStyles = makeStyles(theme => ({
    rPaymentBox: {
        borderRadius: "4px",
        boxShadow: "0 0 2px",
        clear: "both",
        marginBottom: "15px",
        padding: "5px",
    },
    thumbnailBox: {
        display: "inline-block",
        marginTop: "15px",
        overflow: "hidden",
        verticalAlign: "top",
        width: "25%",
    },
    thumbnail: {
        backgroundRepeat: "no-repeat",
        backgroundSize: "contain",
        height: "50px",
        width: "100%",
    },
    detailBox: {
        display: "inline-block",
        paddingLeft: "10px",
        textAlign: "left",
        width: "75%",
    },
    detail: {
        fontSize: "14px",
        overflow: "hidden",
        textOverflow: "ellipsis",
        whiteSpace: "nowrap",
    },
    cancelLink: {
        marginTop: "5px",
        textAlign: "right",
    },
    mainTitle: {
        fontSize: "12px",
        fontWeight: "bold",
        whiteSpace: "nowrap" /* stay on one line */,
        overflow: "hidden" /* hide extra text */,
        textOverflow: "ellipsis" /* show ... */,
    },
    subTitle: {
        fontSize: "12px",
        color: "#555555",
        textTransform: "uppercase",
    },
    description: {
        fontSize: "12px",
        marginTop: "5px",
    },
    subValues: {
        fontSize: "12px",
        fontWeight: "600",
        fontWeight: "bold",
    },
    blueBoldLink: {
        color: "#18c2ee",
        fontWeight: "bold",
        cursor: "pointer",
        fontSize: "13px",
    },
}));

const RecurringPaymentCell = ({ paymentData, cancelRecurringPayment }) => {
    const classes = useStyles();
    const pageTexts = UITexts.transactions.recurringPage;
    const validThumbnail = url => {
        if (url) {
            return url.match(/^https?:\/\/.+\/.+$/) != null;
        }
        return false;
    };

    return (
        <>
            {paymentData.invoiceType !== "PREAUTH" ? (
                <div className={styles.greyListContainer}>
                    <Grid container>
                        <Grid item xs={12}>
                            <Grid container>
                                <Grid item xs={8}>
                                    <Typography variant="body2">
                                        {paymentData.merchantName ? (
                                            <h3
                                                style={{ margin: 0 }}
                                                title={paymentData.merchantName}>
                                                <span
                                                    className={classes.mainTitle}
                                                    style={{
                                                        fontWeight: 600,
                                                        textTransform: "uppercase",
                                                    }}>
                                                    {paymentData.merchantName}
                                                </span>
                                            </h3>
                                        ) : (
                                            ""
                                        )}
                                    </Typography>
                                </Grid>
                                <Grid item xs={4}>
                                    <Typography
                                        style={{ textAlign: "right" }}
                                        className={styles.blueBoldLink}>
                                        <a
                                            className={classes.blueBoldLink}
                                            onClick={() =>
                                                cancelRecurringPayment({
                                                    recurringToken: paymentData.token,
                                                    status: "CANCELLED",
                                                })
                                            }>
                                            {pageTexts.cancelBtnTxt}
                                        </a>
                                    </Typography>
                                </Grid>
                            </Grid>
                        </Grid>
                        {/* <Grid item xs={6}>
            {paymentData.invoiceType === "PREAUTH" ?
              <Typography variant="body2">
                {pageTexts.preAuthAmountMsg}:
              </Typography>
            :
              <Typography variant="body2">
                {pageTexts.nextPaymentMsg}:
              </Typography>
            }
          </Grid>
          <Grid item xs={6}>
            {paymentData.invoiceType === "PREAUTH" ?
              <Typography title={renderCurrency(paymentData.approvedAmount, paymentData.currency, "16px")} align="right" className={styles.darkBoldText}>
                {renderCurrency(paymentData.approvedAmount, paymentData.currency, "16px")}
              </Typography>
            :
              <Typography title={moment(paymentData.nextDueDate).format("MMM DD, YYYY")} align="right" className={styles.darkBoldText}>
                {moment(paymentData.nextDueDate).format("MMM DD, YYYY")}
              </Typography>
            }
          </Grid> */}
                        {/* Amount Section: Show Invoice Amount if fixAmount exists, else Max Amount */}
                        <Grid item xs={6}>
                            <Typography variant="body2" className={classes.subTitle}>
                                {pageTexts.amountMsg}:
                            </Typography>
                        </Grid>
                        <Grid item xs={6}>
                            <Typography align="right" className={classes.subValues}>
                                {isCrypto(paymentData.currency)
                                    ? renderCurrency(
                                          paymentData.fixAmount != null && paymentData.fixAmount !== undefined && paymentData.frequency !== "NONE"
                                              ? paymentData.fixAmount
                                              : paymentData.maxAmount,
                                          paymentData.currency,
                                          "14px",
                                          null,
                                          true
                                      )
                                    : renderCurrency(
                                          paymentData.fixAmount != null && paymentData.fixAmount !== undefined && paymentData.frequency !== "NONE"
                                              ? paymentData.fixAmount
                                              : paymentData.maxAmount,
                                          paymentData.currency,
                                          "14px"
                                      )}
                            </Typography>
                        </Grid>
                        {/* <Grid item xs={6}>
                <Typography variant="body2">
                  {pageTexts.paymentFrequency}:
                </Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography align="right" className={styles.darkBoldText}>
                  {paymentData.frequency}:
                </Typography>
              </Grid> */}

                        <Grid item xs={5}>
                            <Typography variant="body2" className={classes.subTitle}>
                                {pageTexts.expiresOn}:
                            </Typography>
                        </Grid>
                        <Grid item xs={7}>
                            {paymentData.invoiceType === "PREAUTH" ? (
                                <Typography
                                    title={moment
                                        .utc(paymentData.expiry)
                                        .local()
                                        .format("MMM DD, YYYY")}
                                    align="right"
                                    className={classNames([classes.subValues])}>
                                    {moment.utc(paymentData.expiry).local().format("MMM DD, YYYY")}
                                </Typography>
                            ) : (
                                <Typography
                                    title={moment(paymentData.expiry).format("MMM DD, YYYY")}
                                    align="right"
                                    className={classNames([classes.subValues])}>
                                    {moment(paymentData.expiry).format("MMM DD, YYYY")}
                                </Typography>
                            )}
                        </Grid>
                    </Grid>
                    <Box my={1}>
                        <Typography className={classes.description} title={paymentData.details}>
                            {paymentData.details}
                        </Typography>
                    </Box>
                    {/* {validThumbnail(paymentData.thumbnail) &&
          <div className={classes.thumbnailBox}>
            <div className={classes.thumbnail} style={{backgroundImage: `url('${paymentData.thumbnail}')`}}></div>
          </div>
        }
        <div className={classes.detailBox} style={{width: (validThumbnail(paymentData.thumbnail) ? "200px" : "250px")}}>
          {paymentData.merchantName ? <Typography className={classes.detail} title={paymentData.merchantName}><span style={{fontWeight: 600}}>{paymentData.merchantName}</span></Typography> : ''}
          {paymentData.nextDueDate ? <Typography className={classes.detail}><span style={{fontWeight: 600}}>Next Payment Due:</span> <span title={moment(paymentData.nextDueDate).format("MMM DD, YYYY")}>{moment(paymentData.nextDueDate).format("MMM DD, YYYY")}</span></Typography> : ''}
          {paymentData.maxAmount ? <Typography className={classes.detail}><span style={{fontWeight: 600}}>Max Amount:</span> <span title={`${paymentData.currency} ${displayAmount(paymentData.maxAmount)}`}>{renderCurrency(paymentData.maxAmount, paymentData.currency)}</span></Typography> : ''}
          {paymentData.fixAmount ? <Typography className={classes.detail}><span style={{fontWeight: 600}}>Amount:</span> <span title={`${paymentData.currency} ${displayAmount(paymentData.fixAmount)}`}>{renderCurrency(paymentData.fixAmount, paymentData.currency)}</span></Typography> : ''}
          {(paymentData.remainingAmt || paymentData.remainingAmt == 0) ? <Typography className={classes.detail}><span style={{fontWeight: 600}}>Remaining Amount:</span> <span title={`${paymentData.currency} ${displayAmount(paymentData.remainingAmt)}`}>{renderCurrency(paymentData.remainingAmt, paymentData.currency)}</span></Typography> : ''}
          {(paymentData.frequency && paymentData.frequency != "NONE") ? <Typography className={classes.detail}><span style={{fontWeight: 600}}>Payment Interval:</span> <span title={paymentData.frequency}>{paymentData.frequency}</span></Typography> : ''}
          {paymentData.expiry ? <Typography className={classes.detail}><span style={{fontWeight: 600}}>Expiry:</span> <span title={moment(paymentData.expiry).format("MMM DD, YYYY")}>{moment(paymentData.expiry).format("MMM DD, YYYY")}</span></Typography> : ''}
          {paymentData.details ? <Typography className={classes.detail}> <span title={paymentData.details}>{paymentData.details}</span></Typography> : ''}
          <div className={classes.cancelLink}>
            <a
              style={{ color:"rgb(24, 194, 238)",cursor: "pointer", fontSize: "14px" }}
              onClick={() => cancelRecurringPayment({recurringToken: paymentData.token, status: "CANCELLED"})}>
              Cancel
            </a>
          </div>
        </div> */}
                </div>
            ) : null}
            {paymentData.invoiceType == "PREAUTH" && paymentData.status == "ACTIVE" ? (
                <div className={styles.greyListContainer}>
                    <Grid container>
                        <Grid item xs={12}>
                            <Grid container>
                                <Grid item xs={8}>
                                    <Typography variant="body2">
                                        {paymentData.merchantName ? (
                                            <h3
                                                style={{ margin: 0 }}
                                                title={paymentData.merchantName}>
                                                <span
                                                    className={classes.mainTitle}
                                                    style={{
                                                        fontWeight: 600,
                                                        textTransform: "uppercase",
                                                    }}>
                                                    {paymentData.merchantName}
                                                </span>
                                            </h3>
                                        ) : (
                                            ""
                                        )}
                                    </Typography>
                                </Grid>
                            </Grid>
                        </Grid>
                        {/* <Grid item xs={6}>
      {paymentData.invoiceType === "PREAUTH" ?
        <Typography variant="body2">
          {pageTexts.preAuthAmountMsg}:
        </Typography>
      :
        <Typography variant="body2">
          {pageTexts.nextPaymentMsg}:
        </Typography>
      }
    </Grid>
    <Grid item xs={6}>
      {paymentData.invoiceType === "PREAUTH" ?
        <Typography title={renderCurrency(paymentData.approvedAmount, paymentData.currency, "16px")} align="right" className={styles.darkBoldText}>
          {renderCurrency(paymentData.approvedAmount, paymentData.currency, "16px")}
        </Typography>
      :
        <Typography title={moment(paymentData.nextDueDate).format("MMM DD, YYYY")} align="right" className={styles.darkBoldText}>
          {moment(paymentData.nextDueDate).format("MMM DD, YYYY")}
        </Typography>
      }
    </Grid> */}
                        {/* Amount Section: Show Invoice Amount if fixAmount exists, else Max Amount */}
                        <Grid item xs={6}>
                            <Typography variant="body2" className={classes.subTitle}>
                                {pageTexts.amountMsg}:
                            </Typography>
                        </Grid>
                        <Grid item xs={6}>
                            <Typography align="right" className={classes.subValues}>
                                {isCrypto(paymentData.currency)
                                    ? renderCurrency(
                                          paymentData.fixAmount != null && paymentData.fixAmount !== undefined && paymentData.frequency !== "NONE"
                                              ? paymentData.fixAmount
                                              : paymentData.maxAmount,
                                          paymentData.currency,
                                          "14px",
                                          null,
                                          true
                                      )
                                    : renderCurrency(
                                          paymentData.fixAmount != null && paymentData.fixAmount !== undefined && paymentData.frequency !== "NONE"
                                              ? paymentData.fixAmount
                                              : paymentData.maxAmount,
                                          paymentData.currency,
                                          "14px"
                                      )}
                            </Typography>
                        </Grid>
                        {/* <Grid item xs={6}>
          <Typography variant="body2">
            {pageTexts.paymentFrequency}:
          </Typography>
        </Grid>
        <Grid item xs={6}>
          <Typography align="right" className={styles.darkBoldText}>
            {paymentData.frequency}:
          </Typography>
        </Grid> */}

                        <Grid item xs={5}>
                            <Typography variant="body2" className={classes.subTitle}>
                                {pageTexts.expiresOn}:
                            </Typography>
                        </Grid>
                        <Grid item xs={7}>
                            {paymentData.invoiceType === "PREAUTH" ? (
                                <Typography
                                    title={moment
                                        .utc(paymentData.expiry)
                                        .local()
                                        .format("MMM DD, YYYY")}
                                    align="right"
                                    className={classNames([classes.subValues])}>
                                    {moment.utc(paymentData.expiry).local().format("MMM DD, YYYY")}
                                </Typography>
                            ) : (
                                <Typography
                                    title={moment(paymentData.expiry).format("MMM DD, YYYY")}
                                    align="right"
                                    className={classNames([classes.subValues])}>
                                    {moment(paymentData.expiry).format("MMM DD, YYYY")}
                                </Typography>
                            )}
                        </Grid>
                    </Grid>
                    <Box my={1}>
                        <Typography className={classes.description} title={paymentData.details}>
                            {paymentData.details}
                        </Typography>
                    </Box>
                </div>
            ) : null}
        </>
    );
};

export default RecurringPaymentCell;
