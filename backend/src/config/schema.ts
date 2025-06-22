export const SwapInscriptionRuneSchema = {
  struct: {
    inscription_txid: "string",
    inscription_vout: "u32",
    user_swap_psbt: { array: { type: "u8" } },
  },
};

export const SwapRuneInscriptionSchema = {
  struct: {
    rune_txids: { array: { type: "string" } },
    rune_vouts: { array: { type: "u32" } },
    user_swap_psbt: { array: { type: "u8" } },
  },
};

export const SwapRuneSchema = {
  struct: {
    txids: { array: { type: "string" } },
    vouts: { array: { type: "u32" } },
    user_swap_tx: { array: { type: "u8" } },
  },
};
