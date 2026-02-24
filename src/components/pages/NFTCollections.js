import ArrowBackOutlinedIcon from '@material-ui/icons/ArrowBackOutlined';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import NFT from '../NFT';
import "../../NFTcollections.css";
import { fetchNFTs, fetchUserWalletList } from '../../api';
import InfiniteScroll from 'react-infinite-scroll-component';
import { Button, Typography, responsiveFontSizes, makeStyles, Grid, Box } from '@material-ui/core';
import CircularProgress from '@material-ui/core/CircularProgress';
import HistoryOutlinedIcon from '@material-ui/icons/HistoryOutlined';
import RefreshIcon from '@material-ui/icons/Refresh';
import LinkCryptoWalletModal from './LinkCryptoWalletModal';
import { SUPPORTED_CRYPTO_CURRENCIES } from '../../utils/constants';
import uiText from "../../../configurations/dropp.json"

const useStyles = makeStyles((theme)=>({
  iconContainer:{
    textAlign:"center",
    minWidth:"81px",
    cursor: "pointer"
  },
  icon:{
    color:"#83878C"
  },
  options:{
    color: "rgb(24, 194, 238)",
    cursor: "pointer",
    fontWeight: 600,
    textTransform: "uppercase",
    wordBreak: "break-word",
  }
}))

const pageText = uiText.nftcollections;

