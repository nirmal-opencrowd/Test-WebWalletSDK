import React from "react";
import { Route, Switch, Redirect } from "react-router-dom";

//Core App pages
import GettingStarted from "./components/pages/GettingStarted";
import DroppRecovery from "./components/pages/DroppRecovery";
import AdvancedHbarRecovery from "./components/pages/AdvancedHbarRecovery";
import LinkAccountSuccess from "./components/pages/LinkAccountSuccess";
import ChangePin from "./components/ChangePin";
import Login from "./components/pages/Login";
import Home from "./components/pages/Home";
import RecentPurchases from "./components/pages/RecentPurchases";
import Support from "./components/pages/Support";
import AccountSettings from "./components/pages/AccountSettings";
import PurchaseDetails from "./components/pages/PurchaseDetails";
import Favorites from "./components/Favorites";
import Offers from "./components/Offers";
import FirstTimeFlow from "./components/pages/FirstTimeFlow";
import UnlinkAccount from "./components/pages/UnlinkAccount";
import TxnHistory from "./components/TxnHistory";
import Replenishment from "./components/Replenishment";
import Pay from "./components/Pay";
import RecurringPayment from "./components/RecurringPayment";
import About from "./components/About";
import InfoAccess from "./components/InfoAccess";
import WCApproval from "./components/WCApproval";
import WCSignApproval from "./components/WCSignApproval";
import MagicLinkRecovery from "./components/pages/MagicLinkRecovery";
import ValidateAccount from "./components/pages/ValidateAccount";
import PreAuthPayment from "./components/PreAuthPayment";

const Routes = () => (
    <Switch>
        <Route path="/" exact render={() => <Redirect to="/firsttimeflow" />} />
        <Route path="/login" component={Login} exact />
        <Route path="/firsttimeflow" component={FirstTimeFlow} />
        <Route path="/gettingStarted" component={GettingStarted} exact />
        <Route path="/validateAccount" component={ValidateAccount} exact />
        <Route path="/submitrequest" component={Support} exact />
        <Route path="/accountsettings" component={AccountSettings} exact />
        <Route path="/purchasedetails" component={PurchaseDetails} exact />
        <Route path="/dropprecovery" component={DroppRecovery} exact />
        <Route path="/magiclinkrecovery" component={MagicLinkRecovery} exact/>
        <Route path="/advancedhbarrecovery" component={AdvancedHbarRecovery} exact />
        <Route path="/linkAccountSuccess" component={LinkAccountSuccess} exact />
        <Route path="/changePin" component={ChangePin} exact />
        <Route path="/pay" component={Pay} exact />
        <Route path="/recurringPayment" component={RecurringPayment} exact />
        <Route path="/preAuthPayment" component={PreAuthPayment} exact />
        <Route path="/infoAccess" component={InfoAccess} exact />
        <Route path="/wcApproval" component={WCApproval} exact />
        <Route path="/wcSignApproval" component={WCSignApproval} exact />
        <Route path="/about" component={About} exact />
        <Route path="/home" component={Home} exact />
        <Route path="/recentpurchases" component={RecentPurchases} exact />
        <Route path="/favorites" component={Favorites} />
        <Route path="/history" component={TxnHistory} />
        <Route path="/replenishment" component={Replenishment} />
        <Route path="/offers" component={Offers} />
        <Route path="/unlinkaccount" component={UnlinkAccount} exact />
    </Switch>
);

export default Routes;
