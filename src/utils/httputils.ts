import axios from "axios";
import { ycWicpSwapCanisterId, mlpSwapCanisterId } from "./icUtils";

const urlBuilder = (canisterId:string, endpoint: string) => `https://${canisterId}.raw.ic0.app/${endpoint}`;
export interface AmmMetadata {
    token2: string,
    token1: string
}
//TODO: make another of these functions for the user's LQ pool.
// Automated Market Maker for WICP & YC
export async function getYcWicpAmmMetaData(): Promise<AmmMetadata> {
  return await (
    await axios.get(urlBuilder(ycWicpSwapCanisterId, "getMetaData"), { responseType: "json" })
  ).data;
}

export async function getMlpAmmMetaData(): Promise<AmmMetadata> {
  return await (
    await axios.get(urlBuilder(mlpSwapCanisterId, "getMetaData"), { responseType: "json" })
  ).data;
}

export async function priceOfIcp(): Promise<number> {
  const icp = (await axios.get("https://api.coingecko.com/api/v3/simple/price?ids=internet-computer&vs_currencies=usd", {responseType: "json"})).data
  console.log(icp);
  return icp["internet-computer"].usd;
}