const NFTCollections = ({ setCurrentScreen, setScreenWithData, userDetails }) => {
  const classes = useStyles();
  const [fetchedNFTs, setFetchedNFTs] = useState([]);
  const [nftMapping, setNftMapping] = useState({});
  const [loadedNFTs, setLoadedNFTs] = useState([]);
  const [uptoIndex, setUptoIndex] = useState(20);
  const [startIndex, setStartIndex] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [noNFT, setNoNFT] = useState(null);
  const [networkError, setNetworkError] = useState(false);
  const [refresh, setRefresh] = useState(true);
  const [cryptoWallets, setCryptoWallets] = useState(null);
  const [openLinkCryptoModal, setOpenLinkCryptoModal] = useState(false);
  const [screen, setScreen] = useState("");

  async function getUserWalletList() {
    let cryptoWalletList = [];
    let res = await fetchUserWalletList();
    if (res && res.data && res.data.length) {
      for (let i = 0; i < res.data.length; i++) {
        if (res.data[i].walletId && SUPPORTED_CRYPTO_CURRENCIES.indexOf(res.data[i].walletId.currencyCode) != -1) {
          cryptoWalletList.push(res.data[i]);
        }
      }
      setCryptoWallets(cryptoWalletList);
    }
  }

  async function fetchNFTsData() {
    let response = {};
    try {
      response = await fetchNFTs({from: startIndex, size: uptoIndex});
      if (response) {
        if (response.data && response.data.length) {
          let nfts = [...fetchedNFTs];
          setFetchedNFTs(nfts.concat(response.data));
          setStartIndex((startIndex + uptoIndex));
          setNoNFT(false);
          if(response.data.length < uptoIndex - startIndex) {
            setHasMore(false)
          } else {
            setHasMore(true);
          }
        } else {
          if(startIndex == 0) {
            setNoNFT(true);
          }
          setHasMore(false);
        }
        if (response.mapping) {
          setNftMapping({...nftMapping, ...response.mapping});
        }
      }
    } catch(err) {
      setNetworkError(true);
    }
  }

  useEffect(() => {
    fetchNFTsData();
    getUserWalletList();
  }, [refresh])

  const opencryptomodal = (screen) => {
    setScreen(screen);
    setOpenLinkCryptoModal(true)
  }

  // const scrollToEnd = () => {
  //   setStartIndex(uptoIndex)
  //   setUptoIndex(uptoIndex + 6)
  // }

  // window.onscroll = () => {
   //   if (window.innerHeight + document.documentElement.scrollTop === document.documentElement.offsetHeight) {
  //     scrollToEnd()
  //   }
  // }

  const refreshList = () => {
    setStartIndex(0);
    setUptoIndex(20);
    setFetchedNFTs([]);
    setRefresh(!refresh);
  }

  return (
    <div style={{ marginTop: "40px" }}>
      {/* <div
        style={{
          textAlign: "left",
          width: "600px",
          marginTop: "6px",
          marginLeft: "20px",
        }}
        >
        <div style={{ paddingTop: "9px", marginRight: "180px" }}>
          <label style={{ fontWeight: "450", color: "#18C2EE", fontSize: "1.8em" }}>
            NFT Collections
          </label>
          <br />
          <label style={{ fontSize: "1.3em" }}>
            HEDERA NFTS
          </label>
        </div>
      </div> */}
      <div className="horizontalLine">
        <hr/>
      </div>
      <div className="NFTBalance">
        <Grid container spacing={1} className='NFTBtns'>
          <Grid item xs={4} className={classes.iconContainer} onClick={cryptoWallets && cryptoWallets.length ? () => setCurrentScreen("associateNFT") : () => opencryptomodal("associateNFT")}>
            {/* <i className={`material-icons-outlined ${classes.icon}`}>token</i> */}
            <Typography variant='body2' className={classes.options} >{pageText.tokenAssociationText}</Typography>
          </Grid>
          <Grid item xs={4} className={classes.iconContainer} onClick={cryptoWallets && cryptoWallets.length ? () => setCurrentScreen("nftReceiving") : () => opencryptomodal("nftReceiving")}>
            {/* <i className={`material-icons-outlined ${classes.icon}`}>arrow_circle_left</i> */}
            <Typography variant='body2' className={classes.options}>{pageText.recieveNFTText}</Typography>
          </Grid>
          <Grid item xs={4} className={classes.iconContainer} onClick={cryptoWallets && cryptoWallets.length ? () => setCurrentScreen("nftHistory") : () => opencryptomodal("nftHistory")}>
            {/* <HistoryOutlinedIcon className={classes.icon}/> */}
            <Typography variant='body2' className={classes.options}>{pageText.nftHistoryText}</Typography>
          </Grid>
        </Grid>
      </div>
      <div className="horizontalLine">
        <hr/>
      </div>
      {
        networkError ?
          <>
            <div style={{margin: "auto", marginTop: "200px", textAlign: "center"}}>
              <div>{pageText.noServiceAvailableMsg}</div>
            </div>
          </>
        :
          <>
            {(noNFT != null && noNFT) ?
              <div style={{margin: "auto", marginTop: "200px", textAlign: "center"}}>
                <div>{pageText.noNFTMsg}</div>
              </div>
            :
              <>
                {fetchedNFTs && fetchedNFTs.length ?
                  <>
                    <div className="availableNFTs" >
                      <InfiniteScroll
                        dataLength={fetchedNFTs.length}
                        next={fetchNFTsData}
                        hasMore={hasMore}
                        loader={<div className="infiniteSrollLoader"><CircularProgress color="inherit" /></div>}
                        height={470}>
                        <Box p={1}>
                          <Grid container spacing={2}> 
                          {
                            fetchedNFTs?.map((NFTData, index) => {
                              return <Grid item xs={6}>
                                <NFT
                                    fetchedData={fetchedNFTs}
                                    cryptoWallets = {cryptoWallets}
                                    setScreenWithData={setScreenWithData}
                                    setCurrentScreen={setCurrentScreen}
                                    key={NFTData.serialNumber}
                                    object={NFTData}
                                    mapping={nftMapping} />
                              </Grid>
                            })
                          }
                          </Grid>
                        </Box>
                      </InfiniteScroll>
                    </div>
                  </>
                :
                  <div className="loader">
                    <CircularProgress color="inherit" />
                  </div>
                }
              </>
            }

          </>
      }



      <div className="footer">
        {/* <div className='backArrow'>
          <ArrowBackOutlinedIcon onClick={() => setCurrentScreen("dashboard")} style={{ cursor: "pointer", color: "#18C2EE" }} />
        </div> */}
        <div style={{position:"fixed", left: "260px", bottom:"10px"}}>
          <Button onClick={refreshList} style={{ cursor: "pointer", color:"#18c2ee" }}><RefreshIcon/></Button>
        </div>
      </div>
      <LinkCryptoWalletModal
      open= {openLinkCryptoModal}
      setOpen = {setOpenLinkCryptoModal}
      setCurrentScreen = {setCurrentScreen}
      screen = {screen}
      getUserWalletList= {getUserWalletList}
      />
    </div>
  )
}

export default NFTCollections;