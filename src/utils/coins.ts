import { _SERVICE as Dip20Service } from "../declarations/dip20/dip20.did";
import { _SERVICE as SwapSrvice } from "../declarations/swap/swap.did";
import { wicpCanisterId } from "./icUtils";

export interface CoinInputWithServices {
	name: string,
    symbol: string
	tradingPair: string[],
    canisterId?: string,
    service?: Dip20Service,
    swapServices?: Map<string,SwapSrvice>
    swapCanisterIds?: Map<string,string> 
};

export interface CoinInput {
    name: string,
    symbol: string
	tradingPair: string[],
    canisterId?: string,
    swapCanisterIds?: Map<string,string> 
}

export interface SharesData {
    shares : bigint, 
    share1? : bigint, 
    share2? : bigint 
    name1?: string,
    name2?: string,
    symbol1?: string,
    symbol2?: string
}

export interface TradingPair_Serializable {
    name: string,
    symbol: string
    canisterId?: string,
    swapCanisterIds?: Map<string,string> 
}

export interface CoinInput_Serializable {
    name: string,
    symbol: string
	tradingPair: string[],
    canisterId?: string,
    swapCanisterIds?: Map<string,string> 
}


const WICP: CoinInput = {
    name: "WICP",
    symbol: "WICP",
    canisterId: wicpCanisterId,
    tradingPair: []
}

const ICP: CoinInput = {
    name: "ICP",
    symbol: "ICP",
    tradingPair: [WICP.symbol]
    
}

const MLP: CoinInput = {
    name: "CIG",
    symbol: "CIG",
    tradingPair: []
}

WICP.tradingPair = [ICP.symbol];

const coinList = [WICP, ICP];

export default {
    WICP, ICP, MLP, coinList
}