/**
 * User Routes Module
 * 
 * This module defines all user-related API endpoints for the CHIMERA application.
 * It handles requests related to user balances, inscriptions, and minting operations.
 */

import { Router } from "express";
import {
  getRuneBalance,
  getInscriptionList,
  getMintCount,
  getETFRuneBalance,
} from "../../controller/userData.Controller";

// Create a new router instance for user-related endpoints
const UserRoute = Router();

/**
 * @route GET /get-mint-count
 * @description Get the total number of mints performed in the system
 * @returns {Object} Response containing the mint count
 */
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

/**
 * @route POST /get-rune-balance
 * @description Get the Rune token balance for a specific user address
 * @param {string} req.body.userAddress - The Bitcoin address to check balance for
 * @returns {Object} Response containing the Rune balance
 */
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

/**
 * @route POST /get-etf-rune-balance
 * @description Get the ETF-specific Rune token balance for a user address
 * @param {string} req.body.userAddress - The Bitcoin address to check ETF balance for
 * @returns {Object} Response containing the ETF Rune balance
 */
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

/**
 * @route POST /get-inscription-list
 * @description Get the list of inscriptions (ordinals/BRC-20 tokens) for a user address
 * @param {string} req.body.userAddress - The Bitcoin address to fetch inscriptions for
 * @returns {Object} Response containing the list of inscriptions
 */
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

// Export the configured router for use in the main application
export default UserRoute;
