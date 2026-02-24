import * as React from 'react';
import { Box } from "@material-ui/core";

export default function NumberStepIcon(props) {
  const { icon, active, completed } = props;

  return (
    <Box
      sx={{
        width: 24,
        height: 24,
        borderRadius: '50%',
        bgcolor: active || completed ? '#18c2ee' : 'grey.400',
        color: 'white',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: 12,
        fontWeight: 600,
      }}
    >
      {icon}
    </Box>
  );
}
