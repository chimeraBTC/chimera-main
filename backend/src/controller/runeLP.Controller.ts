/**
 * Rune Liquidity Pool (LP) Controller
 * 
 * @module RuneLPController
 * @description
 * This module handles all DEX (Decentralized Exchange) related operations for Rune tokens,
 * including liquidity pool interactions, price calculations, and user position management.
 * It serves as the primary interface between the application and the Saturn DEX.
 *
 * Key Features:
 * - User position management in liquidity pools
 * - Real-time token price fetching
 * - Swap price calculations with slippage
 * - Liquidity pool statistics and analytics
 * - Integration with Saturn DEX API
 *
 * @see {@link https://docs.saturnbtc.io/} for Saturn DEX API documentation
 */

// Core Dependencies
import sdk, { type IConnection } from "@saturnbtcio/pools-api-sdk";
import * as bitcoin from "bitcoinjs-lib";
import axios, { type AxiosResponse } from "axios";
import { Decimal } from "decimal.js";

// Application Dependencies
import { postSaturnData } from "../utils/saturn.service";
import { type PoolStatsResponse } from "../types/type";

// Configuration
import {
  SATURN_KEY,          // API key for Saturn DEX
  SATURN_URL,           // Base URL for Saturn API
  POOL_ID,              // ID of the liquidity pool
  RUNE_TOKEN_NAME_1,    // First token in the trading pair
  RUNE_TOKEN_NAME_2,    // Second token in the trading pair
  SATURN_CONNECT_URL,   // Connection URL for Saturn DEX
} from "../config/config";

/**
 * Saturn DEX Connection Configuration
 * 
 * @constant {IConnection} connection
 * @description
 * Configuration object for connecting to the Saturn DEX API.
 * Contains the base URL and authentication headers required for API access.
 * 
 * @property {string} host - The base URL for the Saturn DEX API
 * @property {Object} headers - Authentication headers
 * @property {string} headers['x-api-key'] - API key for authenticating with Saturn DEX
 */
const connection: IConnection = {
  host: SATURN_CONNECT_URL,
  headers: {
    "x-api-key": SATURN_KEY as string,
  },
};

/**
 * Checks if a user has an active position in the liquidity pool
 * 
 * @param {string} pubkey - The user's public key to check for liquidity positions
 * @returns {Promise<boolean>} True if the user has an active position, false otherwise
 * @throws {Error} If there's an error communicating with the Saturn DEX API
 * 
 * @example
 * // Check if a user has a position in the pool
 * const hasPosition = await checkUserPosition('user_public_key_hex');
 * console.log('User has position:', hasPosition);
 */
export const checkUserPosition = async (pubkey: string): Promise<boolean> => {
  try {
    const url = `${SATURN_URL}/v0/user/position/${pubkey}/${POOL_ID}`;
    await axios.get(url);
    return true;
  } catch (error) {
    console.error("Error checking user position:", error);
    return false;
  }
};

/**
 * Fetches the current price of the token from the liquidity pool
 * 
 * @returns {Promise<number>} The current price of the token
 * @throws {Error} If there's an error fetching the price
 * 
 * @example
 * // Get the current token price
 * const price = await getTokenPrice();
 * console.log('Current token price:', price);
 */
export const getTokenPrice = async (): Promise<number> => {
  try {
    const url = `${SATURN_URL}/v0/pool/by-id/${POOL_ID}`;
    const res = await axios.get<{ price: number }>(url);
    return res.data.price;
  } catch (error) {
    console.error("Error fetching token price:", error);
    return 0;
  }
};

/**
 * Calculates the expected output amount for a token swap with the given parameters
 * 
 * @param {number} amount - The amount of tokens to swap
 * @param {number} feeRate - The fee rate for the swap (in basis points)
 * @returns {Promise<number>} The expected output amount after the swap
 * @throws {Error} If there's an error calculating the swap price
 * 
 * @example
 * // Calculate the output for swapping 100 tokens with a 30bps fee
 * const outputAmount = await getTokenSwapPrice(100, 30);
 * console.log('Expected output:', outputAmount);
 */
