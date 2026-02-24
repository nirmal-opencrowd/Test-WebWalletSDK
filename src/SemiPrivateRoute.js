import React from "react";
import { Route, Redirect } from "react-router-dom";
import * as localstorage from "./utils/local-storage";

const SemiPrivateRoute = ({ component: Component, ...rest }) => {
    const [accountSetupDone, setAccountSetupDone] = React.useState(false);

    React.useEffect(() => {
        localstorage._get("_encrypted").catch(test => {
            setAccountSetupDone(Object.keys(test).length > 0);
        });
    }, []);

    return (
        <Route
            {...rest}
            render={props => {
                return accountSetupDone ? (
                    <Component {...props} />
                ) : (
                    <Redirect
                        to={{
                            pathname: "/firsttimeflow",
                            state: { from: props.location },
                        }}
                    />
                );
            }}
        />
    );
};

export default SemiPrivateRoute;
