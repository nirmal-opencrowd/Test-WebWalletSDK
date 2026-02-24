import { FormControl, InputLabel, MenuItem, Select, makeStyles } from '@material-ui/core'
import React from 'react'
import commonStyles from "./../../styles/common.module.scss";


const useStyles = makeStyles((theme) => ({
    formControl: {
        margin: "8px 0px",
        minWidth: 120,
    },
    selectEmpty: {
        marginTop: theme.spacing(2),
    },
    selectField: {
        borderRadius: '20px',
        '& .MuiOutlinedInput-root': {
            borderRadius: '20px',
            color: "grey",
        },
    },
}));

const TradeCurrencyDropdown = ({cryptoWallets, tradeCurrency, setTradeCurrency, reviewNFT}) => {
    const classes = useStyles();

    const handleChange = (event) => {
        setTradeCurrency(event.target.value);
    };
    return (
        <div>
            <FormControl disabled={!reviewNFT} size='small' variant="outlined" className={classes.formControl}>
                <InputLabel id="demo-simple-select-outlined-label" >Currency</InputLabel>
                {cryptoWallets && cryptoWallets.length ?
                    <Select
                        className={`${commonStyles.inputFieldWithGreyBg} ${classes.selectField}`}
                        // style={{borderRadius: "20px"}}
                        labelId="demo-simple-select-outlined-label"
                        id="demo-simple-select-outlined"
                        value={tradeCurrency}
                        onChange={handleChange}
                        label="Trade Currency"
                    >

                        {cryptoWallets.map((item) => {
                            return (
                                <MenuItem value={item.walletId.currencyCode}>{item.walletId.currencyCode}</MenuItem>
                            )
                        })}
                    </Select>
                : ""}
            </FormControl>
        </div>
    )
}

export default TradeCurrencyDropdown;