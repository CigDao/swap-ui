import { FormControl, InputLabel, Select, MenuItem, Button, SelectChangeEvent, Grid, Paper } from '@mui/material';
import { getProviders } from '@utils/icUtils';
import * as React from 'react';
import { useNavigate } from 'react-router-dom';
import LogoWrapper from '@components/LogoWrapper/LogoWrapper';
import { useEffect, useState } from 'react';
import Loading from '@components/Loading/Loading';
import { getYcWicpAmmMetaData } from '@utils/httputils';

interface params {
  provider: string | undefined
  setProvider: any
};

export default function WalletConnector({provider, setProvider}: params) {
	const navigate = useNavigate();
	const [loadingState, setLoadingState] = useState(false);

	async function init() {
		if (provider) {
			const prov = getProviders(provider);
			await prov.init();
			await prov.disconnect();
		};
	};

	useEffect(() => {
		init().then();
	}, []);

	async function connect(event: SelectChangeEvent) {
		const connector = event.target.value as string;
		if (connector) {
			setLoadingState(true);
			const canisters = await getYcWicpAmmMetaData();
			const provider = getProviders(connector, [canisters.token1, canisters.token2]);
			await provider.init();
			await provider.connect();
			navigate('/swap');
      		setProvider(connector);
			setLoadingState(false);
		}
	}

	function content() {
		return (
			<>
				<Grid container spacing={0} direction='column' alignItems='center' justifyContent='center'>
					<Grid item xs={3}>
						<Paper sx={{ bgcolor: 'white', marginBottom: 2, minWidth: 300, padding: 5 }}>
							{!loadingState && (
								<FormControl fullWidth>
									<InputLabel id='demo-simple-select-label'>Connect</InputLabel>
									<Select labelId='demo-simple-select-label' id='demo-simple-select' label='Connect' value='' onChange={connect}>
										<MenuItem value={'nfid'}>NFID</MenuItem>
										<MenuItem value={'plug'}>Plug</MenuItem>
										<MenuItem value={'stoic'}>Stoic</MenuItem>
									</Select>
								</FormControl>
							)}
							{loadingState && <Loading />}
						</Paper>
					</Grid>
				</Grid>
			</>
		);
	}

	return (
		<>
			<LogoWrapper renderContent={content} />
		</>
	);
}
