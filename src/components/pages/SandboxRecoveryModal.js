import React, { useState } from 'react'
import { Box, Modal, Typography } from '@material-ui/core'
import { makeStyles } from '@material-ui/core';
import classNames from 'classnames';
import { resetLocalData } from './../../utils/utils';

const useStyles = makeStyles(() => ({
    modalAtCenter : {
        alignItems:"center",
        display:"flex",
        justifyContent:"center",
    },
    ctrlBtns: {
        marginTop: "10px",
        display :"flex",
        justifyContent:"space-around"
    },
    modalContainer: {
        backgroundColor: '#FFFFFF',
        border: 0,
        padding: "15px",
        width: 250,
    },
}))

const SandboxRecoveryModal = ({ screenData }) => {
    const classes = useStyles();
    const [openModalAfterSwitch, setOpenModalAfterSwitch] = useState(false);

    React.useEffect(() => {
        if(screenData && screenData.showSandboxRecoveryModal) {
            setOpenModalAfterSwitch(true);
        }
    },[])


    const handleSwitchModalClose = () => {
      if (screenData && screenData.askToUpdate) {
        resetLocalData();
      }
      window.location.reload();
    }



    return (
        <div style={{ marginTop: "-33px" }}>
            <div
                style={{
                    textAlign: "left",
                    width: "600px",
                    marginTop: "6px",
                    marginLeft: "20px",
                }}
                >
                <div style={{ paddingTop: "9px", marginRight: "180px" }}>
                    <label style={{ fontWeight: "450", color: "#18C2EE", fontSize: "1.8em" }}>
                        Sandbox
                    </label>
                    <br />
                    {!screenData.askToUpdate ?
                        <label style={{ fontSize: "1.3em" }}>
                            Recovery
                        </label>
                    : ""}
                </div>
            </div>
            <div style={{margin:"0px 20px"}}>
              <Modal className={classes.modalAtCenter} open={openModalAfterSwitch} onClose={handleSwitchModalClose} >
                <Box className={classes.modalContainer}>
                    <Typography variant='subtitle2'>
                        {screenData.askToUpdate ? "This test account is no longer available. Please switch to your main account." : "Quit and relaunch extension for the new mode to take effect."}
                    </Typography>
                    <div className={classes.ctrlBtns}>
                        <button className={classNames(["button-done", classes.btnWidth])} onClick={handleSwitchModalClose}>OK</button>
                    </div>
                </Box>
              </Modal>
            </div>
        </div>
    )
}

export default SandboxRecoveryModal;