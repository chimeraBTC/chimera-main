import axios from "axios";
import {
  GOMAESTRO_URL,
  UNISAT_KEY,
  GOMAESTRO_PRIVATE_KEY,
  inscriptionIdList,
} from "../config/config";

export const fetchTxStatus = async (txid: string) => {
  try {
    const url = `https://ordinalgenesis.mempool.space/testnet4/api/tx/${txid}/status`;
    const res = await axios.get(url);
    return res.data.confirmed;
  } catch (error) {
    console.log(error);
    return false;
  }
};
export const isUTXOSpent = async (txid: string, vout: number) => {
  try {
    const url = `https://ordinalgenesis.mempool.space/testnet4/api/tx/${txid}/outspend/${vout}`;
    const res = await axios.get(url);
    return res.data.spent;
  } catch (error) {
    console.error(`Error checking UTXO spent status: ${txid}:${vout}`, error);
    return true;
  }
};

export const validateUTXO = async (txid: string, vout: number) => {
  try {
    const [isConfirmed, spent] = await Promise.all([
      fetchTxStatus(txid),
      isUTXOSpent(txid, vout),
    ]);

    return isConfirmed && !spent;
  } catch (error) {
    console.error(`UTXO validation failed: ${txid}:${vout}`, error);
    return false;
  }
};

export const fetchBTCUtxo = async (address: string) => {
  try {
    const url = `${GOMAESTRO_URL}/mempool/addresses/${address}/utxos`;
    let cursor = "";
    let res;
    const utxos = [];

    const config = {
      headers: {
        "api-key": GOMAESTRO_PRIVATE_KEY,
      },
    };

    while (1) {
      if (cursor !== "") {
        res = await axios.get(url, { ...config, params: { cursor } });
      } else {
        res = await axios.get(url, { ...config });
      }

      const utxoPromises = (res.data.data as any[])
        .filter(
          (utxo) => utxo.runes.length === 0 && Number(utxo.satoshis) > 10000
        )
        .map(async (utxo) => {
          const confirmed = await validateUTXO(utxo.txid, utxo.vout);
          return confirmed
            ? {
                scriptpubkey: utxo.script_pubkey,
                txid: utxo.txid,
                value: Number(utxo.satoshis),
                vout: utxo.vout,
              }
            : null;
        });

      // Wait for all UTXO status checks to resolve
      const resolvedUtxos = await Promise.all(utxoPromises);
      utxos.push(...resolvedUtxos.filter((utxo) => utxo !== null));

      cursor = res.data.next_cursor;

      if (cursor === null) break;
    }

    return utxos;
  } catch (error) {
    console.log(error);
    return [];
  }
};

export const fetchRuneUTXO = async (address: string, runeId: string) => {
  try {
    const url = `${GOMAESTRO_URL}/addresses/${address}/runes/${runeId}`;
    let cursor = "";
    const utxos = [];

    const config = {
      headers: {
        "api-key": GOMAESTRO_PRIVATE_KEY,
      },
    };

    do {
      const res = await axios.get(url, {
        ...config,
        params: cursor ? { cursor } : {},
      });

      const utxoPromises = res.data.data.map(async (utxo: any) => {
        const confirmed = await validateUTXO(utxo.txid, utxo.vout);
        return confirmed
          ? {
              txid: utxo.txid,
              vout: utxo.vout,
              amount: utxo.rune_amount,
              value: Number(utxo.satoshis),
            }
          : null;
      });

      // Wait for all UTXO status checks to resolve
      const resolvedUtxos = await Promise.all(utxoPromises);
      utxos.push(...resolvedUtxos.filter((utxo) => utxo !== null));

      cursor = res.data.next_cursor;
    } while (cursor !== null);

    return utxos;
  } catch (error) {
    console.error("Error fetching UTXOs: ", error);
    return [];
  }
};

export const fetchInscriptionUTXO = async (
  address: string,
  inscriptionId: string
) => {
  try {
    const url = `${GOMAESTRO_URL}/addresses/${address}/inscriptions`;
    let cursor = "";
    let res;
    const utxos = [];

    const config = {
      headers: {
        "api-key": GOMAESTRO_PRIVATE_KEY,
      },
    };

    while (1) {
      if (cursor !== "") {
        res = await axios.get(url, { ...config, params: { cursor } });
      } else {
        res = await axios.get(url, { ...config });
      }

      const utxoPromises = (res.data.data as any[])
        .filter((utxo) => utxo.inscription_id === inscriptionId)
        .map(async (utxo) => {
          const confirmed = await validateUTXO(utxo.utxo_txid, utxo.utxo_vout);
          return confirmed
            ? {
                inscriptionId: inscriptionId,
                txid: utxo.utxo_txid,
                vout: utxo.utxo_vout,
                value: Number(utxo.satoshis),
              }
            : null;
        });

      // Wait for all UTXO status checks to resolve
      const resolvedUtxos = await Promise.all(utxoPromises);
      utxos.push(...resolvedUtxos.filter((utxo) => utxo !== null));
      if (utxos.length > 0) break;

      cursor = res.data.next_cursor;

      if (cursor === null) break;
    }

    return utxos;
  } catch (error) {
    console.log(error);
    return [];
  }
};

