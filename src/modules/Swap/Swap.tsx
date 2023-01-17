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
import coins, { CoinInput } from '@utils/coins';
import { IConnector } from '@connect2ic/core';
import { getProviders, ycWicpSwapCanisterId, wicpCanisterId } from '@utils/icUtils';
import { AccountIdentifier, SubAccount } from '@dfinity/nns';
import { Principal } from '@dfinity/principal';
import { bigIntToDecimal, bigIntToDecimalPrettyString, DECIMALS } from '@utils/decimalutils';
import LoadingButton from '@mui/lab/LoadingButton';
import Loading from '@components/Loading/Loading';
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
import IcUtils, {updateICPBalance} from '@utils/icUtils';
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
	const [appLoading, setAppLoading] = useState(true);
	const [swapCoinList, setSwapCoinList] = useState(coins.coinList);
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

	const populateCoinObjects = async (
		newToken1: CoinInput, 
		newToken2: CoinInput,
		swapService: SwapService, 
		existingToken1?: CoinInput, 
		existingToken2?: CoinInput
	) => {
		if (existingToken1 && existingToken2) {
			existingToken1.tradingPair.push(existingToken2);
			existingToken2.tradingPair.push(existingToken1);
		} else if (existingToken1 && !existingToken2) {
			newToken2.tradingPair.push(existingToken1);
			existingToken1.tradingPair.push(newToken2);
			existingToken1.service = (await icUtils.wicpCanister(icpProvider)) as any;
			if(!existingToken1.swapServices) existingToken1.swapServices = new Map();
			if(!newToken2.swapServices) newToken2.swapServices = new Map();
			existingToken1.swapServices.set(newToken2.symbol, swapService);
			newToken2.swapServices.set(existingToken1.symbol, swapService);
			swapCoinList.push(newToken2);
			setSwapCoinList(swapCoinList);
		} else if (!existingToken1 && existingToken2) {
			newToken1.tradingPair.push(existingToken2);
			existingToken2.tradingPair.push(newToken1);
			existingToken2.service = (await icUtils.wicpCanister(icpProvider)) as any;
			if(!existingToken2.swapServices) existingToken2.swapServices = new Map();
			if(!newToken1.swapServices) newToken1.swapServices = new Map();
			existingToken2.swapServices.set(newToken1.symbol, swapService);
			newToken1.swapServices.set(existingToken2.symbol, swapService);
			swapCoinList.push(newToken1);
			setSwapCoinList(swapCoinList);
		} else if (!existingToken1 && !existingToken2) {
			newToken1.tradingPair.push(newToken2);
			newToken2.tradingPair.push(newToken1);
			swapCoinList.push(newToken2);
			swapCoinList.push(newToken1);
			setSwapCoinList(swapCoinList);
		}
	};
	
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
		let swapService;
		if(metadata.symbol === "YC" || metadata.symbol === "WICP") {
			swapService = await icUtils.ycWicpSwapCanister(icpProvider);
		};
		if(metadata.symbol === "YC") swapServices.set("WICP", swapService);
		if(metadata.symbol === "WICP") swapServices.set("YC", swapService);
		balanceMap.set(metadata.symbol, bigIntToDecimalPrettyString(balance));
		
		return {
			name: metadata.name,
			symbol: metadata.symbol,
			tradingPair: [],
			service: dip20,
			swapServices,
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
		if (icpProvider && icpProvider.principal) {
			const coinRequests: any = [
				getPriceOfYc(), 
				updateICPBalance(icpProvider, balanceMap,setIcpBalance, icUtils), 
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
			
			const token1Promise = response[3] as any;
			const token2Promise = response[4] as any;
			const newToken1: CoinInput = token1Promise.value;
			const newToken2: CoinInput = token2Promise.value;
			const existingToken1 = swapCoinList.find(x => x.symbol === newToken1.symbol);
			const existingToken2 = swapCoinList.find(x => x.symbol === newToken2.symbol);
			const ycWicpSwapCanister = await icUtils.ycWicpSwapCanister(icpProvider);
			await populateCoinObjects(newToken1, newToken2, ycWicpSwapCanister, existingToken1, existingToken2);
			
			const token3Promise = response[5] as any;
			const token4Promise = response[6] as any;
			const newToken3: CoinInput = token3Promise.value;
			const newToken4: CoinInput = token4Promise.value;
			const existingToken3 = swapCoinList.find(x => x.symbol === newToken3.symbol);
			const existingToken4 = swapCoinList.find(x => x.symbol === newToken4.symbol);
			const ycMlpSwapCanister = await icUtils.ycMlpTokenSwapCanister(icpProvider);
			await populateCoinObjects(newToken4, newToken3, ycMlpSwapCanister, existingToken4, existingToken3);
			console.log([...swapCoinList]);
		}
	}

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
		const selected = coins.coinList.find(x => x.symbol === symbol) as CoinInput;
		setSelectedCoin1(selected);
		setSelectedCoin2(selected.tradingPair[0]);
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
		setSelectedCoin2(coins.coinList.find(x => x.symbol === symbol) as CoinInput);
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

	function equalizePrice(swapChanged: string, price: string, selectedCoin1: CoinInput, selectedCoin2: CoinInput) {
		switch (swapChanged) {
			case 'swap1': {
				if (selectedCoin1.symbol.includes('ICP') && selectedCoin2.symbol.includes('ICP')) {
					setSwapValue2(price.toString());
				} else {
					setDisableForm(true);
					setSwap2Loading(true);
					equalizeCoinGivenCoin(price, selectedCoin1, selectedCoin2, setSwapValue2).then();
				}
				break;
			}
			case 'swap2': {
				if (selectedCoin1.symbol.includes('ICP') && selectedCoin2.symbol.includes('ICP')) {
					setSwapValue1(price.toString());
				} else {
					setDisableForm(true);
					setSwap1Loading(true);
					equalizeCoinGivenCoin(price, selectedCoin2, selectedCoin1, setSwapValue1).then();
				}
				break;
			}
		}
	}

	async function equalizeCoinGivenCoin(tokensOfcoin1: string, coinToTrade: CoinInput, coinToCompare: CoinInput, setSwapFunc: any) {
		const response = (await Promise.allSettled<any>([
			coinToTrade.service?.balanceOf(Principal.fromText(ycWicpSwapCanisterId)),
			coinToCompare.service?.balanceOf(Principal.fromText(ycWicpSwapCanisterId))
		])) as any;
		const displayPrice = getSwapTokenEstimate(tokensOfcoin1, response[0].value, response[1].value);
		setSwapFunc(bigIntToDecimal(displayPrice).getValue());
		setSwap2Loading(false);
		setSwap1Loading(false);
		setDisableForm(false);
	}
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

		if (selectedCoin1.symbol.includes('ICP') && selectedCoin2.symbol.includes('WICP')) {
			transferICPToWICP(BigInt(Number(swapValue1) * DECIMALS)).then(finishSwap);
		} else if (selectedCoin1.symbol.includes('WICP') && selectedCoin2.symbol.includes('ICP')) {
			withdrawICP(BigInt(Number(swapValue1) * DECIMALS)).then(finishSwap);
		} else {
			if (swapValue1) swapToken(BigInt(Number(swapValue1?.toString()) * DECIMALS)).then(finishSwap);
		}
	}

	async function swapToken(amount: bigint) {
		try {
			const ammMetadata = await getYcWicpAmmMetaData();
			const swapCanisterId = selectedCoin1.swapCanisterIds?.get(selectedCoin2.symbol);
			await selectedCoin1.service?.approve(Principal.fromText(swapCanisterId || ""), amount);
			const swapValueDecimal2 = new bigDecimal(swapValue2).getValue().replace('.', '');

			const slipCalced = calcSlippage(slippageValue.toString(), swapValueDecimal2);
			const swapCanister = selectedCoin1.swapServices?.get(selectedCoin2.symbol);
			if(!swapCanister){
				throw("swap canister missing");
			}
			const doSwap = ammMetadata.token1 === selectedCoin1.canisterId ? await swapCanister.swapToken1(amount, BigInt(slipCalced)) : await swapCanister.swapToken2(amount, BigInt(slipCalced));

			const prince = icpProvider.principal;
			const coin1Balance = await selectedCoin1.service?.balanceOf(Principal.fromText(prince ?? ''));
			const coin2Balance = await selectedCoin2.service?.balanceOf(Principal.fromText(prince ?? ''));
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
								<Button onClick={() => navigate('/liquidity', { replace: false, state: coinBalanceMap})}>Add Liquidity</Button>
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
									{swapCoinList.map(coin => (
										<MenuItem
											onClick={() => {
												onChangeSwap1(coin.symbol);
												setSwap1AnchorEl(null);
											}}
											sx={{ display: 'flex', flexGrow: 1 }}
											key={coin.symbol}
											value={coin.symbol}>
											<CoinAvatar coinType={coin.symbol} />
											<span>{coin.name}</span>
										</MenuItem>
									))}
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
									{selectedCoin1.tradingPair.map(coin => (
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
									))}
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
