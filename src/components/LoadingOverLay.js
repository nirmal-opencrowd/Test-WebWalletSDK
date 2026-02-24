import React from 'react';
import { Box, CircularProgress } from "@material-ui/core";

const LoadingOverLay = ({ loading }) => {
  if (!loading) return null;

  return (
    <Box
      sx={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 1300
      }}
    >
      <CircularProgress color="primary" />
    </Box>
  );
};

export default LoadingOverLay;