import React from 'react';
import { Box, Modal, Typography, makeStyles } from '@material-ui/core';
import * as api from "./../api";

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

const SaveCCModal = ({ openSaveCCModal, setOpenSaveCCModal, setIsChecked, userDetails, isChecked }) => {

    const classes = useStyles();

    const saveCC = async () => {
        let res = await api.enableSavedCCForPayOnDemand({lastFourDigitsOfCC: userDetails.ccLastFourDigits, payOnDemand: !isChecked});
        setIsChecked((res && res.responseCode == 0) ? !isChecked : isChecked);
        api.resetUserDetails();
        setOpenSaveCCModal(false);
    }

    const saveCCModalClose = () => {
        isChecked ? setIsChecked(true) : setIsChecked(false);
        setOpenSaveCCModal(false);
    }


    return (
        <div>
            <Modal
                open={openSaveCCModal}
                onClose={saveCCModalClose}
            >
                <Box className={classes.modalContainer}>
                    <Typography id="modal-modal-description" sx={{ mt: 2 }}>
                    {
                        isChecked ? "Do you want to remove this for future purchases?"
                        :
                        "Do you want to save this for future purchases?"
                    }
                    </Typography>
                    <div className={classes.ctrlBtns}>
                        <button className="button-cancel" onClick={saveCCModalClose}>
                            No
                        </button>
                        &nbsp;&nbsp;&nbsp;&nbsp;
                        <button className="button-done" onClick={saveCC}>
                            Yes
                        </button>
                    </div>
                </Box>
            </Modal>
        </div>
    )
}

export default SaveCCModal