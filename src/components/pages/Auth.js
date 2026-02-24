import React from "react";
import { Link, NavLink, useHistory, withRouter } from "react-router-dom";
import Login from "./Login";
import UnlinkAccount from "./UnlinkAccount";

/* global chrome */
/* global safari */
/* global browser */

const finalBrowser = chrome || safari || browser
const Auth = ({ history, forceUpdate, merchantTxn }) => {

    const [forgotPin, setForgotPin] = React.useState(false);

    const navigateToHome = () => {
        history.push("/home");
    };

    React.useEffect(() => {}, [forgotPin]);

    //let history = useHistory();

    async function unlinkAccount() {
        await _remove("_encrypted");
        //setAccountSetupDone(false);
    }

    function isEmpty(obj) {
        return Object.keys(obj).length === 0;
    }

    const checkForError = () => {
        const lastError = finalBrowser.runtime.lastError;
        if (!lastError) {
            return;
        }
        // if it quacks like an Error, its an Error
        if (lastError.stack && lastError.message) {
            return lastError;
        }
        // repair incomplete error object (eg chromium v77)
        return new Error(lastError.message);
    };

    const _get = key => {
        const local = finalBrowser.storage.local;
        return new Promise((resolve, reject) => {
            local.get([key], result => {
                const err = checkForError();
                if (err) {
                    reject(err);
                } else {
                    resolve(result);
                }
            });
        });
    };

    const set = async () => {
        await _set();
        //setAccountSetupDone(true);
    };

    const _set = data => {
        const local = finalBrowser.storage.local;
        return new Promise((resolve, reject) => {
            local.set(data, () => {
                const err = checkForError();
                if (err) {
                    reject(err);
                } else {
                    resolve();
                }
            });
        });
    };

    const _remove = key => {
        const local = finalBrowser.storage.local;
        return new Promise((resolve, reject) => {
            local.remove([key], () => {
                const err = checkForError();
                if (err) {
                    reject(err);
                } else {
                    resolve();
                }
            });
        });
    };

    const isSetup = async () => {
        const result = await _get("_encrypted");
        if (isEmpty(result)) {
            return false;
        } else {
            return true;
        }
    };

    const storageTest = () => {
        // finalBrowser.storage.local.set({ "name": "Karan" }, function(){
        // });
        //finalBrowser.storage.local.get(['name'], function(data) {
        //window.close();
        //});
        var test = finalBrowser.runtime.getURL("index.html");
        finalBrowser.tabs.create({ url: test + "#" + "/home" });
    };

    const openNewTab = () => {
        var baseUrl = finalBrowser.runtime.getURL("index.html");
        finalBrowser.tabs.create({ url: baseUrl + "#" + "/gettingStarted" });
    };

    const checkStorage = () => {
        finalBrowser.storage.local.get(["name"], function (data) {});
    };

    if (forgotPin) {
        return <UnlinkAccount forgotPin={setForgotPin} forceUpdate={forceUpdate} />;
    } else {
        return <Login forgotPin={setForgotPin} forceUpdate={forceUpdate} merchantTxn={merchantTxn} />;
    }

    // return ( forgotPin ? <UnlinkAccount forgotPin={setForgotPin}/> : <Login forgotPin={setForgotPin}/> );
};

export default Auth;
