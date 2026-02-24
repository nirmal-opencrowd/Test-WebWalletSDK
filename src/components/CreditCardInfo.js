import React from 'react';
import { Box, Checkbox, Divider, FormControlLabel, Grid, Modal, Typography, makeStyles } from '@material-ui/core';
import * as api from "./../api";
import { getActiveWallet } from '../utils/utils';
import styles from "./../styles/common.module.scss";
import uiTexts from "./../../configurations/dropp.json";

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

const CreditCardInfo = (props) => {
    const [activeWallet, setActiveWallet] = React.useState({});
    const [removeObj, setRemoveObj] = React.useState(null);
    const [openConfirmModal, setOpenConfirmModal] = React.useState(false);
    const classes = useStyles();

    const { isChecked, handleCheckboxChange } = props
    const pageTexts = uiTexts.creditCardInfoComp;

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

    const showConfirmationModal = (type, lastFourDigits) => {
        setRemoveObj({ type, lastFourDigits });
        setOpenConfirmModal(true);
    };

    const handleConfirmModalClose = () => {
        setRemoveObj(null);
        setOpenConfirmModal(false);
    };

    const remove = async () => {
        if (!removeObj) return;
        let res = await api.removeCC({ lastFourDigitsOfCC:  activeWallet.ccLastFourDigits });
        if (res && res.responseCode == 0) {
            //   fetchDetailsForScreen();
            handleConfirmModalClose();
            if (props.lowBalanceModal) {
                window.location.reload();
            }
        }
    };

    return (
        <div>
            <div>
                {
                    activeWallet && Object.keys(activeWallet).length ?
                        <Box my={1}>
                            <Typography className={styles.mediumSizedText}>
                                <span>
                                    {pageTexts.creditCardEndingWithTxt}:&nbsp;
                                </span>
                                <span className={styles.darkBoldText}>
                                    {activeWallet.ccLastFourDigits}
                                </span> &nbsp;&nbsp;
                                <span>
                                    {pageTexts.creditCardExpiryTxt}:&nbsp;
                                </span>
                                <span className={styles.darkBoldText}>
                                    {activeWallet.ccMonth}/{activeWallet.ccYear}
                                </span>
                            </Typography>
                            {props.lowBalanceModal ? "" :
                                <div style={{ marginTop: "15px" }}>
                                    <FormControlLabel
                                        control={
                                            <Checkbox
                                                checked={isChecked}
                                                onChange={handleCheckboxChange}
                                                color="primary"
                                            />
                                        }
                                        label=<Typography className={styles.mediumSizedText}>{pageTexts.payOnDemandCheckbox}</Typography>
                                    />
                                </div>
                            }

                            {/* <Grid container>
                                <Grid item>
                                    <label style={{ fontSize: "1.3em", display: "inline-block", marginLeft: "12px", marginTop: "12px" }}>XXXX-XXXX-XXXX-{activeWallet.ccLastFourDigits}</label>
                                </Grid>
                            </Grid> */}
                            <Divider className={styles.divider}/>
                            <Box my={2}>
                                <div>
                                    <div>
                                        {props.lowBalanceModal ? "" :
                                            <a
                                                className={`${styles.blueBoldLink} ${styles.upperCase}`}
                                                onClick={props.showConfirmationModal ?  ()=> props.showConfirmationModal("CC", activeWallet.ccLastFourDigits) : showConfirmationModal}
                                            >
                                                {pageTexts.removeLinkedCardTxt}
                                            </a>
                                        }
                                    </div>
                                </div>
                            </Box>
                            <br />
                        </Box> : ""
                }
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
        </div>
    )
}

export default CreditCardInfo