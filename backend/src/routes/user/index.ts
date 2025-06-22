import { Router } from "express";
import {
  getRuneBalance,
  getInscriptionList,
  getMintCount,
  getETFRuneBalance,
} from "../../controller/userData.Controller";

const UserRoute = Router();

UserRoute.get("/get-mint-count", async (req, res) => {
  try {
    console.log("Get Mint Count");

    const count = await getMintCount();

    res.status(200).json({
      success: true,
      count,
    });
  } catch (error: any) {
    console.error("Get Inscription List", error);
    res.status(500).send({ error });
  }
});

UserRoute.post("/get-rune-balance", async (req, res) => {
  try {
    console.log("Get User Rune Balance");

    const { userAddress } = req.body;

    const { balance } = await getRuneBalance(userAddress);

    console.log(balance);

    res.status(200).json({
      success: true,
      balance: balance,
    });
  } catch (error: any) {
    console.error("Get User Rune Balance", error);
    res.status(500).send({ error });
  }
});

UserRoute.post("/get-etf-rune-balance", async (req, res) => {
  try {
    console.log("Get ETF User Rune Balance");

    const { userAddress } = req.body;

    const { balance } = await getETFRuneBalance(userAddress);

    console.log(balance);

    res.status(200).json({
      success: true,
      balance: balance,
    });
  } catch (error: any) {
    console.error("Get User Rune Balance", error);
    res.status(500).send({ error });
  }
});

UserRoute.post("/get-inscription-list", async (req, res) => {
  try {
    console.log("Get Inscription List");

    const { userAddress } = req.body;

    const { inscriptions } = await getInscriptionList(userAddress);

    res.status(200).json({
      success: true,
      inscriptions: inscriptions,
    });
  } catch (error: any) {
    console.error("Get Inscription List", error);
    res.status(500).send({ error });
  }
});

export default UserRoute;
