import type { Principal } from "@dfinity/principal";
export type HeaderField = [string, string];
export interface Request {
  'url' : string,
  'method' : string,
  'body' : Array<number>,
  'headers' : Array<HeaderField>,
};
export interface Response {
  'body' : Array<number>,
  'headers' : Array<HeaderField>,
  'streaming_strategy' : [] | [StreamingStrategy],
  'status_code' : number,
};
export type StreamingCallback = (arg_0: StreamingCallbackToken) => Promise<
    StreamingCallbackResponse
  >;
export interface StreamingCallbackResponse {
  'token' : [] | [StreamingCallbackToken],
  'body' : Array<number>,
};
export interface StreamingCallbackToken {
  'key' : number,
  'sha256' : [] | [Array<number>],
  'index' : number,
  'content_encoding' : string,
};
export type StreamingStrategy = {
    'Callback' : {
      'token' : StreamingCallbackToken,
      'callback' : StreamingCallback,
    }
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
      { 'Slippage' : bigint } |
      { 'InsufficientPoolBalance' : null } |
      { 'BlockUsed' : null } |
      { 'AmountTooSmall' : null }
  };
export interface _SERVICE {
  'getCycles' : () => Promise<bigint>,
  'getEquivalentToken1Estimate' : (arg_0: bigint) => Promise<bigint>,
  'getEquivalentToken2Estimate' : (arg_0: bigint) => Promise<bigint>,
  'getHeapSize' : () => Promise<bigint>,
  'getMemorySize' : () => Promise<bigint>,
  'getShares' : (arg_0: Principal) => Promise<bigint>,
  'getSwapToken1Estimate' : (arg_0: bigint) => Promise<bigint>,
  'getSwapToken1EstimateGivenToken2' : (arg_0: bigint) => Promise<TxReceipt>,
  'getSwapToken2Estimate' : (arg_0: bigint) => Promise<bigint>,
  'getSwapToken2EstimateGivenToken1' : (arg_0: bigint) => Promise<TxReceipt>,
  'getWithdrawEstimate' : (arg_0: bigint) => Promise<
      { 'share1' : bigint, 'share2' : bigint }
    >,
  'http_request' : (arg_0: Request) => Promise<Response>,
  'price' : () => Promise<bigint>,
  'provide' : (arg_0: bigint, arg_1: bigint) => Promise<TxReceipt>,
  'swapToken1' : (arg_0: bigint, arg_1: bigint) => Promise<TxReceipt>,
  'swapToken2' : (arg_0: bigint, arg_1: bigint) => Promise<TxReceipt>,
  'withdraw' : (arg_0: bigint) => Promise<TxReceipt>,
};

export const idlFactory =  ({ IDL }: any) => {
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
      'Slippage' : IDL.Nat,
      'InsufficientPoolBalance' : IDL.Null,
      'BlockUsed' : IDL.Null,
      'AmountTooSmall' : IDL.Null,
    }),
  });
  const HeaderField = IDL.Tuple(IDL.Text, IDL.Text);
  const Request = IDL.Record({
    'url' : IDL.Text,
    'method' : IDL.Text,
    'body' : IDL.Vec(IDL.Nat8),
    'headers' : IDL.Vec(HeaderField),
  });
  const StreamingCallbackToken = IDL.Record({
    'key' : IDL.Nat32,
    'sha256' : IDL.Opt(IDL.Vec(IDL.Nat8)),
    'index' : IDL.Nat32,
    'content_encoding' : IDL.Text,
  });
  const StreamingCallbackResponse = IDL.Record({
    'token' : IDL.Opt(StreamingCallbackToken),
    'body' : IDL.Vec(IDL.Nat8),
  });
  const StreamingCallback = IDL.Func(
      [StreamingCallbackToken],
      [StreamingCallbackResponse],
      ['query'],
    );
  const StreamingStrategy = IDL.Variant({
    'Callback' : IDL.Record({
      'token' : StreamingCallbackToken,
      'callback' : StreamingCallback,
    }),
  });
  const Response = IDL.Record({
    'body' : IDL.Vec(IDL.Nat8),
    'headers' : IDL.Vec(HeaderField),
    'streaming_strategy' : IDL.Opt(StreamingStrategy),
    'status_code' : IDL.Nat16,
  });
  return IDL.Service({
    'getCycles' : IDL.Func([], [IDL.Nat], ['query']),
    'getEquivalentToken1Estimate' : IDL.Func([IDL.Nat], [IDL.Nat], []),
    'getEquivalentToken2Estimate' : IDL.Func([IDL.Nat], [IDL.Nat], []),
    'getHeapSize' : IDL.Func([], [IDL.Nat], ['query']),
    'getMemorySize' : IDL.Func([], [IDL.Nat], ['query']),
    'getShares' : IDL.Func([IDL.Principal], [IDL.Nat], ['query']),
    'getSwapToken1Estimate' : IDL.Func([IDL.Nat], [IDL.Nat], []),
    'getSwapToken1EstimateGivenToken2' : IDL.Func([IDL.Nat], [TxReceipt], []),
    'getSwapToken2Estimate' : IDL.Func([IDL.Nat], [IDL.Nat], []),
    'getSwapToken2EstimateGivenToken1' : IDL.Func([IDL.Nat], [TxReceipt], []),
    'getWithdrawEstimate' : IDL.Func(
        [IDL.Nat],
        [IDL.Record({ 'share1' : IDL.Nat, 'share2' : IDL.Nat })],
        [],
      ),
    'http_request' : IDL.Func([Request], [Response], ['query']),
    'price' : IDL.Func([], [IDL.Nat], []),
    'provide' : IDL.Func([IDL.Nat, IDL.Nat], [TxReceipt], []),
    'swapToken1' : IDL.Func([IDL.Nat, IDL.Nat], [TxReceipt], []),
    'swapToken2' : IDL.Func([IDL.Nat, IDL.Nat], [TxReceipt], []),
    'withdraw' : IDL.Func([IDL.Nat], [TxReceipt], []),
  });
};
export const init = ({ IDL }: any) => { return []; };