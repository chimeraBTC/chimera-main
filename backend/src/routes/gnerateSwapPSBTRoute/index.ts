import { Router } from "express";
import {
  preGeneratePSBT,
  sendInscription,
  pushPSBT,
  preGenerateReconvertPSBT,
  pushReconvertPSBT,
  preGenerateClaimPSBT,
} from "../../controller/generatePSBT.Controller";

let requestCount = 0;
let currentSecond = Math.floor(Date.now() / 1000);

const GenerateSwapPSBTRoute = Router();

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

export default GenerateSwapPSBTRoute;
