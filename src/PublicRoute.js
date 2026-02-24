import React from "react";
import { Route, Redirect } from "react-router-dom";

/* global chrome */

const openNewTab = () => {
    var baseUrl = chrome.runtime.getURL("index.html");
    chrome.tabs.create({ url: baseUrl + "#" + "/home" });
};

const PublicRoute = ({ component: Component, ...rest }) => (
    <Route
        {...rest}
        render={props => {
            const test = true;
            return test ? <Component {...props} /> : <Redirect to={{ pathname: "/" }} />;
        }}
    />
);

export default PublicRoute;
