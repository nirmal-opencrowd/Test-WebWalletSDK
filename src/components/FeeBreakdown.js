import React from 'react';
import { Accordion, AccordionDetails, AccordionSummary, Box, Divider, Grid, makeStyles, Typography } from '@material-ui/core';
import commonStyles from "./../styles/common.module.scss";
import { displayAmount, isCrypto } from '../utils/utils';
import { renderCurrency } from '../utils/currency';

const useStyles = makeStyles((theme) => ({
  nftDetails: {
    display: "inline-block",
    fontSize: "14px",
    overflow: "hidden",
    paddingLeft: "15px",
    verticalAlign: "middle",
    width: "125px"

  },
  greyBackground : {
    backgroundColor:"#f9f9f9",
    padding:"8px"
  },
  accordion: {
    backgroundColor: "#f9f9f9",
    // border: "1px solid #a9a9a9",
    boxShadow: "none",
    width: "100%",
  },
  accordionDetails: {
    padding: "0 16px 16px",
    marginTop: "-14px",
    display: "block",
  },
  noAccordionBox: {
    margin: "1em",
    padding: "1em",
  }
}));

const FeeBreakdown = (props) => {
    const classes = useStyles();
    const {showAccordion, pageTexts, heading, offerCode, invoiceAmount, amount, currency, invoiceCurrency, cryptoAmount, droppCredits, discountedAmount, receiptData, merchantOrganiationName, amountDiscounted } = props;
    const customerData = receiptData ? receiptData.customerData : null;

    function truncateToFourDecimals(num) {
        return (Math.floor(num * 10000) / 10000).toFixed(4);
    }
        const payableAmount =
        discountedAmount && discountedAmount > 0
            ? discountedAmount
            : invoiceAmount;
    const renderContentDetails = () => {
        return (
            <div>
                {
                    customerData && customerData.length ? customerData.map((item, index) => {
                        return (
                            <Grid container spacing={2} key={index}>
                                <Grid item xs={6}>
                                    <Box pt={1}>
                                        <Typography>
                                            {item.quantity} {item.name}
                                        </Typography>
                                    </Box>
                                </Grid>
                                <Grid item xs={6}>
                                    <Box pt={1}>
                                        <Typography align="right">
                                            {renderCurrency(item.quantity * item.price, invoiceCurrency, null, null, isCrypto(invoiceCurrency))}
                                        </Typography>
                                    </Box>
                                </Grid>
                            </Grid>
                        )
                    })
                    :
                    <Grid container spacing={2}>
                        <Grid item xs={6}>
                            <Box pt={1}>
                                <Typography title={merchantOrganiationName} className={commonStyles.ellipsisAfterThreeLines}>
                                    {merchantOrganiationName}
                                </Typography>
                            </Box>
                        </Grid>
                        <Grid item xs={6}>
                            <Box pt={1}>
                                <Typography align="right">
                                    {renderCurrency(invoiceAmount, invoiceCurrency, null, null, isCrypto(invoiceCurrency))}
                                </Typography>
                            </Box>
                        </Grid>
                    </Grid>
                }
                {
                    receiptData && receiptData.discountAmount ?
                        <Grid container spacing={2}>
                            <Divider className={commonStyles.divider}/>
                            <Grid item xs={6}>
                                <Box pt={1}>
                                    <Typography>
                                        {pageTexts && pageTexts.discountText || "Discount"}
                                    </Typography>
                                </Box>
                            </Grid>
                            <Grid item xs={6}>
                                <Box pt={1}>
                                    <Typography align="right">
                                        -{renderCurrency(receiptData.discountAmount, invoiceCurrency, null, null, isCrypto(invoiceCurrency))}
                                    </Typography>
                                </Box>
                            </Grid>
                        </Grid> : ""
                }
                {
                    receiptData && receiptData.tax ?
                        <Grid container spacing={2}>
                            <Grid item xs={6}>
                                <Box pt={1}>
                                    <Typography>
                                        {pageTexts && pageTexts.taxText || "Tax"}
                                    </Typography>
                                </Box>
                            </Grid>
                            <Grid item xs={6}>
                                <Box pt={1}>
                                    <Typography align="right">
                                        {renderCurrency(receiptData.tax, invoiceCurrency, null, null, isCrypto(invoiceCurrency))}
                                    </Typography>
                                </Box>
                            </Grid>
                        </Grid> : ""
                }
                {
                    receiptData && receiptData.tip ?
                        <Grid container spacing={2}>
                            <Grid item xs={6}>
                                <Box pt={1}>
                                    <Typography>
                                        {pageTexts && pageTexts.tipText || "Tip"}
                                    </Typography>
                                </Box>
                            </Grid>
                            <Grid item xs={6}>
                                <Box pt={1}>
                                    <Typography align="right">
                                        {renderCurrency(receiptData.tip, invoiceCurrency, null, null, isCrypto(invoiceCurrency))}
                                    </Typography>
                                </Box>
                            </Grid>
                        </Grid> : ""
                }
                {
                    offerCode || invoiceCurrency !== currency ?
                    <Grid container spacing={2}>
                        {/* <Divider className={commonStyles.divider}/> */}
                        <hr className={commonStyles.horizontalLine} />
                        <Grid item xs={6}>
                            <Box pt={1}>
                                <Typography className={`${commonStyles.mediumSizedText} ${commonStyles.darkBoldText} ${commonStyles.upperCase}`}>
                                    {pageTexts && pageTexts.totalText || "Total"}
                                </Typography>
                            </Box>
                        </Grid>
                        <Grid item xs={6}>
                            <Box pt={1}>
                                <Typography align="right" className={`${commonStyles.darkBoldText}`}>
                                    {renderCurrency(invoiceAmount, invoiceCurrency, null, null, isCrypto(invoiceCurrency))}
                                </Typography>
                            </Box>
                        </Grid>
                    </Grid> : ""
                }
                {
                    offerCode ? <Grid container>
                        <Grid item xs={8}>
                            <Box pt={1}>
                                <Typography>
                                    {pageTexts && pageTexts.offerAppliedText || "Offer applied" } ({pageTexts && pageTexts.offerCodeTxt || "Offer code"}: {offerCode})
                                </Typography>
                            </Box>
                        </Grid>
                        <Grid item xs={4}>
                            <Box pt={1}>
                                <Typography align="right">
                                    -{renderCurrency(amountDiscounted || (invoiceAmount - amount), invoiceCurrency, null, null, isCrypto(invoiceCurrency))}
                                </Typography>
                            </Box>
                        </Grid>
                    </Grid> : ""
                }
                {/* <Divider className={commonStyles.divider}/> */}
                {

                    droppCredits === 0 || droppCredits/(Math.pow(10, 4)) !== invoiceAmount ?
                    <Grid container>
                        <hr className={commonStyles.horizontalLine}/>
                        <Grid container spacing={2}>
                            <Grid item xs={6}>
                                <Box pt={1}>
                                    <Typography className={`${commonStyles.mediumSizedText} ${commonStyles.darkBoldText} ${commonStyles.upperCase}`}>
                                        {pageTexts && pageTexts.youPaidText || `You pay ${currency !="USD" ? `(in ${currency})`: "" }`}
                                    </Typography>
                                </Box>
                            </Grid>
                            <Grid item xs={6}>
                                <Box pt={1}>
                                    <Typography align="right" className={`${commonStyles.darkBoldText}`}>
                                       {/* {truncateToFourDecimals(cryptoAmount)} {isCrypto(invoiceCurrency) ? invoiceCurrency : currency} */}
                                       {isCrypto(invoiceCurrency)
                                        ? renderCurrency(payableAmount, invoiceCurrency, null, null, true)
                                        : renderCurrency(payableAmount, currency, null, null, isCrypto(currency))
                                        }{" "}

                                    </Typography>

                                        {
                                            !isCrypto(invoiceCurrency) && isCrypto(currency) ? <Typography align="right">({renderCurrency(discountedAmount ?? invoiceAmount, invoiceCurrency, null, null, isCrypto(invoiceCurrency))})</Typography> : ""
                                        }
                                </Box>
                            </Grid>
                        </Grid>
                    </Grid> : ""
                }
            </div>
        )
    }
    return (<div>
        { showAccordion ? <Accordion defaultExpanded className={classes.accordion} aria-setsize={"large"}>
            <AccordionSummary
                expandIcon={showAccordion ? <img src="./arrowDown.png" alt="show" />: ""}
                aria-controls="panel1a-content"
                id="panel1a-header"
            >
                <Typography className={`${commonStyles.darkBoldText} ${commonStyles.largeSizedText}`}>{ heading }</Typography>
            </AccordionSummary>
            <AccordionDetails className={`${commonStyles.mediumSizedText} ${classes.accordionDetails}`}>
                { renderContentDetails() }
            </AccordionDetails>
        </Accordion> : <Box className={`${classes.noAccordionBox}`}>
            { renderContentDetails() }
        </Box> }
    </div>
    )
}

export default FeeBreakdown