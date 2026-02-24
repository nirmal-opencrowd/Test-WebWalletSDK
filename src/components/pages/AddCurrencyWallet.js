import React from "react";
import ArrowBackOutlinedIcon from '@material-ui/icons/ArrowBackOutlined';
import * as api from "./../../api";
import * as localstorage from "./../../utils/local-storage";
import { MenuItem, RadioGroup, FormControl, FormLabel, FormControlLabel, Radio, withStyles, makeStyles, TextField, Select, Typography } from "@material-ui/core";
import { MAX_HEDERA_TXN_FEE, SUPPORTED_CRYPTO_CURRENCIES } from "./../../utils/constants";
import {proto} from '@hashgraph/proto';
import forge from "node-forge";
import * as p2phelper from "./../../utils/p2phelper.js";
import { getCARATTokenId, getDroppAccountId, getEncodedTransactionBytes } from "../../utils/utils";
import commonStyles from "./../../styles/common.module.scss";
import uiTexts from "./../../../configurations/dropp.json";
import Loader from "../Loader.js";

const errorMSg = {
  textAlign: "center",
  marginTop: "25px",
  marginLeft: "auto",
  marginRight: "auto"
};

const currencyContainer = {
  marginLeft:"20px",
  marginRight:"20px",
  marginTop:"30px",
  maxHeight:"452px",
  overflowY:"scroll"
};

const pageTexts = uiTexts.addcurrencywallet;

const useStyles = makeStyles((theme) => ({
  root: {
    display: 'flex',
    flexWrap: 'wrap',
  },
  selectEmpty: {
    marginTop: theme.spacing(2),
  },
  margin: {
    margin: theme.spacing(1),
  },
  input: {
    fontSize : 10
  },
  selectField: {
    borderRadius: '20px',
    '& .MuiOutlinedInput-root': {
      borderRadius: '20px',
      color: "grey",
    },
  },
  formControl: {
    width: "100%"
  }
}));

const BlueRadio = withStyles({
  root: {

    '&$checked': {
      color: '#18C2EE',
    },
  },
  checked: {},
})((props) => <Radio size="small" color="default" {...props} />);

const ed25519 = forge.pki.ed25519;

