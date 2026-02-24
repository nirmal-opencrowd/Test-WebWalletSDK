import React from "react";
import { makeStyles } from '@material-ui/core/styles';
import Grid from "@material-ui/core/Grid";
import Typography from "@material-ui/core/Typography";
import * as api from "./../../api";
import RecurringPaymentCell from "./RecurringPaymentCell";
import CircularProgress from '@material-ui/core/CircularProgress';
import * as utils from "../../utils/utils";
import * as p2phelper from "../../utils/p2phelper.js";
import * as localstorage from "../../utils/local-storage";
import forge from "node-forge";
import Box from '@material-ui/core/Box';
import Modal from '@material-ui/core/Modal';
import { MAX_HEDERA_TXN_FEE } from "../../utils/constants";

import {proto} from "@hashgraph/proto";

const ed25519 = forge.pki.ed25519;

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
    fontSize : 10,
  },
  rPaymentContainer: {
    paddingLeft:"1px",
    paddingRight:"1px",
    paddingTop: "10px",
    maxHeight:"584px",
    overflowY:"scroll",
    width: "100%"
  },
  modalContainer: {
    backgroundColor: '#FFFFFF',
    border: 0,
    padding: "15px",
    position: 'absolute',
    left: '10%',
    top: '30%',
    width: 250,

  },
  ctrlBtns: {
    marginTop: "5px",
    textAlign: "right",
  },
  removeAuthLink: {
    color: "#18C2EE",
    cursor: "pointer",
    textDecoration: "underline",
  },
  disableAuthLink: {
    color: "#ccc",
    cursor: "not-allowed",
    textDecoration: "underline",
  }
}));

