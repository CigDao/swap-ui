import type { Principal } from "@dfinity/principal";
import type { ActorMethod } from "@dfinity/agent";

export interface Holder {
  receipt: TxReceipt__1;
  holder: Principal;
  amount: bigint;
}
export interface Metadata {
  fee: bigint;
  decimals: number;
  owner: Principal;
  logo: string;
  name: string;
  totalSupply: bigint;
  symbol: string;
}
export type Time = bigint;
export interface Token {
  allowance: ActorMethod<[Principal, Principal], bigint>;
  approve: ActorMethod<[Principal, bigint], TxReceipt>;
  balanceOf: ActorMethod<[Principal], bigint>;
  bulkTransfer: ActorMethod<[Array<Holder>], Array<Holder>>;
  burn: ActorMethod<[bigint], TxReceipt>;
  communityTransfer: ActorMethod<[Principal, bigint], TxReceipt>;
  decimals: ActorMethod<[], number>;
  getAllowanceSize: ActorMethod<[], bigint>;
  getHolders: ActorMethod<[bigint, bigint], Array<[Principal, bigint]>>;
  getMetadata: ActorMethod<[], Metadata>;
  getTokenFee: ActorMethod<[], bigint>;
  getTokenInfo: ActorMethod<[], TokenInfo>;
  getUserApprovals: ActorMethod<[Principal], Array<[Principal, bigint]>>;
  historySize: ActorMethod<[], bigint>;
  logo: ActorMethod<[], string>;
  mint: ActorMethod<[Array<number> | [], bigint], TxReceipt>;
  name: ActorMethod<[], string>;
  setFee: ActorMethod<[bigint], undefined>;
  setFeeTo: ActorMethod<[Principal], undefined>;
  setLogo: ActorMethod<[string], undefined>;
  setName: ActorMethod<[string], undefined>;
  setOwner: ActorMethod<[Principal], undefined>;
  symbol: ActorMethod<[], string>;
  totalSupply: ActorMethod<[], bigint>;
  transfer: ActorMethod<[Principal, bigint], TxReceipt>;
  transferFrom: ActorMethod<[Principal, Principal, bigint], TxReceipt>;
  withdraw: ActorMethod<[bigint, string], TxReceipt>;
}
export interface TokenInfo {
  holderNumber: bigint;
  deployTime: Time;
  metadata: Metadata;
  historySize: bigint;
  cycles: bigint;
  feeTo: Principal;
}
export type TxReceipt =
  | { Ok: bigint }
  | {
      Err:
        | { InsufficientAllowance: null }
        | { InsufficientBalance: null }
        | { ErrorOperationStyle: null }
        | { Unauthorized: null }
        | { LedgerTrap: null }
        | { ErrorTo: null }
        | { Other: string }
        | { BlockUsed: null }
        | { AmountTooSmall: null };
    };
export type TxReceipt__1 =
  | { Ok: bigint }
  | {
      Err:
        | { InsufficientAllowance: null }
        | { InsufficientBalance: null }
        | { ErrorOperationStyle: null }
        | { Unauthorized: null }
        | { LedgerTrap: null }
        | { ErrorTo: null }
        | { Other: string }
        | { BlockUsed: null }
        | { AmountTooSmall: null };
    };
export interface _SERVICE extends Token {}