const AddCurrencyWallet =( {setCurrentScreen, data, userDetails, setFooterObj}) => {
  const GLOBAL = "GLOBAL";
  const [countryList, setCountryList] = React.useState([]);
  const [countryCurrencyMap, setCountryCurrencyMap] = React.useState([]);
  const [countryCurrencyList, setCountryCurrencyList] = React.useState([]);
  const [defaultCountry, setDefaultCountry] = React.useState("");
  const [selectedCountry, setSelectedCountry] = React.useState({});
  const [currencyList, setCurrencyList] = React.useState([]);
  const [selectedCurrency, setSelectedCurrency] = React.useState({});
  const [selectedOperator, setSelectedOperator] = React.useState({});
  const [backendMsg, setBackendMsg] = React.useState({});
  const [loading, setLoading] = React.useState(true);
  const [existingWallets, setExistingWallets] = React.useState([]);
  const [digitalOperatorInfo, setDigitalOperatorInfo] = React.useState({"countryCode": GLOBAL, operatorId: 0});
  const [digitalCurrencyList, setDigitalCurrencyList] = React.useState([]);
  const [droppNodeId, setDroppNodeId] = React.useState(null);
  const [signatures, setSignatures] = React.useState({});
  const classes = useStyles();

  const {
    AccountID, Duration,
    SignatureMap,
    SignaturePair,
    Timestamp, TokenAssociateTransactionBody, TokenDissociateTransactionBody,
    TokenID, Transaction, TransactionBody, TransactionID
  } = proto;

  React.useEffect(() => {
      if (data && data.length) {
        let walletCombination = [];
        for (let i = 0; i < data.length; i++) {
          let wallet = data[i].walletId;
          walletCombination.push(`${wallet.countryCode}-${wallet.currencyCode}-${wallet.operatorId}`);
        }
        setExistingWallets(walletCombination);
      }

      async function fetchGeoDetails() {
        let geoDetails = await api.fetchGeoInfo();
        setDefaultCountry((geoDetails && geoDetails.country_3) ? geoDetails.country_3 : "USA");
      }
      fetchGeoDetails();

      async function fetchCountryCurrencyList() {
        let allCountryCurrencyMap = await api.fetchCountryCurrencyList();
        if (allCountryCurrencyMap && allCountryCurrencyMap.data) {
          setCountryCurrencyMap(allCountryCurrencyMap.data);
          let countries = [];
          for (let i = 0; i < allCountryCurrencyMap.data.length; i++) {
            countries.push({countryCode: allCountryCurrencyMap.data[i].countryCode, countryName: allCountryCurrencyMap.data[i].countryCurrencyList[0].countryName});
            if (allCountryCurrencyMap.data[i].countryCode == GLOBAL) {
              setDigitalOperatorInfo({countryCode: GLOBAL, operatorId: allCountryCurrencyMap.data[i].countryCurrencyList[0].operatorCountry.operatorId});
              setDigitalCurrencyList(allCountryCurrencyMap.data[i].countryCurrencyList[0].currencyList);
            }
          }
          setCountryList(countries);
        }
        setLoading(false);
      }
      fetchCountryCurrencyList();

      async function fetchNodes() {
        let nodeDetails = await api.fetchNodes();
        const nodeArr = nodeDetails.data[0].nodeAccountId.split(".");
        const node = nodeArr[nodeArr.length - 1];
        setDroppNodeId(parseInt(node));
      }
      fetchNodes();

      async function updateSignatures() {
        const sign = await localstorage._get("_decrypted");
        if (sign && sign._decrypted) {
          setSignatures(sign._decrypted);
        }
      }
      updateSignatures();
  }, []);

  React.useEffect(() => {
    if (defaultCountry && countryCurrencyMap && countryCurrencyMap.length) {
      let countryFound = false;
      for (let i = 0; i < countryCurrencyMap.length; i++) {
        if (defaultCountry == countryCurrencyMap[i].countryCode) {
          countryFound = true;
          break;
        }
      }
      changeCountry(countryFound ? defaultCountry : "USA");
    }
  }, [defaultCountry, countryCurrencyMap]);

  React.useEffect(() => {
    setFooterObj({primaryBtnText: "Add", primaryFuncToCall: saveCurrencyWallet});
    return () => {
      setFooterObj({})
    }
  }, [selectedCountry, selectedCurrency])

  const validate = () => {
    if (!(Object.keys(selectedCountry).length > 0 && selectedCountry.country)) {
      setSelectedCountry({country: null, error: pageTexts.countryErrMsg});
      return false;
    }
    if (!(Object.keys(selectedCurrency).length > 0 && selectedCurrency.currency)) {
      setSelectedCurrency({currency: null, error: pageTexts.currencyErrMsg});
      return false;
    }
    if (!(Object.keys(selectedOperator).length > 0 && selectedOperator.operatorId)) {
      setSelectedOperator({operatorId: null, error: pageTexts.operatorErrMsg});
      return false;
    }

    return true;
  };

  const getTokenTransaction = async () => {
    let tokenIdForTransaction = await getCARATTokenId();
    const idParts = tokenIdForTransaction.split(".");
    let merchantTokenId = TokenID.create({ shardNum: parseInt(idParts[0], 10), realmNum: parseInt(idParts[1], 10), tokenNum: parseInt(idParts[2], 10) });

    let droppAccId = await getDroppAccountId();
    const droppAccIdParts = droppAccId.split(".");
    let accountIDDropp = AccountID.create({accountNum: parseInt(droppAccIdParts[2], 10)});

    let accountIDSender = AccountID.create({ accountNum: userDetails.hhAccount.accountNumber });
    let accountIDNode = AccountID.create({ accountNum: droppNodeId });
    let transactionBody = TokenAssociateTransactionBody.create({ account: accountIDSender });
    transactionBody.tokens.push(merchantTokenId);
    let timeStampNano = p2phelper.createTimestampNano();
    let timestamp = Timestamp.create({ seconds: Math.floor(timeStampNano), nanos: 0 });

    let transactionID = TransactionID.create({ transactionValidStart: timestamp, accountID: accountIDDropp });
    let duration = Duration.create({ seconds: 180 })
    let obj = {
      transactionID: transactionID,
      nodeAccountID: accountIDNode,
      transactionFee: MAX_HEDERA_TXN_FEE,
      transactionValidDuration: duration,
      generateRecord: true,
    };
    obj = {
      ...obj,
      // memo: `Dropp: Token associate ${Math.floor(Math.random() * Math.pow(10, 6))}`,
      tokenAssociate: transactionBody
    };

    let mainTransactionBody = TransactionBody.create(obj);

    var transactionBodyBytes = TransactionBody.encode(mainTransactionBody).finish();

    return await getEncodedTransactionBytes(transactionBodyBytes, signatures, userDetails);

    // let encoding = "binary";
    // let priv = signatures.privateKey;
    // let privateKey = forge.util.hexToBytes(priv);
    // let signature = ed25519.sign({
    //   message: Buffer.from(transactionBodyBytes),
    //   encoding,
    //   privateKey,
    // });

    // var signaturePair = SignaturePair.create({ ed25519: signature });
    // signaturePair.pubKeyPrefix = Buffer.from(p2phelper.hexToBytes(signatures.publicKey));
    // var signatureMap = SignatureMap.create();
    // signatureMap.sigPair.push(signaturePair);

    // var transaction = Transaction.create({
    //   bodyBytes: transactionBodyBytes,
    //   sigMap: signatureMap
    // });

    // var transactionBytes = Transaction.encode(transaction).finish();
    // let encodedTransactionBytes = btoa(String.fromCharCode(...new Uint8Array(transactionBytes)));
    // return encodedTransactionBytes;
  };

  const saveCurrencyWallet = async () => {
    setBackendMsg({});
    if(validate()){
      setLoading(true);
      try {
        let reqParams = {currencyCode: selectedCurrency.currency};
        if (SUPPORTED_CRYPTO_CURRENCIES.indexOf(selectedCurrency.currency) != -1) {
          reqParams["countryCode"] = digitalOperatorInfo.countryCode;
          reqParams["operatorId"] = digitalOperatorInfo.operatorId;
        } else {
          reqParams["countryCode"] = selectedCountry.country;
          reqParams["operatorId"] = selectedOperator.operatorId;
        }

        let result;
        if(selectedCurrency && selectedCurrency.currency !== "CARAT") {
          result = await api.saveCurrencyWallet(reqParams);
        } else {
          let hederaTransaction = await getTokenTransaction();
          let associateTokenRes = await api.associateToken({hederaTransaction});
          if (associateTokenRes.responseCode == 0 && associateTokenRes.data){
            result = await api.saveCurrencyWallet(reqParams);
          }
        }

        if (result && result.responseCode != 0) {
          setLoading(false);
          setBackendMsg({msg: result.errors[0], error: true});
        } else {
          if (SUPPORTED_CRYPTO_CURRENCIES.indexOf(selectedCurrency.currency) != -1) {
            let localUserData = await localstorage.decrypted.get();
            localUserData['savedKeys'] = false;
            await localstorage.decrypted.set(localUserData);
          }
          setCurrentScreen("manageaccounts");
        }
      } catch(e) {
        setLoading(false);
      }
    }
  };

  const changeCountry = (country) => {
    setSelectedCountry({country});
    for (let i = 0; i < countryCurrencyMap.length; i++) {
      if (country == countryCurrencyMap[i].countryCode) {
        setCountryCurrencyList(countryCurrencyMap[i].countryCurrencyList);
        changeOperator(countryCurrencyMap[i].countryCurrencyList[0].operatorCountry.operatorId, countryCurrencyMap[i].countryCurrencyList);
        break;
      }
    }
    // setSelectedOperator({});
    // setCurrencyList([]);
  };

  const changeOperator = (operatorId, list) => {
    setSelectedOperator({operatorId});
    for (let i = 0; i < list.length; i++) {
      if (operatorId == list[i].operatorCountry.operatorId) {
        setCurrencyList(list[i].currencyList);
        break;
      }
    }
  }

  const changeDigitalCurrency = (data) => {
    setSelectedCurrency({currency: data.currency});
    setDigitalOperatorInfo({countryCode: data.countryCode, operatorId: data.operatorId});
    // setSelectedCountry({country: data.countryCode});
    // setSelectedOperator({operatorId: data.operatorId});
  };

  if(loading) {
    return <Loader/>
  }

  return (
    <div style={{marginTop:"40px"}}>
        {/* <div
            style={{
                textAlign: "left",
                marginTop: "6px",
                marginLeft: "20px",
                marginBottom: "10px"
            }}>
            <div style={{ paddingTop: "9px" }}>
                <label style={{ fontWeight: "450", color: "#18C2EE", fontSize: "1.8em" }}>
                    ADD
                </label>
                <br/>
                <label style={{fontSize: "1.3em" }}>
                    CURRENCY ACCOUNT
                </label>
            </div>
        </div> */}
        <div style={currencyContainer}>
          {/* {(Object.keys(countryCurrencyList).length > 0) && <div>
            <FormControl size='small' variant="outlined" className={classes.formControl}>
              <Select
                className={`${commonStyles.inputFieldWithGreyBg} ${classes.selectField}`}
                // style={{borderRadius: "20px"}}
                labelId="demo-simple-select-outlined-label"
                id="demo-simple-select-outlined"
                name="country"
                value={selectedCountry && selectedCountry.country ? selectedCountry.country : ''}
                label="Trade Currency"
              >
                {countryList.map((data, key) => {
                  return (
                    <MenuItem key={data.countryCode} value={data.countryCode}>{data.countryName}</MenuItem>
                  );
                })}
              </Select>
            </FormControl>
          </div>} */}
          {(Object.keys(countryCurrencyList).length > 0) && <div>
            <TextField
              style={{width: "100%"}}
              select
              size="small"
              variant="outlined"
              className={`${commonStyles.inputFieldWithGreyBg} ${classes.selectField}`}
              name="country"
              value={selectedCountry && selectedCountry.country ? selectedCountry.country : ''}
              onChange={e => {
                  changeCountry(e.target.value);
              }}>
                {countryList.map((data, key) => {
                  return (
                    <MenuItem key={data.countryCode} value={data.countryCode}>{data.countryName}</MenuItem>
                  );
                })}
            </TextField>
          </div>}
          {selectedCountry && selectedCountry.error && <div
            className="alert error extension"
            style={errorMSg}>
            <strong>{selectedCountry.error}</strong>
          </div>}

          {/* {(Object.keys(countryCurrencyList).length > 0) && <div>
            <TextField
              style={{width: "250px"}}
              select
              className={classes.margin}
              label="Operator"
              name="operatorId"
              value={selectedOperator && selectedOperator.operatorId ? selectedOperator.operatorId : ''}
              onChange={e => {
                  changeOperator(e.target.value);
              }}>
                {countryCurrencyList.map((data, key) => {
                  return (
                    <MenuItem key={data.operatorCountry.operatorId} value={data.operatorCountry.operatorId}>{data.operatorName}</MenuItem>
                  );
                })}
            </TextField>
          </div>}
          {selectedOperator && selectedOperator.error && <div
            className="alert error extension"
            style={errorMSg}>
            <strong>{selectedOperator.error}</strong>
          </div>} */}

          {(currencyList && currencyList.length > 0 && selectedCountry.country != "GLOBAL") && <div style={{marginTop: "15px"}}>
            <FormControl component="fieldset">
              <Typography className={commonStyles.darkBoldText}>{pageTexts.fiatCurrHeading}</Typography>
              <RadioGroup className={classes.margin} aria-label="currency" onChange={(event) => {setSelectedCurrency({currency: event.target.value})}} name="currency">
                {currencyList.map((currencyData, index) => {
                  return (
                    <FormControlLabel key={index} size="small" value={currencyData.code} control={<BlueRadio />} label={`${currencyData.code}`} disabled={(existingWallets.indexOf(`${selectedCountry.country}-${currencyData.code}-${selectedOperator.operatorId}`) != -1)} />
                  );
                })}
              </RadioGroup>
            </FormControl>
          </div>}

          {(countryList && countryList.length) > 0 ?
            <>
              {selectedCountry.country != GLOBAL ? <hr /> : ''}
              {countryList.map((data, key) =>
                <>
                  {data.countryCode == GLOBAL ?
                    <div style={{marginTop: "15px", marginBottom: "30px"}}>
                      <FormControl component="fieldset">
                        <Typography className={commonStyles.darkBoldText}>{pageTexts.digitalCurrHeading}</Typography>
                        <RadioGroup className={classes.margin} aria-label="currency" onChange={(event) => {changeDigitalCurrency({currency: event.target.value, countryCode: digitalOperatorInfo.countryCode, operatorId: digitalOperatorInfo.operatorId})}} name="currency">
                          {digitalCurrencyList.map((currencyData, index) => {
                            return (
                              <FormControlLabel key={index} size="small" value={currencyData.code} control={<BlueRadio />} label={`${currencyData.code == "USDC" ? "USDC (CIRCLE)" : currencyData.code}`} disabled={(existingWallets.indexOf(`${digitalOperatorInfo.countryCode}-${currencyData.code}-${digitalOperatorInfo.operatorId}`) != -1)} />
                            );
                          })}
                        </RadioGroup>
                      </FormControl>
                    </div>
                  : ""}
                </>
              )}
            </>
          : ""}

          {selectedCurrency && selectedCurrency.error && <div
            className="alert error extension"
            style={errorMSg}>
            <strong>{selectedCurrency.error}</strong>
          </div>}

          {backendMsg && backendMsg.msg && <div
            className={`alert extension ${backendMsg.error ? 'error' : 'success'}`}
            style={errorMSg}>
            <strong>{backendMsg.msg}</strong>
          </div>}
        </div>
        {/* <div className="footer">
          <div className="backArrow">
            <ArrowBackOutlinedIcon onClick={()=> setCurrentScreen("manageaccounts")} style={{cursor:"pointer",color:"#18C2EE"}}/>
          </div>
          <div className="footerRightButtonMedium">
            <button
                className="button-done"
                onClick={saveCurrencyWallet}
                disabled={loading}>
                DONE
            </button>
          </div>
        </div> */}
    </div>
  );
};

export default AddCurrencyWallet;
