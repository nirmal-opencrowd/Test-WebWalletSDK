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

const SavedACHForPayOnDemandModal = ({ openOnDemandACH, setopenOnDemandACH, setPayOnDemandACHChecked, userDetails, payOnDemandACHchecked }) => {
    const classes = useStyles();

    const saveCC = async () => {
        let res = await api.enableSavedACHForPayOnDemand({lastFourDigitsOfACHAct: userDetails.achAccountLastFourDigits, payOnDemand: !payOnDemandACHchecked});
        setPayOnDemandACHChecked((res && res.responseCode == 0) ? !payOnDemandACHchecked : payOnDemandACHchecked);
        api.resetUserDetails();
        setopenOnDemandACH(false);
    }

    const saveCCModalClose = () => {
        payOnDemandACHchecked ? setPayOnDemandACHChecked(true) : setPayOnDemandACHChecked(false);
        setopenOnDemandACH(false);
    }


    return (
        <div>
            <Modal
                open={openOnDemandACH}
                onClose={saveCCModalClose}
            >
                <Box className={classes.modalContainer}>
                    <Typography id="modal-modal-description" sx={{ mt: 2 }}>
                    {
                        payOnDemandACHchecked ? "Do you want to remove this for future purchases?"
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

export default SavedACHForPayOnDemandModal