export const getTokenSwapPrice = async (
  amount: number,
  feeRate: number
): Promise<number> => {
  try {
    const url = `https://api-dev.saturnbtc.io/pool/swap/details?` + 
      `exactIn=true&feeRate=${feeRate}&zeroToOne=true&` +
      `token0=${RUNE_TOKEN_NAME_1}&token1=${RUNE_TOKEN_NAME_2}&amount=${amount}`;
    
    const res = await axios.get<{ price: number }>(url);
    return res.data.price;
  } catch (error) {
    console.error("Error calculating token swap price:", error);
    return 0;
  }
};

/**
 * Retrieves detailed statistics for a specific liquidity pool by its ID
 * 
 * @param {string} poolId - The unique identifier of the liquidity pool
 * @returns {Promise<PoolStatsResponse>} Detailed statistics for the specified pool
 * @throws {Error} If the pool is not found or if there's an error fetching the data
 * 
 * @example
 * // Get statistics for a specific pool
 * const poolStats = await getPoolById('pool_id_here');
 * console.log('Pool TVL:', poolStats.tvl);
 * console.log('24h Volume:', poolStats.volume24h);
 */
export async function getPoolById(poolId: string): Promise<PoolStatsResponse> {
  const response = await fetch(
    `https://indexer-dev.saturnbtc.io/v0/pool/stats/by-ids?poolIds=${poolId}`,
    {
      headers: {
        accept: "*/*",
        "content-type": "application/json",
      },
      body: null,
      method: "GET",
    }
  );

  const poolStats = (await response.json()) as PoolStatsResponse[];
  if (poolStats.length !== 1) {
    throw new Error(`Pool with id ${poolId} not found`);
  }

  return poolStats[0];
}

/**
 * Converts an amount of token0 to its equivalent value in token1 using the given price
 * 
 * @param {string} amount0 - The amount of token0 to convert
 * @param {string} price - The current price of token0 in terms of token1
 * @returns {string} The equivalent amount in token1, rounded to the nearest integer
 * 
 * @example
 * // Convert 100 token0 to token1 with a price of 1.5
 * const token1Amount = convertAmount0ToAmount1('100', '1.5'); // Returns '150'
 */
function convertAmount0ToAmount1(amount0: string, price: string): string {
  const _amount0 = new Decimal(amount0);
  const _price = new Decimal(price);

  return _amount0.times(_price).toFixed(0);
}

/**
 * Converts an amount of token1 to its equivalent value in token0 using the given price
 * 
 * @param {string} amount1 - The amount of token1 to convert
 * @param {string} price - The current price of token0 in terms of token1
 * @returns {string} The equivalent amount in token0, rounded to the nearest integer
 * 
 * @example
 * // Convert 150 token1 to token0 with a price of 1.5
 * const token0Amount = convertAmount1ToAmount0('150', '1.5'); // Returns '100'
 */
function convertAmount1ToAmount0(amount1: string, price: string): string {
  const _amount1 = new Decimal(amount1);
  const _price = new Decimal(price);

  return _amount1.div(_price).toFixed(0);
}

/**
 * Retrieves the pool key for a given public key
 * 
 * @param {string} pubkey - The public key to retrieve the pool key for
 * @returns {Promise<string>} The pool key for the given public key
 * @throws {Error} If there's an error retrieving the pool key
 * 
 * @example
 * // Get the pool key for a public key
 * const poolKey = await getPoolKey('public_key_hex');
 * console.log('Pool key:', poolKey);
 */
export const getPoolKey = async (pubkey: string): Promise<string> => {
  try {
    const url = `${SATURN_URL}/v0/user/position/${pubkey}/${POOL_ID}`;
    const res = await axios.get(url);
    return res.data.owner;
  } catch (error) {
    console.log("Get User Pool Pubkey Error => ", error);
    return "";
  }
};

/**
 * Prepares the assets for deposit into the liquidity pool
 * 
 * @param {string} paymentAddress - The payment address for the deposit
 * @param {string} paymentPubkey - The public key for the payment address
 * @param {string} runeAddress - The Rune address for the deposit
 * @param {string} runePubkey - The public key for the Rune address
 * @param {number} feeRate - The fee rate for the deposit (in basis points)
 * @param {number} amount - The amount of tokens to deposit
 * @param {boolean} type - Whether to deposit token 0 or token 1
 * @returns {Promise<Object>} An object containing the prepared assets and other relevant data
 * @throws {Error} If there's an error preparing the assets
 * 
 * @example
 * // Prepare assets for deposit
 * const preparedAssets = await preDepositAssets('payment_address', 'payment_pubkey', 'rune_address', 'rune_pubkey', 30, 100, true);
 * console.log('Prepared assets:', preparedAssets);
 */
