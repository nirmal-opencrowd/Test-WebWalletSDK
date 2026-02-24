import React, { useState, useRef } from 'react';
import { Grid, TextField } from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';
import commonStyles from "./../styles/common.module.scss";

const useStyles = makeStyles(() => ({
    pinInput: {
        width: "50px",
        margin: "0 10px",
        textAlign: "center",
        fontSize: "20px",
        "& .MuiOutlinedInput-input": {
            textAlign: "center",
            fontWeight: 600
        },
    },
    pinContainer: {
        display: "flex",
        justifyContent: "center",
    },
}));

const WalletPinInput = ({setValue}) => {
  const classes = useStyles();
  const [pin, setPin] = useState(Array(4).fill(''));
  const inputRefs = useRef([]);

  const handleChange = (e, index) => {
    const newPin = [...pin];
    newPin[index] = e.target.value;
    setPin(newPin);

    // Automatically focus next input if digit is entered
    if (e.target.value.length === 1 && index < 3) {
      inputRefs.current[index + 1].focus();
    }

    const result = newPin.join("");
    setValue(result);

  };

  const handleKeyDown = (e, index) => {
    // Move to the previous input field if backspace is pressed and the current input is empty
    if (e.key === 'Backspace' && pin[index] === '' && index > 0) {
      inputRefs.current[index - 1].focus();
    }
  };

  return (
    <Grid container className={classes.pinContainer}>
      {pin.map((digit, index) => (
        <TextField
          key={index}
          inputRef={(el) => (inputRefs.current[index] = el)} // Store refs for each input field
          variant="outlined"
          inputProps={{ maxLength: 1 }}
          value={digit}
          onChange={(e) => handleChange(e, index)}
          onKeyDown={(e) => handleKeyDown(e, index)} // Detect backspace
          className={classes.pinInput}
        />
      ))}
    </Grid>
  );
};

export default WalletPinInput;