const MyRecurringPayments =( {setCurrentScreen, setScreenWithData, userDetails, duration, setDuration}) => {
  const [recurringPayments, setRecurringPayments] = React.useState(null);
  const [loading, setLoading] = React.useState(true);
  const [noActivePayments, setNoActivePayments] = React.useState(null);
  const [open, setOpen] = React.useState(false);
  const [openDroppKeyModal, setOpenDroppKeyModal] = React.useState(false);
  const [cancelData, setCancelData] = React.useState(null);
  const [hideBtn, setHideBtn] = React.useState(false);
  const [droppNodeId, setDroppNodeId] = React.useState(0);
  const [signatures, setSignatures] = React.useState({});
  const [apiInProgress, setApiInProgress] = React.useState(false);
  const [hasCryptoAuthorization, setHasCryptoAuthorization] = React.useState(null);
  const classes = useStyles();
  const {AccountID, Timestamp, TransactionID, Duration, TransactionBody, SignaturePair, SignatureMap, Transaction, Key, CryptoUpdateTransactionBody} = proto;

  async function getSignatures() {
    let signatures = await localstorage._get("_decrypted");
    setSignatures(signatures._decrypted);
  }

  async function fetchNodes() {
    let nodeDetails = await api.fetchNodes();
    const nodeArr = nodeDetails.data[0].nodeAccountId.split(".");
    const node = nodeArr[nodeArr.length - 1];
    setDroppNodeId(parseInt(node));
  }

  async function hasRecurringPayment() {
    const result = await api.hasRecurringPayment();
    if (result && result.responseCode == 0) {
      setHasCryptoAuthorization(result.data);
    }
  }

  React.useEffect(() => {
    getMyActiveRecurringPayments({status: "ACTIVE", payerAccount: utils.hederaAccountToString(userDetails.hhAccount)});
    Promise.all([fetchNodes(), getSignatures()]);
  }, [userDetails]);

  const getMyActiveRecurringPayments = async (data) => {
    let payments = await api.fetchActiveRecurringPayments(data);
    if (payments && payments.data.length) {
      setRecurringPayments(payments.data);
      setNoActivePayments(false);
    } else {
      setRecurringPayments(null);
      setNoActivePayments(true);
      hasRecurringPayment();
    }
    setLoading(false);
  };

  const handleOpen = async (data) => {
    setCancelData(data);
    setOpen(true);
  };

  const createEncodedUpdateAccount = async() => {
    var accountIDSender = AccountID.create({accountNum:userDetails.hhAccount.accountNumber})
    var accountIDNode = AccountID.create({accountNum:droppNodeId})
    var userAccountKey = Key.create({ed25519: p2phelper.hexToBytes(signatures.publicKey)});

    var cryptoUpdateTransactionBody = CryptoUpdateTransactionBody.create({accountIDToUpdate: accountIDSender, key: userAccountKey});

    let timeStampNano = p2phelper.createTimestampNano();
    var timestamp = Timestamp.create({seconds:Math.floor(timeStampNano), nanos: 0});

    var transactionID = TransactionID.create({transactionValidStart:timestamp, accountID:accountIDSender});
    var duration = Duration.create({seconds:180});

    var transactionBody = TransactionBody.create({
      transactionID:transactionID,
      nodeAccountID:accountIDNode,
      transactionFee : MAX_HEDERA_TXN_FEE,
      transactionValidDuration : duration,
      generateRecord : true,
      // memo : "Update Account via Dropp",
      cryptoUpdateAccount : cryptoUpdateTransactionBody
    });

    var transactionBodyBytes = TransactionBody.encode(transactionBody).finish()

    return await utils.getEncodedTransactionBytes(transactionBodyBytes, signatures, userDetails);
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
    //   bodyBytes : transactionBodyBytes,
    //   sigMap : signatureMap
    // })

    // var transactionBytes = Transaction.encode(transaction).finish();
    // let encodedTransactionBytes = btoa(String.fromCharCode(...new Uint8Array(transactionBytes)));

    // return encodedTransactionBytes
  };

  const cancelRecurrence = async () => {
    if (cancelData) {
      setOpen(false);
      let cancelPayment = await api.cancelRecurringPayment({payerAccount: utils.hederaAccountToString(userDetails.hhAccount), ...cancelData});
      if (cancelPayment) {
        setCancelData(null);
        setLoading(true);
        getMyActiveRecurringPayments({status: "ACTIVE", payerAccount: utils.hederaAccountToString(userDetails.hhAccount)});
      }
    }
  };

  const handleClose = () => {
    setCancelData(null);
    setOpen(false);
  }

  const closeDroppKeyModal = () => {
    setOpenDroppKeyModal(false);
  };

  const removeDroppKeyAsCosigner = async () => {
    setApiInProgress(true);
    const updateAccountTxn = await createEncodedUpdateAccount();
    setOpenDroppKeyModal(false);
    let result = await api.removeDroppAsCosigner({base64encodedUpdateAccountTx: updateAccountTxn});
    if (result) {
      setHideBtn(true);
      await api.fetchUserDetails(true);
    }
    setApiInProgress(false);
  };

  // const handleDurationChange = selectedOption => {
  //   setDuration(selectedOption.target.value);
  // };

  return (
    <>
      {/* <FormControl size="small" variant="outlined" className={classes.formControl} style={{marginLeft:"209px",marginBottom:"3px"}}>
        <InputLabel id="demo-simple-select-outlined-label">Duration</InputLabel>
        <Select
          style={{width:"107px", height:"36px"}}
          labelId="demo-simple-select-outlined-label"
          id="demo-simple-select-outlined"
          value={duration}
          onChange={handleDurationChange}
          label="Duration"
          size="small"
        >
          <MenuItem value={"30"}>30 Days</MenuItem>
          <MenuItem value={"60"}>60 Days</MenuItem>
          <MenuItem value={"90"}>90 Days</MenuItem>
          <MenuItem value={"All"}>All</MenuItem>

        </Select>
      </FormControl>
      <br/> */}
      {loading ?
        <div style={{margin: "90px auto"}}>
          <Grid container justifyContent={"center"} alignItems={"center"}>
              <Grid item>
                <CircularProgress />
              </Grid>
          </Grid>
        </div>
      :
        <div className={classes.rPaymentContainer}>
          {(recurringPayments && recurringPayments.length > 0) ?
            <>
              {recurringPayments.map((data, index) =>
                <React.Fragment key={index}>
                  <RecurringPaymentCell  paymentData={data} cancelRecurringPayment={handleOpen} />
                </React.Fragment>
              )}
            </>
          : <>
            {(noActivePayments != null && noActivePayments) ?
              <>
                {
                  (!hideBtn && userDetails.isDroppCosigner && (hasCryptoAuthorization != null && !hasCryptoAuthorization) && noActivePayments == true) ?
                    <>
                      <Grid container>
                        <Grid item style={{fontSize: "1.1em", lineHeight: "18px"}}>
                            <div style={{color: "#C53942"}}>
                              You had authorized Dropp to withdraw {(userDetails.currency == "HBAR") ? "HBAR" : (userDetails.currency == "USDC" ? "USDC" : "USD")} from your Dropp account for recurring payments.
                            </div>
                            <div style={{textAlign: "right", paddingTop: "15px", paddingRight: "20px"}}>
                              {apiInProgress ?
                                <span className={classes.disableAuthLink}>Remove Authorization</span>
                              :
                                <span className={classes.removeAuthLink} onClick={() => setOpenDroppKeyModal(true)}>Remove Authorization</span>
                              }
                            </div>
                        </Grid>
                      </Grid>
                      {apiInProgress ?
                        <Grid container justifyContent={"center"} alignItems={"center"} style={{marginTop: "10px"}}>
                            <Grid item>
                              <CircularProgress />
                            </Grid>
                        </Grid>
                      : ""}
                    </>

                  : ""
                }
                <Grid container justifyContent={"center"} alignItems={"center"}>
                  <Grid item>
                      <div style={{marginTop: "130px", fontSize:"12px"}}>
                        No Active Recurring Payments
                      </div>
                  </Grid>
                </Grid>
              </>
            : ''}
          </>}
        </div>
      }

      <Modal
        open={open}
        onClose={handleClose}
      >
        <Box className={classes.modalContainer}>
          <Typography id="modal-modal-description" sx={{ mt: 2 }}>
            Are you sure you want to cancel your recurring payment?
          </Typography>
          <div className={classes.ctrlBtns}>
            <button className="button-cancel" onClick={handleClose}>
                No
            </button>
            &nbsp;&nbsp;&nbsp;&nbsp;
            <button className="button-done" onClick={cancelRecurrence}>
                Yes
            </button>
          </div>
        </Box>
      </Modal>

      <Modal
        open={openDroppKeyModal}
        onClose={closeDroppKeyModal}
      >
        <Box className={classes.modalContainer}>
          <Typography id="modal-modal-description" sx={{ mt: 2 }}>
            Are you sure you want to remove Dropp's authorization to withdraw {(userDetails.currency == "HBAR") ? "HBAR" : (userDetails.currency == "USDC" ? "USDC" : "USD")} for recurring payments?
          </Typography>
          <div className={classes.ctrlBtns}>
            <button className="button-cancel" onClick={closeDroppKeyModal}>
                No
            </button>
            &nbsp;&nbsp;&nbsp;&nbsp;
            <button className="button-done" onClick={removeDroppKeyAsCosigner}>
                Yes
            </button>
          </div>
        </Box>
      </Modal>
    </>
  );
};

export default MyRecurringPayments;
