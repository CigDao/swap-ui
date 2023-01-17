import { _SERVICE as Dip20Service } from "../declarations/dip20/dip20.did";
import { _SERVICE as SwapSrvice } from "../declarations/swap/swap.did";
import { wicpCanisterId } from "./icUtils";

export interface CoinInput {
	name: string,
    symbol: string
	tradingPair: CoinInput[],
    canisterId?: string,
    service?: Dip20Service,
    swapServices?: Map<string,SwapSrvice>
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
    tradingPair: [WICP]
    
}
WICP.tradingPair = [ICP];

const coinList = [WICP, ICP];

export default {
    WICP, ICP, coinList
}