import React from "react";
import { Grid, Typography } from "@material-ui/core";
/* global chrome */

const PaymentMessage = ({ message, cancel, color }) => {
    return (
      <Grid
        container
        item
        direction="column"
        alignItems="center"
        style={{
            textAlign: "left",
            flexGrow: "1",
        }}>
          <Grid item>
            <img
                style={{ cursor: "pointer", padding: "1em" }}
                height="50"
                width="120"
                src="./dropp_logo.png"
            />
          </Grid>
          <Grid
            container
            direction="column"
            style={{
                padding: "1em",
            }}>
              <Typography style={{fontSize: "18px", textAlign: "center", color: color}}>
                {message}
              </Typography>
          </Grid>

          <Grid container direction="column" style={{ padding: "1em" }}>
            <Grid container item>
              <Grid container item direction="row" justifyContent="center">
                <Grid item>
                  <button className="button-cancel" onClick={cancel}>
                    CLOSE
                  </button>
                </Grid>
              </Grid>
            </Grid>
        </Grid>
      </Grid>
    );
};

export default PaymentMessage;
