import React from "react";
import * as localstorage from "./../utils/local-storage";
import ArrowBackOutlinedIcon from '@material-ui/icons/ArrowBackOutlined';
import SlidingPane from "react-sliding-pane";
import "react-sliding-pane/dist/react-sliding-pane.css";
import { Box, Grid, IconButton, Typography } from "@material-ui/core";
import { makeStyles } from '@material-ui/core/styles';
import commonStyles from "./../styles/common.module.scss";
import RemoveCircleOutlineIcon from '@material-ui/icons/RemoveCircleOutline';
import uiTexts from "./../../configurations/dropp.json"

const useStyles = makeStyles(() => ({
  favoriteListContainer: {
    maxHeight: "638px",
    overflow: "hidden",
    overflowY: "scroll",
  }
}))

const pageTexts = uiTexts.favorites;

const Favorites = ({ setCurrentScreen }) => {
    const [favorites, setFavorites] = React.useState({});
    const [noRecords, setNoRecords] = React.useState(null);
    const [state, setState] = React.useState({
    isPaneOpen: false,
    isPaneOpenLeft: false,
  });

  const classes = useStyles();

  React.useEffect(() => {
      localstorage.favorites.getFavorites().then(favs => {
          setFavorites(favs);
      });
  }, []);

  React.useEffect(() => {
      localstorage.favorites.setFavorites(favorites).catch(console.error);
      setNoRecords(!(favorites && Object.keys(favorites).length > 0));
  }, [favorites]);

  const removeFavorite = organizationName => {
      const newFavorites = { ...favorites };
      delete newFavorites[organizationName];
      setFavorites(newFavorites);
  };

  const renderFavorites = () => {
        return (
            <table
                className="favorites-table"
                style={{
                    width: "300px",
                    textAlign: "left",
                    marginTop: "25px",
                    marginLeft: "23px",
                }}>
                {Object.entries(favorites).map(([organizationName, data]) => {

                    return (
                        <tr style={{ height: "48px" }}>
                            <td>
                                <div style={{ width: "100%" }}>
                                    <span
                                        style={{
                                            fontSize: "15px",
                                            lineHeight: "24px",
                                        }}>
                                        <b>{organizationName.toUpperCase()}</b>
                                    </span>
                                </div>
                            </td>
                            <td>
                                <img
                                    style={{
                                        cursor: "pointer",
                                        height: "24px",
                                        width: "24px",
                                    }}
                                    onClick={() => removeFavorite(organizationName)}
                                    src="./cancel_grey.png"
                                />
                            </td>
                        </tr>
                    );
                })}
            </table>
        );
    };

    return (
        <div
            style={{ marginTop:"40px", padding: "0 20px"}}>
            {/* <div
                style={{
                    textAlign: "left",
                    width: "600px",
                    marginTop: "6px",
                    marginLeft: "20px",
                    marginBottom:"10px"
                }}>
                <div style={{ paddingTop: "9px", marginRight: "180px" }}>
                    <label style={{ fontWeight: "450", color: "#18C2EE", fontSize: "1.8em" }}>
                        FAVORITE
                    </label>
                    <br/>
                    <label style={{fontSize: "1.3em" }}>
                        MERCHANTS
                    </label>

                </div>
            </div> */}
            {/*renderFavorites()*/}
            {/*<table onClick={()=>setCurrentScreen("fundnow")} style={{float:"left", display:"inline-block", marginTop:"-12px", cursor:"pointer", marginRight:"20px",width:"294px", height:"87px", textAlign:"left"}}>
              <tr>
                <td style={{display:"inline-block", height:"100px", fontSize:"37px"}}><img width="100px" src="https://s.wsj.net/img/meta/wsj-social-share.png"></img></td>
                <td style={{width:"173px", textAlign:"left", marginLeft:"-8px", marginTop:"31px", fontSize:"1.25em", display:"inline-block"}}>
                  <tr style={{fontWeight:"750"}}>Wallstreet Journal</tr>
                  <tr>www.wsj.com</tr>
                </td>
              </tr>
            </table>
            <table onClick={()=>setCurrentScreen("fundnow")} style={{float:"left", display:"inline-block", marginTop:"-12px", cursor:"pointer", marginRight:"20px",width:"294px", height:"87px", textAlign:"left"}}>
              <tr>
                <td style={{display:"inline-block", height:"100px", fontSize:"37px"}}><img width="100px" src="https://assets.nflxext.com/ffe/siteui/allow-robots/contentSampling/seo-watch-free-link-preview.jpg"></img></td>
                <td style={{width:"173px", textAlign:"left", marginLeft:"-8px", marginTop:"31px", fontSize:"1.25em", display:"inline-block"}}>
                  <tr style={{fontWeight:"750"}}>Netflix</tr>
                  <tr>www.netflix.com</tr>
                </td>
              </tr>
            </table>
            <table onClick={()=>setCurrentScreen("fundnow")} style={{float:"left", display:"inline-block", marginTop:"-12px", cursor:"pointer", marginRight:"20px",width:"294px", height:"87px", textAlign:"left"}}>
              <tr>
                <td style={{display:"inline-block", height:"100px", fontSize:"37px"}}><img width="100px" src="https://res.cloudinary.com/practicaldev/image/fetch/s--6AjcSzun--/c_fill,f_auto,fl_progressive,h_320,q_auto,w_320/https://dev-to-uploads.s3.amazonaws.com/uploads/user/profile_image/318738/643b2cc4-63b5-4943-b883-21eda39f2764.jpg"></img></td>
                <td style={{width:"173px", textAlign:"left", marginLeft:"-8px", marginTop:"31px", fontSize:"1.25em", display:"inline-block"}}>
                  <tr style={{fontWeight:"750"}}>Dragonglass</tr>
                  <tr>www.dragonglass.me</tr>
                </td>
              </tr>
            </table>*/}
            {(noRecords != null && noRecords) ?
              <div style={{width: "100%", margin: "200px auto", textAlign: "center"}}>
                {pageTexts.noFavMerchantMsg}
              </div>
            :
              <div className={classes.favoriteListContainer}>
                {Object.entries(favorites).map(([organizationName, data]) => {
                    return (
                      <Box key={Math.random()} py={2} className={commonStyles.greyListContainer}>
                        <Grid container justifyContent="space-between" alignItems="center">
                          <Grid item xs={8}>
                            <Typography className={commonStyles.darkBoldText}>
                              {organizationName.toUpperCase()}
                            </Typography>
                          </Grid>
                          <Grid item xs={2} onClick={() => removeFavorite(organizationName)}>
                            <IconButton>
                              <RemoveCircleOutlineIcon />
                            </IconButton>
                          </Grid>
                          {/* <div style={{display:"inline-block",marginBottom:"-28px", width:"294px", marginLeft:"20px", marginRight:"20px"}}>
                          <div style={{float:"left"}}>
                              <div style={{display:"flex", justifyContent:"center", alignItems:"center",height: "80px",width: "90px",marginRight: "20px"}}>
                                <img style={{width:"90px"}} src="dropp_logo.png"/>
                              </div>
                              <div style={{marginTop:"-40px", height:"90px", float:"left", width:"150px"}}>
                                  <p style={{marginTop:"29px", display:"inline-block", maxHeight:"50px", width:"135px", fontSize:"1.15em", wordBreak:"break-word"}}>{organizationName.toUpperCase()}</p>
                                  <p style={{width:"135px", wordBreak:"break-all"}}>{data.domain}</p>
                              </div>
                          </div>
                            <div style={{height:"83px", display:"flex",alignItems:"center",paddingLeft:"25px"}}>
                              <img
                                  style={{
                                      cursor: "pointer",
                                      height: "24px",
                                      width: "24px",
                                      marginTop:"27px"
                                  }}
                                  onClick={() => removeFavorite(organizationName)}
                                  src="./cancel_grey.png"
                              />
                            </div>
                          </div>
                          <br/> */}
                        </Grid>
                      </Box>
                    );
                })}
              </div>
            }



            {/*<div style={{height:"80px"}}>
              <div
                  style={{
                      float:"left",
                      height: "80px",
                      width: "90px",
                      backgroundImage: `url('https://assets.nflxext.com/ffe/siteui/allow-robots/contentSampling/seo-watch-free-link-preview.jpg')`,
                      backgroundPosition: "center",
                      backgroundSize: "cover",
                      marginLeft: "20px",
                        marginRight: "20px"
                  }}
              />
            <div style={{height:"90px", float:"left", width:"150px"}}>
                <p style={{marginTop:"29px", display:"inline-block", maxHeight:"50px", width:"180px", fontSize:"1.15em", wordBreak:"break-word"}}>Netflix</p>
                <p>www.netflix.com</p>
              </div>
              <div>
                <img
                    style={{
                        cursor: "pointer",
                        height: "24px",
                        width: "24px",
                        marginTop:"27px"
                    }}
                    onClick={() => ""}
                    src="./cancel_grey.png"
                />
              </div>
            </div>
            <br/>*/}
            {/*<div style={{height:"80px"}}>
              <div
                  style={{
                      float:"left",
                      height: "80px",
                      width: "90px",
                      backgroundImage: `url('https://res.cloudinary.com/practicaldev/image/fetch/s--6AjcSzun--/c_fill,f_auto,fl_progressive,h_320,q_auto,w_320/https://dev-to-uploads.s3.amazonaws.com/uploads/user/profile_image/318738/643b2cc4-63b5-4943-b883-21eda39f2764.jpg')`,
                      backgroundPosition: "center",
                      backgroundSize: "cover",
                      marginLeft: "20px",
                      marginRight: "20px"
                  }}
              />
              <div style={{height:"90px", float:"left", width:"150px"}}>
                <p style={{marginTop:"29px", display:"inline-block", maxHeight:"50px", width:"180px", fontSize:"1.15em", wordBreak:"break-word"}}>Dragonglass</p>
                <p>www.dragonglass.me</p>
              </div>
              <div>
                <img
                    style={{
                        cursor: "pointer",
                        height: "24px",
                        width: "24px",
                        marginTop:"27px"
                    }}
                    onClick={() => ""}
                    src="./cancel_grey.png"
                />
              </div>
            </div>*/}
            {/* <div className="footer">
              <div className="backArrow ">
                <ArrowBackOutlinedIcon onClick={()=> setCurrentScreen("dashboard")} style={{cursor:"pointer",color:"#18C2EE"}}/>
              </div>
            </div> */}
        </div>
    );
};
export default Favorites;
