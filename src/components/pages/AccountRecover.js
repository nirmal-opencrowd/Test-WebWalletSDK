import React, { useEffect, useRef } from "react";
import { getQrCode } from "../../api";
import { v1 as uuidv1 } from 'uuid';
import QRCode from "react-qr-code";
import { getBrowserDetail, droppVersion } from "./../../utils/utils";
import * as localstorage from "../../utils/local-storage";

import { Grid , CircularProgress} from "@material-ui/core";

const AccountRecover = props => {
    const [result, setResult] = React.useState(null);
    const [uuidJson, setUuidJson] = React.useState(null);
    let intervalFunc = null;
    let UUID = '';

    React.useEffect(() => {
        return () => {
            if(intervalFunc) {
                clearInterval(intervalFunc);
            }
        };
    }, [])

    async function getUuid() {
        ///// Get uuid from local storage data
        return localstorage._get("_uuid").then((uuidData) => {
            return uuidData;
        });
    }

    React.useEffect(() => {
        async function fetchUUID() {
            if (props.switchToSandbox) {
                UUID = uuidv1();
            } else {
                const uuidData = await getUuid();
                UUID = uuidData._uuid ? uuidData._uuid : uuidv1();
            }
        }
        fetchUUID();
    }, []);

    const getQRCode = async (switchToSandbox) => {
        let uuid = UUID;
        ///// Set uuid from local storage data
        localstorage._set({'_uuid' : uuid});
        let uuidJsonData = {
            "uuid" : uuid,
            "qr_type" : "EXTN_ONB"
        };
        setUuidJson(uuidJsonData);
        const browserDetail = getBrowserDetail();
        if (uuid) {
            const qrDataReq = {
                "uuid": uuid,
                "browserName": browserDetail.browserName,
                "browserVersion": browserDetail.browserVersion,
                "droppExtensionVersion": droppVersion()
            }
            let response = await getQrCode(qrDataReq, switchToSandbox);
            if(response && response.responseCode === 0) {
                const qrData = response.data.qrCodeEncrypted;
                if (!props.switchToSandbox || (JSON.parse(qrData)?.env == "SB" || JSON.parse(qrData)?.env == "QA" || JSON.parse(qrData)?.env == "D")) {
                    clearInterval(intervalFunc);
                    setResult(response.data.qrCodeEncrypted);
                    props.getQrcodeData(response.data.qrCodeEncrypted);
                }
            }
        }
    }


    React.useEffect(() => {
        if(!result) {
            intervalFunc = setInterval(() => props.switchToSandbox ? getQRCode(props.switchToSandbox) : getQRCode(), 2000);
        }
    }, [result]);

    return (
        <Grid>
                {/* <div
                    style={{
                        position: "absolute",
                        top: "1.3em",
                        left: "5em",
                    }}>
                    <img style={{ height: "50px" }} src="./dropp_logo.png" alt="logo" />
                </div> */}
                <Grid item>
                    <p style={{ fontSize: "14px", margin: "10px", marginBottom: "1em", textAlign: "center", }}
                        className={props.switchToSandbox ? "" : "select-action__button-text-small"}>
                        {props.switchToSandbox ? "Please scan the QR from your Dropp Mobile app. Make sure Test mode is enabled on your app" : "Please scan the QR from your Dropp Mobile app"}
                    </p>
                </Grid>

                <Grid item style={{marginTop:"-19px", display:'flex', flexDirection: 'column', alignItems:'center'}}>
                    {/* <label htmlFor="fname" >QR code</label> */}
                    { uuidJson && uuidJson.uuid ?
                        <QRCode  size={150} style={{ fontSize: "16px", marginTop: "15px" }} value={JSON.stringify(uuidJson)} />
                        :
                        <Grid container justifyContent={"center"} alignItems={"center"}>
                                <Grid item style={{marginTop: "20px"}}>
                                    <CircularProgress size={25}/>
                                </Grid>
                            </Grid>
                    }

                </Grid>

                {/* <Grid item style={{ fontSize: "12px", marginTop: "1em", textAlign: "center", }} >
                    <p>UUID value is : {UUID}</p>
                </Grid> */}
            </Grid>
    );
};

export default AccountRecover;
