import React from "react";
import ReactTooltip from "react-tooltip";

const RecentPurchases = () => {
    return (
        <div style={{ width: "500px", position: "fixed", left: "35%", textAlign: "center" }}>
            <div>
                <img
                    style={{ marginTop: "60px" }}
                    height="70"
                    width="180"
                    src="./dropp_logo.png"
                    className=""></img>
            </div>

            <div
                style={{
                    textAlign: "center",
                    width: "400px",
                    marginTop: "40px",
                    marginLeft: "40px",
                }}>
                <div style={{ paddingTop: "9px", marginRight: "180px", float: "left" }}>
                    <label style={{ color: "#18C2EE", fontSize: "26px", marginLeft: "10px" }}>
                        <b>PURCHASES</b>
                    </label>
                </div>
                <img height="40" width="40" src="./dropp_logo_small.png"></img>
                <hr className="solid" />
            </div>
            <button style={{ marginTop: "300px" }} className="button button-primary">
                Done
            </button>
        </div>
    );
};
export default RecentPurchases;
