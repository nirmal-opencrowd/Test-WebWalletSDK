import React from "react";
import { Grid, Typography } from "@material-ui/core";

const LinkAccountSuccess = () => {
    return (
        <Grid
            container
            item
            className="linkAccountSuccess"
            direction="column"
            alignItems="center"
            justifyContent="center"
            style={{ padding: "1em", flexGrow: "1", textAlign: "center" }}>
            <Grid item>
                <img style={{ marginTop: "50px" }} height="60" src="./dropp_logo.png" alt="logo" />
            </Grid>
            <Grid item>
                <p style={{ fontSize: "20px", marginTop: "60px" }}>
                    Your <b>Dropp</b> account has been linked.
                </p>
                <p style={{ fontSize: "20px" }}>Please head over to the browser extension.</p>
                <Typography component="h1" style={{ fontSize: "2.5rem", marginTop: "60px" }}>
                    THANK YOU
                </Typography>
            </Grid>
        </Grid>
    );
};

export default LinkAccountSuccess;
