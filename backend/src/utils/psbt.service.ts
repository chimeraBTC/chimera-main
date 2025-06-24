/**
 * PSBT (Partially Signed Bitcoin Transaction) Service
 * 
 * This module provides essential functions for working with Bitcoin transactions,
 * including fee estimation, transaction fee calculation, and transaction broadcasting.
 * It serves as a utility layer between the application and the Bitcoin network.
 * 
 * Dependencies:
 * - bitcoinjs-lib: For Bitcoin transaction building and manipulation
 * - tiny-secp256k1: For elliptic curve cryptography operations
 * - axios: For making HTTP requests to blockchain APIs
 */

// Import required libraries
import * as Bitcoin from "bitcoinjs-lib";  // Bitcoin transaction building library
import * as ecc from "tiny-secp256k1";      // Elliptic curve cryptography for Bitcoin
import axios from "axios";                   // HTTP client for API requests
import { TEST_MODE, SIGNATURE_SIZE } from "../config/config";  // Application configuration

// Initialize the Bitcoin library with the ECC implementation
// This is required before any Bitcoin operations can be performed
Bitcoin.initEccLib(ecc);

/**
 * Fetches the current recommended fee rate from the mempool.space API
 * 
 * This function queries the mempool.space API to get the current recommended
 * fee rates for different confirmation targets. It returns the 'fastest' fee rate
 * with a minimum of 5 satoshis per byte.
 * 
 * @returns {Promise<number>} The recommended fee rate in satoshis per byte (minimum 5)
 * @throws May throw errors if the API is unavailable
 */
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

/**
 * Calculates the estimated transaction fee based on transaction size and fee rate
 * 
 * This function estimates the transaction size in virtual bytes (vbytes) based on the
 * number of inputs and outputs, then calculates the fee by multiplying by the fee rate.
 * Includes a 50% safety margin to account for size estimation inaccuracies.
 * 
 * @param vinsLength - Number of transaction inputs (UTXOs being spent)
 * @param voutsLength - Number of transaction outputs (excluding change)
 * @param feeRate - Fee rate in satoshis per virtual byte
 * @param includeChangeOutput - Whether to include a change output in the size calculation (0 = no, 1 = yes)
 * @returns The estimated transaction fee in satoshis
 */
export const calculateTxFee = (
  vinsLength: number,
  voutsLength: number,
  feeRate: number,
  includeChangeOutput: 0 | 1 = 1
) => {
  // Base transaction size in virtual bytes (version, locktime, etc.)
  const baseTxSize = 10;
  // Approximate size of a typical P2WPKH input in vbytes
  const inSize = 180;
  // Approximate size of a typical P2WPKH output in vbytes
  const outSize = 34;

  // Calculate total transaction size in vbytes
  const txSize =
    baseTxSize + // Base transaction overhead
    vinsLength * inSize + // Size of all inputs
    voutsLength * outSize + // Size of all outputs
    includeChangeOutput * outSize; // Add change output if needed
  
  // Calculate fee with 1.5x multiplier for safety margin
  const fee = Math.round(txSize * feeRate * 1.5);
  return fee;
};

/**
 * Broadcasts a raw transaction to the Bitcoin network
 * 
 * This function sends a raw transaction to the mempool.space API for broadcasting
 * to the Bitcoin network. It's currently hardcoded to use the testnet endpoint.
 * 
 * @param rawTx - The raw transaction in hexadecimal format
 * @returns The transaction ID (txid) if successful
 * @throws May throw errors if the broadcast fails
 */
export const pushRawTx = async (rawTx: string) => {
  // TODO: Make the network configurable instead of hardcoding testnet
  const txid = await postData(`https://mempool.space/testnet4/api/tx`, rawTx);
  
  // For testing without actually broadcasting
  // const txid = "test";
  
  console.log("pushed txid", txid);
  return txid;
};

/**
 * Internal helper function to send HTTP POST requests with retry logic
 * 
 * This function handles all HTTP POST requests with built-in retry logic for
 * transient errors. It's used internally by other functions in this module.
 * 
 * @param url - The URL to send the request to
 * @param json - The data to send in the request body
 * @param content_type - The Content-Type header value (defaults to "text/plain")
 * @param apikey - Optional API key for authentication
 * @returns The response data from the server
 * @throws Error for non-retryable failures
 */
const postData = async (
  url: string,
  json: any,
  content_type = "text/plain",
  apikey = ""
) => {
  // Retry loop for handling transient errors
  while (1) {
    try {
      // Prepare request headers
      const headers: any = {};

      // Set Content-Type header if provided
      if (content_type) headers["Content-Type"] = content_type;

      // Add API key to headers if provided
      if (apikey) headers["X-Api-Key"] = apikey;
      
      // Execute the POST request with the provided data and headers
      const res = await axios.post(url, json, {
        headers,
      });

      // Return the successful response data
      return res.data;
    } catch (err: any) {
      // Extract error details from the Axios error
      const axiosErr = err;
      
      // Log the error response for debugging
      console.log("push tx error", axiosErr.response?.data);

      // Check if this is a "too-long-mempool-chain" error which is retryable
      // This specific error occurs when there are too many unconfirmed transactions
      // from the same address in the mempool
      if (
        !(axiosErr.response?.data).includes(
          'sendrawtransaction RPC error: {"code":-26,"message":"too-long-mempool-chain,'
        )
      )
        // For non-retryable errors, throw an exception
        throw new Error("Got an err when push tx");
      
      // If we get here, it's a retryable error and the loop will continue
    }
  }
};