export const preDepositAssets = async (
  paymentAddress: string,
  paymentPubkey: string,
  runeAddress: string,
  runePubkey: string,
  feeRate: number,
  amount: number,
  type: boolean
) => {
  try {
    const checkPosition = await checkUserPosition(runePubkey);
    const poolData = await getPoolById(POOL_ID);
    console.log(poolData.price);
    let amount0;
    let amount1;
    if (type) {
      amount0 = amount.toString();
      amount1 = convertAmount0ToAmount1(amount0, poolData.price);
    } else {
      amount1 = amount.toString();
      amount0 = convertAmount1ToAmount0(amount1, poolData.price);
    }

    const psbtData = await prePosition(
      paymentAddress,
      paymentPubkey,
      runeAddress,
      runePubkey,
      feeRate,
      amount0,
      amount1,
      checkPosition
    );
    console.log(psbtData, amount0, amount1, checkPosition);
    return {
      psbtData,
      amount0: amount0,
      amount1: amount1,
      checkPosition,
    };
  } catch (error) {
    console.log("Error Occurs while Deposit Assets => ", error);
    throw error;
  }
};

/**
 * Prepares a position in the liquidity pool by either opening a new position or increasing liquidity
 * in an existing one based on the user's current position status.
 * 
 * @param {string} paymentAddress - The Bitcoin address used for paying transaction fees
 * @param {string} paymentPubkey - The public key associated with the payment address
 * @param {string} runeAddress - The Rune address for the position
 * @param {string} runePubkey - The public key associated with the Rune address
 * @param {number} feeRate - The fee rate for the transaction (in satoshis/byte)
 * @param {string} amount0 - The amount of token0 to add to the position
 * @param {string} amount1 - The amount of token1 to add to the position
 * @param {boolean} checkPosition - Whether the user has an existing position
 * @returns {Promise<string>} The prepared PSBT (Partially Signed Bitcoin Transaction) in hex format
 * @throws {Error} If there's an error preparing the position
 * 
 * @example
 * // Prepare a new position
 * const psbt = await prePosition(
 *   'payment_address',
 *   'payment_pubkey',
 *   'rune_address',
 *   'rune_pubkey',
 *   5, // feeRate
 *   '1000000', // amount0
 *   '500000',  // amount1
 *   false      // checkPosition
 * );
 */
const prePosition = async (
  paymentAddress: string,
  paymentPubkey: string,
  runeAddress: string,
  runePubkey: string,
  feeRate: number,
  amount0: string,
  amount1: string,
  checkPosition: boolean
) => {
  try {
    if (!checkPosition) {
      // const psbtResponse =
      //   await sdk.functional.v0.pool.open_position.psbt.openPositionPsbt(
      //     connection,
      //     {
      //       token0: RUNE_TOKEN_NAME_1,
      //       token1: RUNE_TOKEN_NAME_2,
      //       amount0,
      //       amount1,
      //       initializeAccountUtxo: true,
      //       feeRate,
      //       pubkey,
      //       address,
      //     }
      //   );
      // return psbtResponse.data;
      const psbtResponse = await postSaturnData(
        `${SATURN_CONNECT_URL}/v0/pool/open-position/psbt`,
        {
          token0: RUNE_TOKEN_NAME_1,
          token1: RUNE_TOKEN_NAME_2,
          amount0,
          amount1,
          initializeAccountUtxo: true,
          feeRate,
          runePubkey,
          runeAddress,
          paymentAddress,
          paymentPubkey,
        }
      );
      return psbtResponse;
    } else {
      // const psbtResponse =
      //   await sdk.functional.v0.pool.increase_liquidity.psbt.increaseLiquidityPsbt(
      //     connection,
      //     {
      //       token0: RUNE_TOKEN_NAME_1,
      //       token1: RUNE_TOKEN_NAME_2,
      //       amount0,
      //       amount1,
      //       initializeAccountUtxo: false,
      //       feeRate,
      //       pubkey,
      //       address,
      //     }
      //   );
      // return psbtResponse.data;
      const psbtResponse: any =
        await sdk.functional.v0.pool.increase_liquidity.psbt.increaseLiquidityPsbt(
          connection,
          {
            runePubkey,
            runeAddress,
            paymentAddress,
            paymentPubkey,
            feeRate,
            amount0: amount0!,
            amount1: amount1!,
            token0: RUNE_TOKEN_NAME_1,
            token1: RUNE_TOKEN_NAME_2,
            initializeAccountUtxo: false,
          }
        );
      return psbtResponse.data.psbt;
    }
  } catch (error) {
    console.log("Error Occurs while Pre Open Position");
    throw error;
  }
};

