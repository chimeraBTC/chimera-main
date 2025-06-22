import { Router } from "express";
import {
  preGenerateRuneSwap,
  pushSwapPsbt,
  getSmartContractRuneBalance,
} from "../../controller/swap.Controller";

const ETFRoute = Router();

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

export default ETFRoute;
