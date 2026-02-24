import React from 'react';
import { makeStyles } from '@material-ui/core/styles';
import TextField from '@material-ui/core/TextField';
import Button from '@material-ui/core/Button';

const ConnectWithDapps = ({setCurrentScreen, userDetails}) => {
  const [uri, setUri] = React.useState("");
  const [uriErr, setUriErr] = React.useState(null);

  const uriRegex = /^wc:[a-fA-F0-9]+@2\?(?:[a-zA-Z0-9-]+=[a-zA-Z0-9-]+&)*relay-protocol=irn&symKey=[a-fA-F0-9]+$/;


  const useStyles = makeStyles((theme) => ({
    container: {
      maxWidth: 420,
      margin: '0 auto',
      padding: '12px',
    },
    topBar: {
      display: 'flex',
      alignItems: 'center',
      padding: '8px 4px',
    },
    backIcon: {
      color: '#18C2EE',
      cursor: 'pointer',
    },
    title: {
      flex: 1,
      textAlign: 'center',
      fontWeight: 800,
      fontSize: '1.2rem',
      letterSpacing: '2px',
    },
    card: {
      background: '#fff',
      borderRadius: 18,
      padding: '22px',
      boxShadow: '0 8px 20px rgba(0,0,0,0.06)',
      marginTop: 12,
    },
    wcHeader: {
      display: 'flex',
      alignItems: 'center',
      marginBottom: 12,
    },
    wcLogo: {
      width: 40,
      height: 40,
      marginRight: 12,
    },
    wcTitle: {
      fontSize: '1.1rem',
      fontWeight: 700,
    },
    description: {
      color: '#555',
      marginBottom: 16,
      lineHeight: 1.4,
    },
    inputWrap: {
      marginBottom: 16,
    },
    input: {
      width: '100%',
      background: '#fff',
      borderRadius: 30,
    },
    qrButton: {
      padding: 8,
    },
    connectBtn: {
      background: '#18C2EE',
      color: '#fff',
      borderRadius: 30,
      padding: '5px 28px',
      fontWeight: 700,
      fontSize: '12px',
      width: '160px',
      textTransform: 'none',
      '&:hover': {
        background: '#18C2EE',
      },
    },
  notchedOutline: {
    borderRadius: 30,
  },
  }));

  const classes = useStyles();

  // function queryBuilder(request) {
  //   let query = "";
  //   for (let i = 0; i < Object.keys(request).length; i++) {
  //       if (Object.keys(request)[i] !== "message") {
  //           query = query + Object.keys(request)[i] + "=" + encodeURI(request[Object.keys(request)[i]]) + "&";
  //       }
  //   }
  //   return query;
  // }

  function connect() {
    if (!uri) {
      setUriErr("Please enter the URI string");
      return;
    } else if (uri && uriRegex.test(uri)){
      let obj = { isLoggedIn: true, uri: uri, walletConnectApproval: true, withoutUrl: true };
      chrome.runtime.sendMessage({
        type: "askForWCApproval",
        request: obj
      });
      setTimeout(() => {
        window.close();
      }, 1000);
    } else {
      setUriErr("Invalid URI string");
      return;
    }
  }

  const URIHandler = (e) => {
    setUriErr(null);
    setUri(e.target.value);
  }

  return (
    <div className={classes.container}>

      <div className={classes.card}>
        <div className={classes.wcHeader}>
          <div className={classes.wcLogo}>
            {/* placeholder logo - if you have an asset, replace src */}
            <img src="/menuIcons/icon-wc-connect-1@3x.png" alt="wc" style={{ width: '100%', height: '100%' }} onError={(e)=>{e.target.style.display='none'}} />
          </div>
          <div>
            <div className={classes.wcTitle}>WalletConnect</div>
          </div>
        </div>
        <div className={classes.description}>
          Connect with any WalletConnect supported app. Use the pair string URI.
        </div>

        <div className={classes.inputWrap}>
          <TextField
            variant="outlined"
            placeholder="URI string e.g. wc:a281567b..."
            value={uri}
            onChange={URIHandler}
            className={classes.input}
            id="custom-css-outlined-input-1"
            InputProps={{
              classes: { notchedOutline: classes.notchedOutline },
              inputProps: { style: { padding: '10px 14px', fontSize: '12px', borderRadius: '25px'} },
            }}
          />
          {uriErr && (
            <div className="errMsg extension" style={{ marginTop: 8 }}>
              <strong>{uriErr}</strong>
            </div>
          )}
        </div>

        <div style={{ textAlign: 'left' }}>
          <Button className={classes.connectBtn} onClick={connect}>
            CONNECT
          </Button>
        </div>
      </div>
    </div>
  );
}

export default ConnectWithDapps;
