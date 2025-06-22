import { runeId, SOURCE_RUNE_TOKEN_ID } from "../config/config";
import {
  fetchRuneUTXO,
  fetchAvailableInscriptionUTXO,
} from "../utils/utxo.service";
import { analyzeRuneInfo } from "../utils/utils.service";
import NFTDataModel from "../model/NftData";

export const getRuneBalance = async (userAddress: string) => {
  try {
    const runeUtxos = await fetchRuneUTXO(userAddress, runeId);
    const { runeTotalAmount, divisibility } = await analyzeRuneInfo(
      runeUtxos,
      runeId
    );

    return { balance: runeTotalAmount };
  } catch (error) {
    throw error;
  }
};

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

export const getInscriptionList = async (userAddress: string) => {
  try {
    const inscriptions = await fetchAvailableInscriptionUTXO(userAddress);
    const inscriptionIds = inscriptions.map((item) => item.inscriptionId);
    return { inscriptions: inscriptionIds };
  } catch (error) {
    throw error;
  }
};

export const getMintCount = async () => {
  try {
    const nftInfo: any = await NFTDataModel.findOne({ name: "Chimera" });
    return nftInfo.count;
  } catch (error) {
    throw error;
  }
};
