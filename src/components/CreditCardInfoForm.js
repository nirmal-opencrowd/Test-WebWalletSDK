import React from 'react';
import { Grid, TextField, Typography, makeStyles } from '@material-ui/core';

const useStyles = makeStyles(() => ({
    textFieldMargin: {
        marginTop: "10px",
    },
    smallInput : {
        width:"49%",
    },
    errText: {
        color: "#E42131"
    }
}))

const CreditCardInfoForm = ({setCreditCardFormValues, cardInfoErr}) => {
    const [name, setName] = React.useState("");
    const [cardNumber, setCardNumber] = React.useState("");
    const [expiryMonth, setExpiryMonth] = React.useState("");
    const [expiryYear, setExpiryYear] = React.useState("");
    const [cvc, setCvc] = React.useState("");
    const [zipCode, setZipCode] = React.useState("");

    const classes = useStyles();

    const handleCCNumber = (event) => {
        let ccNumber = event.target.value ? event.target.value.replace(/\D/g, '') : "";
        if (ccNumber.length > 16) {
          ccNumber = ccNumber.slice(0, 16);
        }
        const ccParts = ccNumber.match(/.{1,4}/g);
        setCardNumber(ccParts ? ccParts.join(' ') : "");
      }

    React.useEffect(() => {
        setCreditCardFormValues({name, cardNumber: cardNumber.replace(/ /g, '') , expiryMonth, expiryYear, cvc, zipCode})
    } , [name, cardNumber, expiryMonth, expiryYear, cvc, zipCode])


    return (
        <div>
            <TextField
                className={classes.textFieldMargin}
                label="Name on Card"
                onChange={(e) => setName(e.target.value)}
                size="small"
                value={name}
                variant="outlined"
                fullWidth
                error={!!cardInfoErr.name}
            />
            {cardInfoErr.name && <Typography className={classes.errText} variant='caption text'>{cardInfoErr.name}</Typography>}
            <TextField
                className={classes.textFieldMargin}
                label="Card Number"
                onChange={handleCCNumber}
                size="small"
                value={cardNumber}
                variant="outlined"
                fullWidth
                error={!!cardInfoErr.cardNumber}
            />
            {cardInfoErr.cardNumber && <Typography className={classes.errText} variant='caption text'>{cardInfoErr.cardNumber}</Typography>}
            <Grid container justifyContent='space-between' >
                <Grid item className={classes.smallInput}>
                    <TextField
                        className={classes.textFieldMargin}
                        label="MM"
                        onChange={(e) => setExpiryMonth(e.target.value)}
                        size="small"
                        value={expiryMonth}
                        variant="outlined"
                        fullWidth
                        error={!!cardInfoErr.expiryMonth}
                    />
                    {cardInfoErr.expiryMonth && <Typography className={classes.errText} variant='caption text'>{cardInfoErr.expiryMonth}</Typography>}
                </Grid>
                <Grid item className={classes.smallInput}>
                    <TextField
                        className={classes.textFieldMargin}
                        label="YYYY"
                        onChange={(e) => setExpiryYear(e.target.value)}
                        size="small"
                        value={expiryYear}
                        variant="outlined"
                        fullWidth
                        error={!!cardInfoErr.expiryYear}
                    />
                    {cardInfoErr.expiryYear && <Typography className={classes.errText} variant='caption text'>{cardInfoErr.expiryYear}</Typography>}
                </Grid>
            </Grid>
            <Grid container justifyContent='space-between' >
                <Grid item className={classes.smallInput}>
                    <TextField
                        className={classes.textFieldMargin}
                        label="Security Code"
                        onChange={(e) => setCvc(e.target.value)}
                        size="small"
                        value={cvc}
                        variant="outlined"
                        fullWidth
                        error={!!cardInfoErr.cvc}
                    />
                    {cardInfoErr.cvc && <Typography className={classes.errText} variant='caption text'>{cardInfoErr.cvc}</Typography>}
                </Grid>
                <Grid item className={classes.smallInput}>
                    <TextField
                        className={classes.textFieldMargin}
                        label="Zip Code"
                        onChange={(e) => setZipCode(e.target.value)}
                        size="small"
                        value={zipCode}
                        variant="outlined"
                        fullWidth
                        error={!!cardInfoErr.zipCode}
                    />
                    {cardInfoErr.zipCode && <Typography className={classes.errText} variant='caption text'>{cardInfoErr.zipCode}</Typography>}
                </Grid>
            </Grid>
        </div>
    )
}

export default CreditCardInfoForm