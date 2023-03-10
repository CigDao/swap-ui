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
import React, { useEffect, useState, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { CoinAvatar } from '@components/CoinAvatar/CoinAvatar';
import LogoWrapper from '@components/LogoWrapper/LogoWrapper';
import coins, { CoinInput, CoinInputWithServices, CoinInput_Serializable } from '@utils/coins';
import { IConnector } from '@connect2ic/core';
import { getProviders, ycWicpSwapCanisterId, wicpCanisterId, mlpSwapCanisterId } from '@utils/icUtils';
import { AccountIdentifier, SubAccount } from '@dfinity/nns';
import { Principal } from '@dfinity/principal';
import { bigIntToDecimal, bigIntToDecimalPrettyString, DECIMALS } from '@utils/decimalutils';
import LoadingButton from '@mui/lab/LoadingButton';
import Loading from '@components/Loading/Loading';
import { _SERVICE as Dip20Service, idlFactory as dip20Factory } from "../../declarations/dip20/dip20.did";
import ImportExportIcon from '@mui/icons-material/ImportExport';
import ImportExportRoundedIcon from '@mui/icons-material/ImportExportRounded';
import { getMlpAmmMetaData, getYcWicpAmmMetaData, priceOfIcp } from '@utils/httputils';
import debounce from 'lodash.debounce';
import SettingsIcon from '@mui/icons-material/Settings';
import bigDecimal from 'js-big-decimal';
import { TxReceipt } from 'src/declarations/dip20/dip20.did';
import { theme } from '@misc/theme';
import { _SERVICE as SwapService } from 'src/declarations/swap/swap.did';
import { ArrowDropDown } from '@mui/icons-material';
import NavBar from '@components/NavBar/NavBar';
import IcUtils, {updateICPBalance, } from '@utils/icUtils';
import { YC_CONTRACT } from 'src/declarations/yourcoin/yourcoin.did';

interface IAlert {
	show: boolean;
	type: 'success' | 'error' | 'info';
	message: string;
}

export default function Swap({provider}: any) {
	const formatter = new Intl.NumberFormat('en-US', {
		style: 'currency',
		currency: 'USD',
	  
		// These options are needed to round to whole numbers if that's what you want.
		//minimumFractionDigits: 0, // (this suffices for whole numbers, but will print 2500.10 as $2,500.1)
		//maximumFractionDigits: 0, // (causes 2500.99 to be printed as $2,501)
	  });

	const location = useLocation();
	const navigate = useNavigate();
	const isSmallScreen = useMediaQuery(theme.breakpoints.down('md'));

	const [selectedCoin1, setSelectedCoin1] = useState<CoinInput>(coins.ICP);
	const [selectedCoin2, setSelectedCoin2] = useState<CoinInput>(coins.WICP);
	const [coinBalanceMap, setCoinBalanceMap] = useState<Map<string, string>>(new Map());
	const [icpProvider] = useState<IConnector>(getProviders(provider));
	const [slippageError, setSlippageError] = useState(false);
	const [swap1Error, setSwap1Error] = useState(false);
	const [swap2Error, setSwap2Error] = useState(false);
	const [swapButtonLoading, setSwapButtonLoading] = useState(false);
	const [swapValue1, setSwapValue1] = useState<string | undefined | number>('0');
	const [swapValue2, setSwapValue2] = useState<string | undefined | number>('0');
	const [wicpFailed, setWicpFailed] = useState<boolean>(false);
	const [swapServices, setSwapServices] = useState<Map<string, {canisterId: string, swapService: SwapService}>>(new Map());
	const [tokenServices, setTokenServices] = useState<Map<string, {canisterId?: string, service?: Dip20Service}>>(new Map());
	const [appLoading, setAppLoading] = useState(true);
	const [swapCoinList, setSwapCoinList] = useState(new Map());
	const [swap1Loading, setSwap1Loading] = useState(false);
	const [swap2Loading, setSwap2Loading] = useState(false);
	const [disableForm, setDisableForm] = useState(false);
	const [showSlippage, setShowSlippage] = useState(false);
	const [switchToggled, setSwitchToggled] = useState(false);
	const [disableSwapButton, setDisableSwapButton] = useState(false);
	const [slippageValue, setSlippageValue] = useState(1);
	const [priceOfYC, setPriceOfYC] = useState<string>('0');
	const [priceOfWICP, setPriceOfWICP] = useState<string>('0');
	const [icpBalance, setIcpBalance] = useState<string>('0');
	const [marketCap, setMarketCap] = useState<string>('0');

	const [tvl, setTvl] = useState<string>('0');

	const [swapButtonText, setSwapButtonText] = useState<'SWAP' | 'MINT' | 'UNWRAP'>('MINT');
	const [alertValue, setAlertValue] = useState<IAlert>({
		show: false,
		type: 'success',
		message: ''
	});
	const [swap1AnchorEl, setSwap1AnchorEl] = React.useState<null | HTMLElement>(null);
	const [swap2AnchorEl, setSwap2AnchorEl] = React.useState<null | HTMLElement>(null);
	const icUtils = new IcUtils();
	
	useEffect(() => {
		setAppLoading(true);
		init().then(() => {
			setAppLoading(false);
			calcMarketcap().then();
		});
	}, []);
	
	async function updateWICPBalance(icpProvider: IConnector, balanceMap: Map<string, string>) {
		const wICP = await icUtils.wicpCanister(icpProvider);
		const wicpBalance = await wICP.balanceOf(Principal.fromText(icpProvider.principal ?? ''));
		balanceMap.set(coins.WICP.symbol, bigIntToDecimalPrettyString(wicpBalance));
		return balanceMap;
	}
	//Adds a generic Dip20 token to the balance map
	async function updateDip20Balance(dip20CanisterId: string, icpProvider: IConnector, balanceMap: Map<string, string>) {
		const dip20 = await icUtils.dip20Canister(dip20CanisterId, icpProvider);
		const metadata = await dip20.getMetadata();
		const balance = await dip20.balanceOf(Principal.fromText(icpProvider.principal ?? ''));
		const swapServices = new Map();
		const swapCanisterIds = new Map();
		let swapService;
		let swapServiceCanisterId;
		if(metadata.symbol === "YC" || metadata.symbol === "WICP") {
			swapService = await icUtils.ycWicpSwapCanister(icpProvider);
			swapServiceCanisterId = ycWicpSwapCanisterId;
		};
		if(metadata.symbol === "YC") {
			swapCanisterIds.set("WICP",swapServiceCanisterId);
			swapServices.set("WICP", swapService);
		};
		if(metadata.symbol === "WICP") {
			swapCanisterIds.set("YC",swapServiceCanisterId);
			swapServices.set("YC", swapService);
		}
		balanceMap.set(metadata.symbol, bigIntToDecimalPrettyString(balance));
		
		return {
			name: metadata.name,
			symbol: metadata.symbol,
			tradingPair: [],
			service: dip20,
			swapServices,
			swapCanisterIds,
			canisterId: dip20CanisterId
		};
	}

	async function calcMarketcap() {
		const wicpContract = await icUtils.wicpCanister(icpProvider);
		const ycContract = await icUtils.dip20Canister(YC_CONTRACT, icpProvider);
		const totalToken1 = await ycContract.balanceOf(Principal.fromText(ycWicpSwapCanisterId));
		const totalToken2 = await wicpContract.balanceOf(Principal.fromText(ycWicpSwapCanisterId));
		const priceIC = getSwapTokenEstimate('1', totalToken1.toString(), totalToken2.toString());
		const totalSupply = await ycContract.totalSupply();
		const usdPrice = await priceOfIcp();
		const marketCap = bigIntToDecimal(priceIC).multiply(bigIntToDecimal(totalSupply)).multiply(new bigDecimal(usdPrice)).round(2).getValue();
		
		setMarketCap(formatter.format(Number(marketCap)));

	}

	async function init() {
		if (!icpProvider) {
			navigate('/');
			return;
		}

		await icpProvider.init();
		const connected = await icpProvider.isConnected();
		if (!connected) {
			navigate('/');
			return;
		}

		let balanceMap = new Map<string, string>();
		if (icpProvider.principal) {

			//Adding default Coins to the swapCoinList map;
			coins.coinList.forEach((coin: CoinInput) => {
				const {symbol} = coin;
				swapCoinList.set(symbol, coin);
			});
			
			//gathering async requests to be called simultaneously;
			const coinRequests: any = [
				getPriceOfYc(), 
				updateICPBalance(icpProvider, balanceMap, setIcpBalance, icUtils), 
				updateWICPBalance(icpProvider, balanceMap)];

			const dips_yc_wicp = await getYcWicpAmmMetaData();
			[dips_yc_wicp.token1, dips_yc_wicp.token2].forEach(canisterId => {
				coinRequests.push(updateDip20Balance(canisterId, icpProvider, balanceMap));
			});

			const dips_yc_mlpToken = await getMlpAmmMetaData();
			[dips_yc_mlpToken.token1, dips_yc_mlpToken.token2].forEach(canisterId => {
				coinRequests.push(updateDip20Balance(canisterId, icpProvider, balanceMap));
			});

			const response = await Promise.allSettled<any>(coinRequests);
			setCoinBalanceMap(balanceMap);

			//populating swapCoinsList and tradingPairs Maps
			for(let i = 3; i < response.length; i+=2){
				let token1Promise: any = response[i];
				let token2Promise: any = response[i+1];
				let newToken1: CoinInputWithServices = token1Promise.value;
				let newToken2: CoinInputWithServices = token2Promise.value;
				let traidngPairKey = `${newToken1.symbol}-${newToken2.symbol}`;
				traidngPairKey = traidngPairKey.toUpperCase();
				let existingCoin1: CoinInput = swapCoinList.get(newToken1.symbol);
				let existingCoin2: CoinInput = swapCoinList.get(newToken2.symbol);
				//populating tokenServices map
				if(newToken1.canisterId){
					const serviceObj = tokenServices.get(newToken1.symbol.toUpperCase());
					if(serviceObj)tokenServices.set(newToken1.symbol.toUpperCase(), {...serviceObj, canisterId: newToken1.canisterId})
					else tokenServices.set(newToken1.symbol.toUpperCase(), {canisterId: newToken1.canisterId});
				}
				if(newToken1.service){
					const serviceObj = tokenServices.get(newToken1.symbol.toUpperCase());
					if(serviceObj) tokenServices.set(newToken1.symbol.toUpperCase(), {...serviceObj, service: newToken1.service});
					else tokenServices.set(newToken1.symbol.toUpperCase(), {service: newToken1.service});
				}
				if(newToken2.canisterId){
					const serviceObj = tokenServices.get(newToken2.symbol.toUpperCase());
					if(serviceObj) tokenServices.set(newToken2.symbol.toUpperCase(), { ...serviceObj, canisterId: newToken2.canisterId});
					else tokenServices.set(newToken2.symbol.toUpperCase(), {canisterId: newToken2.canisterId});
				}
				if(newToken2.service){
					const serviceObj = tokenServices.get(newToken2.symbol.toUpperCase());
					if(serviceObj) tokenServices.set(newToken2.symbol.toUpperCase(), {...serviceObj, service: newToken2.service});
					else tokenServices.set(newToken2.symbol.toUpperCase(), {service: newToken2.service});
				}
				//populating SwapCoinList map
				if(existingCoin1) {
					const tradingPairIsAlreadyPresent = existingCoin1.tradingPair.find(pair => pair === traidngPairKey);
					if(!tradingPairIsAlreadyPresent) existingCoin1.tradingPair.push(newToken2.symbol.toLocaleUpperCase());
				} else {
					newToken1.tradingPair.push(newToken2.symbol.toLocaleUpperCase());
					const newToken_1 : CoinInput = {
						name: newToken1.name,
						symbol: newToken1.symbol,
						tradingPair: newToken1.tradingPair,
						canisterId: newToken1.canisterId,
						swapCanisterIds: newToken1.swapCanisterIds
					};
					swapCoinList.set(newToken1.symbol.toUpperCase(), newToken_1);
				}
				if(existingCoin2) {
					const tradingPairIsAlreadyPresent = existingCoin2.tradingPair.find(pair => pair === traidngPairKey);
					if(!tradingPairIsAlreadyPresent) existingCoin2.tradingPair.push(newToken1.symbol.toLocaleUpperCase());
				} else {
					newToken2.tradingPair.push(newToken1.symbol.toLocaleUpperCase());
					const newToken_2 : CoinInput = {
						name: newToken2.name,
						symbol: newToken2.symbol,
						tradingPair: newToken2.tradingPair,
						canisterId: newToken2.canisterId,
						swapCanisterIds: newToken2.swapCanisterIds
					};
					swapCoinList.set(newToken2.symbol.toUpperCase(), newToken_2);
				};
				//Populating swapServices map
				if(traidngPairKey === "YC-WICP"){
					const swapService = await icUtils.ycWicpSwapCanister(icpProvider);
					const canisterId = ycWicpSwapCanisterId;
					swapServices.set(traidngPairKey,{ swapService, canisterId});
				} else if(traidngPairKey.toUpperCase() === `${coins.MLP.symbol}-YC`){
					console.log(traidngPairKey.toUpperCase());
					const swapService = await icUtils.ycMlpTokenSwapCanister(icpProvider);
					const canisterId = mlpSwapCanisterId;
					console.log(traidngPairKey);
					swapServices.set(traidngPairKey,{ swapService, canisterId});
				};
			};
		}
	};

	async function transferICPToWICP(amount: bigint) {
		if (icpProvider && icpProvider.principal) {
			const ledger = await icUtils.ledgerCanister(icpProvider);
			const identifier = AccountIdentifier.fromPrincipal({
				principal: Principal.fromText(wicpCanisterId),
				subAccount: SubAccount.ZERO
			}).toNumbers();
			let result = await ledger.transfer({
				amount: { e8s: amount },
				memo: BigInt(0),
				fee: { e8s: BigInt(10000) },
				from_subaccount: [],
				created_at_time: [],
				to: identifier
			});
			if ('Ok' in result) {
				await mintWICP(result.Ok, amount);
			}
		}
	}

	async function mintWICP(blockIndex: any, amount: bigint) {
		const wicpCanister = await icUtils.wicpCanister(icpProvider);
		let mintSuccessfull = await wicpCanister.mint([], blockIndex);

		if (!('Ok' in mintSuccessfull)) {
			setAlertValue({
				show: true,
				type: 'info',
				message: `Swap failed, trying again`
			});
			let mintAgain = await wicpCanister.mint([], blockIndex);
			if (!('Ok' in mintAgain)) {
				setWicpFailed(true);
				setAlertValue({
					show: true,
					type: 'error',
					message: `Swap failed ${Object.keys(mintAgain.Err)}`
				});
			}
			return;
		}
		let balanceMap = coinBalanceMap;
		balanceMap = await updateICPBalance(icpProvider, balanceMap, setIcpBalance, icUtils);
		balanceMap = await updateWICPBalance(icpProvider, balanceMap);
		setCoinBalanceMap(balanceMap);
		setAlertValue({
			show: true,
			type: 'success',
			message: `Succesfully swapped ${bigIntToDecimalPrettyString(amount)} ${selectedCoin1.symbol} for ${bigIntToDecimalPrettyString(amount)} ${selectedCoin2.symbol}`
		});
		setTimeout(() => {
			alertValue.show = false;
			setAlertValue(alertValue);
		}, 6000);
	}

	async function withdrawICP(amount: bigint) {
		const identifier = AccountIdentifier.fromPrincipal({
			principal: Principal.fromText(icpProvider.principal ?? ''),
			subAccount: SubAccount.ZERO
		}).toHex();
		const wicpCanister = await icUtils.wicpCanister(icpProvider);
		const withResp: TxReceipt = await wicpCanister.withdraw(amount, identifier);
		if ('Ok' in withResp) {
			let balanceMap = coinBalanceMap;
			balanceMap = await updateICPBalance(icpProvider, balanceMap, setIcpBalance, icUtils);
			balanceMap = await updateWICPBalance(icpProvider, balanceMap);
			setCoinBalanceMap(balanceMap);
			setAlertValue({
				show: true,
				type: 'success',
				message: `Succesfully swapped ${bigIntToDecimalPrettyString(amount)} ${selectedCoin1.symbol} for ${bigIntToDecimalPrettyString(amount)} ${selectedCoin2.symbol}`
			});
		} else {
			console.log(withResp);
			setAlertValue({
				show: true,
				type: 'error',
				message: `Error swapping ${Object.keys(withResp.Err)}`
			});
		}

		setTimeout(() => {
			alertValue.show = false;
			setAlertValue(alertValue);
		}, 6000);
	}

	function onSlippageSet(e: any) {
		const val = e.target.value;
		if (val > 100) {
			setSlippageError(true);
		} else if (val < 0.01) {
			setSlippageError(true);
		} else {
			setSlippageError(false);
		}
		setSlippageValue(val);
	}

	function onChangeSwap1(symbol: string) {
		const selected_1 = swapCoinList.get(symbol.toUpperCase());
		const selected_2 = swapCoinList.get(selected_1.tradingPair[0]);
		setSelectedCoin1(selected_1);
		setSelectedCoin2(selected_2);
		resetSwap();
	}

	function updateLabel(symbol: string, secondSymbol: string) {
		if (symbol === 'ICP') {
			setSwapButtonText('MINT');
		} else if (symbol === 'WICP' && secondSymbol === 'ICP') {
			setSwapButtonText('UNWRAP');
		} else {
			setSwapButtonText('SWAP');
		}
	}

	function onChangeSwap2(symbol: string) {
		const selected = swapCoinList.get(symbol.toUpperCase());
		setSelectedCoin2(selected);
		resetSwap();
	}

	const debounceEqualizedSwap1 = useRef(debounce((val, selectedCoin1, selectedCoin2) => equalizePrice('swap1', val, selectedCoin1, selectedCoin2), 500));
	const debounceEqualizedSwap2 = useRef(debounce((val, selectedCoin1, selectedCoin2) => equalizePrice('swap2', val, selectedCoin1, selectedCoin2), 500));

	function onChangeSwapAmount1(e: any) {
		const val = e.target.value;
		setSwapValue1(val);
		if (val && Number(val) > 0) {
			console.log(val);
			debounceEqualizedSwap1.current(val, selectedCoin1, selectedCoin2);
		}
	}

	function onChangeSwapAmount2(e: any) {
		const val = e.target.value;
		setSwapValue2(val);
		if (val && Number(val) > 0) {
			debounceEqualizedSwap2.current(val, selectedCoin1, selectedCoin2);
		}
	}

	useEffect(() => {
		validateInputs();
		updateLabel(selectedCoin1.symbol, selectedCoin2.symbol);
	}, [swapValue2, swapValue1, switchToggled]);

	function validateInputs() {
		if (!swapValue2 || !isValidNumber(swapValue2?.toString())) {
			setSwap2Error(true);
		} else {
			setSwap2Error(false);
		}
		if (!swapValue1 || !isValidNumber(swapValue1?.toString())) {
			setSwap1Error(true);
		} else {
			setSwap1Error(false);
		}
		if (!swapValue1 || swapValueInvalid(swapValue1.toString(), selectedCoin1)) {
			setSwap1Error(true);
		} else {
			setSwap1Error(false);
		}
	}

	function swapValueInvalid(swapval: string, selectedCoin: CoinInput) {
		const swapValNum = Number(swapval);
		const maxValNum = Number(new bigDecimal(coinBalanceMap.get(selectedCoin.symbol)?.replaceAll(',', '')).round(8).getValue());
		return swapValNum > maxValNum;
	}

	function isValidNumber(str: string) {
		const regExp = /^(\d+(\.\d{1,8})?)$/;
		return regExp.test(str);
	}

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
					setSwapValue2(price.toString());
				} else {
                    setDisableForm(true);
					setSwap2Loading(true);
                    const value = BigInt(parseFloat(price) * DECIMALS);
                    let coin2EqualizedValue;
                    if(token1.selectionOrder === 1){
                        coin2EqualizedValue = await swapService.getEquivalentToken2Estimate(value);
                    } else {
						console.log(value);
                        coin2EqualizedValue = await swapService.getEquivalentToken1Estimate(value);
                        console.log('equalizedValue: ',coin2EqualizedValue);
                    }
                    if(!coin2EqualizedValue && coin2EqualizedValue !== BigInt(0)) return;
                    coin2EqualizedValue = parseFloat(coin2EqualizedValue.toString()) / parseFloat(DECIMALS.toString());
                    setSwapValue2(Number(coin2EqualizedValue.toString()));
				};
				break;
			}
			case 'swap2': {
				if (selectedCoin1.symbol.includes('ICP') && selectedCoin2.symbol.includes('ICP')) {
					setSwapValue1(price.toString());
				} else {
					setDisableForm(true);
					setSwap1Loading(true);
                    const value = BigInt(parseFloat(price) * DECIMALS)
                    let coin1EqualizedValue;
                    if(token1.selectionOrder === 2){
                        coin1EqualizedValue = await swapService.getEquivalentToken2Estimate(value);
                    } else {
                        coin1EqualizedValue = await swapService.getEquivalentToken1Estimate(value);
                    }
                    if(!coin1EqualizedValue && coin1EqualizedValue !== BigInt(0)) return;
                    coin1EqualizedValue = parseFloat(coin1EqualizedValue.toString()) / parseFloat(DECIMALS.toString());
                    setSwapValue1(Number(coin1EqualizedValue.toString()));
				}
				break;
			}
		}
		setSwap2Loading(false);
		setSwap1Loading(false);
		setDisableForm(false);
	}

	// function equalizePrice(swapChanged: string, price: string, selectedCoin1: CoinInput, selectedCoin2: CoinInput) {
	// 	switch (swapChanged) {
	// 		case 'swap1': {
	// 			if (selectedCoin1.symbol.includes('ICP') && selectedCoin2.symbol.includes('ICP')) {
	// 				setSwapValue2(price.toString());
	// 			} else {
	// 				setDisableForm(true);
	// 				setSwap2Loading(true);
	// 				equalizeCoinGivenCoin(price, selectedCoin1, selectedCoin2, setSwapValue2).then();
	// 			}
	// 			break;
	// 		}
	// 		case 'swap2': {
	// 			if (selectedCoin1.symbol.includes('ICP') && selectedCoin2.symbol.includes('ICP')) {
	// 				setSwapValue1(price.toString());
	// 			} else {
	// 				setDisableForm(true);
	// 				setSwap1Loading(true);
	// 				equalizeCoinGivenCoin(price, selectedCoin2, selectedCoin1, setSwapValue1).then();
	// 			}
	// 			break;
	// 		}
	// 	}
	// }

	// async function equalizeCoinGivenCoin(tokensOfcoin1: string, coinToTrade: CoinInput, coinToCompare: CoinInput, setSwapFunc: any) {
	// 	const coinToTradeServiceObj = tokenServices.get(coinToTrade.symbol.toUpperCase());
	// 	const coinToCompareServiceObj = tokenServices.get(coinToCompare.symbol.toUpperCase());
	// 	if(!coinToTradeServiceObj || !coinToCompareServiceObj) return;
	// 	const response = (await Promise.allSettled<any>([
	// 		coinToTradeServiceObj.service?.balanceOf(Principal.fromText(ycWicpSwapCanisterId)),
	// 		coinToCompareServiceObj.service?.balanceOf(Principal.fromText(ycWicpSwapCanisterId))
	// 	])) as any;
	// 	const displayPrice = getSwapTokenEstimate(tokensOfcoin1, response[0].value, response[1].value);
	// 	setSwapFunc(bigIntToDecimal(displayPrice).getValue());
	// 	setSwap2Loading(false);
	// 	setSwap1Loading(false);
	// 	setDisableForm(false);
	// }
	// populates TVL, Market, YC to ICP conversion and ICP to YC conversion
	async function getPriceOfYc() {
		const wicpContract = await icUtils.wicpCanister(icpProvider);
		const ycContract = await icUtils.dip20Canister(YC_CONTRACT, icpProvider);
		const totalToken1 = await ycContract.balanceOf(Principal.fromText(ycWicpSwapCanisterId));
		const totalToken2 = await wicpContract.balanceOf(Principal.fromText(ycWicpSwapCanisterId));
		const priceYC = getSwapTokenEstimate('1', totalToken2.toString(), totalToken1.toString());
		const priceIC = getSwapTokenEstimate('1', totalToken1.toString(), totalToken2.toString());
		setPriceOfYC(bigIntToDecimal(priceYC).round(3).getPrettyValue(3, ","));
		setPriceOfWICP(bigIntToDecimalPrettyString(priceIC));
		const division = bigIntToDecimal(priceIC).multiply(bigIntToDecimal(totalToken1));
		const usdPrice = await priceOfIcp();
		const tvl = bigIntToDecimal(totalToken2).add(division).multiply(new bigDecimal(usdPrice)).round(2).getValue();
		setTvl(formatter.format(Number(tvl)));
	}

	function getSwapTokenEstimate(amountToken1: string, totalToken1: string, totalToken2: string) {
		const amountOfTokenBigInt = BigInt(Math.round(Number(amountToken1) * DECIMALS));
		const totalToken1Balance = BigInt(totalToken1);
		const totalToken2Balance = BigInt(totalToken2);

		let price = totalToken1Balance * totalToken2Balance;

		let token1After = totalToken1Balance + amountOfTokenBigInt;
		let token2After = price / token1After;

		var amountToken2 = totalToken2Balance - token2After;
		return amountToken2;
	}

	function resetSwap() {
		setSwapValue1(0);
		setSwapValue2(0);
	}

	function setMaxCoin1() {
		const fixedNumber = coinBalanceMap.get(selectedCoin1.symbol)?.replaceAll(',', '');
		setSwapValue1(fixedNumber);
		equalizePrice('swap1', fixedNumber ?? '', selectedCoin1, selectedCoin2);
	}

	function setMaxCoin2() {
		const fixedNumber = coinBalanceMap.get(selectedCoin2.symbol)?.replaceAll(',', '');
		setSwapValue2(fixedNumber);
		equalizePrice('swap2', fixedNumber ?? '', selectedCoin1, selectedCoin2);
	}

	function swap() {
		if (swapValue1 === '0') {
			return;
		}
		setSwapButtonLoading(true);
		setDisableForm(true);
		const finishSwap = () => {
			setSwapButtonLoading(false);
			resetSwap();
			setDisableForm(false);
		};
		if(!swapValue1) return;
		if (selectedCoin1.symbol.includes('ICP') && selectedCoin2.symbol.includes('WICP')) {
			transferICPToWICP(BigInt(parseFloat(swapValue1.toString()) * DECIMALS)).then(finishSwap);
		} else if (selectedCoin1.symbol.includes('WICP') && selectedCoin2.symbol.includes('ICP')) {
			withdrawICP(BigInt(parseFloat(swapValue1.toString()) * DECIMALS)).then(finishSwap);
		} else {
			if (swapValue1) swapToken(BigInt(parseFloat(swapValue1?.toString()) * DECIMALS)).then(finishSwap);
		}
	}

	async function swapToken(amount: bigint) {
		try {
			const ammMetadata = await getYcWicpAmmMetaData();
			const tradingPairKey1 = `${selectedCoin1.symbol.toUpperCase()}-${selectedCoin2.symbol.toUpperCase()}`;
			const tradingPairKey2 = `${selectedCoin2.symbol.toUpperCase()}-${selectedCoin1.symbol.toUpperCase()}`;
			let swapService = swapServices.get(tradingPairKey1);
			if(!swapService) swapService = swapServices.get(tradingPairKey2);
			if(!swapService) return;
			const swapCanisterId = swapService.canisterId;
			const selectedCoin1ServiceObj = tokenServices.get(selectedCoin1.symbol);
			const selectedCoin2ServiceObj = tokenServices.get(selectedCoin2.symbol);
			let swapServiceObj = swapServices.get(tradingPairKey1);
			if(!swapServiceObj) swapServiceObj = swapServices.get(tradingPairKey2);
			if(!swapServiceObj) throw('swapService not defined');
			if(!selectedCoin1ServiceObj) throw('selectedCoin1ServiceObj not defined');
			if(!selectedCoin2ServiceObj) throw('selectedCoin2ServiceObj not defined');
			await selectedCoin1ServiceObj.service?.approve(Principal.fromText(swapCanisterId || ""), amount);
			const swapValueDecimal2 = new bigDecimal(swapValue2).getValue().replace('.', '');
			const slipCalced = calcSlippage(slippageValue.toString(), swapValueDecimal2);
			const swapCanister = swapServiceObj.swapService;
			if(!swapCanister){
				throw("swap canister missing");
			}
			const doSwap = ammMetadata.token1 === selectedCoin1.canisterId ? await swapCanister.swapToken1(amount, BigInt(slipCalced)) : await swapCanister.swapToken2(amount, BigInt(slipCalced));
			const prince = icpProvider.principal;
			const coin1Balance = await selectedCoin1ServiceObj.service?.balanceOf(Principal.fromText(prince ?? ''));
			const coin2Balance = await selectedCoin2ServiceObj.service?.balanceOf(Principal.fromText(prince ?? ''));
			coinBalanceMap.set(selectedCoin1.symbol, bigIntToDecimalPrettyString(coin1Balance));
			coinBalanceMap.set(selectedCoin2.symbol, bigIntToDecimalPrettyString(coin2Balance));
			setCoinBalanceMap(coinBalanceMap);
			calcMarketcap().then();
			if (doSwap && 'Ok' in doSwap) {
				setAlertValue({
					show: true,
					type: 'success',
					message: `Succesfully swapped ${bigIntToDecimalPrettyString(amount)} ${selectedCoin1.symbol} for ${bigIntToDecimalPrettyString(doSwap.Ok)} ${selectedCoin2.symbol}`
				});
			} else {
				console.error(doSwap);
				setAlertValue({
					show: true,
					type: 'error',
					message: `Error ${Object.keys(doSwap?.Err)}`
				});
			}
		} catch (e) {
			console.error(e);
			setAlertValue({
				show: true,
				type: 'error',
				message: `Error ${JSON.stringify(e)}`
			});
		}

		setTimeout(() => {
			alertValue.show = false;
			setAlertValue(alertValue);
		}, 6000);
	}

	const stripServicesFromTokenServices = (tokenServices: Map<any, any>) => {
		const newTokenServices = new Map();
		tokenServices.forEach((tokenServiceObj, key) => {
			let newTokenServiceObj = {canisterId: tokenServiceObj.canisterId};
			newTokenServices.set(key,newTokenServiceObj);
		});
		return newTokenServices;
	};

	function calcSlippage(partialValue: string, totalValue: string) {
		const slippageVal = new bigDecimal(partialValue);
		const swap2Val = bigIntToDecimal(totalValue);
		const oneHundred = new bigDecimal(100);
		const devidebyOnHundo = slippageVal.divide(oneHundred, 8);
		const multipliedBySwap2 = devidebyOnHundo.multiply(swap2Val).round(8);
		return swap2Val.subtract(multipliedBySwap2).getValue().replace('.', '');
	}

	function switchSwaps() {
		setSelectedCoin1(selectedCoin2);
		setSelectedCoin2(selectedCoin1);
		setSwapValue1(swapValue2);
		setSwapValue2(swapValue1);
		setSwitchToggled(!switchToggled);
	};

	const renderMenuItemsFromMap = (map: Map<any, any>) => {
		const mapAsArray = Array.from(map.entries());
		return (
			mapAsArray.map(([key, value]) => (
				<MenuItem
					onClick={() => {
						onChangeSwap1(value.symbol);
						setSwap1AnchorEl(null);
					}}
					sx={{ display: 'flex', flexGrow: 1 }}
					key={value.symbol}
					value={value.symbol}>
					<CoinAvatar coinType={value.symbol} />
					<span>{value.name}</span>
				</MenuItem>
			))
		);
	}

	function renderSwap() {
		return (
			<Box sx={{ display: 'flex', flexGrow: 1 }}>
				<Box sx={{ display: 'flex', flexGrow: 1, justifyContent: 'center' }}>
					<Paper elevation={3} sx={{ bgcolor: 'white', marginBottom: 2, p: 2, maxWidth: isSmallScreen ? '100%' : '600px', margin: 1, flexGrow: 1 }}>
						<Box sx={{ display: 'flex', flexGrow: 1, flexDirection: "row" }}>
							<Box sx={{ display: 'flex', flexGrow: 1, justifyContent: 'left' }}>
								<Button onClick={() => navigate('/')}>Disconnect</Button>
							</Box>
							<Box sx={{ display: 'flex', flexGrow: 1, justifyContent: 'right' }}>
								<Button onClick={() => {
									const tokenServices_serializable = stripServicesFromTokenServices(tokenServices);
										navigate(
											'/liquidity', 
											{ 
												replace: false, 
												state: {
													coinBalanceMap: coinBalanceMap, 
													swapCoinList: swapCoinList,
													tokenServices: tokenServices_serializable
												} 
											}
										);
									}}>Add Liquidity</Button>
							</Box>
						</Box>
						<Box sx={{ display: 'flex', flexGrow: 1, flexDirection: "row" }}>
							<Box sx={{ display: 'flex', flexGrow: 1, justifyContent: 'left' }}>
								<List sx={{
											width: '100%',
											maxWidth: 360,
											bgcolor: 'background.paper',
											}} component="nav" aria-label="mailbox folders">
									<ListItem>
										<ListItemText>
											1 YC = {priceOfWICP} ICP
										</ListItemText>
									</ListItem>
									<Divider />
									<ListItem >
										<ListItemText>
											1 ICP = {priceOfYC} YC
										</ListItemText>
									</ListItem>
								</List>
							</Box>
							<Box sx={{ display: 'flex', flexGrow: 1, justifyContent: 'left' }}>
								<List sx={{
											width: '100%',
											maxWidth: 360,
											bgcolor: 'background.paper',
											}} component="nav" aria-label="mailbox folders">
														
									<ListItem>
										<ListItemText> 
											Fully Diluted Valuation: {marketCap}
										</ListItemText>
									</ListItem>
									<Divider />
									<ListItem>
										<ListItemText> 
											Total Value Locked: {tvl}
										</ListItemText>
									</ListItem>
								</List>
							</Box>
						</Box>
						<Box sx={{ display: 'flex', flexGrow: 1, justifyContent: 'right' }}>
							<Button onClick={() => setShowSlippage(!showSlippage)} variant='text' size='small'>
								<SettingsIcon />
							</Button>
							<Box sx={{ display: showSlippage ? { xs: 'block' } : { xs: 'none' }, justifyContent: 'right' }}>
								<TextField
									id='standard-basic'
									label='Slippage'
									variant='outlined'
									type='number'
									error={slippageError}
									onChange={onSlippageSet}
									value={slippageValue}
									InputProps={{
										inputMode: 'numeric',
										inputProps: { min: 0, max: 100 },
										startAdornment: <InputAdornment position='start'>%</InputAdornment>
									}}
								/>
							</Box>
						</Box>

						<ListItem>
							<Box sx={{ display: 'flex', flexGrow: 1 }}>
								<Button
									sx={{ minWidth: isSmallScreen ? '200px' : '300px', paddingLeft: 1, justifyContent: 'flex-start' }}
									variant='outlined'
									id='demo-positioned-button'
									aria-haspopup='true'
									disabled={disableForm}
									onClick={(event: React.MouseEvent<HTMLElement>) => {
										setSwap1AnchorEl(event.currentTarget);
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
									anchorEl={swap1AnchorEl}
									onClose={() => setSwap1AnchorEl(null)}
									open={Boolean(swap1AnchorEl)}
									anchorOrigin={{
										vertical: 'bottom',
										horizontal: 'right'
									}}
									transformOrigin={{
										vertical: 'top',
										horizontal: 'right'
									}}>
									{renderMenuItemsFromMap(swapCoinList)}
								</Menu>
							</Box>
							<Box sx={{ display: 'flex', flexGrow: 1 }}>
								<TextField
									id='standard-basic'
									label={selectedCoin1.symbol}
									variant='outlined'
									fullWidth
									type='number'
									value={swapValue1}
									error={swap1Error}
									disabled={disableForm}
									onChange={onChangeSwapAmount1}
									InputProps={{
										inputMode: 'numeric',
										inputProps: { min: 0 },
										startAdornment: <>{swap1Loading ? <CircularProgress /> : <></>}</>
									}}
								/>
							</Box>
						</ListItem>
						<ListItem>
							<Typography sx={{ width: '100%', marginRight: 2 }} align='right' variant='subtitle1' display='block' gutterBottom>
								{selectedCoin1.symbol}: {coinBalanceMap?.get(selectedCoin1.symbol)}
							</Typography>
							<Button disabled={disableForm} variant='contained' onClick={setMaxCoin1} size='large' color='secondary'>
								Max
							</Button>
						</ListItem>
						<ListItem sx={{ margin: 0 }}>
							<Box sx={{ display: 'flex', flexGrow: 1, justifyContent: 'center' }}>
								<Button disabled={disableForm} onClick={switchSwaps} variant='text' size='large'>
									{switchToggled ? <ImportExportIcon sx={{ fontSize: 50 }} /> : <ImportExportRoundedIcon sx={{ fontSize: 50 }} />}
								</Button>
							</Box>
						</ListItem>
						<ListItem>
							<Box sx={{ display: 'flex', flexGrow: 1 }}>
								<Button
									sx={{ minWidth: isSmallScreen ? '200px' : '300px', paddingLeft: 1, justifyContent: 'flex-start' }}
									variant='outlined'
									id='swapButton2'
									aria-haspopup='true'
									disabled={disableForm}
									onClick={(event: React.MouseEvent<HTMLElement>) => {
										setSwap2AnchorEl(event.currentTarget);
									}}>
									<Box sx={{ display: 'flex', flexGrow: 1, alignItems: 'center' }}>
										<CoinAvatar coinType={selectedCoin2.symbol} />
										<span>
											{selectedCoin2.name} ({selectedCoin2.symbol})
										</span>
									</Box>
									<ArrowDropDown />
								</Button>
								<Menu
									id='swapButton2'
									aria-labelledby='swapButton2'
									anchorEl={swap2AnchorEl}
									onClose={() => setSwap2AnchorEl(null)}
									open={Boolean(swap2AnchorEl)}
									anchorOrigin={{
										vertical: 'bottom',
										horizontal: 'right'
									}}
									transformOrigin={{
										vertical: 'top',
										horizontal: 'right'
									}}>
									{selectedCoin1.tradingPair.map(symbol => {
										const coin = swapCoinList.get(symbol);
										return(
											<MenuItem
												onClick={() => {
													onChangeSwap2(coin.symbol);
													setSwap2AnchorEl(null);
												}}
												sx={{ display: 'flex', flexGrow: 1 }}
												key={coin.symbol}
												value={coin.symbol}>
												<CoinAvatar coinType={coin.symbol} />
												<span>{coin.name}</span>
											</MenuItem>
										)
									})}
								</Menu>
							</Box>
							<Box sx={{ display: 'flex', flexGrow: 1 }}>
								<TextField
									id='standard-basic'
									label={selectedCoin2.symbol}
									variant='outlined'
									fullWidth
									type='number'
									value={swapValue2}
									error={swap2Error}
									disabled={disableForm}
									onChange={onChangeSwapAmount2}
									InputProps={{
										inputMode: 'numeric',
										inputProps: { min: 0 },
										startAdornment: <>{swap2Loading ? <CircularProgress /> : <></>}</>
									}}
								/>
							</Box>
						</ListItem>

						<ListItem>
							<Typography sx={{ width: '100%', marginRight: 2 }} align='right' variant='subtitle1' display='block' gutterBottom>
								{selectedCoin2.symbol}: {coinBalanceMap?.get(selectedCoin2.symbol)}
							</Typography>
							<Button disabled={disableForm} variant='contained' onClick={setMaxCoin2} size='large' color='secondary'>
								Max
							</Button>
						</ListItem>
						<ListItem>
							<Snackbar open={alertValue.show}>
								<Alert variant='filled' severity={alertValue.type}>
									{alertValue.message}
								</Alert>
							</Snackbar>
						</ListItem>
						<ListItem>
							<Collapse in={swapButtonLoading}>
								<Alert severity='warning'>Do not refresh or leave window, this transaction can take over 3 minute</Alert>
							</Collapse>
						</ListItem>
						<ListItem>
							<LoadingButton loading={swapButtonLoading} onClick={swap} fullWidth disabled={swap1Error || swap2Error || slippageError || disableForm} variant='contained'>
								{swapButtonText}
							</LoadingButton>
						</ListItem>
					</Paper>
				</Box>
			</Box>
		);
	}

	return <Box sx={{ display: 'flex', flexGrow: 1, flexDirection:"column" }}>
			<NavBar onClose={async () =>  {
				await updateICPBalance(icpProvider, coinBalanceMap, setIcpBalance, icUtils);
				setCoinBalanceMap(coinBalanceMap);
			}} walletAddress={icpProvider?.principal} balance={icpBalance}
			icpProvider={icpProvider} 
			setBalance={(balance: string) => {
				coinBalanceMap.set("ICP", balance);
				setIcpBalance(balance);
			}}/>
			{appLoading ? <LogoWrapper renderContent={Loading} /> : <LogoWrapper renderContent={renderSwap} />}
		</Box>;
}
