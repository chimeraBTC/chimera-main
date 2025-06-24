// HTTP client and type imports
import axios from "axios";
import {
  GOMAESTRO_URL,
  GOMAESTRO_PRIVATE_KEY,
  MEMPOOL_API,
  MAX_RETRIES,
  TEST_MODE,
} from "../config/config";
import type { IRuneUtxo } from "../types/type";

// Interface for Bitcoin transaction data
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

// Fetches raw transaction hex by transaction ID from mempool.space
export const getTxHexById = async (txId: string) => {
  try {
    // Construct the URL for the mempool.space API, using testnet if in test mode
    const { data } = await axios.get(
      `https://mempool.space/${TEST_MODE ? "testnet4/" : ""}api/tx/${txId}/hex`
    );

    return data as string;
  } catch (error) {
    // Log the error for debugging purposes
    console.log("Mempool api error. Can not get transaction hex");

    // Throw a user-friendly error message
    throw "Mempool api is not working now. Try again later";
  }
};

// Gets UTXOs for a Bitcoin address from mempool.space
export const fetchMempoolUtxo = async (address: string) => {
  // Construct the URL to fetch UTXOs for the given address
  const url = `${MEMPOOL_API}/address/${address}/utxo`;
  
  // Make the API request to get UTXOs
  const res = await axios.get(url);
  
  // Type the response data as an array of Transactions
  const fetchData: Transaction[] = res.data;
  
  // Extract only the necessary fields (txid and value) from each UTXO
  const result = fetchData.map(({ txid, value }) => ({ txid, value }));
  
  return result;
};

// Retrieves Rune balances for an address using GoMaestro API
export const getRuneBalanceList = async (address: string) => {
  try {
    // Construct the URL to fetch Rune balances for the given address
    const url = `${GOMAESTRO_URL}/addresses/${address}/runes`;
    
    // Set up the request configuration with the API key
    const config = {
      headers: {
        "api-key": GOMAESTRO_PRIVATE_KEY,  // Authenticate with the GoMaestro API
      },
    };

    // Make the authenticated API request
    const res = await axios.get(url, { ...config });

    // Return the data from the response
    return res.data.data;
  } catch (error) {
    // Log the error and return an empty array as a fallback
    console.log("Error Occurs While Fetch Rune List Balance => ", error);
    return [];
  }
};

// Calculates total Rune amount and gets divisibility info
export const analyzeRuneInfo = async (
  runeUtxo: IRuneUtxo[],
  runeId: string
) => {
  // Calculate the total amount of Runes by summing up all UTXOs
  const totalAmount = runeUtxo.reduce((accumulator, utxo) => {
    return Number(accumulator) + Number(utxo.amount);
  }, 0);

  // Construct the URL to fetch Rune details
  const url = `${GOMAESTRO_URL}/assets/runes/${runeId}`;

  // Set up the request configuration with the API key
  const config = {
    headers: {
      "api-key": GOMAESTRO_PRIVATE_KEY,  // Authenticate with the GoMaestro API
    },
  };

  // Fetch the Rune details
  const res = await axios.get(url, { ...config });

  // Return the total amount and divisibility
  return {
    runeTotalAmount: totalAmount,           // Total amount of Runes
    divisibility: res.data.data.divisibility, // Decimal places for the Rune
  };
};

// Returns a random number between min (inclusive) and max (exclusive)
export const getRandomNumber = (min: number, max: number) => {
  return Math.floor(Math.random() * (max - min)) + min;
};

// Polls mempool.space to check if a transaction is confirmed
export const checkTxValidation = async (txId: string) => {
  // Construct the URL to check transaction status (hardcoded to testnet)
  const txVerifyUrl = `https://ordinalgenesis.mempool.space/testnet4/api/tx/${txId}`;
  let i = 0;  // Attempt counter

  // Keep trying until we get a confirmation or hit the attempt limit
  while (1) {
    try {
      // Wait for 5 seconds before checking
      await new Promise((resolve) => setTimeout(resolve, 5000));

      // Check the transaction status
      const res = await axios.get(txVerifyUrl);

      // If the transaction is confirmed, return true
      if (res.data.status.confirmed) {
        return true;
      }

      // Increment the attempt counter
      i++;
      
      // If we've reached the maximum number of attempts, give up
      if (i > 10) {
        return false;
      }
    } catch (error) {
      // Log that the transaction is not confirmed yet
      console.log("Tx is not confirmed yet");
      
      // Increment the attempt counter on error too
      i++;
      
      // If we've reached the maximum number of attempts, give up
      if (i > 10) {
        return false;
      }
    }
  }
};
