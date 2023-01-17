import { StoicWallet } from "@connect2ic/core/providers/stoic-wallet";
import { PlugWallet } from "@connect2ic/core/providers/plug-wallet";
import { IConnector } from "@connect2ic/core";
import { NFID } from "@connect2ic/core/providers/nfid";

import { _SERVICE as WicpService, idlFactory as wicpFactory }from "../declarations/token/token.did";
import { _SERVICE as LedgerService, idlFactory as ledgerFactory }from "../declarations/ledger/ledger.did";
import { _SERVICE as SwapSrvice, idlFactory as swapFactory } from "../declarations/swap/swap.did";
import { _SERVICE as Dip20Service, idlFactory as dip20Factory } from "../declarations/dip20/dip20.did";
import { Memoize } from "typescript-memoize";

import { AccountIdentifier, SubAccount } from '@dfinity/nns';
import { Principal } from '@dfinity/principal';
import { bigIntToDecimalPrettyString } from '@utils/decimalutils';
import coins from '@utils/coins';

export const icpHost = "https://ic0.app";
export const wicpCanisterId = "utozz-siaaa-aaaam-qaaxq-cai";
export const ledgerCanisterId = "ryjl3-tyaaa-aaaaa-aaaba-cai";
export const ycWicpSwapCanisterId = "6ox57-5aaaa-aaaap-qaw4q-cai";
export const mlpSwapCanisterId = "nsq5t-lyaaa-aaaan-qczsa-cai";
export const whiteListedCanister =  new Set([wicpCanisterId, ledgerCanisterId, ycWicpSwapCanisterId]);

export function getProviders(connector: string, additionalCanister: string[] = []): IConnector {
    additionalCanister.forEach(x => whiteListedCanister.add(x));
    const whiteListedCans = Array.from(whiteListedCanister);
    return (() => {
        switch(connector) {
            case "plug":
                return new PlugWallet({
                    whitelist: whiteListedCans,
                    host: icpHost,
                });
            case "stoic": 
                return new StoicWallet({
                    whitelist: whiteListedCans,
                    providerUrl: "https://www.stoicwallet.com",
                    host: icpHost,
                  });
            case "nfid":
                return new NFID({
                    whitelist: whiteListedCans,
                    providerUrl: "https://nfid.one",
                    host: icpHost,
                    appName: "CigDao SmokeSwap"
                    });
            default:
                return null;
        }
    })() as IConnector;

}

export async function updateICPBalance(
    icpProvider: IConnector, 
    balanceMap: Map<string, string>, 
    setBalanceFunction: any, 
    icUtils: IcUtils 
    ) : Promise<any> {
    const ledger = await icUtils.ledgerCanister(icpProvider);
    const identifier = AccountIdentifier.fromPrincipal({
        principal: Principal.fromText(icpProvider.principal ?? ''),
        subAccount: SubAccount.ZERO
    }).toNumbers();
    const balance = await ledger.account_balance({ account: identifier });
    balanceMap.set(coins.ICP.symbol, bigIntToDecimalPrettyString(balance.e8s));
    setBalanceFunction(bigIntToDecimalPrettyString(balance.e8s));
    return balanceMap;
}


export default class IcUtils {

    @Memoize()
    async wicpCanister(provider: IConnector){
        return await this.createActor<WicpService>(wicpCanisterId, wicpFactory, provider);
    }

    @Memoize()
    async ledgerCanister(provider: IConnector){
        return await this.createActor<LedgerService>(ledgerCanisterId, ledgerFactory, provider);
    }
    @Memoize()
    async ycWicpSwapCanister(provider: IConnector){
        return await this.createActor<SwapSrvice>(ycWicpSwapCanisterId, swapFactory, provider);
    }
    @Memoize()
    async ycMlpTokenSwapCanister(provider: IConnector){
        return await this.createActor<SwapSrvice>(mlpSwapCanisterId, swapFactory, provider);
    }
    @Memoize()
    async dip20Canister(canisterId: string, provider: IConnector){
        return await this.createActor<Dip20Service>(canisterId, dip20Factory, provider);
    }

    private async createActor<T>(cid: string, idl: any, icConnector: IConnector) {
        if (!(await icConnector.isConnected())) await icConnector.connect();
        const conn = await icConnector.createActor<T>(cid, idl);
        if (conn.isErr()) {
          throw Error("unable to create actor");
        }
    
        return conn.unwrapOr(null as T);
    }
}