/**
 * Generates a message hash for the user to sign when interacting with the liquidity pool.
 * This is a security measure to ensure the user authorizes the transaction.
 * 
 * @param {string} paymentAddress - The Bitcoin address used for paying transaction fees
 * @param {string} paymentPubkey - The public key associated with the payment address
 * @param {string} runeAddress - The Rune address for the position
 * @param {string} runePubkey - The public key associated with the Rune address
 * @param {number} feeRate - The fee rate for the transaction (in satoshis/byte)
 * @param {string} amount0 - The amount of token0 to add to the position
 * @param {string} amount1 - The amount of token1 to add to the position
 * @param {string} signedPsbt - The PSBT signed by the user
 * @param {any} account - The user's account information
 * @param {boolean} checkPosition - Whether the user has an existing position
 * @returns {Promise<Object>} The message hash and related data for the user to sign
 * @throws {Error} If there's an error generating the message
 * 
 * @example
 * // Generate a message for a new position
 * const messageData = await generateMessage(
 *   'payment_address',
 *   'payment_pubkey',
 *   'rune_address',
 *   'rune_pubkey',
 *   5,              // feeRate
 *   '1000000',      // amount0
 *   '500000',       // amount1
 *   'signed_psbt',  // signedPsbt
 *   userAccount,    // account
 *   false           // checkPosition
 * );
 */
export const generateMessage = async (
  paymentAddress: string,
  paymentPubkey: string,
  runeAddress: string,
  runePubkey: string,
  feeRate: number,
  amount0: string,
  amount1: string,
  signedPsbt: string,
  account: any,
  checkPosition: boolean
) => {
  try {
    const userPoolPubkey = await getPoolKey(runePubkey);
    const psbtBase64 = bitcoin.Psbt.fromHex(signedPsbt).toBase64();
    let messageHashResponse: any;
    if (!checkPosition) {
      // messageHashResponse =
      //   await sdk.functional.v0.pool.open_position.message.openPositionMessage(
      //     connection,
      //     {
      //       pubkey,
      //       poolId: POOL_ID,
      //       amount0: amount0,
      //       amount1: amount1,
      //       feeRate,
      //       signedPsbt: psbtBase64,
      //       account: account, // From PSBT response
      //       address,
      //     }
      //   );
      messageHashResponse = await postSaturnData(
        `${SATURN_CONNECT_URL}/v0/pool/open-position/message`,
        {
          poolId: POOL_ID,
          amount0,
          amount1,
          feeRate,
          signedPsbt: psbtBase64,
          account: account,
          runePubkey,
          runeAddress,
          paymentAddress,
          paymentPubkey,
        }
      );
    } else {
      // messageHashResponse =
      //   await sdk.functional.v0.pool.increase_liquidity.message.increaseLiquidityMessage(
      //     connection,
      //     {
      //       positionPubKey: userPoolPubkey,
      //       pubkey,
      //       poolId: POOL_ID,
      //       amount0: amount0,
      //       amount1: amount1,
      //       feeRate,
      //       signedPsbt: psbtBase64,
      //       address,
      //     }
      //   );
      messageHashResponse =
        await sdk.functional.v0.pool.increase_liquidity.message.increaseLiquidityMessage(
          connection,
          {
            runeAddress,
            runePubkey,
            paymentPubkey,
            paymentAddress,
            signedPsbt: psbtBase64,
            feeRate,
            poolId: POOL_ID,
            positionPubKey: userPoolPubkey,
            amount0: amount0!,
            amount1: amount1!,
            mergeUtxoPsbt: psbtBase64,
          }
        );
    }
    console.log(
      messageHashResponse,
      psbtBase64,
      account,
      amount0,
      amount1,
      userPoolPubkey
    );
    return {
      message: messageHashResponse,
      psbtBase64,
      account,
      amount0,
      amount1,
      userPoolPubkey,
    };
  } catch (error) {
    console.log("Error while generate Open Message", error);
    throw error;
  }
};

