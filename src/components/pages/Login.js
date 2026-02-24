import React from "react";
import * as localstorage from "../../utils/local-storage";
import {
    FormControl,
    Grid,
    Input,
    InputAdornment,
    OutlinedInput,
    InputLabel,
    makeStyles,
    Typography,
    TextField
} from "@material-ui/core";
import classNames from "classnames";

var CryptoJS = require("crypto-js");

const useStyles = makeStyles(() => ({
    OutlinedInputRoot:{
        height:'18px',
    },
    inputField: {
        padding:"5px 7px",
        '&:focus': {
          borderColor: '#18C2EE"',
        },
      },
    greyBackground: {
        backgroundColor: "#f9f9f9",
        marginTop: "20px",
        padding: "10px",
        borderRadius:"10px"
    },
    buttonContainer:{
        display:"flex",
        justifyContent:"space-between",
        paddingTop:"30px"
    },
    button:{
        width:"45%",
        cursor:"pointer"
    },
}))

const Login = ({ history, forgotPin, forceUpdate, merchantTxn }) => {
    const classes = useStyles();

    const [pin, setPin] = React.useState("");
    const [unlockAccountError, setUnlockAccountError] = React.useState(false);

    function closeAlert() {
        setTimeout(function () {
            setUnlockAccountError(false);
        }, 3000);
    }

    const unlockAccount = async () => {
        setUnlockAccountError(false);
        let resultEncrypted = await localstorage._get("_encrypted");
        try {
            let decrypted = JSON.parse(
                CryptoJS.AES.decrypt(resultEncrypted._encrypted, pin).toString(CryptoJS.enc.Utf8)
            );
            await localstorage._set({ _decrypted: decrypted });
            forceUpdate(Object.keys(merchantTxn).length > 0);
        } catch (e) {
            setUnlockAccountError(true);
        }
    };

    return (
        <Grid >
            <div
                style={{
                    textAlign: "center",
                    marginTop: "28px",
                }}>
                <img height="40px" width="96px" src="./dropp_logo.png" />
            </div>

            <Grid item style={{ padding: "20px" }}>
                <div className={classes.greyBackground}>
                    <div style={{width:"92%", margin:"40px 0px"}}>
                        <FormControl
                            style={{
                                padding:"0px 20px",
                                width:"91%"
                            }}
                            variant="outlined">
                            {/* <InputLabel htmlFor="pin">Enter PIN</InputLabel> */}
                            <label style={{marginBottom:"7px"}}>
                                <Typography variant="body2" >
                                    Enter PIN to unlock your wallet
                                </Typography>
                            </label>
                            <TextField
                                className={{ root: classes.OutlinedInputRoot, input: classes.inputField }}
                                style={{height:"35px", width:"100%", backgroundColor:"#ffffff"}}
                                type="password"
                                id="pin"
                                value={pin}
                                variant="outlined"
                                size="small"
                                onChange={e => setPin(e.target.value)}
                            />

                        </FormControl>
                    </div>
                </div>
                <div>
                    <button
                        style={{ marginTop: "20px", width: "100%" }}
                        className="button-done"
                        onClick={unlockAccount}>
                        UNLOCK
                    </button>
                </div>
                <div className={classes.buttonContainer}>
                    <label
                        style={{ color: "#18C2EE", fontSize: "17px" }}
                        onClick={e => forgotPin(true)}>
                        <u>Forgot PIN?</u>
                    </label>
                    <button
                        style={{ border: "1px solid #18C2EE", backgroundColor: "#ffffff", color: "#000000" }}
                        className={classNames(["button-cancel", classes.button])}
                        onClick={() => window.close()}
                    >
                        Close
                    </button>
                </div>
                {unlockAccountError && (
                    <div
                        className="alert error extension"
                        style={{ marginBottom: "20px", textAlign: "center", marginTop: "20px" }}>
                        <strong>Invalid PIN</strong>
                    </div>
                )}
            </Grid>
        </Grid>
    );
};

export default Login;
