/**
 * User Data Controller
 * 
 * This module handles all user-related data operations including fetching balances,
 * inscriptions, and mint counts. It serves as the business logic layer between
 * the API routes and the data services.
 */

import { runeId, SOURCE_RUNE_TOKEN_ID } from "../config/config";
import {
  fetchRuneUTXO,
  fetchAvailableInscriptionUTXO,
} from "../utils/utxo.service";
import { analyzeRuneInfo } from "../utils/utils.service";
import NFTDataModel from "../model/NftData";

/**
 * Retrieves the Rune token balance for a given user address
 * 
 * @param {string} userAddress - The Bitcoin address to check balance for
 * @returns {Promise<{balance: number}>} Object containing the Rune balance
 * @throws Will throw an error if the balance cannot be fetched
 */
export const getRuneBalance = async (userAddress: string) => {
  try {
    console.log("🔍 Fetching rune balance for:", userAddress, "runeId:", runeId);
    const runeUtxos = await fetchRuneUTXO(userAddress, runeId);
    console.log("📦 Raw runeUtxos:", JSON.stringify(runeUtxos, null, 2));
    
    const { runeTotalAmount, divisibility } = await analyzeRuneInfo(
      runeUtxos,
      runeId
    );
    console.log("💰 Final balance:", runeTotalAmount, "divisibility:", divisibility);

    return { balance: runeTotalAmount };
  } catch (error) {
    console.error("❌ Error in getRuneBalance:", error);
    throw error;
  }
};

/**
 * Retrieves the ETF Rune token balance for a given user address
 * This is specifically for the source Rune token used in the ETF system
 * 
 * @param {string} userAddress - The Bitcoin address to check ETF balance for
 * @returns {Promise<{balance: number}>} Object containing the ETF Rune balance
 * @throws Will throw an error if the balance cannot be fetched
 */
export const getETFRuneBalance = async (userAddress: string) => {
  try {
    const runeUtxos = await fetchRuneUTXO(userAddress, SOURCE_RUNE_TOKEN_ID);
    const { runeTotalAmount, divisibility } = await analyzeRuneInfo(
      runeUtxos,
      SOURCE_RUNE_TOKEN_ID
    );

    return { balance: runeTotalAmount };
  } catch (error) {
    throw error;
  }
};

/**
 * Retrieves a list of inscription IDs for a given user address
 * 
 * @param {string} userAddress - The Bitcoin address to fetch inscriptions for
 * @returns {Promise<{inscriptions: string[]}>} Object containing array of inscription IDs
 * @throws Will throw an error if the inscription list cannot be fetched
 */
export const getInscriptionList = async (userAddress: string) => {
  try {
    const inscriptions = await fetchAvailableInscriptionUTXO(userAddress);
    const inscriptionIds = inscriptions.map((item) => item.inscriptionId);
    return { inscriptions: inscriptionIds };
  } catch (error) {
    throw error;
  }
};

/**
 * Retrieves the current mint count for the Chimera NFT collection
 * 
 * @returns {Promise<number>} The current number of mints
 * @throws Will throw an error if the mint count cannot be retrieved
 */
export const getMintCount = async () => {
  try {
    const nftInfo: any = await NFTDataModel.findOne({ name: "Chimera" });
    return nftInfo.count;
  } catch (error) {
    throw error;
  }
};
