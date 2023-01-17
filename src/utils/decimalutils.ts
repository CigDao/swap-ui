import bigDecimal from "js-big-decimal";

export const DECIMALS = 100000000;

export const DECIMALS_BI = BigInt(100000000);

export function bigIntToDecimal(big: BigInt | number | string) {
    var result = new bigDecimal(big?.toString() || 1);
    var decimal = new bigDecimal(DECIMALS);
    return result.divide(decimal, 8);
}

export function bigIntToDecimalPrettyString(big: BigInt | number | undefined) {
    return big ? bigIntToDecimal(big).getPrettyValue(3, ",") : "0";
}
