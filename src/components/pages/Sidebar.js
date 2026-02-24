import React from "react";
import ArrowBackOutlinedIcon from '@material-ui/icons/ArrowBackOutlined';
import styles from '../../styles/common.module.scss'
import { Grid, Typography } from "@material-ui/core";
import AccountBoxOutlinedIcon from '@material-ui/icons/AccountBoxOutlined';
import LockOutlinedIcon from '@material-ui/icons/LockOutlined';
import MoreHorizOutlinedIcon from '@material-ui/icons/MoreHorizOutlined';
import { hederaAccountToString } from "../../utils/utils";
import uiTexts from "./../../../configurations/dropp.json";
import commonStyles from "./../../styles/common.module.scss";
import Copy from './Copy';
const pageTexts = uiTexts.profile;
const SidebarMenu = ({ setCurrentScreen, onSetOpen, setScreenWithData, userDetails }) => {

    const onSelect = target => {
        setScreenWithData(target, {fromScreen: "sidebar"});
        onSetOpen(false);
    };

    const closeNavigation = () => {
        onSetOpen(false);
    }

    const getContentForFunding = () => {
        if (["HBAR", "CARAT"].includes(userDetails.currency)) {
            return [
                {
                    subtitle: "Deposit",
                    icon: <img height="30px" width="30px" src="/menuIcons/down.up.square@3x.png" alt="deposit" />,
                    action: () => onSelect("fundCrypto")
                },
                {
                    subtitle: "Transfer Now",
                    icon: <img height="30px" width="30px" src="/menuIcons/arrow.up.square@3x.png" alt="transfer" />,
                    action: () => onSelect("redeemCrypto")
                }
            ]
        } else if (userDetails.currency == "USDC" && userDetails.operatorId == "0") {
            return [
                {
                    subtitle: "Deposit",
                    icon: <img height="30px" width="30px" src="/menuIcons/down.up.square@3x.png" alt="deposit" />,
                    action: () => onSelect("transferUSDC")
                },
                {
                    subtitle: "History",
                    icon: <img height="30px" width="30px" src="/menuIcons/clock@3x.png" alt="deposit" />,
                    action: () => onSelect("usdcHistory")
                },
                {
                    subtitle: "Transfer Now",
                    icon: <img height="30px" width="30px" src="/menuIcons/arrow.up.square@3x.png" alt="transfer" />,
                    action: () => onSelect("redeemCrypto")
                }
            ]
        } else {
            return [
                {
                    subtitle: "Add Cash",
                    icon: <img height="30px" width="30px" src="/menuIcons/dollarsign.square@4x@3x.png" alt="deposit" />,
                    action: () => onSelect("fundnow")
                },
                {
                    subtitle: "Link Bank",
                    icon: <img height="30px" width="30px" src="/menuIcons/custom.building.columns.square@4x@3x.png" alt="transfer" />,
                    action: () => onSelect("fundingAccount")
                },
                {
                    subtitle: "Link Card",
                    icon: <img height="30px" width="30px" src="/menuIcons/custom.creditcard.square@4x@3x.png" alt="transfer" />,
                    action: () => onSelect("fundingAccount")
                },
                {
                    subtitle: "Cash Out",
                    icon: <img height="30px" width="30px" src="/menuIcons/down.up.square@3x.png" alt="transfer" />,
                    action: () => onSelect("redeemnow")
                },
                // {
                //     subtitle: "More",
                //     icon: <img height="30px" width="30px" src="/menuIcons/custom.ellipsis.square@4x@3x.png" alt="transfer" />,
                //     action: () => onSelect("dashboard")
                // },
            ]
        }
    }

    const menuList = [
        {
            title : "Funding",
            content : getContentForFunding(),
        },
        {
            title: "Accounts & transaction",
            content : [
                {
                    subtitle: "Currency Accounts",
                    icon: <img height="30px" width="30px" src="/menuIcons/rectangle.on.rectangle.angled.svg" alt="currency" />,
                    action: () => onSelect("manageaccounts")
                },
                {
                    subtitle: "Transactions",
                    icon: <img height="30px" width="30px" src="/menuIcons/custom.list.bullet.square@4x@3x.png" alt="transactions" />,
                    action: () => onSelect("transactions")
                },
            ]
        },
        {
            title: "Dropp Merchants",
            content : [
                {
                    subtitle: "Merchant List",
                    icon: <img height="30px" width="30px" src="/menuIcons/building.2@4x@3x.png" alt="merchants" />,
                    action: () => onSelect("merchantList")
                },
                {
                    subtitle: "Favorite Merchants",
                    icon: <img height="30px" width="30px" src="/menuIcons/heart.text.square@4x@3x.png" alt="favorite" />,
                    action: () => onSelect("favorites"),
                },
                {
                    subtitle: "Merchant Offers",
                    icon: <img height="30px" width="30px" src="/menuIcons/tag.square@4x@3x.png" alt="offers" />,
                    action: () => onSelect("offers"),
                }
            ]
        },
        {
            title: "Wallet Connect & Web3",
            content : [
                {
                    subtitle: "Connect With Apps",
                    icon: <img height="30px" width="30px" src="/menuIcons/icon-wc-connect-1@3x.png" alt="connect" />,
                    action: () => onSelect("connectWithDapps"),
                },
                {
                    subtitle: "Connected Apps",
                    icon: <img height="30px" width="30px" src="/menuIcons/custom.rectangle.connected.to.line.below.square@4x@3x.png" alt="connected" />,
                    action: () => onSelect("connectedDapps"),
                },
                {
                    subtitle: "NFT Collections",
                    icon: <img height="30px" width="30px" src="/menuIcons/square@4x@3x.png" alt="NFT" />,
                    action: () => onSelect("nftcollections"),
                }
            ]
        },
        {
            title: "Settings",
            content : [
                {
                    subtitle: "Profile",
                    icon: <img height="30px" width="30px"  src="/menuIcons/profileImage.png" alt="profile"/>,
                    action: () => onSelect("profile"),
                },
                {
                    subtitle: "Wallet Pin",
                    icon: <img height="30px" width="30px" src="/menuIcons/lock.square@4x@3x.png" alt="pin" />,
                    action: () => onSelect("changepin"),
                },
                {
                    subtitle: "More",
                    icon: <img height="30px" width="30px" src="/menuIcons/custom.ellipsis.square@4x@3x.png" alt="more" />,
                    action: () => onSelect("accountsettings"),
                }
            ]
        },
        {
            title: "Support",
            content : [
                {
                    subtitle: "About",
                    icon: <img height="30px" width="30px" src="/menuIcons/info.square@4x@3x.png" alt="about" />,
                    action: () => onSelect("about")
                },
                {
                    subtitle: "Contact",
                    icon: <img height="30px" width="30px" src="/menuIcons/text.bubble@4x@3x.png" alt="contact" />,
                    action: () => onSelect("support")
                }
            ]
        }
    ]

    return (
        <div style={{ color: "#000", marginTop: "20px", margin: "auto", textAlign: "left", width: "90%" }}>
            {/*<h3 style={{ color: "darkblue", marginBottom: "2em" }}>
                {Object.keys(userDetails).length === 0
                    ? "0.0.0"
                    : hederaAccountToString(userDetails.hhAccount)}
                ({localStorage.getItem("port") === "7100" ? "Mainnet" : "Testnet"})
            </h3>*/}
            <div style={{height: "42px", display: "flex", alignItems: "center", marginLeft: "-10px", marginTop: "10px", gap: "8px"}}>
                <img src="./arrowBack.png" alt="back" style={{cursor: "pointer"}} onClick={closeNavigation}/>
                <Copy iconColor="disabled" toolTipTitle="Copy Account Id" text={hederaAccountToString(userDetails.hhAccount)}>
                    <Typography style={{fontSize: "12px", flex: 1, textAlign: "center", paddingLeft:"20px", fontWeight: 700, textTransform: "uppercase", color: "#333333", cursor: "pointer", letterSpacing: "0.3px"}}>
                        {pageTexts.accIdText}: {hederaAccountToString(userDetails.hhAccount)}
                    </Typography>
                </Copy>
            </div>
            
            <div className={styles.scrollableSection} style={{height: "600px", overflowY: "scroll"}}>

                {
                    menuList.map((menu, index) => {
                        return (
                            <div key={index} style={{marginBottom: "30px"}}>
                                <h3>{menu.title}</h3>
                                <Grid container style={{padding: "20px 0px"}} className={styles.greyListContainer}>
                                    {menu.content.map((content, index) => {
                                        return (
                                            <Grid item xs={4} key={index} style={{cursor: "pointer"}} onClick={content.action}>
                                                <Grid container justifyContent="center">
                                                    <div style={{textAlign: "center", padding: "10px 20px"}}>
                                                        <div className={styles.icon} style={{marginBottom: "5px"}}>
                                                            {content.icon ? content.icon : ""}
                                                        </div>
                                                        <div>
                                                            {content.subtitle}
                                                        </div>
                                                    </div>
                                                </Grid>
                                            </Grid>
                                        )
                                    })}
                                </Grid>
                            </div>
                        )
                    })
                }
            </div>
            {/* <Grid container>
                <Grid item xs={4}>
                    <h3 onClick={e => onSelect("dashboard")} style={{ fontSize: "1.2em", cursor: "pointer" }}>
                        HOME
                    </h3>
                </Grid>
                <Grid item xs={4}>
                    <h3 onClick={e => onSelect("fundaccount")} style={{ fontSize: "1.2em", cursor: "pointer" }}>
                        FUND ACCOUNT
                    </h3>
                </Grid>
                <Grid item xs={4}>
                    <h3 onClick={e => onSelect("merchantList")} style={{ fontSize: "1.2em", cursor: "pointer" }}>
                        DROPP MERCHANTS
                    </h3>
                </Grid>
                <Grid item xs={4}>
                    <h3 onClick={e => onSelect("offers")} style={{ fontSize: "1.2em", cursor: "pointer" }}>
                        OFFERS
                    </h3>
                </Grid>
                <Grid item xs={4}>
                    <h3 onClick={e => onSelect("transactions")} style={{ fontSize: "1.2em", cursor: "pointer" }}>
                        TRANSACTIONS
                    </h3>
                </Grid>
                <Grid item xs={4}>
                    <h3 onClick={e => onSelect("manageaccounts")} style={{ fontSize: "1.2em", cursor: "pointer" }}>
                        MANAGE CURRENCY ACCOUNTS
                    </h3>
                </Grid>
                <Grid item xs={4}>
                    <h3 onClick={e => onSelect("nftcollections")} style={{ fontSize: "1.2em", cursor: "pointer" }}>
                        NFT COLLECTIONS
                    </h3>

                </Grid>
                <Grid item xs={4}>
                    <h3 onClick={e => onSelect("walletConnect")} style={{ fontSize: "1.2em", cursor: "pointer" }}>
                        WALLET CONNECT
                    </h3>
                </Grid>
                <Grid item xs={4}>
                    <h3 onClick={e => onSelect("accountsettings")} style={{ fontSize: "1.2em", cursor: "pointer" }}>
                        SETTINGS
                    </h3>

                </Grid>
                <Grid item xs={4}>
                    <h3 onClick={e => onSelect("support")} style={{ fontSize: "1.2em", cursor: "pointer" }}>
                        SUPPORT
                    </h3>

                </Grid>
            </Grid> */}
            {/* <h3 onClick={e => onSelect("profile")} style={{ fontSize:"1.2em", cursor: "pointer" }}>
                PROFILE
            </h3> */}
            {/* <h3 onClick={e => onSelect("favorites")} style={{fontSize:"1.2em", cursor: "pointer" }}>
                FAVORITES
            </h3> */}
            {/* <h3 onClick={e => onSelect("changepin")} style={{fontSize:"1.2em", cursor: "pointer" }}>
                WALLET PIN
            </h3>
            <h3 onClick={e => onSelect("notifications")} style={{fontSize:"1.2em", cursor: "pointer" }}>
                NOTIFICATIONS
            </h3> */}
            {/* <h3 onClick={e => onSelect("notifications")} style={{fontSize:"1.2em", cursor: "pointer" }}>
                RECOVERY
            </h3> */}
            {/* <h3 onClick={e => onSelect("fundaccount")} style={{fontSize:"1.2em", cursor: "pointer" }}>
                FUND ACCOUNT
            </h3> */}


            {/* <h3 onClick={e => onSelect("history")} style={{fontSize:"1.2em", cursor: "pointer" }}>
                PURCHASES
            </h3>
            <h3 onClick={e => onSelect("credits")} style={{fontSize:"1.2em", cursor: "pointer" }}>
                CREDITS
            </h3>
            <h3 onClick={e => onSelect("myrecurringpayments")} style={{fontSize:"1.2em", cursor: "pointer" }}>
                RECURRING AUTHORIZATIONS
            </h3> */}
            {/* <br/>
            <br/> */}

            {/* <h3 onClick={e => onSelect("about")} style={{fontSize:"1.2em", cursor: "pointer" }}>
                ABOUT
            </h3> */}

        </div>
    );
};

export default SidebarMenu;
