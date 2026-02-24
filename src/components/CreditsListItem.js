import React from "react";
import Divider from '@material-ui/core/Divider';
import { isCrypto } from "../utils/utils";
import { renderCurrency } from "../utils/currency";
import styles from "./../styles/common.module.scss";
import txnStyles from "./../styles/transactions.module.scss";
import ArrowForwardIosIcon from '@material-ui/icons/ArrowForwardIos';
import { Grid, Typography } from "@material-ui/core";
import moment from "moment";

const moreTxnLink = {
  clear: "both",
  color:"#18C2EE",
  cursor: "pointer",
  fontSize: "1.15em",
  margin: "0 auto",
  overflow: "hidden",
  paddingTop: "5px",
  textAlign: "center",
  textDecoration: "underline",
  textOverflow: "ellipsis",
  width: "80%",
  whiteSpace: "nowrap",
};

const CreditsListItem = ({ transaction, viewMerchantCredits }) => {
    const [params, setParams] = React.useState({});

    React.useEffect(() => {
        let p = {};
        if (transaction.shareURL) {
            if (transaction.shareURL.indexOf("?") !== -1) {
                const queryString = transaction.shareURL.split("?")[1];
                p = Object.fromEntries(new URLSearchParams(queryString).entries());
            }
        }
        if (transaction.purchaseURL) {
            const queryString = transaction.purchaseURL.split("?")[1];
            p = { ...p, ...Object.fromEntries(new URLSearchParams(queryString).entries()) };
        }
        if (transaction.thumbnail) {
          p = {...p, thumbnail: transaction.thumbnail};
        }
        if (Object.entries(p).length > 0) {
            setParams(p);
        }
    }, [transaction]);

    const creditsFromMerchant = (event) => {
        event.stopPropagation();
        viewMerchantCredits(transaction);
    };

    return (
      <div>
        {(transaction.numOfTxns && transaction.numOfTxns > 1) ?
          <Grid container className={txnStyles.numOfTxnContainer}>
            <Grid item xs={6}>
              <Typography className={styles.upperCase}>{transaction.merchantOrganiationName}</Typography>
            </Grid>
            <Grid item xs={6}  onClick={creditsFromMerchant}>
              <Typography align="right" className={styles.blueBoldLink}>+{(transaction.numOfTxns - 1)} more</Typography>
            </Grid>
          </Grid>
          : <br />}
        <div className={styles.greyListContainer}>
          <Grid container alignItems="center">
            <Grid item xs={7}>
              <h3>{transaction.merchantOrganiationName}</h3>
              <Typography className={styles.mediumSizedText}>{moment(transaction.createTimeEpoch * 1000).format("MMM DD YYYY hh:mm A")}</Typography>
            </Grid>
            <Grid item xs={5}>
              <div className={txnStyles.amountContainer}>
                <span className={txnStyles.amount} style={{paddingLeft: "3px"}}>{
                  isCrypto(transaction.currency)
                    ?
                    renderCurrency(transaction.amount, transaction.currency, "16px", null, true)
                    :
                    renderCurrency(transaction.amount, (transaction.currency == "DCT" ? "USD" : transaction.currency), "16px")
                }</span>
              </div>
            </Grid>
            <Divider className={styles.divider} />
            <div style={{ clear: "both"}}>
              <React.Fragment>
                {params.thumbnail ? (
                  <div>
                    <div style={{ width: "175px", float: "left" }}>
                      <p style={{ textOverflow: "ellipsis", overflow: "hidden", display: "inline-block", maxHeight: "53px", fontSize: "1.15em", whiteSpace: "nowrap", width: "100%" }} title={transaction.itemId}>{transaction.itemId}</p>
                      {transaction.transactionType == "Refund" ?
                        <div style={{ textOverflow: "ellipsis", overflow: "hidden", display: "inline-block", maxHeight: "53px", fontSize: "1em", whiteSpace: "nowrap", width: "100%" }}>Refunded</div>
                        :
                        <div style={{ textOverflow: "ellipsis", overflow: "hidden", display: "inline-block", maxHeight: "53px", fontSize: "1em", whiteSpace: "nowrap", width: "100%" }}>Purchased by: {`${transaction.refFisrtName} ${transaction.refLastName}`}</div>
                      }
                      {/* <div style={{display:"inline-block", marginBottom: "5px", marginTop:"5px"}}>
                                <i
                                    style={{
                                        fontWeight: "300",
                                        verticalAlign: "baseline",
                                    }}>
                                    {new Date(
                                        transaction.createTimeEpoch * 1000
                                    ).toLocaleString()}
                                </i>
                            </div> */}
                    </div>
                    {/* <div style={{ overflow: "hidden", display: "flex", justifyContent: "center", alignItems: "center", marginLeft: "10px", float: "right", marginBottom: "5px" }}>
                      <div style={{ height: "50px", width: "90px", backgroundPosition: "right", backgroundRepeat: "no-repeat", backgroundSize: "contain", backgroundImage: `url(${decodeURIComponent(params.thumbnail)})` }}></div>
                    </div> */}
                  </div>
                ) :
                  (
                    <div style={{ width: "175px", float: "left" }}>
                      <p style={{ textOverflow: "ellipsis", overflow: "hidden", display: "inline-block", marginBottom: "2px", maxHeight: "50px", fontSize: "1.15em", whiteSpace: "nowrap", width: "100%" }} title={transaction.itemId}>{transaction.itemId}</p>
                      {(transaction.transactionType == "Refund" || transaction.transactionType == "MerchantCredit") ?
                        <div style={{ textOverflow: "ellipsis", overflow: "hidden", display: "inline-block", maxHeight: "53px", fontSize: "1em", whiteSpace: "nowrap", width: "100%" }}>{transaction.transactionType == "MerchantCredit" ? "Credit" : "Refunded"}</div>
                        :
                        <div style={{ textOverflow: "ellipsis", overflow: "hidden", display: "inline-block", maxHeight: "53px", fontSize: "1em", whiteSpace: "nowrap", width: "100%" }}>Purchased by: {`${transaction.refFisrtName} ${transaction.refLastName}`}</div>
                      }
                      {/* <div style={{marginBottom: "5px", marginTop:"5px", width:"220px"}}>
                            <i
                                style={{
                                    fontWeight: "300",
                                    verticalAlign: "baseline",
                                }}>
                                {new Date(
                                    transaction.createTimeEpoch * 1000
                                ).toLocaleString()}

                            </i>
                        </div> */}
                    </div>
                  )
                }
              </React.Fragment>
            </div>
          </Grid>
        </div>
        {/* {(transaction.numOfTxns && transaction.numOfTxns > 1) ?
          <div style={{ ...moreTxnLink, ...(!params.thumbnail && { paddingTop: "15px" }) }} onClick={creditsFromMerchant}>
            <span>+{(transaction.numOfTxns - 1)} more from {transaction.merchantOrganiationName}</span>
          </div>
          : <br />} */}
      </div>
    );
};

export default CreditsListItem;
