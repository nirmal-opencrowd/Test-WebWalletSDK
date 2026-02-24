import React, { useEffect, useRef } from "react";
import { devEnvConst, qaEnvConst, prodEnvConst, sandboxEnvConst, envMap } from "../../utils/constants";
import forge from "node-forge";
import * as localstorage from "../../utils/local-storage";

import { Grid, FormControl, Radio, RadioGroup, FormControlLabel, Button } from "@material-ui/core";

const EnvOptions = props => {
    const [envOptions, setEnvOptions] = React.useState([]);
    const [env, setEnv] = React.useState(props.savedENV ? props.savedENV : process.env.REACT_APP_ENV_SET);
    const onSelectEnvironment = (value) => {
        setEnv(value);
    }

    const setEnvironment = () => {
        props.hideEnvSettings(env);
    }

    React.useEffect(() => {
        if(process.env.REACT_APP_ENV_SET == devEnvConst) {
            setEnvOptions([devEnvConst, qaEnvConst]);
        } else if(process.env.REACT_APP_ENV_SET == prodEnvConst) {
            setEnvOptions([prodEnvConst, sandboxEnvConst]);
        }
    }, []);

    return (
        <Grid>
            <Grid item>
                <Grid item style={{ textAlign: "center", paddingTop: "10px", paddingBottom: "10px" }}>
                        <p style={{ fontSize: "16px", margin: "10px", marginBottom: "1em", textAlign: "center"}}
                            className="select-action__button-text-small" >
                           Please select the environment
                        </p>
                </Grid>
                <FormControl>
                    <RadioGroup
                        aria-labelledby="demo-radio-buttons-group-label"
                        defaultValue={env}
                        name="radio-buttons-group"
                        onChange={(e) => onSelectEnvironment(e.target.value)}
                    >
                        {envOptions.map((envData) =>
                            <FormControlLabel key={envData} value={envData} control={<Radio color="primary"/>} label={envMap[envData]} />
                        )}
                    </RadioGroup>

                    <Button variant="contained" color="primary" onClick={() => setEnvironment()}>Update</Button>
                </FormControl>

            </Grid>
        </Grid>
    );
};

export default EnvOptions;
