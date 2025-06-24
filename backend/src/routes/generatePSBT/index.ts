/**
 * Generate PSBT Routes Module
 * 
 * This module handles the generation and processing of Partially Signed Bitcoin Transactions (PSBTs)
 * for various operations including inscription, claiming, and rune-related transactions.
 * It includes rate limiting for sensitive operations.
 */

import { Router } from "express";
import {
  preGeneratePSBT,
  sendInscription,
  pushPSBT,
  preGenerateReconvertPSBT,
  pushReconvertPSBT,
  preGenerateClaimPSBT,
} from "../../controller/generatePSBT.Controller";

// Rate limiting variables
let requestCount = 0;
let currentSecond = Math.floor(Date.now() / 1000);

// Create a new router instance for PSBT generation endpoints
const GenerateSwapPSBTRoute = Router();

/**
 * @route POST /pre-send-inscribe-psbt
 * @description Generates a PSBT for sending an inscription
 * @param {string} req.body.userPubkey - User's public key for the transaction
 * @returns {Object} Response containing the generated PSBT in hex format
 */
GenerateSwapPSBTRoute.post("/pre-send-inscribe-psbt", async (req, res) => {
  try {
    console.log("Pre Send Inscription Generate PSBT function called!");

    const { userPubkey } = req.body;

    const { hexPsbt } = await sendInscription(userPubkey);

    res.status(200).json({
      success: true,
      psbt: hexPsbt,
    });
  } catch (error: any) {
    console.error(
      "Error Occurs while pre generate send Inscription PSBT => ",
      error
    );
    res.status(500).send({ error });
  }
});

/**
 * @route POST /pre-claim-generate-psbt
 * @description Generates a PSBT for claiming tokens with rate limiting
 * @param {string} req.body.userAddress - User's Bitcoin address
 * @param {string} req.body.userPubkey - User's public key
 * @returns {Object} Response containing PSBT and related data or rate limit error
 */
GenerateSwapPSBTRoute.post("/pre-claim-generate-psbt", async (req, res) => {
  try {
    console.log("Pre Generate claim PSBT function called!");

    const secondNow = Math.floor(Date.now() / 1000);

    if (secondNow > currentSecond) {
      currentSecond = secondNow;
      requestCount = 0;
    }

    if (requestCount >= 10) {
      res.status(500).json({
        success: false,
        error:
          "There are too many mints in queue. Please try again in 1 minute.",
      });
    } else {
      const { userAddress, userPubkey } = req.body;

      console.log("Claim Address => ", userAddress);

      const { hexPsbt, signIndexes, inscriptionUtxo } =
        await preGenerateClaimPSBT(userAddress, userPubkey);

      res.status(200).json({
        success: true,
        psbt: hexPsbt,
        signIndexes,
        inscriptionUtxo,
      });
    }
  } catch (error: any) {
    console.error("Error Occurs while pre claim step PSBT => ", error);
    res.status(500).json({ error });
  }
});

/**
 * @route POST /pre-inscribe-rune-generate-psbt
 * @description Generates a PSBT for the first step of rune inscription
 * @param {string} req.body.walletType - Type of wallet being used
 * @param {string} req.body.userPaymentAddress - User's payment address
 * @param {string} req.body.userPaymentPubkey - User's payment public key
 * @param {string} req.body.userOrdinalAddress - User's ordinal address
 * @param {string} req.body.userOrdinalPubkey - User's ordinal public key
 * @returns {Object} Response containing PSBT and signing information
 */
GenerateSwapPSBTRoute.post(
  "/pre-inscribe-rune-generate-psbt",
  async (req, res) => {
    try {
      console.log("Pre Generate first step PSBT function called!");

      const {
        walletType,
        userPaymentAddress,
        userPaymentPubkey,
        userOrdinalAddress,
        userOrdinalPubkey,
      } = req.body;

      const {
        base64Psbt,
        hexPsbt,
        signPaymentIndexes,
        signOrdinalIndexes,
        inscriptionUtxo,
      } = await preGeneratePSBT(
        walletType,
        userPaymentAddress,
        userPaymentPubkey,
        userOrdinalAddress,
        userOrdinalPubkey
      );

      res.status(200).json({
        success: true,
        base64Psbt,
        hexPsbt,
        signPaymentIndexes,
        signOrdinalIndexes,
        inscriptionUtxo,
      });
    } catch (error: any) {
      console.error(
        "Error Occurs while pre generate first step PSBT => ",
        error
      );
      res.status(500).send({ error });
    }
  }
);

