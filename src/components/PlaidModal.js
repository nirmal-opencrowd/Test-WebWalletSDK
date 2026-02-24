import React, { useCallback, useEffect } from "react";
// import { usePlaidLink } from 'react-plaid-link';
import { addPlaidLib } from "./../utils/utils"

const PlaidModal = (props) => {
  const [plaid, setPlaid] = React.useState(false);
  const [handler, setHandler] = React.useState(false);
  // let handler;
  useEffect(() => {
    async function loadPlaidLib() {
      const lib = await addPlaidLib();
      if (lib) {
        setPlaid(lib);
      }
    }
    loadPlaidLib();
  }, []);

  useEffect(() => {
    if (plaid) {
      const {linkToken} = props;
      const config = {
        token: linkToken,
        onSuccess: onSuccess,
        onExit: onExit
      };
      // handler = plaid.create(config);
      setHandler(plaid.create(config));
    }

  }, [plaid]);

  const onSuccess = useCallback((public_token, metadata) => {
    props.setBankDetails(metadata);
    props.resetPlaidData();
  }, []);

  const onExit = useCallback((error, metadata) => {
    props.resetPlaidData();
  }, []);

  return ( <>
      {handler && handler.open ? handler.open() : ""}
      </>
		);
};

export default PlaidModal;