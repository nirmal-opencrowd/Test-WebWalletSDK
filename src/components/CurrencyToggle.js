import React from "react";
import getSymbolFromCurrency from 'currency-symbol-map';
import { displayAmount, getCurrencyDecimal, isCrypto } from "../utils/utils";

const CurrencyToggle = ({hbarImageWidth="7px", hbarImageHeight="11px", fontSize="1em", size, amount, cryptoAmount, userCurrency, currency, invoiceCurrency, invoiceAmount, maxDecimalPlace = 4 }) => {
    const [currencyIn, setCurrencyIn] = React.useState("");
    React.useEffect(() => {
        function setUserCurrency() {
            const c = invoiceCurrency || currency || userCurrency;
            if (!c && currency && currency == "DCT") {
                c = currency
            } else if (!c) {
                c = userCurrency;
            }
            setCurrencyIn(c ? c : '');
        }
        setUserCurrency();
      }, []);

    return (
        <>
            { currencyIn ?
                <span>
                    {currencyIn === "HBAR" ? (
                        <div>
                            <img
                                style={{
                                    marginRight: "1px",
                                    width: hbarImageWidth,
                                    height: hbarImageHeight,
                                    display: "inline-block",
                                }}
                                src="./hbar_icon.png"
                                alt="HBAR"
                            />
                            <span
                                style={{
                                    fontSize: fontSize,
                                }}>
                                {displayAmount(invoiceAmount ? invoiceAmount : cryptoAmount, maxDecimalPlace)}
                            </span>
                        </div>
                    )
                    :
                        <>
                            {(currencyIn == "DCT") ?
                                <span style={{ fontSize: fontSize}}>${displayAmount(amount, maxDecimalPlace)} in Dropp Credits</span>
                            :
                                <span style={{ fontSize: fontSize}}>{(isCrypto(currencyIn)) ? `${currencyIn} ${displayAmount(invoiceAmount ? invoiceAmount : cryptoAmount, maxDecimalPlace)}` : `${getSymbolFromCurrency(currencyIn)}${displayAmount(invoiceAmount ? invoiceAmount : amount, maxDecimalPlace)}`}</span>
                            }
                        </>
                    }
                </span>
            : <span style={{ fontSize: fontSize }}>{displayAmount(invoiceAmount ? invoiceAmount : amount, maxDecimalPlace)}</span>}
        </>
    );
};

export default CurrencyToggle;
