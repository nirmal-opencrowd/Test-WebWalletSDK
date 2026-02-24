import React, { useRef } from "react";
import QrReader from "react-qr-reader";
import forge from "node-forge";
import {Mnemonic} from "@hashgraph/sdk";
import { useAlert } from "react-alert";
import Dropdown from "react-dropdown";
import {
    FormControl,
    Grid,
    InputAdornment,
    InputLabel,
    OutlinedInput,
    MenuItem,
    Select,
} from "@material-ui/core";
import * as p2phelper from "./../../utils/p2phelper";
var bip39 = require("bip39");
var CryptoJS = require("crypto-js");

const ed25519 = forge.pki.ed25519;

const previewStyle = {
    marginTop: "5px",
    height: 150,
    width: 150,
};

/* global chrome */

const AdvancedHbarRecovery = props => {
    const [result, setResult] = React.useState("");
    const [passphrase, setPassphrase] = React.useState("");
    const [pin, setPin] = React.useState("");
    const [renterPin, setRenterPin] = React.useState("");
    const [userData, setUserData] = React.useState({});
    const [errorMessage, setErrorMessage] = React.useState("");
    const [net, setNet] = React.useState("");

    const qrReaderRef = useRef(null);
    const alert = useAlert();

    const validate = () => {
        if (!result || !passphrase || !pin || !renterPin) {
            setErrorMessage("Missing Fields");
            closeAlert();
            return false;
        }
        if (pin !== renterPin) {
            setErrorMessage("Pins don't match");
            closeAlert();
            return false;
        }
        return true;
    };

    function closeAlert() {
        setTimeout(function () {
            setErrorMessage("");
        }, 3000);
    }

    const sendMessage = encryptedData => {
        chrome.runtime.sendMessage(
            { type: "link", _encrypted: encryptedData, port: net },
            async function (response) {}
        );
    };

    const navigateToLinkAcctSuccess = () => {
        props.history.push("/home"); // or "/dashboard" if that's the main page
    };

    const decryptNew = async backupString => {
        let encryptedBackupString = backupString;
        let encryptedBackupJson = {};
        try {
            encryptedBackupJson = JSON.parse(backupString);
        } catch(err) {
             encryptedBackupJson = {};
         }
         let entropyStr = encryptedBackupJson["e"];
         let encryptedEntropy = forge.util.decode64(entropyStr);
         let entropyHashString = encryptedBackupJson["h"];
         let entropyHash = forge.util.decode64(entropyHashString);
         let userId = encryptedBackupJson["u"];


        //AES
        let decryptedBackupString = forge.util.decode64(entropyStr);
        let byteBufferStringRequiredByForge = forge.util.createBuffer(decryptedBackupString);
        // DERIVED KEY
        try {
            var salt = forge.util.hexToBytes("ff");
            var keygen = forge.pkcs5.pbkdf2(passphrase, salt, 2048, 32, "sha512");
            //var keygen = forge.pkcs5.pbkdf2('test', salt, 2048, 32,'sha512');

            // AES DECRYPT
            let decipher = forge.cipher.createDecipher("AES-CTR", keygen);
            decipher.start({
                iv: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
            });
            decipher.update(byteBufferStringRequiredByForge);
            decipher.finish();

            let utf8DecryptedOpRaw = decipher.output.data;
            let md = forge.md.md5.create();
            md.update(utf8DecryptedOpRaw);
            if (md.digest().toHex().toLowerCase() == forge.util.bytesToHex(entropyHash).toLowerCase()) {
                // let decoded64Entropy = forge.util.decode64(utf8DecryptedOpRaw);

                let entropyHex = forge.util.bytesToHex(utf8DecryptedOpRaw);
                let mnemonic = bip39.entropyToMnemonic(entropyHex);

                // var Ed25519KeyPair = await Ed25519PrivateKey.fromMnemonic(mnemonic, "");
                // var DerivedEd25519KeyPair = await Ed25519KeyPair.derive2(0);
                const recoveredMnemonic = await Mnemonic.fromString(mnemonic.toString());
                const recoveredRootKey = await recoveredMnemonic.toPrivateKey();
                var DerivedEd25519KeyPair = await recoveredRootKey.derive(0);
                var publicKey = DerivedEd25519KeyPair._keyPair.publicKey;
                var publicKeyHex = p2phelper.bytesToHex(publicKey);
                var privateKey = DerivedEd25519KeyPair._keyPair.secretKey;
                var privateKeyHex = p2phelper.bytesToHex(privateKey);

                let randomBytes = forge.util.createBuffer("KeyPairTest");
                let sig = signWithKeyAndVerify(randomBytes, privateKeyHex, publicKeyHex);

                if (sig) {
                    return {
                        publicKey: publicKeyHex,
                        privateKey: privateKeyHex,
                        userId: userId,
                    };
                } else {
                    return undefined;
                }
                // return {
                //     entropy: utf8DecryptedOpRaw,
                //     userId: userId,
                // };
            } else {
                return undefined;
              }
        } catch (e) {
            console.log("decryptNew error:", setErrorMessage("Invalid Passphrase"),e);
            setErrorMessage("Invalid Passphrase");
            closeAlert();
        }
    };

    const decryptOld = async backupString => {
        // BACKUP STRING
        let encryptedBackupString = backupString.slice(1);
        // let encryptedBackupString = backupString

        //AES
        let decryptedBackupString = forge.util.decode64(encryptedBackupString);
        let bytes = new Uint8Array(decryptedBackupString.length);
        for (let i = 0; i < decryptedBackupString.length; i++) {
            bytes[i] = decryptedBackupString.charCodeAt(i);
        }

        let byteBufferStringRequiredByForge = forge.util.createBuffer(decryptedBackupString);

        // DERIVED KEY
        var salt = forge.util.hexToBytes("ff");
        var keygen = forge.pkcs5.pbkdf2(passphrase, salt, 2048, 32, "sha512");
        //var keygen = forge.pkcs5.pbkdf2('123456', salt, 2048, 32,'sha512');

        let decipher = forge.cipher.createDecipher("AES-CTR", keygen);
        decipher.start({
            iv: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        });
        decipher.update(byteBufferStringRequiredByForge);
        decipher.finish();
        let combine = decipher.output.getBytes();

        let entropy = combine.slice(0, 32);
        let entropyHex = forge.util.bytesToHex(entropy);
        let publickKey = combine.slice(32, 64);
        let publickKeyHex = forge.util.bytesToHex(publickKey);
        let emailData = combine.slice(64, combine.length - 48);

        let randomBytes = forge.util.createBuffer("KeyPairTest");
        let mnemonic = bip39.entropyToMnemonic(entropyHex);
        const recoveredMnemonic = await Mnemonic.fromString(mnemonic.toString());
        const recoveredRootKey = await recoveredMnemonic.toPrivateKey();
        var DerivedEd25519KeyPair = await recoveredRootKey.derive(0);

        // var Ed25519KeyPair = await Ed25519PrivateKey.fromMnemonic(mnemonic, "");
        // var privateKey = (await Ed25519KeyPair.derive2(0))._keyData;
        var privateKeyHex = p2phelper.bytesToHex(DerivedEd25519KeyPair._keyPair.secretKey);

        let sig = signWithKeyAndVerify(randomBytes, privateKeyHex, publickKeyHex);

        if (sig) {
            return {
                publicKey: publickKeyHex,
                privateKey: privateKeyHex,
                email: emailData,
            };
        } else {
            return undefined;
        }
    };

    const signWithKeyAndVerify = (txBodyBytes, privateKeyHex, publicKeyHex) => {
        let message = txBodyBytes;
        let encoding = "utf8";
        let privateKey = forge.util.hexToBytes(privateKeyHex);
        let publicKey = forge.util.hexToBytes(publicKeyHex);
        let signature = ed25519.sign({
            message,
            encoding,
            privateKey,
        });

        let verified = ed25519.verify({
            message,
            encoding,
            signature,
            publicKey,
        });
        if (verified === false) {
            return undefined;
        }
        return signature;
    };

    const linkAccount = async () => {
        if (validate()) {
            let data;
            if (result.slice(0, 1) == "@") {
                data = await decryptOld(result);
            } else {
                data = await decryptNew(result);
            }

            if (data) {
                setUserData(data);
                let encryptedData = CryptoJS.AES.encrypt(JSON.stringify(data), pin).toString();
                sendMessage(encryptedData);
                navigateToLinkAcctSuccess();
            } else {
                setErrorMessage("Invalid Passphrase");
                closeAlert();

            }
        }
    };

    return (
        <Grid container item direction="column" alignContent="center" alignItems="center" className="linkAccount">
            <div
                style={{
                    position: "absolute",
                    top: "1.3em",
                    left: "5em",
                }}>
                <img style={{ height: "50px" }} src="./dropp_logo.png" alt="logo" />
            </div>
            <Grid item>
                <p style={{ fontSize: "28px", marginTop: "1em", marginBottom: "2em" }}>
                    Link your <b>Dropp</b> account
                </p>
            </Grid>



            <Grid item style={{ marginTop: "30px", textAlign: "left", width: "250px" }}>
                <FormControl variant="outlined" className="" style={{ width: "100%" }}>
                    <InputLabel id="network-label">Network</InputLabel>
                    <Select
                        labelId="network-label"
                        id="network"
                        value={net}
                        onChange={e => {
                            setNet(e.target.value);
                        }}
                        label="Network">
                        <MenuItem value={7100}>Main net</MenuItem>
                        <MenuItem value={6001}>Test net</MenuItem>
                    </Select>
                </FormControl>
            </Grid>

            <Grid item style={{ marginTop: "15px" }}>
                <br />
                <FormControl
                    fullWidth
                    style={{
                        color: "",
                    }}
                    variant="outlined">
                    <InputLabel htmlFor="pin">Enter Hedera Account #</InputLabel>
                    <OutlinedInput
                        placeholder="Acct #"
                        type="password"
                        id="accountId"
                        value={passphrase}
                        onChange={e => setPassphrase(e.target.value)}
                        startAdornment={
                            <InputAdornment>
                            </InputAdornment>
                        }
                        labelWidth={185}
                    />
                </FormControl>
            </Grid>

            <Grid style={{ marginTop: "35px" }}>
              <div className="switch-field">
                <input type="radio" id="radio-one" name="switch-one" value="yes" checked/>
                <label for="radio-one">Private Key</label>
                <input type="radio" id="radio-two" name="switch-one" value="no" />
                <label for="radio-two">Mnemonic</label>
              </div>
            </Grid>

            <Grid item style={{ marginTop: "15px" }}>
                <Grid item container direction="row">
                    <Grid item style={{ width: "200px", marginRight: "1em" }}>
                        <FormControl
                            fullWidth
                            style={{
                                color: "",
                            }}
                            variant="outlined">
                            <InputLabel htmlFor="pin">Protect your Wallet</InputLabel>
                            <OutlinedInput
                                placeholder="PIN"
                                type="password"
                                id="pin"
                                value={pin}
                                onChange={e => setPin(e.target.value)}
                                startAdornment={
                                    <InputAdornment>
                                        <i
                                            style={{ color: "#aaa" }}
                                            className="fa fa-lock fa-lg fa-fw"
                                            aria-hidden="true"
                                        />
                                    </InputAdornment>
                                }
                                labelWidth={135}
                            />
                        </FormControl>
                    </Grid>
                </Grid>
            </Grid>

            <button style={{ marginTop: "25px" }} className="button-done" onClick={linkAccount}>
                LINK ACCOUNT
            </button>
            {errorMessage && (
                <div
                    className="alert error browser"
                    style={{ textAlign: "center", marginTop: "50px" }}>
                    <strong>{errorMessage}</strong>
                </div>
            )}
        </Grid>
    );
};

export default AdvancedHbarRecovery;
