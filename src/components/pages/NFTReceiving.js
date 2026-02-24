import React, { useEffect } from 'react';
import ArrowBackOutlinedIcon from '@material-ui/icons/ArrowBackOutlined';
import { makeStyles } from '@material-ui/core/styles';
import Typography from "@material-ui/core/Typography";
import "../../NFTcollections.css";
import TextField from '@material-ui/core/TextField';
import '../../NFTcollections.css';
import * as api from "./../../api";
import { decodeBase64, getCurrencyDecimal, stringToHederaAccount, displayAmount, getCleanNFTUrl, hederaAccountToString, getUSDCTokenId, getCurrencyDecimalPlaces, getEncodedTransactionBytes } from "./../../utils/utils";
import { renderCurrency } from "../../utils/currency";
import {proto} from "@hashgraph/proto";
import * as p2phelper from "./../../utils/p2phelper.js";
import { MAX_HEDERA_TXN_FEE, COMMON_ERROR_MSG } from "./../../utils/constants";
import forge from "node-forge";
import * as localstorage from "./../../utils/local-storage";
import Box from '@material-ui/core/Box';
import Modal from '@material-ui/core/Modal';
import { Accordion, AccordionDetails, AccordionSummary, CircularProgress, Divider, Grid, Table, TableBody, TableCell, TableRow } from '@material-ui/core';
import CancelOutlinedIcon from '@material-ui/icons/CancelOutlined';
import CheckCircleOutlineIcon from '@material-ui/icons/CheckCircleOutline';
import classNames from 'classnames';
import commonStyles from './../../styles/common.module.scss';
import Copy from './Copy';

const ed25519 = forge.pki.ed25519;

const useStyles = makeStyles((theme) => ({
    detailContainer: {
        marginTop: "30px",
        // maxHeight: "500px",
        paddingLeft: "20px",
        paddingRight: "20px",
        overflow:"scroll"
    },
    button: {
        backgroundColor: "#18c2ee",
        color: "#FFFFFF"
    },
    container: {
        paddingLeft:"8px",
        paddingTop: "10px",
    },
    keyField: {
        width: "100%",
    },
    multilineInput: {
        '& .MuiInput-multiline': {
            paddingTop: 0
        }
    },
    modalContainer: {
        backgroundColor: '#FFFFFF',
        border: 0,
        left: '10%',
        padding: "15px",
        position: 'absolute',
        top: '30%',
        width: 250,
    },
    ctrlBtns: {
        marginTop: "5px",
        textAlign: "right",
    },
    table: {
        border: 'none',
        borderCollapse: 'collapse',
    },
    headings: {
        height: "35px"
    },
    cell: {
        border: 'none',
        fontSize: '15px',
        padding: '10px 0px',
        verticalAlign: "top",
    },
    keyCell: {
        border: 'none',
        fontSize: '15px',
        verticalAlign: "top",
        width: "56%",
    },
    valueCell: {
        paddingLeft: "5px"
    },
    tableRow: {
        padding: "5px 0px"
    },
    greyBackground: {
        backgroundColor: "#f9f9f9",
        borderRadius: "16px",
        marginTop: "30px",
        padding: "8px",
    },
    stepCirle: {
        border: "none",
        borderRadius: "100%",
        margin: "auto",
        textAlign: "center",
        width: "40px",
        height:"40px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center"
    },
    marginY : {
        margin:"5px 0px"
    },
    loader : {
        alignItems:"center",
        backgroundColor: '#000000',
        border: 0,
        color:"#18c2ee",
        display:"flex",
        height:"100vh",
        justifyContent: "center",
        opacity:"0.5",
        width: "100%",
    },
    accordion: {
        backgroundColor: "#f9f9f9",
        border: "1px solid #a9a9a9",
        boxShadow: "none",
        width: "100%",
    },
    accordionDetails: {
        padding: "0 16px 16px",
        marginTop: "-14px",
        display: "block",
    },
    root: {
        display: 'flex',
        flexWrap: 'wrap',
    },
    roundedInputField: {
        "& .MuiOutlinedInput-root": {
            borderRadius: "20px"
        }
    },
}));