export const idlFactory = ({ IDL }: any) => {
  const TxReceipt = IDL.Variant({
    Ok: IDL.Nat,
    Err: IDL.Variant({
      InsufficientAllowance: IDL.Null,
      InsufficientBalance: IDL.Null,
      ErrorOperationStyle: IDL.Null,
      Unauthorized: IDL.Null,
      LedgerTrap: IDL.Null,
      ErrorTo: IDL.Null,
      Other: IDL.Text,
      BlockUsed: IDL.Null,
      AmountTooSmall: IDL.Null,
    }),
  });
  const TxReceipt__1 = IDL.Variant({
    Ok: IDL.Nat,
    Err: IDL.Variant({
      InsufficientAllowance: IDL.Null,
      InsufficientBalance: IDL.Null,
      ErrorOperationStyle: IDL.Null,
      Unauthorized: IDL.Null,
      LedgerTrap: IDL.Null,
      ErrorTo: IDL.Null,
      Other: IDL.Text,
      BlockUsed: IDL.Null,
      AmountTooSmall: IDL.Null,
    }),
  });
  const Holder = IDL.Record({
    receipt: TxReceipt__1,
    holder: IDL.Principal,
    amount: IDL.Nat,
  });
  const Metadata = IDL.Record({
    fee: IDL.Nat,
    decimals: IDL.Nat8,
    owner: IDL.Principal,
    logo: IDL.Text,
    name: IDL.Text,
    totalSupply: IDL.Nat,
    symbol: IDL.Text,
  });
  const Time = IDL.Int;
  const TokenInfo = IDL.Record({
    holderNumber: IDL.Nat,
    deployTime: Time,
    metadata: Metadata,
    historySize: IDL.Nat,
    cycles: IDL.Nat,
    feeTo: IDL.Principal,
  });
  const Token = IDL.Service({
    allowance: IDL.Func([IDL.Principal, IDL.Principal], [IDL.Nat], ["query"]),
    approve: IDL.Func([IDL.Principal, IDL.Nat], [TxReceipt], []),
    balanceOf: IDL.Func([IDL.Principal], [IDL.Nat], ["query"]),
    bulkTransfer: IDL.Func([IDL.Vec(Holder)], [IDL.Vec(Holder)], []),
    burn: IDL.Func([IDL.Nat], [TxReceipt], []),
    communityTransfer: IDL.Func([IDL.Principal, IDL.Nat], [TxReceipt], []),
    decimals: IDL.Func([], [IDL.Nat8], ["query"]),
    getAllowanceSize: IDL.Func([], [IDL.Nat], ["query"]),
    getHolders: IDL.Func([IDL.Nat, IDL.Nat], [IDL.Vec(IDL.Tuple(IDL.Principal, IDL.Nat))], ["query"]),
    getMetadata: IDL.Func([], [Metadata], ["query"]),
    getTokenFee: IDL.Func([], [IDL.Nat], ["query"]),
    getTokenInfo: IDL.Func([], [TokenInfo], ["query"]),
    getUserApprovals: IDL.Func([IDL.Principal], [IDL.Vec(IDL.Tuple(IDL.Principal, IDL.Nat))], ["query"]),
    historySize: IDL.Func([], [IDL.Nat], ["query"]),
    logo: IDL.Func([], [IDL.Text], ["query"]),
    mint: IDL.Func([IDL.Opt(IDL.Vec(IDL.Nat8)), IDL.Nat64], [TxReceipt], []),
    name: IDL.Func([], [IDL.Text], ["query"]),
    setFee: IDL.Func([IDL.Nat], [], ["oneway"]),
    setFeeTo: IDL.Func([IDL.Principal], [], ["oneway"]),
    setLogo: IDL.Func([IDL.Text], [], ["oneway"]),
    setName: IDL.Func([IDL.Text], [], ["oneway"]),
    setOwner: IDL.Func([IDL.Principal], [], ["oneway"]),
    symbol: IDL.Func([], [IDL.Text], ["query"]),
    totalSupply: IDL.Func([], [IDL.Nat], ["query"]),
    transfer: IDL.Func([IDL.Principal, IDL.Nat], [TxReceipt], []),
    transferFrom: IDL.Func([IDL.Principal, IDL.Principal, IDL.Nat], [TxReceipt], []),
    withdraw: IDL.Func([IDL.Nat64, IDL.Text], [TxReceipt], [])
  });
  return Token;
};
export const init = ({ IDL }: any) => {
  return [IDL.Text, IDL.Text, IDL.Text, IDL.Nat8, IDL.Nat, IDL.Principal, IDL.Nat];
};