/**
 * @route POST /push-inscribe-rune-psbt-arch
 * @description Pushes a signed PSBT for inscription to the Arch network
 * @param {string} req.body.walletType - Type of wallet being used
 * @param {string} req.body.userAddress - User's Bitcoin address
 * @param {string} req.body.signedPSBT - Signed PSBT in base64 format
 * @param {Object} req.body.inscriptionUtxo - UTXO containing the inscription
 * @param {boolean} req.body.mint - Whether this is a mint operation
 * @returns {Object} Response containing the transaction ID
 */
GenerateSwapPSBTRoute.post(
  "/push-inscribe-rune-psbt-arch",
  async (req, res) => {
    try {
      console.log("Push to Arch function called!");

      const { walletType, userAddress, signedPSBT, inscriptionUtxo, mint } =
        req.body;

      const { txid } = await pushPSBT(
        walletType,
        userAddress,
        signedPSBT,
        inscriptionUtxo,
        mint
      );

      res.status(200).json({
        success: true,
        txid: txid,
      });
    } catch (error: any) {
      console.error("Push to Arch function => ", error);
      res.status(500).send({ error });
    }
  }
);

/**
 * @route POST /pre-rune-inscribe-generate-psbt
 * @description Generates a PSBT for rune inscription reconversion
 * @param {string} req.body.walletType - Type of wallet being used
 * @param {string} req.body.userPaymentAddress - User's payment address
 * @param {string} req.body.userPaymentPubkey - User's payment public key
 * @param {string} req.body.userOrdinalAddress - User's ordinal address
 * @param {string} req.body.userOrdinalPubkey - User's ordinal public key
 * @param {string} req.body.inscriptionId - ID of the inscription to reconvert
 * @returns {Object} Response containing PSBT and related data
 */
GenerateSwapPSBTRoute.post(
  "/pre-rune-inscribe-generate-psbt",
  async (req, res) => {
    try {
      console.log("Pre Generate first step PSBT function called!");

      const {
        walletType,
        userPaymentAddress,
        userPaymentPubkey,
        userOrdinalAddress,
        userOrdinalPubkey,
        inscriptionId,
      } = req.body;

      const {
        base64Psbt,
        hexPsbt,
        signPaymentIndexes,
        signOrdinalIndexes,
        runeUtxos,
        remainAmount,
      } = await preGenerateReconvertPSBT(
        walletType,
        userPaymentAddress,
        userPaymentPubkey,
        userOrdinalAddress,
        userOrdinalPubkey,
        inscriptionId
      );

      res.status(200).json({
        success: true,
        base64Psbt,
        hexPsbt,
        signPaymentIndexes,
        signOrdinalIndexes,
        runeUtxos,
        remainAmount,
      });
    } catch (error: any) {
      console.error(
        "Error Occurs while pre generate first step PSBT => ",
        error
      );
      res.status(500).send({ error });
    }
  }
);

/**
 * @route POST /push-rune-inscribe-psbt-arch
 * @description Pushes a signed PSBT for rune inscription to the Arch network
 * @param {string} req.body.walletType - Type of wallet being used
 * @param {string} req.body.signedPSBT - Signed PSBT in base64 format
 * @param {Array} req.body.runeUtxos - Array of Rune UTXOs to include
 * @returns {Object} Response containing the transaction ID
 */
GenerateSwapPSBTRoute.post(
  "/push-rune-inscribe-psbt-arch",
  async (req, res) => {
    try {
      console.log("Pre Generate first step PSBT function called!");

      const { walletType, signedPSBT, runeUtxos } = req.body;

      const { txid } = await pushReconvertPSBT(
        walletType,
        signedPSBT,
        runeUtxos
      );

      res.status(200).json({
        success: true,
        txid,
      });
    } catch (error: any) {
      console.error(
        "Error Occurs while pre generate first step PSBT => ",
        error
      );
      res.status(500).send({ error });
    }
  }
);

// Export the configured router for use in the main application
export default GenerateSwapPSBTRoute;