/**
 * Submits a signed message to the DEX to execute a liquidity pool operation.
 * This is the final step in adding or increasing liquidity in a position.
 * 
 * @param {string} paymentAddress - The Bitcoin address used for paying transaction fees
 * @param {string} paymentPubkey - The public key associated with the payment address
 * @param {string} runeAddress - The Rune address for the position
 * @param {string} runePubkey - The public key associated with the Rune address
 * @param {number} feeRate - The fee rate for the transaction (in satoshis/byte)
 * @param {string} amount0 - The amount of token0 being added to the position
 * @param {string} amount1 - The amount of token1 being added to the position
 * @param {string} signedPsbt - The PSBT signed by the user
 * @param {any} account - The user's account information
 * @param {string} signature - The signature of the message hash
 * @param {string} positionPubKey - The public key of the position (if it exists)
 * @param {boolean} checkPosition - Whether the user has an existing position
 * @returns {Promise<Object>} The result of the position update
 * @throws {Error} If there's an error submitting the signed message
 * 
 * @example
 * // Submit a signed message to update a position
 * const result = await submitSignedMessage(
 *   'payment_address',
 *   'payment_pubkey',
 *   'rune_address',
 *   'rune_pubkey',
 *   5,              // feeRate
 *   '1000000',      // amount0
 *   '500000',       // amount1
 *   'signed_psbt',  // signedPsbt
 *   userAccount,    // account
 *   'signature',    // signature
 *   'position_pubkey', // positionPubKey
 *   true            // checkPosition
 * );
 */
export const submitSignedMessage = async (
  paymentAddress: string,
  paymentPubkey: string,
  runeAddress: string,
  runePubkey: string,
  feeRate: number,
  amount0: string,
  amount1: string,
  signedPsbt: string,
  account: any,
  signature: string,
  positionPubKey: string,
  checkPosition: boolean
) => {
  try {
    let positionResponse: any;
    if (!checkPosition) {
      // positionResponse =
      //   await sdk.functional.v0.pool.open_position.openPosition(connection, {
      //     pubkey,
      //     poolId: POOL_ID,
      //     amount0: amount0,
      //     amount1: amount1,
      //     feeRate,
      //     signedPsbt,
      //     account: account, // From PSBT response
      //     signature,
      //     address,
      //   });
      positionResponse = await postSaturnData(
        `${SATURN_CONNECT_URL}/v0/pool/open-position`,
        {
          signature,
          poolId: POOL_ID,
          amount0,
          amount1,
          feeRate,
          signedPsbt,
          account: account,
          runePubkey,
          runeAddress,
          paymentAddress,
          paymentPubkey,
        }
      );
    } else {
      // positionResponse =
      //   await sdk.functional.v0.pool.increase_liquidity.increaseLiquidity(
      //     connection,
      //     {
      //       pubkey,
      //       poolId: POOL_ID,
      //       amount0: amount0,
      //       amount1: amount1,
      //       feeRate,
      //       signedPsbt,
      //       signature,
      //       positionPubKey,
      //       address,
      //     }
      //   );
      positionResponse = await postSaturnData(
        `${SATURN_CONNECT_URL}/v0/pool/increase-liquidity`,
        {
          signature,
          positionPubKey,
          poolId: POOL_ID,
          feeRate,
          signedPsbt,
          amount0,
          amount1,
          runePubkey,
          runeAddress,
          paymentAddress,
          paymentPubkey,
        }
      );
    }
    console.log(positionResponse);
    return positionResponse;
  } catch (error) {
    console.log("Error while Submit Message", error);
    throw error;
  }
};

/**
 * Generates a PSBT (Partially Signed Bitcoin Transaction) for a token swap operation.
 * This prepares the transaction that will execute the swap on the DEX.
 * 
 * @param {string} paymentAddress - The Bitcoin address used for paying transaction fees
 * @param {string} paymentPubkey - The public key associated with the payment address
 * @param {string} runeAddress - The Rune address for the swap
 * @param {string} runePubkey - The public key associated with the Rune address
 * @param {number} feeRate - The fee rate for the transaction (in satoshis/byte)
 * @param {number} amount - The amount of tokens to swap
 * @param {boolean} assetType - If true, swap token0 to token1; if false, swap token1 to token0
 * @returns {Promise<Object>} The generated PSBT and related swap information
 * @throws {Error} If there's an error generating the PSBT
 * 
 * @example
 * // Generate a PSBT for swapping token0 to token1
 * const swapData = await swapGeneratePsbt(
 *   'payment_address',
 *   'payment_pubkey',
 *   'rune_address',
 *   'rune_pubkey',
 *   5,              // feeRate
 *   1000000,        // amount
 *   true            // assetType (true for token0->token1, false for token1->token0)
 * );
 */
