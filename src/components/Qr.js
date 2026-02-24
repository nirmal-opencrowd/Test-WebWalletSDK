import React, { Component } from "react";
import QrReader from "react-qr-reader";
import forge from "node-forge";
import { Ed25519PrivateKey } from "@hashgraph/sdk";

var pbkdf2 = require("pbkdf2");
var bip39 = require("bip39");

const ed25519 = forge.pki.ed25519;

/* global chrome */
export class Test extends Component {
    constructor(props) {
        super(props);
        this.state = {
            delay: 100,
            result: "No result",
        };

        this.handleScan = this.handleScan.bind(this);
        this.openImageDialog = this.openImageDialog.bind(this);
    }

    async decrypt(backupString) {
        // BACKUP STRING
        let newBackupString = backupString.slice(1);

        //AES
        let encryptedString = forge.util.decode64(newBackupString);

        let bytes = new Uint8Array(encryptedString.length);
        for (let i = 0; i < encryptedString.length; i++) {
            bytes[i] = encryptedString.charCodeAt(i);
        }
        let byteBufferStringRequiredByForge = forge.util.createBuffer(encryptedString);

        // DERIVED KEY
        var salt = forge.util.hexToBytes("ff");
        var keygen = forge.pkcs5.pbkdf2("T0rnad0!", salt, 2048, 32, "sha512");
        //var keygen = forge.pkcs5.pbkdf2('123456', salt, 2048, 32,'sha512');

        var hex = forge.util.bytesToHex(keygen);

        let decipher = forge.cipher.createDecipher("AES-CTR", keygen);
        let iv = forge.util.createBuffer("");

        decipher.start({
            iv: "",
        });
        decipher.update(byteBufferStringRequiredByForge);
        decipher.finish();
        let combine = decipher.output.getBytes();

        let entropy = combine.slice(0, 32);
        let entropyHex = forge.util.bytesToHex(entropy);
        let publickKey = combine.slice(32, 64);
        let publickKeyHex = forge.util.bytesToHex(publickKey);
        let emailData = combine.slice(64, combine.length - 48);
        let randomBytes = forge.util.createBuffer("test");

        //method 1 nodeforge

        // var seed = forge.util.hexToBytes('aac1015a5bb32039b6335991d4e4ce329573bd1135226205d62ec62e7e558baa');
        // var keypair = ed25519.generateKeyPair({seed: seed});

        //method 2 hdkey

        // var seed = '509e23f4826df36190cdaf4c0a3ee79b846ca604e97e280782c702346fbad7d2016a91a4af328cdcdb8108b1f2acad7a2b9004735ce20ec1db3d699545395feb'
        // var hdkey = HDKey.fromMasterSeed(Buffer.from(seed, 'hex'))
        // var childkey = hdkey.derive("m/44/3030/0/0")

        // var privateKeyHex = forge.util.bytesToHex(keypair.privateKey)
        //  publickKeyHex = forge.util.bytesToHex(keypair.publicKey)

        //var publickKeyHex = "c66badf3df6c4e70b956ff014fa514aaa486295340e9bf798671239f6ac0ac8f";
        //var privateKeyHex = "3e3a7ff372f72d56209d9b8aca5dddb82f5ac50664e4120d2c3b41489a272677c66badf3df6c4e70b956ff014fa514aaa486295340e9bf798671239f6ac0ac8f";

        //method 3 ed25519 HD Key

        // const { key, chainCode} = derivePath("m/0'/0'", '509e23f4826df36190cdaf4c0a3ee79b846ca604e97e280782c702346fbad7d2016a91a4af328cdcdb8108b1f2acad7a2b9004735ce20ec1db3d699545395feb');

        //const { key, chainCode } = getMasterKeyFromSeed('509e23f4826df36190cdaf4c0a3ee79b846ca604e97e280782c702346fbad7d2016a91a4af328cdcdb8108b1f2acad7a2b9004735ce20ec1db3d699545395feb');

        let mnemonic = bip39.entropyToMnemonic(entropyHex);
        var newseedtest = bip39.mnemonicToSeedSync("mnemonic", "");
        // salt = mnemonic+'T0rnad0!'

        //  var keytest = forge.pkcs5.pbkdf2(mnemonic, salt, 2048, 64,'sha512');

        var Ed25519KeyPair = await Ed25519PrivateKey.fromMnemonic(mnemonic, "");
        var privateKey = (await Ed25519KeyPair.derive2(0))._keyData;
        var privateKeyHex = forge.util.bytesToHex(privateKey);
        let sig = this.signWithKeyAndVerify(randomBytes, privateKeyHex, publickKeyHex);
    }

    signWithKeyAndVerify(txBodyBytes, privateKeyHex, publicKeyHex) {
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
        //let sig = new Signature()
        //sig.setEd25519(signature)
        return signature;

        // let sigPair = new SignaturePair()
        // sigPair.setEd25519(signature)
        // return sigPair
    }

    handleScan(result) {
        if (result) {
            this.setState({ result });
        }
        this.decrypt(result);
    }
    handleError(err) {
    }
    openImageDialog() {
        this.refs.qrReader1.openImageDialog();
    }

    render() {
        const previewStyle = {
            height: 140,
            width: 220,
        };

        return (
            <div align="center">
                <QrReader
                    ref="qrReader1"
                    delay={this.state.delay}
                    style={previewStyle}
                    onError={this.handleError}
                    onScan={this.handleScan}
                    legacyMode
                />
                <br />
                <input
                    style={{ marginTop: "70px" }}
                    type="button"
                    value="Submit QR Code"
                    onClick={this.openImageDialog}
                />
                <p style={{ width: "700px", wordBreak: "break-word" }}>{this.state.result}</p>
            </div>
        );
    }
}
