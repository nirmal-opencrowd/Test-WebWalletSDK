import React from 'react';
import "../../NFTcollections.css";
import { dapps } from '../../utils/local-storage';
import ArrowBackOutlinedIcon from '@material-ui/icons/ArrowBackOutlined';
import { CircularProgress, Typography, makeStyles } from '@material-ui/core';
import moment from 'moment';
import Box from '@material-ui/core/Box';
import Modal from '@material-ui/core/Modal';

const useStyles = makeStyles({
    footer: {
        backgroundColor: "white",
        bottom: "0px",
        height: "95px",
        padding: "0px 20px",
        position: "fixed",
        width: "100%",
        zIndex: "100",
    },
    transactionBox: {
        backgroundColor: "#f9f9f9",
        display: "flex",
        justifyContent: "space-between",
        margin: "10px 20px",
        padding: "8px",
    },
    launchIconInBox: {
        float:"right",
        height:"18px",
        marginTop:"10px",
    },
    launchIconInFooter: {
        height:"18px",
        position:"relative",
        top:"4px"
    },
    dateKey: {
      margin: "10px 20px"
    },
    modalContainer: {
      backgroundColor: '#FFFFFF',
      border: 0,
      padding: "15px",
      position: 'absolute',
      left: '10%',
      top: '10%',
      width: 250,

    },
    ctrlBtns: {
      marginTop: "5px",
      textAlign: "right",
    },
})

const ConnectedDapps = ({ setCurrentScreen }) => {
    const classes = useStyles();
    const [dappsHistory, setDappsHistory] = React.useState(null);
    const [currentTopic, setCurrentTopic] = React.useState(null);
    const [openConfirmModal, setOpenConfirmModal] = React.useState(false);
    const [openSuccessModal, setOpenSuccessModal] = React.useState(false);
    const [loading, setLoading] = React.useState(false);
    const [backendErr, setBackendErr] = React.useState(null);

    const getDapps = async () => {
      let res = await dapps.getDapps();
      let keys = Object.keys(res);
      if (res && keys.length > 0) {
        keys = keys.sort((a, b) => moment(a).isAfter(moment(b)) ? -1 : 1);
        let history = {};
        for (let i = 0; i < keys.length; i++) {
          history[keys[i]] = res[keys[i]];
        }
        setDappsHistory(history);
      } else {
        setDappsHistory({});
      }
    };

    const getCurrentTopic = async () => {
      chrome.runtime.sendMessage({
        type: "getCurrentTopic"
      }, (res) => {
        setCurrentTopic(res);
      });
    };

    React.useEffect(()=>  {
      Promise.all([getDapps(), getCurrentTopic()]);
    }, []);

    const handleConfirmModalClose = () => {
      setOpenConfirmModal(false);
    };

    const disconnect = async () => {
      chrome.runtime.sendMessage({
        type: "wcDisconnect",
        request: {topic: currentTopic}
      }, (res) => {
        setCurrentTopic("");
        setOpenConfirmModal(false);
        setOpenSuccessModal(true);
      });
    };

    const handleSuccessModalClose = () => {
      setOpenSuccessModal(false);
      setDappsHistory({});
      getDapps();
    };

    return (
        <>
            <div>
                {/* <div
                  style={{
                      textAlign: "left",
                      margin: "10px 20px",
                  }}>
                    <div style={{ padding: "10px 0px" }}>
                        <label style={{ fontWeight: "450", color: "#18C2EE", fontSize: "1.8em" }}>
                            Connected Apps
                        </label>
                    </div>
                    <div style={{ clear: "both" }}>
                        <hr style={{ backgroundColor: "#B4B4B4", height: "1px", border: "none" }} />
                    </div>
                </div> */}
                <div>
                    {(dappsHistory && Object.keys(dappsHistory).length > 0) ?
                        <>
                          {Object.keys(dappsHistory).map((item, index) => {
                            return (
                              <>
                                <div key={index} className={classes.dateKey}>
                                  {moment(item).format("MMM DD, YYYY")}
                                </div>
                                {dappsHistory[item].map((data, index) => {
                                  return (
                                    <div key={index} className={classes.transactionBox}>
                                      <div style={{width : "165px"}}>
                                        <div style={{paddingTop: "5px", width:"174px"}}>
                                          <Typography variant='body2'>{data.currentTime}</Typography>
                                        </div>
                                        <Typography>{data.metadata.name}</Typography>
                                        <Typography variant='body2'>{data.metadata.description}</Typography>
                                      </div>
                                      <div>
                                          <Typography variant='body2'>
                                              {data.accountId}
                                          </Typography>
                                          <a style={{cursor: "pointer", display: "block", paddingTop: "10px"}} onClick={(e) => {e.preventDefault(); setOpenConfirmModal(true);}}>
                                            Disconnect
                                          </a>
                                      </div>
                                    </div>
                                  )
                                })}
                              </>
                            )
                          })}
                        </>
                        :
                          <>
                            {dappsHistory == null ?
                              <div className="loader">
                                  <CircularProgress color="inherit" />
                              </div>
                            :
                              <div style={{margin: "0 20px", height:"75vh", display:"flex", justifyContent:'center', alignItems:"center"}}>
                                <Typography>No connected apps</Typography>
                              </div>
                            }
                          </>
                    }
                </div>
            </div>
            <Modal
              open={openConfirmModal}
              onClose={handleConfirmModalClose}
            >
              <Box className={classes.modalContainer}>
                <Typography id="modal-modal-description" sx={{ mt: 2 }}>
                  Are you sure you want to disconnect this app?
                </Typography>
                <div className={classes.ctrlBtns}>
                  <button className="button-cancel" onClick={handleConfirmModalClose}>
                      No
                  </button>
                  &nbsp;&nbsp;&nbsp;&nbsp;
                  <button className="button-done" onClick={disconnect}>
                      Yes
                  </button>
                </div>
              </Box>
            </Modal>
            <Modal
              open={openSuccessModal}
              onClose={backendErr ? () => setOpenSuccessModal(false) : handleSuccessModalClose}
            >
              <Box className={classes.modalContainer}>
                {
                  loading ?
                    <div className="loader" style={{ margin: "9px auto auto" }}>
                      <CircularProgress color="inherit" />
                    </div> :
                    backendErr ?
                      <>
                        <Typography sx={{ mt: 2 }}>
                          <strong>Error</strong>
                        </Typography>
                        <Typography sx={{ mt: 2 }} style={{ wordBreak: "break-all" }}>
                          {backendErr}
                        </Typography>
                      </>
                      :
                      <Typography id="modal-modal-description" sx={{ mt: 2 }}>
                        Disconnected successfully!
                      </Typography>
                }
                <div className={classes.ctrlBtns}>
                  {loading ?
                    ""
                    :
                    <button className="button-done" onClick={backendErr ? () => setOpenSuccessModal(false) : handleSuccessModalClose}>
                      Ok
                    </button>
                  }
                </div>
              </Box>
            </Modal>
            {/* <div className="footer">
                <div className='backArrow'>
                    <ArrowBackOutlinedIcon onClick={() => setCurrentScreen("dashboard")} style={{ cursor: "pointer", color: "#18C2EE" }} />
                </div>
            </div> */}
        </>
    )
}

export default ConnectedDapps;