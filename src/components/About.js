import React from "react";
import * as api from "./../api";
import ArrowBackOutlinedIcon from '@material-ui/icons/ArrowBackOutlined';
import { Box, Typography } from "@material-ui/core";
import commonStyles from "./../styles/common.module.scss";
import uiTexts from "./../../configurations/dropp.json"

const pageTexts = uiTexts.about;

const About = ({ setCurrentScreen, setFooterObj }) => {

    const openNewTabAgreement = () => {
        chrome.tabs.create({ url: `https://dropp.cc/user-agreement-plain-text` });
    };

    const openWebsite = () => {
        chrome.tabs.create({ url: `https://dropp.cc/` });
    };

    React.useEffect(() => {
      setFooterObj({
        footerText: (
          <><span className={commonStyles.darkBoldText}>{pageTexts.extVersionText} </span>
            <span>{pageTexts.version}</span></>
        )
      })

      return () => {
        setFooterObj({});
      }
    }, [])

    return (
        <div style={{ marginTop:"40px", padding: "0 20px" , maxHeight: "580px"}}>
          {/* <div
              style={{
                  textAlign: "left",
                  width: "400px",
                  marginTop: "6px",
                  marginLeft: "20px",
              }}>
              <div style={{ paddingTop: "9px", marginRight: "180px" }}>
                  <label style={{ fontWeight: "450", color: "#18C2EE", fontSize: "1.8em" }}>
                      ABOUT
                  </label>
              </div>
          </div> */}

          <p style={{fontSize:"1.2em", marginTop:"27px",width:"291px",textAlign:"left"}}>
            {pageTexts.aboutExtMsg}
          </p>
          <Box my={3}>
            <Typography variant="h5">
              {pageTexts.orgName}
            </Typography>
            <Typography className={commonStyles.blueLinkText}>
              {pageTexts.contact}
            </Typography>
          </Box>
          <div style={{textAlign: "left", width: "320px", marginTop: "25px" }}>
            {/* <h3>Dropp Version</h3>
            <p style={{fontSize:"1.2em", marginTop: "-12px" }}>2.2.19</p> */}
            {/* <h3 style={{marginTop:"60px"}}>LINKS</h3> */}
            <a onClick={openNewTabAgreement} className={commonStyles.blueBoldText} style={{fontSize:"1.2em", cursor: "pointer",display:"inline-block",paddingBottom:"6px"}}><b>{pageTexts.termsAndConditionText}</b></a><br/>
            {/* <a onClick={openWebsite} style={{fontSize:"1.2em", color:"#18C2EE",cursor: "pointer",display:"inline-block",paddingBottom:"6px"}}><b>Visit our website</b></a><br/> */}
          </div>
          {/* <div className="footer">
            <div className="backArrow backArrowOnly">
              <ArrowBackOutlinedIcon onClick={()=> setCurrentScreen("dashboard")} style={{cursor:"pointer",color:"#18C2EE"}}/>
            </div>
          </div> */}
        </div>
    );
};
export default About;
