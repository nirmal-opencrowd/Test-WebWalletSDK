import React from 'react';
import { Modal, Box, Typography, makeStyles, TextField, InputAdornment } from '@material-ui/core';
import * as localstorage from "./../utils/local-storage";
import CancelRoundedIcon from '@material-ui/icons/CancelRounded';
import classNames from 'classnames';
import Visibility from '@material-ui/icons/Visibility';
import VisibilityOff from '@material-ui/icons/VisibilityOff';

const useStyles = makeStyles((theme) => ({
    modalContainer: {
        backgroundColor: '#FFFFFF',
        border: 0,
        padding: "15px",
        position: 'absolute',
        width: 250,

    },
    modalAtCenter: {
        alignItems: "center",
        display: "flex",
        justifyContent: "center",
    },
    ctrlBtns: {
        marginTop: "10px",
        textAlign: "center",
    },
    cancelIcon: {
        cursor: "pointer",
        opacity: "0.7",
        position: "absolute",
        right: "-23px",
        top: "-15px",
    }
}));

const PassphraseModal = ({
    openPassphraseModal,
    setOpenPassphraseModal,
    setPassphraseMatched
}) => {
    const classes = useStyles();

    const [passphrase, setPassphrase] = React.useState(null);
    const [localUserData, setLocalUserData] = React.useState(null);
    const [passphraseErr, setPassphraseErr] = React.useState(null);
    const [showPassphrase, setShowPassphrase] = React.useState(false);

    React.useEffect(() => {
        async function getLocalUser() {
            let userData = await localstorage.decrypted.get();
            if (userData) {
                setLocalUserData(userData);
            }
        }
        getLocalUser();
    }, [])

    // validating whether the passphrase user entering is correct or not
    const validation = () => {
        if (!passphrase) {
            setPassphraseErr("Please enter passphrase")
        }
        if (passphrase && localUserData && localUserData.p) {
            if (passphrase == localUserData.p) {
                setPassphraseMatched(true);  // setting the passphraseMatch state true , which is defined in HbarDetails.js
                setOpenPassphraseModal(false)
            } else {
                setPassphraseMatched(false);
                setPassphraseErr("Invalid passphrase");
            }
        }
    }

    // function defined to just close the modal without entering the passphrase
    const modalCloseHandler = () => {
        setOpenPassphraseModal(false);
        setPassphraseErr(null);
    }

    const passphraseHandler = (e) => {
        setPassphrase(e.target.value);
        setPassphraseErr(null);
    }

    return (
        <div>
            <Modal
                open={openPassphraseModal}
                onClose={validation}
                className={classes.modalAtCenter}
            >
                <Box className={classes.modalContainer}>
                    <CancelRoundedIcon className={classes.cancelIcon} onClick={modalCloseHandler} />
                    <Typography style={{ paddingBottom: "14px" }}>Enter your passphrase to continue</Typography>
                    <TextField
                        value={passphrase}
                        onChange={passphraseHandler}
                        variant='outlined'
                        size='small'
                        style={{ width: "100%" }}
                        type={showPassphrase ? "text" : "password"}
                        InputProps={{
                            endAdornment: <InputAdornment position="end">
                                <div style={{cursor:"pointer"}} onClick={()=> setShowPassphrase(!showPassphrase)}>
                                    {
                                        showPassphrase ? <VisibilityOff color="disabled" /> : <Visibility color="disabled" />
                                    }
                                </div>
                            </InputAdornment>
                        }}
                    />
                    {
                        passphraseErr && (<div className="errMsg extension" style={{ marginBottom: "10px", marginLeft: "5px" }}>
                            <strong>{passphraseErr}</strong>
                        </div>)
                    }
                    <div className={classes.ctrlBtns}>
                        <button className={classNames(["button-done"])} onClick={validation}>Continue</button>
                    </div>
                    <div style={{ paddingTop: "15px" }}>
                        <Typography style={{ fontWeight: "600", fontSize: "14px" }}>Why are you asking me for this?</Typography>
                        <Typography variant='body2'>To better protect your wallet, we will occasionally ask you to confirm your passphrase before viewing sensitive information or performing sensitive actions.</Typography>
                    </div>
                </Box>
            </Modal>
        </div>
    )
}

export default PassphraseModal;