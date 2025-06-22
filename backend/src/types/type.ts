export interface IRuneUtxo {
  txid: string;
  vout: number;
  amount: number;
  value: number;
}

export interface IInscriptionUtxo {
  txid: string;
  vout: number;
  value: number;
}

export interface ISendValue {
  inscription_txid: string;
  inscription_vout: number;
  user_swap_psbt: Uint8Array;
}

export interface PoolStatsResponse {
  id: string;
  tvl_now: string;
  tvl_24h_ago: string;
  tvl_diff: string;
  volume_24h: string;
  volume_diff_24h: string;
  fees_24h: string;
  apy_24h: string;
  apy: string;
  volume_7d: string;
  fees_7d: string;
  apy_7d: string;
  price: string;
  token0Amount: string;
  token1Amount: string;
  token0: {
    id: string;
    name: string;
    displayName: string;
    symbol: string;
    tradeable: boolean;
    verified: boolean;
    icon: null | string;
    priority: number;
    type: "rare_sat" | "rune" | "btc";
    divisibility: number;
    supply: string;
    batchSize: string;
    transactionId?: undefined | string;
    createdAt: string;
  };
  token1: {
    id: string;
    name: string;
    displayName: string;
    symbol: string;
    tradeable: boolean;
    verified: boolean;
    icon: null | string;
    priority: number;
    type: "rare_sat" | "rune" | "btc";
    divisibility: number;
    supply: string;
    batchSize: string;
    transactionId?: undefined | string;
    createdAt: string;
  };
  liquidity: string;
  fee_rate: number;
}
