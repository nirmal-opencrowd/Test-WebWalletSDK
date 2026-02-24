import { CircularProgress, Grid } from "@material-ui/core";
import React from "react";

const Loader = ({ height, width }) => {
    return (
        <Grid container justifyContent="center" alignItems="center" style={{height: "70%"}}>
            {/* <Grid item style={{fontSize:"2.4em", marginLeft:"115px", marginTop:"130px"}} className="loader">

            </Grid> */}
            <CircularProgress color="primary"/>
        </Grid>
    );
};
export default Loader;