export const swapGeneratePsbt = async (
  paymentAddress: string,
  paymentPubkey: string,
  runeAddress: string,
  runePubkey: string,
  feeRate: number,
  amount: number,
  assetType: boolean
) => {
  try {
    const price = await getTokenSwapPrice(amount, feeRate);
    console.log(price);
    let amount0 = 0;
    let amount1 = 0;
    if (assetType) {
      amount0 = Number(amount);
      amount1 = Number(price) * Number(amount);
    } else {
      amount0 = Number(amount);
      amount1 = Number(amount) / Number(price);
    }
    // const psbtResponse: any = await sdk.functional.v0.pool.swap.psbt.swapPsbt(
    //   connection,
    //   {
    //     pubkey: pubkey,
    //     poolId: POOL_ID,
    //     amountIn: Math.trunc(amount0).toString(),
    //     amountOut: Math.trunc(amount1).toString(),
    //     feeRate: feeRate,
    //     zeroToOne: true,
    //     exactIn: true,
    //     address: address,
    //   }
    // );

    const psbtResponse = await postSaturnData(
      `${SATURN_CONNECT_URL}/v0/pool/swap/psbt`,
      {
        poolId: POOL_ID,
        amountIn: Math.trunc(amount0).toString(),
        amountOut: Math.trunc(amount1).toString(),
        feeRate,
        zeroToOne: assetType,
        exactIn: true,
        runePubkey,
        runeAddress,
        paymentAddress,
        paymentPubkey,
      }
    );

    console.log(
      psbtResponse,
      Math.trunc(amount0).toString(),
      Math.trunc(amount1).toString(),
      assetType
    );
  } catch (error) {
    console.log("Swap Generate Psbt error => ", error);
    throw error;
  }
};

/**
 * Generates a message hash for a swap operation that the user needs to sign.
 * This is a security measure to ensure the user authorizes the swap transaction.
 * 
 * @param {string} paymentAddress - The Bitcoin address used for paying transaction fees
 * @param {string} paymentPubkey - The public key associated with the payment address
 * @param {string} runeAddress - The Rune address for the swap
 * @param {string} runePubkey - The public key associated with the Rune address
 * @param {number} feeRate - The fee rate for the transaction (in satoshis/byte)
 * @param {string} amount0 - The amount of token0 to swap
 * @param {string} amount1 - The expected amount of token1 to receive
 * @param {string} signedPsbt - The PSBT signed by the user
 * @param {string} splitRunePsbt - The PSBT for splitting Rune UTXOs (if needed)
 * @param {string[]} shardPubkeys - Array of public keys for shard management
 * @param {boolean} assetType - If true, swap token0 to token1; if false, swap token1 to token0
 * @returns {Promise<Object>} The message hash and related data for the user to sign
 * @throws {Error} If there's an error generating the swap message
 * 
 * @example
 * // Generate a message for a token swap
 * const messageData = await swapMessage(
 *   'payment_address',
 *   'payment_pubkey',
 *   'rune_address',
 *   'rune_pubkey',
 *   5,              // feeRate
 *   '1000000',      // amount0
 *   '500000',       // amount1 (expected output)
 *   'signed_psbt',  // signedPsbt
 *   'split_psbt',   // splitRunePsbt
 *   ['pubkey1', 'pubkey2'], // shardPubkeys
 *   true            // assetType
 * );
 */
