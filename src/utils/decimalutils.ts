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

export function prettyStringToNumber(string: string){
    let intString : string = '';
    for(let i = 0; i < string.length; i++){
        let char = string[i];
        if(char === ",") continue;
        intString += char;
    };
    if(intString === '') return Number(0);
    return Number(intString);
};
