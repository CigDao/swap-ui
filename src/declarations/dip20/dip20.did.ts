import type { Principal } from "@dfinity/principal";
export interface Metadata {
  'fee' : bigint,
  'decimals' : number,
  'owner' : Principal,
  'logo' : string,
  'name' : string,
  'totalSupply' : bigint,
  'symbol' : string,
};
export type Time = bigint;
export interface TokenInfo {
  'holderNumber' : bigint,
  'deployTime' : Time,
  'metadata' : Metadata,
  'historySize' : bigint,
  'cycles' : bigint,
  'feeTo' : Principal,
};
export type TxReceipt = { 'Ok' : bigint } |
  {
    'Err' : { 'InsufficientAllowance' : null } |
      { 'InsufficientBalance' : null } |
      { 'ErrorOperationStyle' : null } |
      { 'Unauthorized' : null } |
      { 'LedgerTrap' : null } |
      { 'ErrorTo' : null } |
      { 'Other' : string } |
      { 'BlockUsed' : null } |
      { 'AmountTooSmall' : null }
  };
export interface _SERVICE {
  'allowance' : (arg_0: Principal, arg_1: Principal) => Promise<bigint>,
  'approve' : (arg_0: Principal, arg_1: bigint) => Promise<TxReceipt>,
  'balanceOf' : (arg_0: Principal) => Promise<bigint>,
  'burn' : (arg_0: bigint) => Promise<TxReceipt>,
  'decimals' : () => Promise<number>,
  'getAllowanceSize' : () => Promise<bigint>,
  'getHolders' : (arg_0: bigint, arg_1: bigint) => Promise<
      Array<[Principal, bigint]>
    >,
  'getMetadata' : () => Promise<Metadata>,
  'getTokenFee' : () => Promise<bigint>,
  'getTokenInfo' : () => Promise<TokenInfo>,
  'getUserApprovals' : (arg_0: Principal) => Promise<
      Array<[Principal, bigint]>
    >,
  'historySize' : () => Promise<bigint>,
  'logo' : () => Promise<string>,
  'mint' : (arg_0: Principal, arg_1: bigint) => Promise<TxReceipt>,
  'name' : () => Promise<string>,
  'setFee' : (arg_0: bigint) => Promise<undefined>,
  'setFeeTo' : (arg_0: Principal) => Promise<undefined>,
  'setLogo' : (arg_0: string) => Promise<undefined>,
  'setName' : (arg_0: string) => Promise<undefined>,
  'setOwner' : (arg_0: Principal) => Promise<undefined>,
  'symbol' : () => Promise<string>,
  'totalSupply' : () => Promise<bigint>,
  'transfer' : (arg_0: Principal, arg_1: bigint) => Promise<TxReceipt>,
  'transferFrom' : (
      arg_0: Principal,
      arg_1: Principal,
      arg_2: bigint,
    ) => Promise<TxReceipt>,
};

export const idlFactory = ({ IDL }: any) => {
    const TxReceipt = IDL.Variant({
      'Ok' : IDL.Nat,
      'Err' : IDL.Variant({
        'InsufficientAllowance' : IDL.Null,
        'InsufficientBalance' : IDL.Null,
        'ErrorOperationStyle' : IDL.Null,
        'Unauthorized' : IDL.Null,
        'LedgerTrap' : IDL.Null,
        'ErrorTo' : IDL.Null,
        'Other' : IDL.Text,
        'BlockUsed' : IDL.Null,
        'AmountTooSmall' : IDL.Null,
      }),
    });
    const Metadata = IDL.Record({
      'fee' : IDL.Nat,
      'decimals' : IDL.Nat8,
      'owner' : IDL.Principal,
      'logo' : IDL.Text,
      'name' : IDL.Text,
      'totalSupply' : IDL.Nat,
      'symbol' : IDL.Text,
    });
    const Time = IDL.Int;
    const TokenInfo = IDL.Record({
      'holderNumber' : IDL.Nat,
      'deployTime' : Time,
      'metadata' : Metadata,
      'historySize' : IDL.Nat,
      'cycles' : IDL.Nat,
      'feeTo' : IDL.Principal,
    });
    return IDL.Service({
      'allowance' : IDL.Func(
          [IDL.Principal, IDL.Principal],
          [IDL.Nat],
          ['query'],
        ),
      'approve' : IDL.Func([IDL.Principal, IDL.Nat], [TxReceipt], []),
      'balanceOf' : IDL.Func([IDL.Principal], [IDL.Nat], ['query']),
      'burn' : IDL.Func([IDL.Nat], [TxReceipt], []),
      'decimals' : IDL.Func([], [IDL.Nat8], ['query']),
      'getAllowanceSize' : IDL.Func([], [IDL.Nat], ['query']),
      'getHolders' : IDL.Func(
          [IDL.Nat, IDL.Nat],
          [IDL.Vec(IDL.Tuple(IDL.Principal, IDL.Nat))],
          ['query'],
        ),
      'getMetadata' : IDL.Func([], [Metadata], ['query']),
      'getTokenFee' : IDL.Func([], [IDL.Nat], ['query']),
      'getTokenInfo' : IDL.Func([], [TokenInfo], ['query']),
      'getUserApprovals' : IDL.Func(
          [IDL.Principal],
          [IDL.Vec(IDL.Tuple(IDL.Principal, IDL.Nat))],
          ['query'],
        ),
      'historySize' : IDL.Func([], [IDL.Nat], ['query']),
      'logo' : IDL.Func([], [IDL.Text], ['query']),
      'mint' : IDL.Func([IDL.Principal, IDL.Nat], [TxReceipt], []),
      'name' : IDL.Func([], [IDL.Text], ['query']),
      'setFee' : IDL.Func([IDL.Nat], [], ['oneway']),
      'setFeeTo' : IDL.Func([IDL.Principal], [], ['oneway']),
      'setLogo' : IDL.Func([IDL.Text], [], ['oneway']),
      'setName' : IDL.Func([IDL.Text], [], ['oneway']),
      'setOwner' : IDL.Func([IDL.Principal], [], ['oneway']),
      'symbol' : IDL.Func([], [IDL.Text], ['query']),
      'totalSupply' : IDL.Func([], [IDL.Nat], ['query']),
      'transfer' : IDL.Func([IDL.Principal, IDL.Nat], [TxReceipt], []),
      'transferFrom' : IDL.Func(
          [IDL.Principal, IDL.Principal, IDL.Nat],
          [TxReceipt],
          [],
        ),
    });
  };
  export const init = ({ IDL }: any) => { return []; };