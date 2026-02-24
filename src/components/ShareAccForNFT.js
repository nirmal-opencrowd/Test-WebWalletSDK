import React from 'react';
import ArrowBackOutlinedIcon from '@material-ui/icons/ArrowBackOutlined';
import { makeStyles } from '@material-ui/core/styles';
import Typography from "@material-ui/core/Typography";
import { hederaAccountToString } from "./../utils/utils";
import Copy from "./pages/Copy";
import QRCode from "react-qr-code";
import "./../NFTcollections.css";

const useStyles = makeStyles((theme) => ({
    detailContainer: {
        paddingLeft: "20px",
        paddingRight: "20px",
        marginTop: "30px",
        maxHeight: "420px",
        overflowY: "scroll"
    },
    keyField: {
        width: "100%",
    },
    multilineInput: {
        '& .MuiInput-multiline': {
            paddingTop: 0
        }
    },
}));

const ShareAccForNFT = ({ setCurrentScreen, userDetails }) => {
    const classes = useStyles();
    return (
        <div style={{ marginTop: "-33px" }}>
            <div
                style={{
                    textAlign: "left",
                    marginTop: "6px",
                    marginLeft: "20px",
                    marginBottom: "10px"
                }}>
                <div style={{ paddingTop: "9px" }}>
                    <label style={{ fontWeight: "450", color: "#18C2EE", fontSize: "1.8em" }}>
                        DROPP
                    </label>
                    <br />
                    <label style={{ fontSize: "1.3em" }}>
                        HEDERA ACCT#
                    </label>
                    <br />
                    <label style={{ fontSize: "1.3em" }}>
                        {hederaAccountToString(userDetails.hhAccount)}
                    </label>
                </div>
            </div>
            <div className={classes.detailContainer}>
                <Typography>Transfer NFT to your Dropp Account</Typography>
                <div style={{ padding: "15px 0", textAlign: "center" }}>
                    <QRCode value={hederaAccountToString(userDetails.hhAccount)} />
                </div>

                <div style={{ textAlign: "center" }}>
                    <span style={{ verticalAlign: "middle", marginRight: "5px" }}>{hederaAccountToString(userDetails.hhAccount)}</span><span style={{ verticalAlign: "middle" }}><Copy iconColor="disabled" toolTipTitle="Copy Hedera Account Address" copyMessage="Hedera Account Address Copied to clipboard" text={hederaAccountToString(userDetails.hhAccount)} /></span>
                </div>
            </div>
            <div className='footer'>
                <div className='backArrow'>
                    <ArrowBackOutlinedIcon onClick={() => setCurrentScreen("nftReceiving")} style={{ cursor: "pointer", color: "#18C2EE" }} />
                </div>
            </div>
        </div>
    )
}

export default ShareAccForNFT;