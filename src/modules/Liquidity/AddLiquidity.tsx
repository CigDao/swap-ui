import React, {useState, useEffect, useCallback, useRef} from "react"
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
import debounce from 'lodash.debounce';
import NavBar from '@components/NavBar/NavBar';
import IcUtils, { updateICPBalance, getProviders, ycWicpSwapCanisterId, mlpSwapCanisterId } from "@utils/icUtils";
import { IConnector } from '@connect2ic/core';
import { _SERVICE as SwapService } from 'src/declarations/swap/swap.did';
import { ArrowDropDown } from '@mui/icons-material';
import coins, { CoinInput, SharesData } from '@utils/coins';
import LoadingButton from '@mui/lab/LoadingButton';
import { bigIntToDecimal, DECIMALS, prettyStringToNumber, bigIntToDecimalPrettyString } from '@utils/decimalutils';
import { CoinAvatar } from '@components/CoinAvatar/CoinAvatar';
import LogoWrapper from '@components/LogoWrapper/LogoWrapper';
import Loading from '@components/Loading/Loading';
import { theme } from '@misc/theme';
import { Principal } from "@dfinity/principal";
import { _SERVICE as Dip20Service } from "../../declarations/dip20/dip20.did";
import { CanisterId } from "@dfinity/nns/dist/proto/base_types_pb";

