/**
 * Represents a UTXO (Unspent Transaction Output) containing Rune tokens
 * 
 * @property {string} txid - The transaction ID where this UTXO was created
 * @property {number} vout - The output index in the transaction
 * @property {number} amount - The amount of Rune tokens in this UTXO
 * @property {number} value - The value in satoshis (1/100,000,000 BTC)
 */
export interface IRuneUtxo {
  txid: string;
  vout: number;
  amount: number;
  value: number;
}

/**
 * Represents a UTXO containing an inscription (ordinal/BRC-20)
 * 
 * @property {string} txid - The transaction ID where this UTXO was created
 * @property {number} vout - The output index in the transaction
 * @property {number} value - The value in satoshis (1/100,000,000 BTC)
 */
export interface IInscriptionUtxo {
  txid: string;
  vout: number;
  value: number;
}

/**
 * Represents the data needed to send a value in a transaction
 * 
 * @property {string} inscription_txid - The transaction ID of the inscription
 * @property {number} inscription_vout - The output index of the inscription
 * @property {Uint8Array} user_swap_psbt - The PSBT (Partially Signed Bitcoin Transaction) for the swap
 */
export interface ISendValue {
  inscription_txid: string;
  inscription_vout: number;
  user_swap_psbt: Uint8Array;
}

/**
 * Represents the statistics and current state of a liquidity pool
 * 
 * @property {string} id - Unique identifier for the pool
 * @property {string} tvl_now - Total Value Locked (TVL) in the pool at current time
 * @property {string} tvl_24h_ago - TVL 24 hours ago
 * @property {string} tvl_diff - Difference in TVL from 24 hours ago
 * @property {string} volume_24h - Trading volume in the last 24 hours
 * @property {string} volume_diff_24h - Volume difference from previous 24h period
 * @property {string} fees_24h - Fees collected in the last 24 hours
 * @property {string} apy_24h - Annual Percentage Yield based on last 24h
 * @property {string} apy - Current APY (may be calculated differently)
 * @property {string} volume_7d - Trading volume in the last 7 days
 * @property {string} fees_7d - Fees collected in the last 7 days
 * @property {string} apy_7d - Annual Percentage Yield based on last 7d
 * @property {string} price - Current price of the pool's token
 * @property {string} token0Amount - Amount of token0 in the pool
 * @property {string} token1Amount - Amount of token1 in the pool
 * @property {Object} token0 - Information about the first token in the pool
 * @property {string} token0.id - Unique identifier for the token
 * @property {string} token0.name - Full name of the token
 * @property {string} token0.displayName - Display name for the token
 * @property {string} token0.symbol - Ticker symbol of the token
 * @property {boolean} token0.tradeable - Whether the token is currently tradeable
 * @property {boolean} token0.verified - Whether the token has been verified
 * @property {string | null} token0.icon - URL to the token's icon, if available
 * @property {number} token0.priority - Display/sorting priority
 * @property {'rare_sat' | 'rune' | 'btc'} token0.type - Type of the token
 * @property {number} token0.divisibility - Number of decimal places
 * @property {string} token0.supply - Total supply of the token
 * @property {string} token0.batchSize - Batch size for transactions
 * @property {string} [token0.transactionId] - Transaction ID where the token was created
 * @property {string} token0.createdAt - ISO timestamp of token creation
 */
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
