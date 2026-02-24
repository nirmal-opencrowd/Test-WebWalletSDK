import { Typography } from '@material-ui/core';
import React, { useState, useEffect } from 'react';

function NetworkConnection() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    function handleOnline() {
      setIsOnline(true);
    }

    function handleOffline() {
      setIsOnline(false);
    }

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return (
    <div style={{width:"100%", position:"absolute", bottom:"60px", zIndex: 2}}>
      {isOnline ? (
        ""
      ) : (
        <div style={{display:"flex", justifyContent:"center"}}>
            <Typography style={{boxShadow: "0 0 2px 0", backgroundColor:"#F9ECBE", textAlign:"center", padding:"6px"}}>No network connection</Typography>
        </div>
      )}
    </div>
  );
}

export default NetworkConnection;