export const swapMessage = async (
  paymentAddress: string,
  paymentPubkey: string,
  runeAddress: string,
  runePubkey: string,
  feeRate: number,
  amount0: string,
  amount1: string,
  signedPsbt: string,
  splitRunePsbt: string,
  shardPubkeys: string[],
  assetType: boolean
) => {
  try {
    const psbtBase64 = bitcoin.Psbt.fromHex(signedPsbt).toBase64();
    let splitRunePsbtBase64;
    let psbtResponse;
    if (splitRunePsbt !== "") {
      splitRunePsbtBase64 = bitcoin.Psbt.fromHex(splitRunePsbt).toBase64();
      psbtResponse = await postSaturnData(
        `${SATURN_CONNECT_URL}/v0/pool/swap/message`,
        {
          signedPsbt: psbtBase64,
          splitRunePsbt: splitRunePsbtBase64,
          poolId: POOL_ID,
          amountIn: amount0,
          amountOut: amount1,
          feeRate,
          zeroToOne: assetType,
          exactIn: true,
          runePubkey,
          runeAddress,
          paymentAddress,
          paymentPubkey,
        }
      );
    } else {
      psbtResponse = await postSaturnData(
        `${SATURN_CONNECT_URL}/v0/pool/swap/message`,
        {
          signedPsbt: psbtBase64,
          poolId: POOL_ID,
          amountIn: amount0,
          amountOut: amount1,
          feeRate,
          zeroToOne: assetType,
          exactIn: true,
          runePubkey,
          runeAddress,
          paymentAddress,
          paymentPubkey,
          shardPubkeys,
        }
      );
    }

    console.log(
      psbtResponse,
      psbtBase64,
      splitRunePsbtBase64,
      amount0,
      amount1,
      assetType,
      shardPubkeys
    );
  } catch (error) {
    console.log("Swap Message error => ", error);
    throw error;
  }
};

/**
 * Submits a signed swap transaction to the DEX for execution.
 * This is the final step in executing a token swap.
 * 
 * @param {string} paymentAddress - The Bitcoin address used for paying transaction fees
 * @param {string} paymentPubkey - The public key associated with the payment address
 * @param {string} runeAddress - The Rune address for the swap
 * @param {string} runePubkey - The public key associated with the Rune address
 * @param {number} feeRate - The fee rate for the transaction (in satoshis/byte)
 * @param {string} amount0 - The amount of token0 being swapped
 * @param {string} amount1 - The expected amount of token1 to receive
 * @param {string} signedPsbt - The PSBT signed by the user
 * @param {string} splitRunePsbt - The PSBT for splitting Rune UTXOs (if needed)
 * @param {string} signature - The signature of the swap message
 * @param {string[]} shardPubkeys - Array of public keys for shard management
 * @param {boolean} assetType - If true, swap token0 to token1; if false, swap token1 to token0
 * @returns {Promise<Object>} The result of the swap operation
 * @throws {Error} If there's an error submitting the swap
 * 
 * @example
 * // Submit a signed swap transaction
 * const result = await submitSwap(
 *   'payment_address',
 *   'payment_pubkey',
 *   'rune_address',
 *   'rune_pubkey',
 *   5,              // feeRate
 *   '1000000',      // amount0
 *   '500000',       // amount1 (expected output)
 *   'signed_psbt',  // signedPsbt
 *   'split_psbt',   // splitRunePsbt
 *   'signature',    // signature
 *   ['pubkey1', 'pubkey2'], // shardPubkeys
 *   true            // assetType
 * );
 */
export const submitSwap = async (
  paymentAddress: string,
  paymentPubkey: string,
  runeAddress: string,
  runePubkey: string,
  feeRate: number,
  amount0: string,
  amount1: string,
  signedPsbt: string,
  splitRunePsbt: string,
  signature: string,
  shardPubkeys: string[],
  assetType: boolean
) => {
  try {
    let psbtResponse;
    if (assetType)
      psbtResponse = await postSaturnData(
        `${SATURN_CONNECT_URL}/v0/pool/swap`,
        {
          signedPsbt,
          splitRunePsbt,
          poolId: POOL_ID,
          amountIn: amount0,
          amountOut: amount1,
          feeRate,
          zeroToOne: assetType,
          exactIn: true,
          signature,
          runePubkey,
          runeAddress,
          paymentAddress,
          paymentPubkey,
        }
      );
    else
      psbtResponse = await postSaturnData(
        `${SATURN_CONNECT_URL}/v0/pool/swap`,
        {
          signedPsbt,
          poolId: POOL_ID,
          amountIn: amount0,
          amountOut: amount1,
          feeRate,
          zeroToOne: assetType,
          exactIn: true,
          signature,
          runePubkey,
          runeAddress,
          paymentAddress,
          paymentPubkey,
          shardPubkeys,
        }
      );

    console.log(psbtResponse);
  } catch (error) {
    console.log("Submit Swap error => ", error);
    throw error;
  }
};
