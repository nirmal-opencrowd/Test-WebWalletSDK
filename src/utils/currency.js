import React from "react";
import getSymbolFromCurrency from 'currency-symbol-map';
import { displayAmount } from "./utils";

export const renderCurrency = (amt, currency, iconSize, maxDecimalPlaces, currencyAsSuffix) => {
    let amount = parseFloat(amt).toFixed(maxDecimalPlaces ? maxDecimalPlaces : 4);
    if (currency === "HBAR") {
        return (
            <>
                {currencyAsSuffix ?
                    <React.Fragment>
                        {displayAmount(amount, maxDecimalPlaces, true)}
                        <img
                            style={{
                                height: `${iconSize ? iconSize : "10px"}`,
                                verticalAlign: "baseline",
                                paddingLeft: "2px",
                            }}
                            src="./hbar_icon.png"
                        />
                    </React.Fragment>
                :
                    <React.Fragment>
                        <img
                            style={{
                                height: `${iconSize ? iconSize : "10px"}`,
                                verticalAlign: "baseline",
                                paddingRight: "2px",
                            }}
                            src="./hbar_icon.png"
                        />
                        {displayAmount(amount, maxDecimalPlaces, true)}
                    </React.Fragment>
                }
            </>

        );
    } else {
        const currencySymbol = getSymbolFromCurrency(currency);
        return currencyAsSuffix ? `${displayAmount(amount, maxDecimalPlaces)}${currencySymbol ? currencySymbol : " " + currency}` : `${currencySymbol ? currencySymbol : currency + " "}${displayAmount(amount, maxDecimalPlaces)}`;
    }
};
