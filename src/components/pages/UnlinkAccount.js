import React from "react";
import { Typography, makeStyles } from "@material-ui/core";
import classNames from "classnames";
import { resetLocalData } from "./../../utils/utils";

const useStyles = makeStyles(() => ({
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
        width:"45%"
    },
    spaceBtwPoints : {
        padding:"10px"
    }
}))

const UnlinkAccount = ({ forgotPin, forceUpdate }) => {
    const classes = useStyles();
    const unlink = async () => {
        resetLocalData(forceUpdate)
    };

    return (
        <div>
            <div
                style={{
                    textAlign: "center",
                    marginTop: "28px",
                }}>
                <img height="40px" width="96px" src="./dropp_logo.png" />
            </div>
            <br />
            <div style={{margin:"40px 20px 20px 20px"}}>
            <div className={classes.greyBackground}>
                <Typography variant="subtitle1" style={{fontWeight:"600"}}>Forgot PIN?</Typography>
                <div style={{paddingTop:"15px"}}>
                    <Typography variant="subtitle2">
                        By design, your PIN is not recoverable.
                    </Typography>
                </div>
                <div
                    style={{
                        paddingTop:"15px"
                    }}>
                    <Typography variant="subtitle2">
                        But here’s what you can do:
                    </Typography>
                    <ol style={{ fontSize: "15px" , padding:"16px", margin:"0px"}}>
                        <li className={classes.spaceBtwPoints}>
                            <Typography variant="subtitle2">
                              Unlink your account from this wallet extension by clicking on the Unlink button below.
                            </Typography>
                        </li>
                        <li className={classes.spaceBtwPoints}>
                            <Typography variant="subtitle2">
                                Link your account again using the backup QR code and passphrase.
                            </Typography>
                        </li>
                        <li className={classes.spaceBtwPoints}>
                            <Typography variant="subtitle2">
                                You can then setup a new PIN.
                            </Typography>
                        </li>
                    </ol>
                </div>
            </div>
                <div className={classes.buttonContainer}>
                    <button
                        className={classNames(["button-done", classes.button])}
                        onClick={unlink}>
                        UNLINK
                    </button>
                    <button
                        style={{border:"1px solid #18C2EE", backgroundColor:"#ffffff", color:"#000000"}}
                        className={classNames(["button-cancel", classes.button])}
                        onClick={e => forgotPin(false)}>
                        CANCEL
                    </button>
                </div>
            </div>
        </div>
    );
};

export default UnlinkAccount;
