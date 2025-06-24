/**
 * ETF Swap Routes Module
 * 
 * This module defines all ETF (Exchange-Traded Fund) swap-related API endpoints for the CHIMERA application.
 * It handles the generation and processing of PSBTs (Partially Signed Bitcoin Transactions)
 * specifically for ETF token swaps, where users can swap between ETF tokens and their underlying
 * Rune token components in a 1:10 ratio.
 */

import { Router } from "express";
import {
  preGenerateRuneSwap,
  pushSwapPsbt,
  getSmartContractRuneBalance,
} from "../../controller/ETFswap.Controller";

// Create a new router instance for swap-related endpoints
const ETFRoute = Router();

/**
 * @route POST /pre-generate-etf-swap
 * @description Initiates a new ETF token swap by generating the necessary PSBTs. This endpoint is specifically
 *              designed for ETF operations where 1 ETF token can be exchanged for 10 underlying Rune tokens
 *              in a single atomic transaction.
 * 
 * @param {string} req.body.walletType - Type of wallet being used (e.g., UNISAT, XVERSE)
 * @param {string} req.body.userPaymentAddress - User's payment address for transaction fees
 * @param {string} req.body.userPaymentPubkey - User's payment public key in hex format
 * @param {string} req.body.userOrdinalAddress - User's ordinal address holding the ETF tokens
 * @param {string} req.body.userOrdinalPubkey - User's ordinal public key in hex format
 * @param {number} req.body.runeAmount - Amount of Rune tokens to swap (must be in multiples of 10 for ETF operations)
 * 
 * @returns {Object} Response containing:
 *   - Multiple PSBTs in both hex and base64 formats for the ETF swap transaction
 *   - Signing indexes for multi-signature requirements
 *   - Transaction details for user confirmation
 */
ETFRoute.post("/pre-generate-etf-swap", async (req, res) => {
  try {
    console.log("Pre Generate ETF Swap");

    const {
      walletType,
      userPaymentAddress,
      userPaymentPubkey,
      userOrdinalAddress,
      userOrdinalPubkey,
      runeAmount,
    } = req.body;

    const {
      firstHex,
      firstBase64,
      secondHex,
      secondBase64,
      thirdHex,
      thirdBase64,
      forthHex,
      forthBase64,
      signOrdinalIndexes,
      signPaymentIndexes_first,
      signPaymentIndexes_second,
      signPaymentIndexes_third,
      signPaymentIndexes_forth,
      txids,
      vouts,
    } = await preGenerateRuneSwap(
      walletType,
      userPaymentAddress,
      userPaymentPubkey,
      userOrdinalAddress,
      userOrdinalPubkey,
      runeAmount
    );

    res.status(200).json({
      success: true,
      firstHex,
      firstBase64,
      secondHex,
      secondBase64,
      thirdHex,
      thirdBase64,
      forthHex,
      forthBase64,
      signOrdinalIndexes,
      signPaymentIndexes_first,
      signPaymentIndexes_second,
      signPaymentIndexes_third,
      signPaymentIndexes_forth,
      txids,
      vouts,
    });
  } catch (error: any) {
    console.error("Pre Generate Rune Swap", error);
    res.status(500).send({ error });
  }
});

/**
 * @route POST /push-swap-psbt
 * @description Pushes a signed PSBT to complete a swap transaction
 * @param {string} req.body.walletType - Type of wallet being used
 * @param {string} req.body.signedPSBT - The signed PSBT in base64 format
 * @param {string[]} req.body.txids - Array of transaction IDs
 * @param {number[]} req.body.vouts - Array of output indices
 * @returns {Object} Success status
 */
ETFRoute.post("/push-swap-psbt", async (req, res) => {
  try {
    console.log("Push Swap Psbt");

    const { walletType, signedPSBT, txids, vouts } = req.body;

    const response = await pushSwapPsbt(walletType, signedPSBT, txids, vouts);

    res.status(200).json({
      success: true,
    });
  } catch (error: any) {
    console.error("Pre Generate Rune Swap", error);
    res.status(500).send({ error });
  }
});

/**
 * @route GET /get-rune-balance-list
 * @description Retrieves the Rune token balance list from the smart contract
 * @returns {Object} Response containing the list of Rune balances
 */
ETFRoute.get("/get-rune-balance-list", async (req, res) => {
  try {
    const response = await getSmartContractRuneBalance();

    res.status(200).json({
      success: true,
      list: response,
    });
  } catch (error) {
    console.error("Get Rune Smart Contract Balance List => ", error);
    res.status(500).send({ error });
  }
});

// Export the configured router for use in the main application
export default ETFRoute;