export const fetchComfortableRuneUTXO = async (
  address: string,
  runeId: string,
  runeAmount: number
) => {
  try {
    let sum = 0;
    let cursor = "";
    let res;
    const url = `${GOMAESTRO_URL}/addresses/${address}/runes/${runeId}`;
    const utxos = [];

    const config = {
      headers: {
        "api-key": GOMAESTRO_PRIVATE_KEY,
      },
    };

    const divUrl = `${GOMAESTRO_URL}/assets/runes/${runeId}`;

    const divRes = await axios.get(divUrl, { ...config });

    while (1) {
      if (cursor !== "") {
        res = await axios.get(url, { ...config, params: { cursor } });
      } else {
        res = await axios.get(url, { ...config });
      }

      for (const item of res.data.data) {
        if (sum >= runeAmount) break;
        const confirmed = await validateUTXO(item.txid, item.vout);
        if (confirmed) {
          sum += Number(item.rune_amount);
          utxos.push({
            txid: item.txid,
            vout: item.vout,
            amount: item.rune_amount,
            value: Number(item.satoshis),
          });
        }
      }

      // Check if the sum is >= runeAmount after processing the data
      if (sum >= runeAmount) {
        break; // Exit the while loop
      }

      cursor = res.data.next_cursor;

      if (cursor === null) break;
    }

    if (utxos.length === 0)
      return {
        totalAmount: 0,
        utxos: [],
        divisibility: 0,
      };

    return {
      totalAmount: sum,
      utxos: utxos,
      divisibility: divRes.data.data.divisibility,
    };
  } catch (error) {
    console.log(error);
    return {
      totalAmount: 0,
      utxos: [],
      divisibility: 0,
    };
  }
};

export const fetchAvailableInscriptionUTXO = async (address: string) => {
  try {
    const url = `${GOMAESTRO_URL}/addresses/${address}/inscriptions`;
    let cursor = "";
    let res;
    const utxos = [];

    const config = {
      headers: {
        "api-key": GOMAESTRO_PRIVATE_KEY,
      },
    };

    while (1) {
      if (cursor !== "") {
        res = await axios.get(url, { ...config, params: { cursor } });
      } else {
        res = await axios.get(url, { ...config });
      }

      const utxoPromises = (res.data.data as any[])
        .filter((utxo) => inscriptionIdList.includes(utxo.inscription_id))
        .map(async (utxo) => {
          const confirmed = await validateUTXO(utxo.utxo_txid, utxo.utxo_vout);
          return confirmed
            ? {
                inscriptionId: utxo.inscription_id,
                txid: utxo.utxo_txid,
                vout: utxo.utxo_vout,
                value: Number(utxo.satoshis),
              }
            : null;
        });

      // Wait for all UTXO status checks to resolve
      const resolvedUtxos = await Promise.all(utxoPromises);
      utxos.push(...resolvedUtxos.filter((utxo) => utxo !== null));

      if (utxos.length >= 1) break;

      cursor = res.data.next_cursor;

      if (cursor === null) break;
    }

    return utxos;
  } catch (error) {
    console.log(error);
    return [];
  }
};

export const fetchAllAvailableInscriptionUTXO = async (address: string) => {
  try {
    const url = `${GOMAESTRO_URL}/addresses/${address}/inscriptions`;
    let cursor = "";
    let res;
    const utxos = [];
    let cnt = 0;

    const config = {
      headers: {
        "api-key": GOMAESTRO_PRIVATE_KEY,
      },
    };

    while (1) {
      if (cursor !== "") {
        res = await axios.get(url, { ...config, params: { cursor } });
      } else {
        res = await axios.get(url, { ...config });
      }

      const utxoPromises = (res.data.data as any[])
        .filter((utxo) => inscriptionIdList.includes(utxo.inscription_id))
        .map(async (utxo) => {
          // const confirmed = await validateUTXO(utxo.utxo_txid, utxo.utxo_vout);
          return {
            txid: utxo.utxo_txid,
            vout: utxo.utxo_vout,
            value: Number(utxo.satoshis),
          };
        });

      // Wait for all UTXO status checks to resolve
      const resolvedUtxos = await Promise.all(utxoPromises);
      utxos.push(...resolvedUtxos.filter((utxo) => utxo !== null));

      cursor = res.data.next_cursor;

      if (cursor === null) break;
      cnt += utxoPromises.length;
      if (cnt > 300) break;
    }

    return utxos;
  } catch (error) {
    console.log(error);
    return [];
  }
};
