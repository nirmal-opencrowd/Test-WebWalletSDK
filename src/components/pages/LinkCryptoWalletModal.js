import React, { useState } from 'react';
import { Modal, Box, Typography, makeStyles, TextField, InputAdornment } from '@material-ui/core';
import classNames from 'classnames';
import * as api from '../../api/index'
import { SUPPORTED_CRYPTO_CURRENCIES } from "./../../utils/constants";

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
        display :"flex",
        justifyContent:"flex-end"
    },
}));

const LinkCryptoWalletModal = ({open, setOpen, setCurrentScreen, screen, getUserWalletList, setScreenWithData, screenData}) => {
    const classes = useStyles();

    const [cryptoLinkErr, setCryptoLinkErr] = useState(null);

    const modalCloseHandler = () => {
        setCryptoLinkErr(null);
        setOpen(false);
    }

    const enableCryptoWallet = async () =>{
        let linked = {};
        for (let i = 0; i < SUPPORTED_CRYPTO_CURRENCIES.length ; i++) {
            try {
                let linkCrypto = await api.saveCurrencyWallet({countryCode : "GLOBAL", currencyCode: SUPPORTED_CRYPTO_CURRENCIES[i], operatorId: "0"})
                if(linkCrypto && linkCrypto.responseCode == 0) {
                    linked[SUPPORTED_CRYPTO_CURRENCIES[i]] = true;
                } else {
                    linked[SUPPORTED_CRYPTO_CURRENCIES[i]] = false;
                    linkCrypto && linkCrypto.errors && linkCrypto.errors.length ? setCryptoLinkErr(linkCrypto.errors[0]) : setCryptoLinkErr("Something went wrong, please try again later");
                    // setCurrentScreen(screen)
                }
            } catch (error) {
                setCryptoLinkErr("Something went wrong, please try again later");
            }
        }
        for (let i = 0; i < SUPPORTED_CRYPTO_CURRENCIES.length; i++) {
            if (linked[SUPPORTED_CRYPTO_CURRENCIES[i]]) {
                getUserWalletList();
                setOpen(false);
                if (setScreenWithData && screenData) {
                    setScreenWithData(screen, screenData);
                } else {
                    setCurrentScreen(screen);
                }
                break;
            }
        }
    }

    return (
        <div>
            <Modal
                open={open}
                onClose={modalCloseHandler}
                className={classes.modalAtCenter}
            >
                <Box className={classes.modalContainer}>
                    <Typography style={{ paddingBottom: "14px" }}>Please enable crypto wallets to use this feature. Once enabled, you can later manage them from the 'Manage Currency Accounts' menu.</Typography>
                    {cryptoLinkErr && (<div className={classNames(["errMsg", "error extension"])} style={{ marginBottom: "10px", marginLeft: "5px" }}>
                        <strong>{cryptoLinkErr}</strong>
                    </div>)}
                    <div className={classes.ctrlBtns}>
                        <button
                        className={classNames(["button-done"])}
                        style={{marginRight:"5px", display: cryptoLinkErr ? "none" : ""}}
                        onClick={enableCryptoWallet}
                        >Enable
                        </button>
                        <button
                        className='button-cancel'
                        onClick={modalCloseHandler}
                        >Cancel
                        </button>
                    </div>
                </Box>
            </Modal>
        </div>
    )
}

export default LinkCryptoWalletModal;