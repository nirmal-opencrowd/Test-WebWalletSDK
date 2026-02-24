import React from "react";
import { Box, Divider, Grid,FormControlLabel,Checkbox, Modal, Typography, makeStyles } from "@material-ui/core";
import * as api from "./../api";
import { getActiveWallet } from '../utils/utils';
import styles from "./../styles/common.module.scss";
import UITexts from "./../../configurations/dropp.json";

const useStyles = makeStyles(() => ({
    modalContainer: {
        backgroundColor: '#FFFFFF',
        border: 0,
        padding: "15px",
        position: 'absolute',
        left: '10%',
        top: '10%',
        width: 250,

    },
    ctrlBtns: {
        marginTop: "5px",
        textAlign: "right",
    },
}))


const BankAccountInfo = (props) => {
    const classes = useStyles();
    const [activeWallet, setActiveWallet] = React.useState({});
    const [removeObj, setRemoveObj] = React.useState(null);
    const [openConfirmModal, setOpenConfirmModal] = React.useState(false);

    const pageTexts = UITexts.fundingAccount;
    const {  payOnDemandACHchecked, handleCheckboxpayOnDemandACH } = props

    React.useEffect(() => {
        async function getUserWalletList() {
            let walletList = await api.fetchUserWalletList();
            if (walletList && walletList.data.length) {
                setActiveWallet(getActiveWallet(walletList.data));
            }
        }

        if (!props.activeWallet) {
            getUserWalletList();
        } else {
            setActiveWallet(props.activeWallet);
        }

    }, []);

    const handleConfirmModalClose = () => {
        setRemoveObj(null);
        setOpenConfirmModal(false);
    };

    const showConfirmationModal = (type, lastFourDigits) => {
        setRemoveObj({ type, lastFourDigits });
        setOpenConfirmModal(true);
    };

    const remove = async () => {
        if (!removeObj) return;
        let res = await api.removeACH({lastFourDigitsOfACHAct: removeObj.lastFourDigits});
        if (res.responseCode == 0) {
            //   fetchDetailsForScreen();
            handleConfirmModalClose();
        }

    };

    return (
        <div>
            <div>
                <Box my={1}>
                    <Grid container >
                        <Grid item xs={6}>
                            <Typography className={styles.mediumSizedText}>
                                <span>
                                    {pageTexts.bankAccEndingWithMsg}:&nbsp;
                                </span>
                                <span className={styles.darkBoldText}>
                                    {activeWallet.achAccountLastFourDigits}
                                </span>
                            </Typography>
                        </Grid>
                        <Grid item xs={6}>
                            <Typography className={styles.mediumSizedText} align="right">
                                {pageTexts.supportsACHMsg}
                            </Typography>
                        </Grid>
                        {props.lowBalanceModal ? "" :
                            <div style={{ marginTop: "15px" }}>
                                <FormControlLabel
                                    control={
                                        <Checkbox
                                            checked={payOnDemandACHchecked}
                                            onChange={() => {
                                                handleCheckboxpayOnDemandACH();
                                            }}
                                            color="primary"
                                        />
                                    }
                                    label=<Typography className={styles.mediumSizedText}>{pageTexts.payOnDemandACHCheckbox}</Typography>
                                />
                            </div>
                        }
                    </Grid>

                </Box>
                <Divider className={styles.divider}/>
                {/* <label style={{ fontSize: "1.3em", display: "inline-block", marginLeft: "12px", marginTop: "12px" }}>XXXX-XXXX-{activeWallet.achAccountLastFourDigits}</label> */}
                {/* <label style={{ fontSize: "1.3em", display: "inline-block", marginLeft: "12px", marginTop: "12px" }}>XXXX-XXXX-1234</label> */}
                <Box my={1}>
                    <div>
                        <div>
                            {props.lowBalanceModal ? "" :
                                <a
                                    className={`${styles.blueBoldLink} ${styles.upperCase}`}
                                    onClick={props.showConfirmationModal ?  ()=> props.showConfirmationModal("ACH", activeWallet.achAccountLastFourDigits) : showConfirmationModal}
                                >
                                    {pageTexts.removeAccountLinkTxt}
                                </a>
                            }
                        </div>
                    </div>
                </Box>
            </div>
            {removeObj ?
                <Modal
                    open={openConfirmModal}
                    onClose={handleConfirmModalClose}
                >
                    <Box className={classes.modalContainer}>
                        <Typography id="modal-modal-description" sx={{ mt: 2 }}>
                            Do you want to {removeObj.type == "ACH" ? "cancel ACH?" : "remove your saved credit card details?"}
                        </Typography>
                        <div className={classes.ctrlBtns}>
                            <button className="button-cancel" onClick={handleConfirmModalClose}>
                                No
                            </button>
                            &nbsp;&nbsp;&nbsp;&nbsp;
                            <button className="button-done" onClick={remove}>
                                Yes
                            </button>
                        </div>
                    </Box>
                </Modal>
                : ""}
        </div>
    )
}

export default BankAccountInfo