/**
 * Schema definition for swapping an inscription for Rune tokens.
 * This schema is used to validate and structure the data required for
 * swapping an ordinal inscription for Rune tokens in the CHIMERA ecosystem.
 * 
 * @constant {Object} SwapInscriptionRuneSchema
 * @property {Object} struct - Defines the structure of the swap data
 * @property {string} struct.inscription_txid - Transaction ID of the inscription being swapped
 * @property {number} struct.inscription_vout - Output index of the inscription UTXO
 * @property {Object} struct.user_swap_psbt - The PSBT (Partially Signed Bitcoin Transaction) for the swap
 * @property {number[]} struct.user_swap_psbt.array - Array of bytes representing the PSBT
 * 
 * @example
 * {
 *   inscription_txid: 'abc123...',
 *   inscription_vout: 0,
 *   user_swap_psbt: [1, 2, 3, ...] // PSBT bytes
 * }
 */
export const SwapInscriptionRuneSchema = {
  struct: {
    inscription_txid: "string",
    inscription_vout: "u32",
    user_swap_psbt: { array: { type: "u8" } },
  },
};

/**
 * Schema definition for swapping Rune tokens for an inscription.
 * This schema is used to validate and structure the data required for
 * swapping Rune tokens for an ordinal inscription in the CHIMERA ecosystem.
 * 
 * @constant {Object} SwapRuneInscriptionSchema
 * @property {Object} struct - Defines the structure of the swap data
 * @property {string[]} struct.rune_txids - Array of transaction IDs containing the Rune UTXOs
 * @property {number[]} struct.rune_vouts - Array of output indices for the Rune UTXOs
 * @property {Object} struct.user_swap_psbt - The PSBT for the swap transaction
 * @property {number[]} struct.user_swap_psbt.array - Array of bytes representing the PSBT
 * 
 * @example
 * {
 *   rune_txids: ['txid1', 'txid2'],
 *   rune_vouts: [0, 1],
 *   user_swap_psbt: [1, 2, 3, ...] // PSBT bytes
 * }
 */
export const SwapRuneInscriptionSchema = {
  struct: {
    rune_txids: { array: { type: "string" } },
    rune_vouts: { array: { type: "u32" } },
    user_swap_psbt: { array: { type: "u8" } },
  },
};

/**
 * Schema definition for Rune-to-Rune swaps.
 * This schema is used to validate and structure the data required for
 * swapping between different Rune tokens in the CHIMERA ecosystem.
 * 
 * @constant {Object} SwapRuneSchema
 * @property {Object} struct - Defines the structure of the swap data
 * @property {string[]} struct.txids - Array of transaction IDs containing the input Rune UTXOs
 * @property {number[]} struct.vouts - Array of output indices for the input Rune UTXOs
 * @property {Object} struct.user_swap_tx - The raw transaction data for the swap
 * @property {number[]} struct.user_swap_tx.array - Array of bytes representing the raw transaction
 * 
 * @example
 * {
 *   txids: ['txid1', 'txid2'],
 *   vouts: [0, 1],
 *   user_swap_tx: [1, 2, 3, ...] // Raw transaction bytes
 * }
 */
export const SwapRuneSchema = {
  struct: {
    txids: { array: { type: "string" } },
    vouts: { array: { type: "u32" } },
    user_swap_tx: { array: { type: "u8" } },
  },
};