export default function AddLiquidity({provider}: any) {
 

    const [icpBalance, setIcpBalance] = useState<string>('0');
    const [appLoading, setAppLoading] = useState(false);
    const [disableForm, setDisableForm] = useState(false);
	const [swapCoinList, setSwapCoinList] = useState(new Map());
    const [selectedCoin1, setSelectedCoin1] = useState<CoinInput>(coins.WICP);
	const [selectedCoin2, setSelectedCoin2] = useState<CoinInput>(coins.WICP);
    const [swapServices, setSwapServices] = useState<Map<string, {canisterId?: string, swapService?: SwapService}>>(new Map());
    const [tokenServices, setTokenServices] = useState<Map<string, {canisterId?: string, service?: Dip20Service}>>(new Map());
    const [withdrawButtonLoading, setWithdrawButtonLoading] = useState(false);
    const [addLiquidityButtonLoading, setAddLiquidityButtonLoading] = useState(false);
    const [token1Loading, setToken1Loading] = useState(false);
    const [token2Loading, setToken2Loading] = useState(false);
    const [shares, setShares] = useState<Map<string, SharesData>>(new Map());
    const[sharesOnDisplay, setSharesOnDisplay] = useState(0);
    const [tokenValue1, setTokenValue1] = useState<string | undefined | number>('0');
	const [tokenValue2, setTokenValue2] = useState<string | undefined | number>('0');
    const [token1AnchorEl, setToken1AnchorEl ] = useState<null | HTMLElement>(null);
    const [token2AnchorEl, setToken2AnchorEl ] = useState<null | HTMLElement>(null);
    const [coinBalanceMap, setCoinBalanceMap] = useState<Map<string, string>>(new Map());
    const [token1Error, setToken1Error] = useState(false);
	const [token2Error, setToken2Error] = useState(false);
    const [reFire_renderSharesData, setReFire_renderSharesData] = useState(0);
    const icUtils = new IcUtils();
    const [icpProvider] = useState<IConnector>(getProviders(provider));
    const isSmallScreen = useMediaQuery(theme.breakpoints.down('md'));

    const navigate = useNavigate();
    const location = useLocation();

    function resetSwap() {
		setTokenValue1(0);
		setTokenValue2(0);
	}


    useEffect(() => {
		setAppLoading(true);
		init().then(() => {
			setAppLoading(false);
			// calcMarketcap().then();
		});
	}, []);

    useEffect(() => {
        loadShares();
    },[swapServices]);

    useEffect(() => {
        popualateAdditionalSharesData(shares);
    },[shares]);

    const popualateAdditionalSharesData = async (shares : Map<string, SharesData>) => {
        let sharesDataPromises: any = [];

        const loadSharesHelper = async (shares: bigint, tradingPairSymbols: string,) => {
            const swapServiceObj = swapServices.get(tradingPairSymbols);
            if(!swapServiceObj) return;
            let tokenShares = await swapServiceObj.swapService?.getWithdrawEstimate(shares);
            return {tradingPairSymbols, tokenShares};
        };

        shares.forEach((shareObj, tradingPairSymbols) => {
            const {shares} = shareObj;
            sharesDataPromises.push(loadSharesHelper(shares, tradingPairSymbols));
        }); 
        let response: any = await Promise.allSettled<any>(sharesDataPromises);
        response = response.map((res: any) => {
            if(res.status !== "fulfilled") return;
            const shareData: {share1: bigint, share2: bigint} = res.value.tokenShares;
            const tradingPairSymbols: string = res.value.tradingPairSymbols;
            return {shareData, tradingPairSymbols};
        });
        response.forEach((data: any) => {
            if(!data) return;
            const {shareData, tradingPairSymbols} = data;
            if(!tradingPairSymbols) return
            let shareObj = shares.get(tradingPairSymbols);
            if(!shareObj) return;
            shares.set(tradingPairSymbols,{...shareObj, ...shareData} )
            setShares(shares);
            setReFire_renderSharesData(reFire_renderSharesData+1);
        });
    };
    const loadShares = async () => {
        const getSharesHelper = async (tradingPairSymbols: string) => {
            if(!icpProvider.principal) return;
            const swapServiceObj = swapServices.get(tradingPairSymbols);
            if(!swapServiceObj) return;
            let shares = await swapServiceObj.swapService?.getShares(Principal.fromText(icpProvider.principal));
            const sharesObj = {shares}
            return {
                tradingPairSymbols,
                sharesObj
            };
        };
        let shareRequests : any = [];
        swapServices.forEach((swapService, tradingPairSymbols) => {
            if(swapService) shareRequests.push(getSharesHelper(tradingPairSymbols));
        });
        let response: any = await Promise.allSettled<any>(shareRequests);
        response.forEach((res: any) => {
            res = res.value;
            res.sharesObj.shares = BigInt(res.sharesObj.shares);
            if(res.tradingPairSymbols === "YC-WICP") {
                res.sharesObj.name1 = "Your Coin";
                res.sharesObj.symbol1 = "YC";
                res.sharesObj.name2 = "WICP";
                res.sharesObj.symbol2 = "WICP";
            } else if(res.tradingPairSymbols === `${coins.MLP.symbol}-YC`){
                res.sharesObj.name1 = coins.MLP.name;
                res.sharesObj.symbol1 = coins.MLP.symbol;
                res.sharesObj.name2 = "Your Coin";
                res.sharesObj.symbol2 = "YC";
            }
            shares.set(res.tradingPairSymbols, res.sharesObj);
            const updatedShares = new Map(shares);
            setShares(updatedShares);
        });
    };

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

        let tokenServices_ = location.state.tokenServices;     
        
        let ycCanisterId = tokenServices_.get("YC");
        ycCanisterId = ycCanisterId.canisterId;

        let wicpCanisterId = tokenServices_.get("WICP");
        wicpCanisterId.canisterId;

        let mlpCoinCanisterId = tokenServices_.get(coins.MLP.symbol);
        mlpCoinCanisterId = mlpCoinCanisterId.canisterId;

        const response = await Promise.allSettled<any>([
            icUtils.ycWicpSwapCanister(icpProvider),
            icUtils.ycMlpTokenSwapCanister(icpProvider),
            icUtils.dip20Canister(ycCanisterId, icpProvider),
            icUtils.wicpCanister(icpProvider),
            icUtils.dip20Canister(mlpCoinCanisterId, icpProvider)
        ]);

        let swapCanisterPromise0 = response[0] as any;
        let swapCanisterPromise1 = response[1] as any;
        let ycTokenServicePromise = response[2] as any;
        let wicpTokenServicePromise = response[3] as any;
        let mlpCoinTokenServicePromise = response[4] as any;

        let swapCanister0 : SwapService = swapCanisterPromise0.value;
        let swapCanister1 : SwapService = swapCanisterPromise1.value;
        let ycTokenService: Dip20Service = ycTokenServicePromise.value;
        let wicpTokenService: Dip20Service = wicpTokenServicePromise.value;
        let mlpCoinTokenService: Dip20Service = mlpCoinTokenServicePromise.value;

        tokenServices_.forEach((tokenServiceObj: any, key: any) => {
            let service;
            if(key === "YC") service = ycTokenService;
            if(key === "WICP") service = wicpTokenService;
            if(key === coins.MLP.symbol) service = mlpCoinTokenService;
            let newTokenServiceObj = {...tokenServiceObj, service: service};
            tokenServices_.set(key, newTokenServiceObj);
        });
        tokenServices_.forEach((serviceObj: {canisterId?: string, service?: Dip20Service}, key: string)=> {
            tokenServices.set(key,serviceObj);
        });
        

        swapServices.set("YC-WICP", {swapService: swapCanister0, canisterId: ycWicpSwapCanisterId});
        swapServices.set(`${coins.MLP.symbol}-YC`, {swapService: swapCanister1, canisterId: mlpSwapCanisterId});

        let coinBalanceMap = location.state.coinBalanceMap;
        let swapCoinList : Map<any, any> = location.state.swapCoinList;
        swapCoinList.forEach((coin, key) => {
            let tradinigPairs = coin.tradingPair;
            tradinigPairs = tradinigPairs.filter((symbol: any) => symbol !== "ICP");
            const coin_ = {...coin, tradingPair: tradinigPairs};
            swapCoinList.set(key, coin_);
        });
        swapCoinList.delete("ICP");
        const selectedCoin1 = swapCoinList.get("YC");
        const selectedCoin2 = swapCoinList.get(coins.MLP.symbol);
        setSelectedCoin1(selectedCoin1);
        setSelectedCoin2(selectedCoin2);
        setCoinBalanceMap(coinBalanceMap);
        setSwapCoinList(swapCoinList);
        const newSwapServicesList = new Map(swapServices);
        setSwapServices(newSwapServicesList);
    };

    console.log(swapServices, tokenServices, coinBalanceMap, swapCoinList);

    async function equalizePrice(swapChanged: string, price: string, selectedCoin1: CoinInput, selectedCoin2: CoinInput) {
        const tradingKey1 = `${selectedCoin1.symbol.toUpperCase()}-${selectedCoin2.symbol.toUpperCase()}`;
        const tradingKey2 = `${selectedCoin2.symbol.toUpperCase()}-${selectedCoin1.symbol.toUpperCase()}`;
        let token1: {token: CoinInput, selectionOrder: number};
        let token2: {token: CoinInput, selectionOrder: number};
        let swapServiceObj = swapServices.get(tradingKey1);
        if(swapServiceObj) {
            token1 = {token: selectedCoin1, selectionOrder: 1};
            token2 = {token: selectedCoin2, selectionOrder: 2};
        } else if(swapServices.get(tradingKey2)){
            swapServiceObj = swapServices.get(tradingKey2);
            token1 = {token: selectedCoin2, selectionOrder: 2};
            token2 = {token: selectedCoin1, selectionOrder: 1};
        } else return;
        let swapService = swapServiceObj?.swapService;
        if(!swapService) return;
		switch (swapChanged) {
			case 'swap1': {
				if (selectedCoin1.symbol.includes('ICP') && selectedCoin2.symbol.includes('ICP')) {
					setTokenValue2(price.toString());
				} else {
                    setDisableForm(true);
					setToken2Loading(true);
                    const value = BigInt(parseFloat(price) * DECIMALS);
                    let coin2EqualizedValue;
                    if(token1.selectionOrder === 1){
                        coin2EqualizedValue = await swapService.getEquivalentToken2Estimate(value);
                    } else {
                        coin2EqualizedValue = await swapService.getEquivalentToken1Estimate(value);
                        console.log(coin2EqualizedValue);
                    }
                    if(!coin2EqualizedValue && coin2EqualizedValue !== BigInt(0)) return;
                    coin2EqualizedValue = parseFloat(coin2EqualizedValue.toString()) / parseFloat(DECIMALS.toString());
                    setTokenValue2(Number(coin2EqualizedValue.toString()));
				};
				break;
			}
			case 'swap2': {
				if (selectedCoin1.symbol.includes('ICP') && selectedCoin2.symbol.includes('ICP')) {
					setTokenValue1(price.toString());
				} else {
					setDisableForm(true);
					setToken1Loading(true);
                    const value = BigInt(parseFloat(price) * DECIMALS)
                    let coin1EqualizedValue;
                    if(token1.selectionOrder === 2){
                        coin1EqualizedValue = await swapService.getEquivalentToken2Estimate(value);
                    } else {
                        coin1EqualizedValue = await swapService.getEquivalentToken1Estimate(value);
                    }
                    if(!coin1EqualizedValue && coin1EqualizedValue !== BigInt(0)) return;
                    coin1EqualizedValue = parseFloat(coin1EqualizedValue.toString()) / parseFloat(DECIMALS.toString());
                    setTokenValue1(Number(coin1EqualizedValue.toString()));
				}
				break;
			}
		}
		setToken2Loading(false);
		setToken1Loading(false);
		setDisableForm(false);
	}

    const debounceEqualizedSwap1 = useRef(debounce((val, selectedCoin1, selectedCoin2) => equalizePrice('swap1', val, selectedCoin1, selectedCoin2), 500));
	const debounceEqualizedSwap2 = useRef(debounce((val, selectedCoin1, selectedCoin2) => equalizePrice('swap2', val, selectedCoin1, selectedCoin2), 500));

	function onChangeSwapAmount1(e: any) {
		const val = e.target.value;
		setTokenValue1(val);
		if (val && Number(val) > 0) {
			debounceEqualizedSwap1.current(val, selectedCoin1, selectedCoin2);
		}
	}

	function onChangeSwapAmount2(e: any) {
		const val = e.target.value;
		setTokenValue2(val);
		if (val && Number(val) > 0) {
			debounceEqualizedSwap2.current(val, selectedCoin1, selectedCoin2);
		}
	}

    function onChangeSwap1(symbol: string) {
		const selected_1 = swapCoinList.get(symbol.toUpperCase());
		let selected_2 = swapCoinList.get(selected_1.tradingPair[0]);
        if(!selected_2) selected_2 = swapCoinList.get(selected_1.tradingPair[1]);
		setSelectedCoin1(selected_1);
		setSelectedCoin2(selected_2);
		resetSwap();
	};

    function onChangeSwap2(symbol: string) {
		const selected = swapCoinList.get(symbol.toUpperCase());
		setSelectedCoin2(selected);
		resetSwap();
	};

    function setMaxCoinAddable() {
		const fixedNumber =  coinBalanceMap.get(selectedCoin1.symbol.toUpperCase())
        if(!fixedNumber) return;
        const fixedNumber_ = prettyStringToNumber(fixedNumber ?? '');
		setTokenValue1(fixedNumber_);
		equalizePrice('swap1', fixedNumber.toString(), selectedCoin1, selectedCoin2);
	}

	function setMaxWithdrawable() {
        const tradingKey1 = `${selectedCoin1.symbol.toUpperCase()}-${selectedCoin2.symbol.toUpperCase()}`;
        const tradingKey2 = `${selectedCoin2.symbol.toUpperCase()}-${selectedCoin1.symbol.toUpperCase()}`;
        let sharesObj = shares.get(tradingKey1);
        if(sharesObj){
            const {share1} = sharesObj;
            let fixedNumber;  
            if(share1) fixedNumber = Number(share1) / Number(DECIMALS);
            else fixedNumber = Number(0);
            console.log('fixed: ',fixedNumber)
            setTokenValue1(fixedNumber.toString());
            equalizePrice('swap1', fixedNumber.toString(), selectedCoin1, selectedCoin2);
        } else {
            sharesObj = shares.get(tradingKey2);
            if(sharesObj){
                const {share2} = sharesObj;
                let fixedNumber;
                if(share2) fixedNumber = Number(share2) / Number(DECIMALS);
                else fixedNumber = Number(0);
                console.log('fixed: ',fixedNumber)
                setTokenValue1(fixedNumber.toString());
                equalizePrice('swap1', fixedNumber.toString(), selectedCoin1, selectedCoin2);
            }
        }
	}

    const renderMenu1ItemsFromMap = (map: Map<any, any>) => {
		const mapAsArray = Array.from(map.entries());
		return (
			mapAsArray.map(([key, value]) => (
				<MenuItem
					onClick={() => {
						onChangeSwap1(value.symbol);
						setToken1AnchorEl(null);
					}}
					sx={{ display: 'flex', flexGrow: 1 }}
					key={value.symbol}
					value={value.symbol}>
					<CoinAvatar coinType={value.symbol} />
					<span>{value.name}</span>
				</MenuItem>
			))
		);
	};

    const renderMenu2Items = (symbols: string[]) => {
        const symbols_ = symbols.filter(symbol => symbol !== "ICP");
        return(
            symbols_.map(symbol => {
                
                const coin = swapCoinList.get(symbol.toUpperCase());
                return (coin) ?
                    <MenuItem
                        onClick={() => {
                            onChangeSwap2(coin.symbol);
                            setToken2AnchorEl(null);
                        }}
                        sx={{ display: 'flex', flexGrow: 1 }}
                        key={coin.symbol}
                        value={coin.symbol}>
                        <CoinAvatar coinType={coin.symbol} />
                        <span>{coin.name}</span>
                    </MenuItem> 
                    : null
            })
        );
    };

    const moveLiquidity = async (providingLiquidity: Boolean) => {
        setDisableForm(true);
        const symbol1 = selectedCoin1.symbol.toUpperCase();
        const symbol2 = selectedCoin2.symbol.toUpperCase();
        const tradingKey1 = `${symbol1}-${symbol2}`;
        const tradingKey2 = `${symbol2}-${symbol1}`;
        let token1Value;
        let token2Value;
        let swapServiceObj = swapServices.get(tradingKey1);
        let sharesObj = shares.get(tradingKey1);
        let token1Service: Dip20Service | undefined;
        let token2Service: Dip20Service | undefined;
        
        if(swapServiceObj){
            token1Value = tokenValue1?.toString();
            token2Value = tokenValue2?.toString();
            const token1ServiceObj = tokenServices.get(symbol1);
            const token2ServiceObj = tokenServices.get(symbol2);
            token1Service = token1ServiceObj?.service;
            token2Service = token2ServiceObj?.service;
            if(!token1Value || !token2Value) {
                console.log('1');
                setDisableForm(false);
                return;
            };
        } else {
            swapServiceObj = swapServices.get(tradingKey2);
            sharesObj = shares.get(tradingKey2);
            token1Value = tokenValue2?.toString();
            token2Value = tokenValue1?.toString();
            const token1ServiceObj = tokenServices.get(symbol2);
            const token2ServiceObj = tokenServices.get(symbol1);
            token1Service = token1ServiceObj?.service;
            token2Service = token2ServiceObj?.service;
            if(!token1Value || !token2Value) {
                console.log('2');
                setDisableForm(false);
                return;
            }
        }; 
        const swapService = swapServiceObj?.swapService;
        const swapCanisterId = swapServiceObj?.canisterId;
        if(!swapService) {
            console.log('3');
            setDisableForm(false);
            return;
        }
        const approvalValue1 = BigInt(Math.floor(parseFloat(token1Value) * DECIMALS * parseFloat('1.1')));
        const approvalValue2 = BigInt(Math.floor(parseFloat(token2Value) * DECIMALS * parseFloat('1.1')));
        token1Value = BigInt(Math.floor(parseFloat(token1Value) * DECIMALS));
        token2Value = BigInt(Math.floor(parseFloat(token2Value) * DECIMALS));
        if(!token1Service || !token2Service) {
            console.log('4');
            setDisableForm(false);
            return;
        }
        if(providingLiquidity){
            const promises = [
                token1Service.approve(Principal.fromText(swapCanisterId || ""), approvalValue1),
                token2Service.approve(Principal.fromText(swapCanisterId || ""),approvalValue2 )
            ];
            const responses = await Promise.allSettled<any>(promises);
            let result = await swapService.provide(token1Value, token2Value);
        } else {
            if(!sharesObj){
                console.log('5');
                setDisableForm(false);
                return;
            }
            const {share1, shares} = sharesObj;
            if(!share1 || !shares){
                console.log('6');
                setDisableForm(false);
                return;
            }
            const percentageToWithdraw = parseFloat(token1Value.toString()) / parseFloat(share1?.toString());
            const shareAmountToWithdraw = Math.floor(parseFloat(shares.toString()) * percentageToWithdraw);
            let result = await swapService.withdraw(BigInt(shareAmountToWithdraw));
            console.log(result);
        }
        setDisableForm(false);
    };

    const renderSharesData = useCallback(() => {
        let sharesData : any;
        const tradeKey1 = `${selectedCoin1.symbol.toUpperCase()}-${selectedCoin2.symbol.toUpperCase()}`;
        const tradeKey2 = `${selectedCoin2.symbol.toUpperCase()}-${selectedCoin1.symbol.toUpperCase()}`;
        let sharesObj = shares.get(tradeKey1);
        if(sharesObj){
            const { share1, share2 } = sharesObj;
            sharesData = {share1: share1?.toString(), share2: share2?.toString()};
        } else {
            sharesObj = shares.get(tradeKey2);
            if(sharesObj){
                const { share1, share2 } = sharesObj
                sharesData = {share1: share2?.toString(), share2: share1?.toString()};
            }
        };
        return(
            <Box sx={{ display: 'flex', flexGrow: 1, flexDirection: "row" }}>
                <Box sx={{ display: 'flex', flexGrow: 1, justifyContent: 'left' }}>
                    <List sx={{
                                width: '100%',
                                maxWidth: 360,
                                bgcolor: 'background.paper',
                                }} component="nav" aria-label="mailbox folders"
                    >
                        <ListItem>
                            <CoinAvatar coinType={selectedCoin1.symbol} />
                            <ListItemText>
                                {
                                    (sharesData?.share1 || sharesData?.share1 === 0) ? 
                                    bigIntToDecimalPrettyString(sharesData.share1): 
                                    <Loading/>
                                }
                            </ListItemText>
                        </ListItem>
                        <Divider />
                    </List>
                </Box>
                <Box sx={{ display: 'flex', flexGrow: 1, justifyContent: 'left' }}>
                    <List sx={{
                                width: '100%',
                                maxWidth: 360,
                                bgcolor: 'background.paper',
                                }} component="nav" aria-label="mailbox folders"
                    >
                        <ListItem>
                            <CoinAvatar coinType={selectedCoin2.symbol} />
                            <ListItemText>
                                {
                                    (sharesData?.share2 || sharesData?.share2 === 0) ? 
                                    bigIntToDecimalPrettyString(sharesData.share2) : 
                                    <Loading/>
                                }
                            </ListItemText>
                        </ListItem>
                        <Divider />
                    </List>
                </Box>
            </Box>
        );
    },[reFire_renderSharesData, selectedCoin1, selectedCoin2]);

    function renderAddLiquidity(){
        return(
            <Box sx={{ display: 'flex', flexGrow: 1 }}>
                <Box sx={{ display: 'flex', flexGrow: 1, justifyContent: 'center' }}>
                    <Paper elevation={3} sx={{ bgcolor: 'white', marginBottom: 2, p: 2, maxWidth: isSmallScreen ? '100%' : '600px', margin: 1, flexGrow: 1 }}>
                        <Box sx={{ display: 'flex', flexGrow: 1, flexDirection: "row" }}>
                            <Box sx={{ display: 'flex', flexGrow: 1, justifyContent: 'left' }}>
                                <Button onClick={() => navigate('/')}>Disconnect</Button>
                            </Box>
                            <Box sx={{ display: 'flex', flexGrow: 1, justifyContent: 'right' }}>
                                <Button onClick={() => navigate('/swap')}>Return to Swap</Button>
                            </Box>
                        </Box>
                        {renderSharesData()}
                        <Box sx={{ display: 'flex', flexGrow: 1, flexDirection: "row" }}>
                            <ListItem>
                                <Box sx={{ display: 'flex', flexGrow: 1 }}>
                                    <Button
                                        sx={{ minWidth: isSmallScreen ? '200px' : '300px', paddingLeft: 1, justifyContent: 'flex-start' }}
                                        variant='outlined'
                                        id='demo-positioned-button'
                                        aria-haspopup='true'
                                        disabled={disableForm}
                                        onClick={(event: React.MouseEvent<HTMLElement>) => {
                                            setToken1AnchorEl(event.currentTarget);
                                        }}>
                                        <Box sx={{ display: 'flex', flexGrow: 1, alignItems: 'center' }}>
                                            <CoinAvatar coinType={selectedCoin1.symbol} />
                                            <span>{selectedCoin1.name}</span>
                                        </Box>
                                        <ArrowDropDown />
                                    </Button>
                                    <Menu
                                        id='demo-positioned-menu'
                                        aria-labelledby='demo-positioned-button'
                                        anchorEl={token1AnchorEl}
                                        onClose={() => setToken1AnchorEl(null)}
                                        open={Boolean(token1AnchorEl)}
                                        anchorOrigin={{
                                            vertical: 'bottom',
                                            horizontal: 'right'
                                        }}
                                        transformOrigin={{
                                            vertical: 'top',
                                            horizontal: 'right'
                                        }}>
                                        {renderMenu1ItemsFromMap(swapCoinList)}
                                    </Menu>
                                </Box>
                                <Box sx={{ display: 'flex', flexGrow: 1 }}>
								    <TextField
                                        id='standard-basic'
                                        label={selectedCoin1.symbol}
                                        variant='outlined'
                                        fullWidth
                                        type='number'
                                        value={tokenValue1}
                                        error={token1Error}
                                        disabled={disableForm}
                                        onChange={onChangeSwapAmount1}
                                        InputProps={{
                                            inputMode: 'numeric',
                                            inputProps: { min: 0 },
                                            startAdornment: <>{token1Loading ? <CircularProgress /> : <></>}</>
                                        }}
                                    />
							    </Box>
                            </ListItem>
                        </Box>
                        <Box sx={{ display: 'flex', flexGrow: 1, flexDirection: "row" }}>
                            <ListItem>
                                <Box sx={{ display: 'flex', flexGrow: 1 }}>
                                    <Button
                                        sx={{ minWidth: isSmallScreen ? '200px' : '300px', paddingLeft: 1, justifyContent: 'flex-start' }}
                                        variant='outlined'
                                        id='demo-positioned-button'
                                        aria-haspopup='true'
                                        disabled={disableForm}
                                        onClick={(event: React.MouseEvent<HTMLElement>) => {
                                            setToken2AnchorEl(event.currentTarget);
                                        }}>
                                        <Box sx={{ display: 'flex', flexGrow: 1, alignItems: 'center' }}>
                                            <CoinAvatar coinType={selectedCoin2.symbol} />
                                            <span>{selectedCoin2.name}</span>
                                        </Box>
                                        <ArrowDropDown />
                                    </Button>
                                    <Menu
                                        id='demo-positioned-menu'
                                        aria-labelledby='demo-positioned-button'
                                        anchorEl={token2AnchorEl}
                                        onClose={() => setToken2AnchorEl(null)}
                                        open={Boolean(token2AnchorEl)}
                                        anchorOrigin={{
                                            vertical: 'bottom',
                                            horizontal: 'right'
                                        }}
                                        transformOrigin={{
                                            vertical: 'top',
                                            horizontal: 'right'
                                        }}>
                                        {renderMenu2Items(selectedCoin1.tradingPair)}
                                    </Menu>
                                </Box>
                                <Box sx={{ display: 'flex', flexGrow: 1 }}>
								    <TextField
                                        id='standard-basic'
                                        label={selectedCoin2.symbol}
                                        variant='outlined'
                                        fullWidth
                                        type='number'
                                        value={tokenValue2}
                                        error={token2Error}
                                        disabled={disableForm}
                                        onChange={onChangeSwapAmount2}
                                        InputProps={{
                                            inputMode: 'numeric',
                                            inputProps: { min: 0 },
                                            startAdornment: <>{token2Loading ? <CircularProgress /> : <></>}</>
                                        }}
                                    />
							    </Box>
                            </ListItem>
                        </Box>
                        <Box sx={{ display: 'flex', flexGrow: 1, flexDirection: "row" }}>
                            <ListItem>
                                <Box sx={{ display: 'flex', flexGrow: 1, justifyContent: 'left' }}>
                                    <Button sx={{ width: '100%' }} disabled={disableForm} variant='contained' onClick={setMaxWithdrawable} size='large' color='secondary'>
                                        Max Withdraw-able
                                    </Button>
                                </Box>
                            </ListItem>
                            <ListItem>
                                <Box sx={{ display: 'flex', flexGrow: 1, justifyContent: 'right' }}>
                                    <Button sx={{ width: '100%' }} disabled={disableForm} variant='contained' onClick={setMaxCoinAddable} size='large' color='secondary'>
                                        Max Add-able
                                    </Button>
                                </Box>
                            </ListItem>
                        </Box>
                        <ListItem>
							<Collapse in={withdrawButtonLoading || addLiquidityButtonLoading}>
								<Alert severity='warning'>Do not refresh or leave window, this transaction can take over 3 minute</Alert>
							</Collapse>
						</ListItem>
                        <Box sx={{ display: 'flex', flexGrow: 1, flexDirection: "row" }}>
                            <ListItem>
                                <LoadingButton loading={withdrawButtonLoading} onClick={() => moveLiquidity(false)} fullWidth disabled={ disableForm} variant='contained'>
                                    Withdraw
                                </LoadingButton>
                            </ListItem>
                            <ListItem>
                                <LoadingButton loading={addLiquidityButtonLoading} onClick={() => moveLiquidity(true)} fullWidth disabled={ disableForm} variant='contained'>
                                    Add Liquidity
                                </LoadingButton>
                            </ListItem>
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