import React from 'react';

const TestModeText = ({ testModeActive }) => {

    return (
        testModeActive ?
            <div style={{ display: "flex", justifyContent: "center" }}>
                <div style={
                    {
                        backgroundColor: "#E9E9E9",
                        borderRadius: "5px",
                        bottom: "5px",
                        color: "#18c2ee",
                        fontSize: "14px",
                        padding: "3px 20px",
                        position: "fixed",
                        zIndex: "99999",
                    }}>
                    <div>
                        Test Mode
                    </div>
                </div>
            </div> : ""
    )
}

export default TestModeText