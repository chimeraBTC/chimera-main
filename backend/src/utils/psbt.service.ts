import * as Bitcoin from "bitcoinjs-lib";
import * as ecc from "tiny-secp256k1";
import axios from "axios";
import { TEST_MODE, SIGNATURE_SIZE } from "../config/config";

Bitcoin.initEccLib(ecc);

export const getFeeRate = async () => {
  try {
    const url = `https://mempool.space/${
      TEST_MODE ? "testnet4/" : ""
    }api/v1/fees/recommended`;

    const res = await axios.get(url);

    return res.data.fastestFee < 5 ? 5 : res.data.fastestFee;
  } catch (error) {
    console.log("Ordinal api is not working now. Try again later");
    return 5;
  }
};

export const calculateTxFee = (
  vinsLength: number,
  voutsLength: number,
  feeRate: number,
  includeChangeOutput: 0 | 1 = 1
) => {
  const baseTxSize = 10;
  const inSize = 180;
  const outSize = 34;

  const txSize =
    baseTxSize +
    vinsLength * inSize +
    voutsLength * outSize +
    includeChangeOutput * outSize;
  const fee = Math.round(txSize * feeRate * 1.5);
  return fee;
};

export const pushRawTx = async (rawTx: string) => {
  const txid = await postData(`https://mempool.space/testnet4/api/tx`, rawTx);
  // const txid = "test";
  console.log("pushed txid", txid);
  return txid;
};

const postData = async (
  url: string,
  json: any,
  content_type = "text/plain",
  apikey = ""
) => {
  while (1) {
    try {
      const headers: any = {};

      if (content_type) headers["Content-Type"] = content_type;

      if (apikey) headers["X-Api-Key"] = apikey;
      const res = await axios.post(url, json, {
        headers,
      });

      return res.data;
    } catch (err: any) {
      const axiosErr = err;
      console.log("push tx error", axiosErr.response?.data);

      if (
        !(axiosErr.response?.data).includes(
          'sendrawtransaction RPC error: {"code":-26,"message":"too-long-mempool-chain,'
        )
      )
        throw new Error("Got an err when push tx");
    }
  }
};
