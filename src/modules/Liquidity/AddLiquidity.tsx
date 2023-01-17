import React, {useState, useEffect} from "react"
import { useNavigate, useLocation } from 'react-router-dom';
import {
	Alert,
	AlertTitle,
	Box,
	Button,
	CircularProgress,
	Collapse,
	Divider,
	InputAdornment,
	List,
	ListItem,
	ListItemButton,
	ListItemText,
	Menu,
	MenuItem,
	Paper,
	Snackbar,
	TextField,
	Typography,
	useMediaQuery
} from '@mui/material';
import NavBar from '@components/NavBar/NavBar';
import IcUtils, { updateICPBalance, getProviders } from "@utils/icUtils";
import { IConnector } from '@connect2ic/core';
import LogoWrapper from '@components/LogoWrapper/LogoWrapper';
import Loading from '@components/Loading/Loading';
import { theme } from '@misc/theme';


export default function AddLiquidity({provider}: any) {

    const [icpBalance, setIcpBalance] = useState<string>('0');
    const [appLoading, setAppLoading] = useState(false);
    const [coinBalanceMap, setCoinBalanceMap] = useState<Map<string, string>>(new Map());
    const icUtils = new IcUtils();
    const [icpProvider] = useState<IConnector>(getProviders(provider));
    const isSmallScreen = useMediaQuery(theme.breakpoints.down('md'));

    const navigate = useNavigate();
    const location = useLocation();


    useEffect(() => {
		setAppLoading(true);
		init().then(() => {
			setAppLoading(false);
			// calcMarketcap().then();
		});
	}, []);

    async function init () {
        if (!icpProvider) {
			navigate('/');
			return;
		};

        await icpProvider.init();
		const connected = await icpProvider.isConnected();
		if (!connected) {
			navigate('/');
			return;
		};
        let coinBalanceMap = location.state;
        setCoinBalanceMap(coinBalanceMap);
    };
    function renderAddLiquidity(){
        return(
            <Box sx={{ display: 'flex', flexGrow: 1 }}>
                <Box sx={{ display: 'flex', flexGrow: 1, justifyContent: 'center' }}>
                    <Paper elevation={3} sx={{ bgcolor: 'white', marginBottom: 2, p: 2, maxWidth: isSmallScreen ? '100%' : '600px', margin: 1, flexGrow: 1 }}>
                        <Box sx={{ display: 'flex', flexGrow: 1, flexDirection: "row" }}>
                            <Box sx={{ display: 'flex', flexGrow: 1, justifyContent: 'left' }}>
                                <Button onClick={() => navigate('/')}>Disconnect</Button>
                            </Box>
                        </Box>
                    </Paper>
                </Box>
            </Box>
        )
    };


    return (
        <Box sx={{ display: 'flex', flexGrow: 1, flexDirection:"column" }}>
            <NavBar onClose={async () =>  {
                await updateICPBalance(icpProvider, coinBalanceMap, setIcpBalance, icUtils);
                setCoinBalanceMap(coinBalanceMap);
            }} walletAddress={icpProvider?.principal} balance={icpBalance}
            icpProvider={icpProvider} 
            setBalance={(balance: string) => {
                coinBalanceMap.set("ICP", balance);
                setIcpBalance(balance);
            }}/>
            {appLoading ? <LogoWrapper renderContent={Loading} /> : <LogoWrapper renderContent={renderAddLiquidity} />}
        </Box>
    );
};