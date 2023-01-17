import { Alert, Button, Dialog, DialogTitle, IconButton, InputAdornment, Snackbar, TextField, useMediaQuery } from '@mui/material';
import React, { useEffect, useState } from 'react';
import QRCode from 'qrcode'
import { theme } from '@misc/theme';
import CopyAllIcon from '@mui/icons-material/CopyAll';

export interface SimpleDialogProps {
    open: boolean;
    walletAddress: string | undefined;
    onClose: () => void;
  }

export default function QrCodeDialog(props: SimpleDialogProps) {

    const { onClose, open, walletAddress } = props;
    const fullScreen = useMediaQuery(theme.breakpoints.down('md'));
    const handleClose = () => {
      onClose();
    };
  
    const [qrAddress, setQrAddress] = useState("false");
    const [displayAddress, setDisplayAddress] = useState<string>();
    const [openSnackBar, setOpenSnackBar] = React.useState(false);


	useEffect(() => {
        generateQrCode().then();

      }, [walletAddress]);
  
	async function generateQrCode() {
		try {
			if (walletAddress) {
                setQrAddress(await QRCode.toDataURL(walletAddress));
                const firstPart = walletAddress.substring(0, 4);
                const secondPart = walletAddress.substring( walletAddress.length - 4, walletAddress.length);
                setDisplayAddress(`${firstPart}...${secondPart}`)

            }
		  } catch (err) {
			console.error(err)
		  }
	}
    
    function copyToClipboard() {
        navigator.clipboard.writeText(walletAddress || "");
        setOpenSnackBar(true);
    }

	return ( <>
        <Dialog onClose={handleClose} open={open}
        fullScreen={fullScreen}
        >
        <DialogTitle sx={{ m: 0, p: 2 }}>
            <TextField
            id='standard-basic'
            label='Copy to clipboard'
            variant='outlined'
            type='text'
            disabled
            onClick={copyToClipboard}
            value={walletAddress}
        >
        </TextField>
        </DialogTitle>
        <img width={"100%"} src={qrAddress}/>
      </Dialog>
      <Snackbar open={openSnackBar} autoHideDuration={6000} onClose={() => setOpenSnackBar(false)}>
        <Alert onClose={() => setOpenSnackBar(false)} severity="success" sx={{ width: '100%' }}>
          Successfully copied address!
        </Alert>
      </Snackbar>
      </>
	);
}

