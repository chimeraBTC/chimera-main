import axios from "axios";
import {
  GOMAESTRO_URL,
  GOMAESTRO_PRIVATE_KEY,
  MEMPOOL_API,
  MAX_RETRIES,
  TEST_MODE,
} from "../config/config";
import type { IRuneUtxo } from "../types/type";

interface Transaction {
  txid: string;
  vout: number;
  status: {
    confirmed: boolean;
    block_height: number;
    block_hash: string;
    block_time: number;
  };
  value: number;
}

export const getTxHexById = async (txId: string) => {
  try {
    const { data } = await axios.get(
      `https://mempool.space/${TEST_MODE ? "testnet4/" : ""}api/tx/${txId}/hex`
    );

    return data as string;
  } catch (error) {
    console.log("Mempool api error. Can not get transaction hex");

    throw "Mempool api is not working now. Try again later";
  }
};

export const fetchMempoolUtxo = async (address: string) => {
  const url = `${MEMPOOL_API}/address/${address}/utxo`;
  const res = await axios.get(url);
  const fetchData: Transaction[] = res.data;
  const result = fetchData.map(({ txid, value }) => ({ txid, value }));
  return result;
};

export const getRuneBalanceList = async (addrress: string) => {
  try {
    const url = `${GOMAESTRO_URL}/addresses/${addrress}/runes`;
    const config = {
      headers: {
        "api-key": GOMAESTRO_PRIVATE_KEY,
      },
    };

    const res = await axios.get(url, { ...config });

    return res.data.data;
  } catch (error) {
    console.log("Error Occurs While Fetch Rune List Balance => ", error);
    return [];
  }
};

export const analyzeRuneInfo = async (
  runeUtxo: IRuneUtxo[],
  runeId: string
) => {
  const totalAmount = runeUtxo.reduce((accumulator, utxo) => {
    return Number(accumulator) + Number(utxo.amount);
  }, 0);

  const url = `${GOMAESTRO_URL}/assets/runes/${runeId}`;

  const config = {
    headers: {
      "api-key": GOMAESTRO_PRIVATE_KEY,
    },
  };

  const res = await axios.get(url, { ...config });

  return {
    runeTotalAmount: totalAmount,
    divisibility: res.data.data.divisibility,
  };
};

export const getRandomNumber = (min: number, max: number) => {
  return Math.floor(Math.random() * (max - min)) + min;
};

export const checkTxValidation = async (txId: string) => {
  const txVerifyUrl = `https://ordinalgenesis.mempool.space/testnet4/api/tx/${txId}`;
  let i = 0;

  while (1) {
    try {
      await new Promise((resolve) => setTimeout(resolve, 5000));

      const res = await axios.get(txVerifyUrl);

      if (res.data.version) {
        break;
      }
    } catch (error) {
      console.log("Finally Bug Here");
      if (i === MAX_RETRIES - 1) {
        console.log(error);
        return false;
      }
    }
    i++;
  }

  return true;
};