const NFTReceiving = ({ setCurrentScreen, userDetails, workingEnv, setFooterObj, setFunctionCallOnBack}) => {
    const classes = useStyles();
    const [tradeInfo, setTradeInfo] = React.useState(null);
    const [droppFeeDetails, setDroppFeeDetails] = React.useState(null);
    const [exchangeRate, setExchangeRate] = React.useState(null);
    const [tradeID, setTradeID] = React.useState(null);
    const [scheduleTxnBody, setScheduleTxnBody] = React.useState(null);
    const [nftDetails, setNftDetails] = React.useState(null);
    const [nftTransfer, setNftTransfer] = React.useState(null);
    const [tradePrice, setTradePrice] = React.useState(0);
    const [expirationTime, setExpirationTime] = React.useState(null);
    const [expirationErr, setExpirationErr] = React.useState(null);
    const [signatures, setSignatures] = React.useState({});
    const [droppNodeId, setDroppNodeId] = React.useState(0);
    const [nftFees, setNftFees] = React.useState({});
    const [balanceErr, setBalanceErr] = React.useState(null);
    const [scheduleSignFees, setScheduleSignFees] = React.useState(null);
    const [payerId, setPayerId] = React.useState(null);
    const [openSuccessModal, setOpenSuccessModal] = React.useState(false);
    const [backendErr, setBackendErr] = React.useState("");
    // const [imgUrl, setImageUrl] = React.useState(null);
    const [imgLoading, setImgLoading] = React.useState(true);
    const [NFTTokenId, setNFTTokenId] = React.useState(null);
    // const [serialNumber, setSerialNumber] = React.useState(null);
    const [fixedFeesArr, setFixedFeeArr] = React.useState();
    const [royaltyFeesArr, setRoyaltyFeesArr] = React.useState();
    const [hederaTransactionFees, setHederaTransactionFees] = React.useState(null);
    const [activeStep, setActiveStep] = React.useState(1);
    const [infoFees, setInfoFees] = React.useState(null);
    const [nftTradeErr, setNftTradeErr] = React.useState(null);
    const [nftTradePass, setNftTradePass] = React.useState(null);
    const [tradeCurrency, setTradeCurrency] = React.useState(null);
    const [usdcTokenAcc, setUsdcTokenAcc] = React.useState(null);
    const [loading, setLoading] = React.useState(false);

    const tokenId = nftDetails && nftDetails.data && nftDetails.data.length ? nftDetails.data[0].token : null;
    const imgUrl = nftDetails && nftDetails.data && nftDetails.data.length ? getCleanNFTUrl(nftDetails.data[0].imageUrl) : null;
    const serialNumber = nftDetails && nftDetails.data && nftDetails.data.length ? nftDetails.data[0].serialNumber : null;
    const nftName = nftDetails && nftDetails.data && nftDetails.data.length ? nftDetails.data[0].name : null;

    const { SchedulableTransactionBody, ScheduleID, ScheduleSignTransactionBody, Timestamp, Transaction, TransactionID, TransactionBody, Duration, SignaturePair, SignatureMap, AccountID } = proto;

    let tradeErrArray = [];
    let tradePassArray = [];
    useEffect(() => {
        async function fetchExchangeRate() {
            let exRate = await api.fetchExchangeRate("USD", "HBAR");
            if (exRate) {
                setExchangeRate(exRate);
            }
        }

        async function getFeeDetails() {
            const res = await api.getFeeDetails();
            if (res && res.data && res.data.responseCode == 0) {
                setDroppFeeDetails(res.data.data);
                if (exchangeRate) {
                    setInfoFees(res.data.data.scheduleGetInfoFeeUSD / exchangeRate);
                }
            }
        }

        async function setUSDCToken() {
            const token = await getUSDCTokenId();
            setUsdcTokenAcc(token);
        }

        Promise.all([getFeeDetails(), fetchExchangeRate(), setUSDCToken()]);
    }, []);

    useEffect(() => {
        if (exchangeRate && droppFeeDetails && droppFeeDetails.scheduleSignFeeUSD) {
            let scheduleSignFeeHBAR = droppFeeDetails.scheduleSignFeeUSD / exchangeRate
            setScheduleSignFees(displayAmount(scheduleSignFeeHBAR));
            // setInfoFees(displayAmount((droppFeeDetails.scheduleGetInfoFeeUSD / exchangeRate)));
        }
    }, [exchangeRate, droppFeeDetails])

    useEffect(() => {
        if (tradeInfo && tradeInfo.expirationTime) {
            let timeDiff = ((tradeInfo.expirationTime * 1000) - new Date().getTime());
            setExpirationTime(Math.round((((timeDiff) % 86400000) % 3600000) / 60000)); // time remining in minutes
        }
    }, [tradeInfo]);

    useEffect(() => {
        setFunctionCallOnBack(() => backButtonHandler);
        switch (activeStep) {
            case 1:
                setFooterObj({primaryBtnText: "Review Trade", primaryFuncToCall: getScheduleTxnInfo, disabledPrimaryBtn: false})
                break;
            case 2:
                setFooterObj({primaryBtnText: "Next", primaryFuncToCall: () => setActiveStep(3), disabledPrimaryBtn: expirationErr || (nftTradeErr && nftTradeErr.length) ? true : false})
                break;
            case 3:
                setFooterObj({primaryBtnText: "Pay", primaryFuncToCall: signAndComplete, disabledPrimaryBtn: loading})
                break;
            default:
                break;
        }
        return () => {
            setFooterObj({})
          }
    }, [activeStep, expirationErr, nftTradeErr, loading, tradeID])



    useEffect(() => {
        async function fetchNFTInfo(tokenId, serialNumber) {
            const res = await api.getNFTInfo({ param: tokenId, serialNumber });
            if (res && res.data && res.data.responseCode == 0) {
                setNftDetails(res.data.data);
                api.resetUserDetails();
            }
        }

        async function fetchNFTFees(tokenId) {
            let response = await api.getNFTFees({ hhAccountID: stringToHederaAccount(tokenId) });
            if (response && response.data && response.data.responseCode == 0 && response.data.data.custom_fees) {
                setNftFees(response.data.data);
            }
        }

        async function updateSignatures() {
            const sign = await localstorage._get("_decrypted");
            if (sign && sign._decrypted) {
                setSignatures(sign._decrypted);
            }
        }

        async function fetchNodes() {
            let nodeDetails = await api.fetchNodes();
            const nodeArr = nodeDetails.data[0].nodeAccountId.split(".");
            const node = nodeArr[nodeArr.length - 1];
            setDroppNodeId(parseInt(node));
        }

        if (scheduleTxnBody && scheduleTxnBody.cryptoTransfer && scheduleTxnBody && scheduleTxnBody.cryptoTransfer.tokenTransfers && scheduleTxnBody.cryptoTransfer.tokenTransfers.length) {
            let tokenTransfer;
            let customTokenTransfer;
            let currency;
            const idParts = usdcTokenAcc.split(".");
            const usdcTokenNum = idParts[idParts.length - 1];
            for (let i = 0; i < scheduleTxnBody.cryptoTransfer.tokenTransfers.length; i++) {
                if (scheduleTxnBody.cryptoTransfer.tokenTransfers[i].nftTransfers && scheduleTxnBody.cryptoTransfer.tokenTransfers[i].nftTransfers.length) {
                    tokenTransfer = scheduleTxnBody.cryptoTransfer.tokenTransfers[i];
                } else if (scheduleTxnBody.cryptoTransfer.tokenTransfers[i].transfers && scheduleTxnBody.cryptoTransfer.tokenTransfers[i].transfers.length) {
                    const tmpTokenTransfer = scheduleTxnBody.cryptoTransfer.tokenTransfers[i];
                    customTokenTransfer = tmpTokenTransfer.transfers;
                    if (tmpTokenTransfer.token.tokenNum == usdcTokenNum) {
                        currency = "USDC"
                        setTradeCurrency(currency);
                    }
                }
            }
            const token = tokenTransfer.token;
            let tokenId = `${token.shard ? token.shard : 0}.${token.realm ? token.realm : 0}.${token.tokenNum ? token.tokenNum : 0}`;
            setNFTTokenId(tokenId);
            let serialNumber = tokenTransfer.nftTransfers[0].serialNumber;
            if(typeof serialNumber === "object") {
                serialNumber = serialNumber.low;
            }
            setNftTransfer(tokenTransfer.nftTransfers[0]);
            const transfer = scheduleTxnBody.cryptoTransfer.transfers;
            let amount = 0;
            if (transfer) {
                currency = "HBAR"
                setTradeCurrency(currency);
                for (let i = 0; i < transfer.accountAmounts.length; i++) {
                    if (transfer.accountAmounts[i].amount < 0) {
                        amount += Math.abs(transfer.accountAmounts[i].amount);
                        const acc = transfer.accountAmounts[i].accountID;
                        if (acc) {
                            setPayerId(`${acc.shard ? acc.shard : 0}.${acc.realm ? acc.realm : 0}.${acc.accountNum ? acc.accountNum : 0}`);
                        }
                    }
                }
            } else if (customTokenTransfer) {
                for (let i = 0; i < customTokenTransfer.length; i++) {
                    if (customTokenTransfer[i].amount < 0) {
                        amount += Math.abs(customTokenTransfer[i].amount);
                        const acc = customTokenTransfer[i].accountID;
                        if (acc) {
                            setPayerId(`${acc.shard ? acc.shard : 0}.${acc.realm ? acc.realm : 0}.${acc.accountNum ? acc.accountNum : 0}`);
                        }
                    }
                }
            }

            setTradePrice(amount ? (amount / getCurrencyDecimal(currency)) : 0);
            if (tokenId && serialNumber) {
                fetchNFTInfo(tokenId, serialNumber);
                fetchNFTFees(tokenId);
            }
            Promise.all([updateSignatures(), fetchNodes()]);
        }
    }, [scheduleTxnBody]);

    useEffect(() => {
        if (nftFees && nftFees.custom_fees && droppFeeDetails && exchangeRate && exchangeRate != 0) {
            setFixedFeeArr(nftFees.custom_fees.fixed_fees);
            setRoyaltyFeesArr(nftFees.custom_fees.royalty_fees);
            setHederaTransactionFees(droppFeeDetails.scheduleSignFeeUSD / exchangeRate);

        }
        if (NFTTokenId) {
            validate(NFTTokenId);
        }
    }, [nftFees, exchangeRate, droppFeeDetails, NFTTokenId]);

    // useEffect(() => {
    //     if (nftDetails && nftDetails.data && nftDetails.data.length) {
    //         setImageUrl(getCleanNFTUrl(nftDetails.data[0].imageUrl));
    //     }
    //     if (nftDetails && nftDetails.data && nftDetails.data.length) {
    //         setTokenId(nftDetails.data[0].token);
    //     }
    //     if (nftDetails && nftDetails.data && nftDetails.data.length) {
    //         setSerialNumber(nftDetails.data[0].serialNumber);
    //     }
    // }, [nftDetails])

    // useEffect(()=>{
    //     if(tradeInfo && tradeInfo.payerId){
    //         setPayerId(tradeInfo.payerId.split(" ")[1]);
    //     }
    // },[tradeInfo])

    useEffect(() => {
        setBalanceErr(null);
        setExpirationErr(null);
    }, [tradeID]);

    // const getNFTFeesInHbars = () => {
    //     let fixedHbarFees = 0;
    //     let royaltyHbarFees = 0;
    //     let fallbackFees = 0;
    //     let droppTradeFees = droppFeeDetails ? droppFeeDetails.feePercentage * tradePrice * 0.01 : 0;
    //     if (fixedFeesArr) {
    //         for (let i = 0; i < fixedFeesArr.length; i++) {
    //             if (!fixedFeesArr[i].denominating_token_id) {
    //                 fixedHbarFees += fixedFeesArr[i].amount;
    //             }
    //         }
    //     }
    //     if (royaltyFeesArr) {
    //         for (let i = 0; i < royaltyFeesArr.length; i++) {
    //             royaltyHbarFees += tradePrice ? royaltyFeesArr[i].amount.numerator / royaltyFeesArr[i].amount.denominator * tradePrice : 0
    //             if (royaltyFeesArr[i].fallback_fee && royaltyFeesArr[i].fallback_fee.denominating_token_id) {
    //                 fallbackFees += royaltyFeesArr[i].fallback_fee.amount;
    //             }
    //         }
    //     }
    //     return fixedHbarFees + royaltyHbarFees + fallbackFees + droppTradeFees + hederaTransactionFees;
    // }

    const tradeIdValidation = () => {
        let hasError = false;
        if (tradeID) {
            if ((tradeID.match(/^(0|(?:[1-9]\d*))\.(0|(?:[1-9]\d*))\.(0|(?:[1-9]\d*))?$/g) == null)) {
                setBalanceErr(`${tradeID} is an invalid trade Id`);
                hasError = true;
            }
            return !hasError;
        } else {
            setBalanceErr("Invalid Trade ID");
            hasError = true;
        }
    }

    const localValidation = () => {
        let hasError = false;
        if (payerId && (hederaAccountToString(userDetails.hhAccount) != payerId)) {
            setBalanceErr(`Only payer can get the details of this trade`);
            hasError = true;
        }
        return !hasError;
    }

    const getTotalAmtBuyerNeedToPay = () => {
        let obj = {"HBAR": 0};
        if (tradePrice && tradeCurrency == "USDC") {
            obj[usdcTokenAcc] = 0;
        }

        if (hederaTransactionFees) {
            obj["HBAR"] += hederaTransactionFees;
        }
        if (tradePrice && tradeCurrency == "HBAR") {
            obj["HBAR"] += tradePrice;
        }
        if (tradePrice && tradeCurrency == "USDC") {
            obj[usdcTokenAcc] += tradePrice;
        }
        if (royaltyFeesArr && royaltyFeesArr.length) {
            for (let i = 0; i < royaltyFeesArr.length; i++) {
                // if (tradePrice > 0 && royaltyFeesArr[i].amount && royaltyFeesArr[i].amount.numerator && royaltyFeesArr[i].amount.denominator) {
                //     const royaltyFeeInPercent = (royaltyFeesArr[i].amount.numerator/royaltyFeesArr[i].amount.denominator)*100;
                //     obj["HBAR"] += (tradePrice * royaltyFeeInPercent * 0.01);
                // }
                if (tradePrice == 0 && royaltyFeesArr[i].fallback_fee) {
                    if (royaltyFeesArr[i].fallback_fee.denominating_token_id) {
                        if (obj[royaltyFeesArr[i].fallback_fee.denominating_token_id]) {
                            obj[royaltyFeesArr[i].fallback_fee.denominating_token_id] += royaltyFeesArr[i].fallback_fee.amount;
                        } else {
                            obj[royaltyFeesArr[i].fallback_fee.denominating_token_id] = royaltyFeesArr[i].fallback_fee.amount;
                        }
                    } else {
                        obj["HBAR"] += (royaltyFeesArr[i].fallback_fee.amount / getCurrencyDecimal("HBAR"));
                    }
                }

            }
        }
        return obj;
    };

    async function validate (token) {
        setNftTradeErr(null);
        setNftTradePass(null);
        let hasError = false;
        let tokenAssociated;
        let usdcTokenAssociated;
        let totalAmtBuyerNeedToPay = getTotalAmtBuyerNeedToPay();
        let collectorAccountArr = nftFees && nftFees.custom_fees && nftFees.custom_fees.royalty_fees && nftFees.custom_fees.royalty_fees.length ? nftFees.custom_fees.royalty_fees : [];
        const response = await api.getAccountBalanceAndTokenInfo({ hhAccountID: userDetails.hhAccount });
        const balanceAndTokens = response.data.data.balance;
        let totalBalance = balanceAndTokens && balanceAndTokens.balance ? balanceAndTokens.balance / getCurrencyDecimal("HBAR") : null;
        let tokens = balanceAndTokens && balanceAndTokens.tokens && balanceAndTokens.tokens.length ? balanceAndTokens.tokens : [];
        for (let i = 0; i < tokens.length; i++) {
            if (tokens[i].token_id == token) {
                tokenAssociated = true;
            }
            if (tradeCurrency == "USDC" && tokens[i].token_id == usdcTokenAcc) {
                usdcTokenAssociated = true;
            }
            if (totalAmtBuyerNeedToPay[tokens[i].token_id]) {
                let usdcBalance = tokens[i].token_id == usdcTokenAcc ? displayAmount(tokens[i].balance/ getCurrencyDecimal("USDC")) : 0;
                if (tokens[i].balance < totalAmtBuyerNeedToPay[tokens[i].token_id]) {
                    if (tokens[i].token_id == usdcTokenAcc) {
                        tradeErrArray.push(`Insufficient USDC balance (current balance ${usdcBalance})`);
                    } else {
                        tradeErrArray.push(`Insufficient token (${tokens[i].token_id}) balance (current balance ${displayAmount(tokens[i].balance)})`);
                    }
                    hasError = true;
                } else {
                    if (tokens[i].token_id == usdcTokenAcc) {
                        tradePassArray.push(`Sufficient USDC balance (current balance ${usdcBalance})`);
                    } else {
                        tradePassArray.push(`Sufficient token (${tokens[i].token_id}) balance (current balance ${displayAmount(tokens[i].balance)})`);
                    }
                }
            }
        }
        if (!tokenAssociated) {
            tradeErrArray.push(`Token ${token} is not associated to your account ${hederaAccountToString(userDetails.hhAccount)}`);
            hasError = true;
        } else {
            tradePassArray.push(`Token ${token} associated to your account ${hederaAccountToString(userDetails.hhAccount)}`);
        }
        if (tradeCurrency == "USDC" && usdcTokenAcc) {
            if (!usdcTokenAssociated) {
                tradeErrArray.push(`Token ${usdcTokenAcc} is not associated to your account ${hederaAccountToString(userDetails.hhAccount)}`);
                hasError = true;
            } else {
                tradePassArray.push(`Token ${usdcTokenAcc} associated to your account ${hederaAccountToString(userDetails.hhAccount)}`);
            }
        }

        if (tradePrice > 0 && tradeCurrency == "USDC" && usdcTokenAcc && collectorAccountArr && collectorAccountArr.length > 0) {
            for (let i = 0; i < collectorAccountArr.length; i++ ) {
                let res = await api.getAccountBalanceAndTokenInfo({ hhAccountID: collectorAccountArr[i].collector_account_id });
                if (res && res.data && res.data.responseCode == 0) {
                    let collectorIdAssociatedTokens = res.data.data.balance.tokens;
                    if (collectorIdAssociatedTokens && collectorIdAssociatedTokens.length && collectorIdAssociatedTokens.length > 0) {
                        let associated = false;
                        for (let j = 0; j < collectorIdAssociatedTokens.length; j++) {
                            if (collectorIdAssociatedTokens[j].token_id == usdcTokenAcc) {
                                associated = true;
                                break;
                            }
                        }
                        if (!associated) {
                            tradeErrArray.push(`USDC token (${usdcTokenAcc}) is not associated to royalty fee collector account (${collectorAccountArr[i].collector_account_id})`);
                        }
                    }
                }
            }
        }

        if (totalBalance < totalAmtBuyerNeedToPay["HBAR"]) {
            tradeErrArray.push(`Insufficient HBAR balance (current balance ${displayAmount(totalBalance)})`);
            hasError = true;
        } else {
            tradePassArray.push(`Sufficient HBAR balance (current balance ${displayAmount(totalBalance)})`);
        }

        setNftTradeErr(tradeErrArray);
        setNftTradePass(tradePassArray);

        return !hasError;
    }

    const getScheduleTxnInfo = async () => {
        // validate trade id
        if (tradeIdValidation()) {
            const res = await api.getScheduleTxnInfo({ param: tradeID });
            setActiveStep(2);
            if (res && res.data && res.data.responseCode == 15) {
                setExpirationErr("Transaction Expired");
            }
            if (localValidation() && res && res.data && res.data.responseCode == 0 && !balanceErr) {
                setTradeInfo(res.data.data);
                const base64EncodedScheduledTxBody = res.data.data.base64EncodedScheduledTxBody;
                const decodedBase64 = decodeBase64(base64EncodedScheduledTxBody);
                let txnBody;
                try {
                    txnBody = SchedulableTransactionBody.decode(Buffer.from(decodedBase64, "binary"));
                } catch (err) {
                    console.log(err);
                }
                if (txnBody) {
                    setScheduleTxnBody(txnBody);
                }
            } else {
                setExpirationErr("Invalid Trade ID");
            }
        }
    };

    const createEncodedNFTTransfer = async () => {
        const idParts = tradeID.split(".");
        const payerAccountId = AccountID.create({ accountNum: userDetails.hhAccount.accountNumber });
        const accountIDNode = AccountID.create({ accountNum: droppNodeId });
        const scheduleId = ScheduleID.create({ shardNum: parseInt(idParts[0], 10), realmNum: parseInt(idParts[1], 10), scheduleNum: parseInt(idParts[2], 10) })
        let scheduleSignTransactionBody = ScheduleSignTransactionBody.create();
        scheduleSignTransactionBody.scheduleID = scheduleId;

        let timeStampNano = p2phelper.createTimestampNano();
        var timestamp = Timestamp.create({ seconds: Math.floor(timeStampNano), nanos: 0 });

        var transactionID = TransactionID.create({ transactionValidStart: timestamp, accountID: payerAccountId });
        var duration = Duration.create({ seconds: 180 });

        var transactionBody = TransactionBody.create({
            transactionID: transactionID,
            nodeAccountID: accountIDNode,
            transactionFee: MAX_HEDERA_TXN_FEE,
            transactionValidDuration: duration,
            generateRecord: true,
            // memo: `Dropp: NFT schedule sign ${Math.floor(Math.random() * Math.pow(10, 6))}`,
            scheduleSign: scheduleSignTransactionBody
        });

        var transactionBodyBytes = TransactionBody.encode(transactionBody).finish()

        return await getEncodedTransactionBytes(transactionBodyBytes, signatures, userDetails);

        // let encoding = "binary";
        // let priv = signatures.privateKey;
        // let privateKey = forge.util.hexToBytes(priv);
        // let signature = ed25519.sign({
        //     message: Buffer.from(transactionBodyBytes),
        //     encoding,
        //     privateKey,
        // });

        // var signaturePair = SignaturePair.create({ed25519: signature });
        // signaturePair.pubKeyPrefix = Buffer.from(p2phelper.hexToBytes(signatures.publicKey));
        // var signatureMap = SignatureMap.create();
        // signatureMap.sigPair.push(signaturePair);

        // var transaction = Transaction.create({
        //     bodyBytes: transactionBodyBytes,
        //     sigMap: signatureMap
        // });

        // var transactionBytes = Transaction.encode(transaction).finish();
        // let encodedTransactionBytes = btoa(String.fromCharCode(...new Uint8Array(transactionBytes)));
        // return encodedTransactionBytes;
    };

    const estimatedCost = () => {
        let totalCost = getTotalAmtBuyerNeedToPay();
        return totalCost;
    }

    const signAndComplete = async () => {
        try {
            setLoading(true);
            const encodedTransfer = await createEncodedNFTTransfer();
            const res = await api.signScheduleTxForNFTTrade({ base64encodedTransferTx: encodedTransfer })
            if (res && res.data && res.data.responseCode == 0) {
                setLoading(false);
                setOpenSuccessModal(true);
                api.resetUserDetails();
            } else {
                const errorMsg = (res && res.data && res.data.errors && res.data.errors.length > 0) ? res.data.errors[0] : COMMON_ERROR_MSG;
                setBackendErr(errorMsg);
                setLoading(false);
                setOpenSuccessModal(true);
            }
        } catch(error) {
            const res = error.response;
            const errorMsg = (res && res.data && res.data.errors && res.data.errors.length > 0) ? res.data.errors[0] : COMMON_ERROR_MSG;
            setBackendErr(errorMsg);
            setLoading(false);
            setOpenSuccessModal(true);
        }
    };

    const handleSuccessModalClose = () => {
        setOpenSuccessModal(false);
        api.resetUserDetails();
        setCurrentScreen("nftcollections");
    };

    const imageLoaded = () => {
        setImgLoading(false);
    };

    const backButtonHandler = () => {
        if (activeStep == 1) {
            setCurrentScreen("nftcollections");
            setFunctionCallOnBack(null);
        } else {
            setActiveStep(activeStep - 1);
            setTradeID(null);
            setExpirationErr(null);
            if (activeStep == 2) {
                setNftTradeErr(null);
                setNftTradePass(null);
                setScheduleTxnBody(null);
                setPayerId(null);
            }
            setBalanceErr(null);
        }
    }

    // useEffect(()=>{
    //     if (tokenId && nftTradeErr && nftTradeErr.length ) {
    //         setNftTradeErr(...nftTradeErr, `Token ${tokenId} not associated`)
    //     }
    // }, [tokenId]);

    return (
        <div style={{ marginTop: "33px" }}>
            {/* <div
                style={{
                    textAlign: "left",
                    marginTop: "6px",
                    marginLeft: "20px",
                    marginBottom: "10px",
                }}>
                <div style={{ paddingTop: "9px" }}>
                    <label style={{ fontWeight: "450", color: "#18C2EE", fontSize: "1.8em" }}>
                        TRADE
                    </label>
                    <br />
                    <label style={{ fontSize: "1.3em" }}>
                        RECEIVE NFT
                    </label>
                </div>
            </div> */}
            <div className={classes.detailContainer}>
                {/* <div style={{ clear: "both" }}>
                    <hr className='dashedLine' />
                </div> */}
                <div style={{ display: "flex", justifyContent: "space-around", padding: "10px 0px" }}>
                    <div style={{ textAlign: "center" }}>
                        <div style={{ backgroundColor: activeStep >= 1  ? "#18c2ee" : "#606060", color: "#ffffff"}} className={classes.stepCirle}>
                            <Typography>1</Typography>
                        </div>
                        <div style={{ display: "block" }}>
                            <Typography className={commonStyles.darkBoldText} variant='body2'>GET ID</Typography>
                        </div>
                    </div>
                    <div style={{ textAlign: "center" }}>
                        <div style={{ backgroundColor: activeStep >= 2 ? "#18c2ee" : "#606060", color: "#ffffff" }} className={classes.stepCirle}>
                            <Typography>2</Typography>
                        </div>
                        <div>
                            <Typography className={commonStyles.darkBoldText} variant='body2'>REVIEW</Typography>
                        </div>
                    </div>
                    <div style={{ textAlign: "center" }}>
                        <div style={{ backgroundColor: activeStep == 3 ? "#18c2ee" : "#606060", color: "#ffffff" }} className={classes.stepCirle}>
                            <Typography>3</Typography>
                        </div>
                        <div>
                            <Typography className={commonStyles.darkBoldText} variant='body2'>CONFIRM</Typography>
                        </div>
                    </div>
                </div>
                {scheduleTxnBody ?
                    <div>
                        <div className={classes.greyBackground}>
                            <Typography variant='h6' style={{ fontWeight: "600" }}>
                                NFT TRADE INFO
                            </Typography>
                            <Grid container>
                                <Grid item xs={8}>
                                    {nftDetails && nftDetails.data && nftDetails.data.length > 0 ? <div>
                                        {nftName ? <Grid container>
                                            <Grid item xs={6}>
                                                <Typography variant="body2">
                                                    TITLE:
                                                </Typography>
                                            </Grid>
                                            <Grid item xs={6}>
                                                <Typography variant="body2" className={commonStyles.darkBoldText}>
                                                    {nftName}
                                                </Typography>
                                            </Grid>
                                        </Grid> : ""}
                                        {tokenId ? (
                                            <Grid container>
                                                <Grid item xs={6}>
                                                    <Typography variant="body2">
                                                        TOKEN ID:
                                                    </Typography>
                                                </Grid>
                                                <Grid item xs={6}>
                                                    <Typography variant="body2" className={commonStyles.darkBoldText}>
                                                        {tokenId}
                                                    </Typography>
                                                </Grid>
                                            </Grid>
                                        ) : ""}

                                        {serialNumber ? (
                                            <Grid container>
                                                <Grid item xs={6}>
                                                    <Typography variant="body2">
                                                        SERIAL NO:
                                                    </Typography>
                                                </Grid>
                                                <Grid item xs={6}>
                                                    <Typography variant="body2" className={commonStyles.darkBoldText}>
                                                        {serialNumber}
                                                    </Typography>
                                                </Grid>
                                            </Grid>
                                        ) : ""}

                                        {nftTransfer && nftTransfer.senderAccountID ? (
                                            <Grid container>
                                                <Grid item xs={6}>
                                                    <Typography variant="body2">
                                                        FROM:
                                                    </Typography>
                                                </Grid>
                                                <Grid item xs={6}>
                                                    <Typography variant="body2" className={commonStyles.darkBoldText}>
                                                        {`${nftTransfer.senderAccountID.shard || 0}.${nftTransfer.senderAccountID.realm || 0}.${nftTransfer.senderAccountID.accountNum || 0}`}
                                                    </Typography>
                                                </Grid>
                                            </Grid>
                                        ) : ""}
                                    </div> : ""}
                                </Grid>
                                <Grid item xs={4}>
                                    <div style={{ display: `${imgLoading ? "none" : "block"}` }}>
                                        <img
                                            style={{ border: "3px solid #000000", width: "100%"}}
                                            src={imgUrl}
                                            alt='NFT'
                                            onLoad={imageLoaded}
                                        />
                                        <div className="NFTImageHolder" style={{ display: `${imgLoading ? "block" : "none"}` }}>
                                            <div className="loader">
                                                <CircularProgress color="inherit" />
                                            </div>
                                        </div>
                                    </div>
                                </Grid>
                            </Grid>
                            <Divider className={commonStyles.divider}/>
                            <Box my={1}>
                                <Typography variant='h6' style={{ fontWeight: "600" }}>
                                    ESTIMATED COST
                                </Typography>
                                {tradePrice ?
                                    <>
                                        <div style={{ display: "flex" }}>
                                            <div style={{ width: "66%" }}>
                                                <Typography variant="body2">
                                                    Trade price for this NFT set by seller
                                                </Typography>
                                            </div>
                                            <Typography variant="body2" className={commonStyles.darkBoldText} style={{ width: "50%" }}>
                                                {displayAmount(tradePrice, getCurrencyDecimalPlaces(tradeCurrency))} {tradeCurrency}
                                            </Typography>
                                        </div>
                                    </>
                                    : ""}
                                {
                                    fixedFeesArr && royaltyFeesArr
                                        ?
                                        <>
                                            <div>
                                                <Table className={classes.table}>
                                                    <TableBody>
                                                        {
                                                            (tradePrice == 0) && royaltyFeesArr
                                                                ? Object.keys(royaltyFeesArr).map((index) => {
                                                                    return (
                                                                        <>
                                                                            {
                                                                                royaltyFeesArr[index].fallback_fee && royaltyFeesArr[index].fallback_fee.amount
                                                                                    ?
                                                                                    <>
                                                                                        <TableRow className={classes.tableRow}>
                                                                                            <TableCell className={classNames([classes.cell, classes.keyCell])}>Royalty Fallback <br />paid to {royaltyFeesArr[index].collector_account_id}</TableCell>
                                                                                            {royaltyFeesArr[index].fallback_fee.denominating_token_id ?
                                                                                                <TableCell className={classNames([classes.cell, classes.valueCell])}>
                                                                                                    {royaltyFeesArr[index].fallback_fee.amount} {`${(royaltyFeesArr[index].fallback_fee.amount == 1 ? "Token" : "Tokens")} (${royaltyFeesArr[index].fallback_fee.denominating_token_id})`}
                                                                                                </TableCell>
                                                                                                :
                                                                                                <TableCell className={classNames([classes.cell, classes.valueCell])}>
                                                                                                    {displayAmount(royaltyFeesArr[index].fallback_fee.amount / getCurrencyDecimal("HBAR"))}
                                                                                                    {tradeCurrency}
                                                                                                </TableCell>
                                                                                            }
                                                                                        </TableRow>
                                                                                    </>
                                                                                    :
                                                                                    ""
                                                                            }
                                                                        </>
                                                                    )
                                                                })
                                                                :
                                                                ""
                                                        }
                                                    </TableBody>
                                                </Table>
                                            </div>
                                        </>
                                        :
                                        ""
                                }
                                {
                                    droppFeeDetails && droppFeeDetails.scheduleSignFeeUSD && hederaTransactionFees
                                        ?
                                        <div>
                                            <Table className={classes.table}>
                                                <TableBody>
                                                    <TableRow className={classes.tableRow}>
                                                        <TableCell className={classNames([classes.cell, classes.keyCell])}>
                                                            <Typography variant="body2">Hedera Transaction Fee (${droppFeeDetails.scheduleSignFeeUSD})</Typography>
                                                        </TableCell>
                                                        <TableCell className={classNames([classes.cell, classes.valueCell])}>
                                                            <Typography variant="body2" className={commonStyles.darkBoldText}>
                                                                {displayAmount(hederaTransactionFees)} HBAR
                                                            </Typography>
                                                        </TableCell>
                                                    </TableRow>
                                                </TableBody>
                                            </Table>
                                        </div>
                                        :
                                        ""
                                }
                                {
                                    (tradePrice || tradePrice == 0) && hederaTransactionFees
                                        ?
                                        <>
                                            <Table className={classes.table}>
                                                <TableBody>
                                                    {tradeCurrency == "USDC" ? <>
                                                        <TableRow className={classes.tableRow}>
                                                            <TableCell className={classNames([classes.cell, classes.keyCell])} style={{paddingBottom:"0px"}}><Typography variant="body2">Estimated total price you will pay</Typography></TableCell>
                                                            <TableCell className={classNames([classes.cell, classes.valueCell])} style={{paddingBottom:"0px", paddingLeft:"0px"}}><Typography variant="body2">{estimatedCost()[usdcTokenAcc] ? displayAmount(estimatedCost()[usdcTokenAcc]) : ""} {tradeCurrency}</Typography></TableCell>
                                                        </TableRow>
                                                            <TableRow className={classes.tableRow} style={{paddingTop:"0px"}}>
                                                                <TableCell className={classNames([classes.cell, classes.keyCell])}></TableCell>
                                                                <TableCell className={classNames([classes.cell, classes.valueCell])} style={{padding:"0px"}}><Typography className={commonStyles.darkBoldText}>{ displayAmount(estimatedCost()["HBAR"]) } HBAR</Typography> </TableCell>
                                                            </TableRow>
                                                    </>
                                                        :
                                                        <TableRow className={classes.tableRow} style={{paddingTop:"0px"}}>
                                                            <TableCell className={classNames([classes.cell, classes.keyCell])} style={{padding:"0px"}}>Estimated total price you will pay </TableCell>
                                                            <TableCell className={classNames([classes.cell, classes.valueCell])} style={{padding:"0px"}}><Typography className={commonStyles.darkBoldText}>{ estimatedCost()["HBAR"] ? displayAmount(estimatedCost()["HBAR"]) : "" } HBAR</Typography> </TableCell>
                                                        </TableRow>}
                                                </TableBody>
                                            </Table>
                                            {/* <div style={{ clear: "both"}}>
                                                <hr className='dashedLine' />
                                            </div> */}
                                        </>
                                        :
                                        ""
                                }
                            </Box>
                        </div>
                        {/* <div className={classNames([classes.container, classes.greyBackground])}>

                        </div> */}
                        {
                            <div className={classes.greyBackground}>
                                {
                                    !expirationErr && !balanceErr && activeStep != 1 && nftTradePass ? Object.keys(nftTradePass).map((index) => {
                                        return (
                                            <div className="error extension" >
                                                <span style={{ color: "#18c2ee" }}><CheckCircleOutlineIcon /></span>  <span>{nftTradePass[index]}</span>
                                            </div>)
                                    })
                                        : ""
                                }
                                {
                                    !expirationErr && !balanceErr && activeStep != 1 && nftTradeErr ? Object.keys(nftTradeErr).map((index) => {
                                        return (
                                            <div className="errMsg extension" >
                                                <CancelOutlinedIcon /><span>{nftTradeErr[index]}</span>
                                            </div>)
                                    })
                                        : ""
                                }
                            </div>
                        }
                        {expirationTime ?
                            <div className={classes.container}>
                                <Typography>
                                    Trade expires <span className={commonStyles.blueBoldText}>{expirationTime}</span> minutes from now.
                                    Proceed next to confirm payment and complete the trade.
                                </Typography>
                            </div>
                            : ""}
                        {/* <div style={{ clear: "both", paddingTop: "30px" }}>
                            <hr className='dashedLine' />
                        </div> */}
                    </div>
                    :
                    <>
                        {/* <div style={{paddingBottom: "10px"}}>
                            <Typography>
                                {hederaAccountToString(userDetails.hhAccount)} <span onClick={() => setCurrentScreen("shareAccForNFT")}  className="material-icons" style={{cursor: "pointer", fontSize: "22px", verticalAlign: "middle"}}>qr_code</span>
                            </Typography>
                        </div> */}
                        {
                            activeStep == 1 && !expirationErr ?
                                <>

                                    <Typography variant='body2' style={{ marginTop: "20px" }}>
                                        Enter the trade ID provided to you by the sender and click
                                        GET NFT TRADE INFO to retrieve the details of the transaction.
                                    </Typography>
                                    <Box my={2}>
                                        <TextField
                                            // style={{ width: "100%", paddingBottom: "5px" }}
                                            className={`${commonStyles.inputFieldWithGreyBg} ${classes.roundedInputField}`}
                                            variant="outlined"
                                            label={<p style={{fontSize:"14px"}} >{"ENTER TRADE ID"}</p>}
                                            size='small'
                                            onChange={(e) => setTradeID(e.target.value)}
                                        />
                                    </Box>
                                    {balanceErr && (<div className="errMsg extension" style={{ marginBottom: "10px", marginLeft: "5px" }}>
                                        <strong>{balanceErr}</strong></div>)}
                                {
                                    activeStep == 1 ?
                                            <div className={classes.root}>
                                                <Accordion defaultExpanded className={classes.accordion} aria-setsize={"large"}>
                                                    <AccordionSummary
                                                        expandIcon={<img src="./arrowDown.png" alt="show" />}
                                                        aria-controls="panel1a-content"
                                                        id="panel1a-header"
                                                    >
                                                        <Typography className={`${commonStyles.darkBoldText} ${commonStyles.largeSizedText}`}> Don't have the Trade ID?</Typography>
                                                    </AccordionSummary>
                                                    <AccordionDetails className={`${commonStyles.mediumSizedText} ${classes.accordionDetails}`}>
                                                        <Typography variant='subtitle2' className={classes.marginY}>
                                                            If you are receiving NFT via Trade, then ask the seller for the Trade ID.
                                                        </Typography>
                                                        <Typography variant='subtitle2' className={classes.marginY}>
                                                            If you are receiving NFT via transfer, then provide your account ID to the sender. Make sure
                                                            you associate the token before the transfer.
                                                        </Typography>
                                                        <Typography variant='subtitle2' style={{ fontWeight: "600" }} className={classes.marginY}>
                                                            Your Account ID
                                                        </Typography>
                                                        <div style={{ alignItems: "baseline", display: "flex", justifyContent: "space-between" }}>
                                                            <Typography variant='subtitle2'>{hederaAccountToString(userDetails.hhAccount)}</Typography>
                                                            <div>
                                                                <p style={{ fontSize: "15px", marginLeft: "10px", display: "inline-block" }}><span onClick={() => setCurrentScreen("shareAccForNFT")} class="material-icons" style={{ cursor: "pointer", fontSize: "24px", verticalAlign: "middle" }}>qr_code</span></p>
                                                                <p style={{ fontSize: "15px", marginLeft: "10px", display: "inline-block" }}><span style={{ verticalAlign: "middle" }}><Copy iconColor="disabled" toolTipTitle="Copy Your Account ID" copyMessage="Account ID Copied to clipboard" text={hederaAccountToString(userDetails.hhAccount)} /></span></p>
                                                            </div>
                                                        </div>
                                                    </AccordionDetails>
                                                </Accordion>
                                            </div>
                                             : ""

                                }
                                {(exchangeRate && droppFeeDetails && droppFeeDetails.scheduleGetInfoFeeUSD) ? <Box py={2}>
                                        <Typography variant="subtitle2">
                                            This look up will incur an estimated network fee of {renderCurrency(droppFeeDetails.scheduleGetInfoFeeUSD, "USD", "15px")} which is approximately {renderCurrency((droppFeeDetails.scheduleGetInfoFeeUSD / exchangeRate), "HBAR", "15px")}
                                        </Typography>
                                    </Box>: "" }
                                    <div className={classes.container}>
                                        {/* {(exchangeRate && droppFeeDetails && droppFeeDetails.scheduleGetInfoFeeUSD) ?
                                            <Typography style={{ paddingBottom: "10px" }}>
                                                This look up will incur an estimated network fee of {renderCurrency((droppFeeDetails.scheduleGetInfoFeeUSD / exchangeRate), "HBAR", "15px")}
                                            </Typography>
                                            : ""} */}
                                        {/* {
                                            activeStep != 1 ? <></> :
                                                <div style={{ paddingBottom: "30px" }}>
                                                    <button
                                                        className={balanceErr || expirationErr ? "disabledgetNFTBtn" : "getNFTBtn"}
                                                        style={{ width: "100%", borderRadius: "0", }}
                                                        onClick={getScheduleTxnInfo}
                                                        disabled={balanceErr || expirationErr}
                                                    >
                                                        GET NFT TRADE INFO
                                                    </button>
                                                </div>
                                        } */}
                                    </div>
                                </> : ""
                        }


                        {
                            expirationErr && !balanceErr
                                ?
                                <>
                                    <div style={{ padding: "20px 0px" }}>
                                        <Typography variant='h6' style={{ color: "#FF5858", fontWeight: "600" }}>
                                            {expirationErr}
                                        </Typography>
                                        <Typography style={{ padding: "10px 0px" }}>
                                            We could not find any pending Trade with ID {tradeID}. If the ID is correct, the trade could have expired. Please ask the seller to resubmit the transaction and provide you with a new Trade ID.
                                        </Typography>
                                        <Typography style={{ padding: "10px 0px" }}>
                                            Transactions not signed within 30 minutes automatically expire.
                                        </Typography>
                                    </div>
                                </>
                                : ""
                        }
                    </>
                }



                <Modal
                    open={openSuccessModal}
                    onClose={backendErr ? () => setOpenSuccessModal(false) : handleSuccessModalClose}
                >
                    <Box className={classes.modalContainer}>
                        {backendErr ?
                            <>
                                <Typography sx={{ mt: 2 }}>
                                    <strong>Error</strong>
                                </Typography>
                                <Typography sx={{ mt: 2 }} style={{ wordBreak: "break-all" }}>
                                    {backendErr}
                                </Typography>
                            </>
                            :
                            <>
                                <Typography sx={{ mt: 2 }}>
                                    <strong>Success</strong>
                                </Typography>
                                <Typography id="modal-modal-description" sx={{ mt: 2 }}>
                                    Trade complete
                                </Typography>
                            </>

                        }
                        <div className={classes.ctrlBtns}>
                            {backendErr ?
                                <button className="button-done" onClick={() => setOpenSuccessModal(false)}>
                                    Ok
                                </button>
                                :
                                <button className="button-done" onClick={handleSuccessModalClose}>
                                    Ok
                                </button>
                            }
                        </div>
                    </Box>
                </Modal>
                <Modal
                open={loading}
                onClose={signAndComplete}
                >
                    <Box className={classes.loader}>
                        <div>
                            <CircularProgress color="inherit" />
                        </div>
                    </Box>
                </Modal>

            </div>
                {/* <div className="footer" style={{ height: activeStep == 3 || workingEnv == "test" ? "105px" : "85px", borderTop: "1px dashed #000000"}}>
                    {
                        activeStep == 3 && activeStep != 1 ?
                            <div>
                                <Typography variant='body2' style={{ fontWeight: "600" }}>
                                    Verify that all information is correct before paying.
                                </Typography>
                                <Typography variant='caption text'>
                                    Tap PAY to pay now and complete the trade.
                                </Typography>
                            </div> :
                            <><div>
                                {
                                    (expirationErr || (nftTradeErr && nftTradeErr.length)) && activeStep == 2 ?
                                        <Typography variant='body2'>
                                            Please address the errors highlighted before proceeding.
                                        </Typography>
                                        : activeStep == 2 ? <Typography variant='body2'>
                                            Proceed next to confirm payment and complete the trade.
                                        </Typography> : ""
                                }
                            </div>
                            </>
                    }
                    {
                        activeStep == 1 && (exchangeRate && droppFeeDetails && droppFeeDetails.scheduleGetInfoFeeUSD) ?
                            <Typography variant='caption text'>
                                This look up will incur an estimated network fee of <br /> {renderCurrency((droppFeeDetails.scheduleGetInfoFeeUSD / exchangeRate), "HBAR", "15px")}
                            </Typography> : ""
                    }
                    <div className='backArrow' style={{top: "5px"}}>
                        <ArrowBackOutlinedIcon onClick={backButtonHandler} style={{ cursor: "pointer", color: "#18C2EE" }} />
                    </div>
                    {activeStep == 2 ?
                        <div className='footerRightButtonSmall' style={{bottom: "25px"}}>
                            <button
                                className={expirationErr || (nftTradeErr && nftTradeErr.length) ? "disabledgetNFTBtn" : "getNFTBtn"}
                                style={{ position: "relative", right: "25px", cursor: "pointer" }}
                                onClick={() => setActiveStep(3)}
                                disabled={expirationErr || (nftTradeErr && nftTradeErr.length) ? true : false}
                            >
                                NEXT
                            </button>
                        </div>
                        : ""}

                    {
                        activeStep == 3 ?
                            <div className='footerRightButtonSmall'>
                                <button
                                    className={scheduleTxnBody ? "getNFTBtn" : "disabledgetNFTBtn"}
                                    style={{ position: "relative", right: "25px", cursor: "pointer" }}
                                    onClick={signAndComplete}
                                    disabled={loading}
                                >
                                    PAY
                                </button>
                            </div>
                            :
                            ""
                    }
                    {
                        activeStep == 1 ?
                            <div className='footerRightButtonLarge'>

                                <button
                                    className="button-done"
                                    onClick={getScheduleTxnInfo}>
                                    GET NFT TRADE INFO
                                </button>
                            </div> : ""
                    }
                </div> */}
        </div>
    )
}

export default NFTReceiving;