import { AppBar, Box, Button, CircularProgress, IconButton, Toolbar, Typography } from '@mui/material';
import icUtils, { getProviders } from '@utils/icUtils';
import React, { useEffect, useState } from 'react';
import QrCodeDialog from '@components/QrCodeDialog/QrCodeDialog';
import { AccountIdentifier, SubAccount } from '@dfinity/nns';
import { Principal } from '@dfinity/principal';
import CachedIcon from '@mui/icons-material/Cached';
import { bigIntToDecimalPrettyString } from '@utils/decimalutils';
import IcUtils from '@utils/icUtils';
export default function NavBar({walletAddress, onClose, balance, setBalance, icpProvider}: 
	{walletAddress: string | undefined, onClose: any, balance: string, setBalance: any, icpProvider: any}) {
	const [open, setOpen] = React.useState(false);
	const [walletIdentifier, setWalletIdentifier] = React.useState("");
	const [loadingBalance, setLoadingBalance] = React.useState(true);
	const icUtils = new IcUtils();

	const handleClose = () => {
		setOpen(false);
		onClose().then();
	  };
	function openQrCode() {
		setOpen(true);
	}

	async function refresh() {
		setLoadingBalance(true);
		const ledger = await icUtils.ledgerCanister(icpProvider);
		const identifier = AccountIdentifier.fromPrincipal({
			principal: Principal.fromText(icpProvider.principal ?? ''),
			subAccount: SubAccount.ZERO
		}).toNumbers();
		const balance = await ledger.account_balance({ account: identifier });
		setBalance(bigIntToDecimalPrettyString(balance.e8s));
		setLoadingBalance(false);
	}

	useEffect(()=>{
		if (walletAddress) {
		const identifier = AccountIdentifier.fromPrincipal({
			principal: Principal.fromText(walletAddress),
			subAccount: SubAccount.ZERO
		}).toHex();
		setWalletIdentifier(identifier);
		refresh().then();
	}
	}, [walletAddress]);

	function fixWalletIdentifier() {
		return `${walletIdentifier.substring(0, 4)}...${walletIdentifier.substring(walletIdentifier.length -4, walletIdentifier.length)}`
	}

	return ( 
		<Box sx={{ display: 'flex', flexGrow: 1 }}>
		<AppBar position="static">
		  <Toolbar>
			<Typography variant="h6" component="div" sx={{ marginRight: 1 }}>
			  SmokeSwap
			</Typography>
			<Box sx={{ flexGrow: 1, justifyContent: "left", textAlign: "left", flexDirection: "unset"  }}>
				ICP: {loadingBalance ? <CircularProgress size="1rem" color="success" /> : balance}
				<IconButton
				size="large"
				edge="start"
				color="inherit"
				aria-label="menu"
				onClick={refresh}
				sx={{ mr: 2 }}
				>
					<CachedIcon/>
				</IconButton>
          	</Box>
			<Box sx={{ flexGrow: 1, justifyContent: "right", textAlign: "right"  }}>
				{walletAddress ? <Button color="inherit" onClick={openQrCode} variant="outlined">{fixWalletIdentifier()}</Button> : <Typography color="inherit"><CircularProgress color="success" /></Typography>}
          	</Box>

		  </Toolbar>
		</AppBar>
		<QrCodeDialog walletAddress={walletIdentifier}
		        open={open}
				onClose={handleClose}
		/>
	  </Box>
	);
}

