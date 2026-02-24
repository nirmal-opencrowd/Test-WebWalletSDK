import React from "react";
import { Route, Redirect } from "react-router-dom";

const PrivateRoute = ({ isAuthed, isRdFile = true, component: Component, ...rest }) => (
    <Route
        {...rest}
        render={props => {
            return isAuthed ? (
                <Component {...props} />
            ) : (
                <Redirect to={{ pathname: "/prelogin", state: { from: props.location } }} />
            );
        }}
    />
);

export default PrivateRoute;
