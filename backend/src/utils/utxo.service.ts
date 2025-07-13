// HTTP client for making API requests
import axios from "axios";

// Import configuration values
import {
  GOMAESTRO_URL,          // Base URL for the GoMaestro API
  UNISAT_KEY,             // API key for Unisat service
  GOMAESTRO_PRIVATE_KEY,  // API key for authenticating with GoMaestro
  inscriptionIdList,     // List of supported inscription IDs
} from "../config/config";

/**
 * Checks if a transaction is confirmed on the blockchain
 * 
 * @param txid - The transaction ID to check
 * @returns Boolean indicating if the transaction is confirmed
 */
export const fetchTxStatus = async (txid: string) => {
  try {
    // Construct URL for mempool.space API to check transaction status
    const url = `https://ordinalgenesis.mempool.space/testnet4/api/tx/${txid}/status`;
    
    // Make the API request to get transaction status
    const res = await axios.get(url);
    
    // Return whether the transaction is confirmed
    return res.data.confirmed;
  } catch (error) {
    // Log error and return false to indicate unconfirmed status
    console.error(`Error checking transaction status for ${txid}:`, error);
    return false;
  }
};
/**
 * Checks if a specific UTXO has been spent
 * 
 * @param txid - The transaction ID of the UTXO
 * @param vout - The output index of the UTXO
 * @returns Boolean indicating if the UTXO has been spent
 */
export const isUTXOSpent = async (txid: string, vout: number) => {
  try {
    // Construct URL to check if a specific UTXO has been spent
    const url = `https://ordinalgenesis.mempool.space/testnet4/api/tx/${txid}/outspend/${vout}`;
    
    // Make the API request to get UTXO spent status
    const res = await axios.get(url);
    
    // Return whether the UTXO has been spent
    return res.data.spent;
  } catch (error) {
    // On error, assume the UTXO is spent to be safe
    console.error(`Error checking UTXO spent status: ${txid}:${vout}`, error);
    return true; // Default to spent on error to prevent double-spend attempts
  }
};

/**
 * Validates if a UTXO exists and is unspent
 * 
 * Combines transaction confirmation check and UTXO spent status
 * 
 * @param txid - The transaction ID to validate
 * @param vout - The output index to validate
 * @returns Boolean indicating if the UTXO is valid and unspent
 */
export const validateUTXO = async (txid: string, vout: number) => {
  try {
    const [isConfirmed, spent] = await Promise.all([
      fetchTxStatus(txid),      // Check if transaction is confirmed
      isUTXOSpent(txid, vout),  // Check if UTXO is already spent
    ]);
    return isConfirmed && !spent;
  } catch (error) {
    console.error(`UTXO validation failed for ${txid}:${vout}`, error);
    return false;
  }
};

/**
 * Fetches all Bitcoin UTXOs for a given address
 * 
 * Retrieves both confirmed and unconfirmed UTXOs, then filters out
 * any that are spent or don't meet the minimum value requirement.
 * 
 * @param address - The Bitcoin address to fetch UTXOs for
 * @returns Array of valid UTXOs with their details
 */
export const fetchBTCUtxo = async (address: string) => {
  try {
    // Construct URL for fetching UTXOs for the given address
    const url = `${GOMAESTRO_URL}/mempool/addresses/${address}/utxos`;
    
    // Initialize pagination cursor
    let cursor = "";
    let res;
    
    // Array to store valid UTXOs
    const utxos = [];

    // Configure request headers with API key
    const config = {
      headers: {
        "api-key": GOMAESTRO_PRIVATE_KEY,  // Authentication for GoMaestro API
      },
    };

    while (1) {
      if (cursor !== "") {
        res = await axios.get(url, { ...config, params: { cursor } });
      } else {
        res = await axios.get(url, { ...config });
      }

      // Process UTXOs in parallel for better performance
      const utxoPromises = (res.data.data as any[])
        // Filter out UTXOs with Runes and minimum value requirement (10,000 sats)
        .filter(
          (utxo) => utxo.runes.length === 0 && Number(utxo.satoshis) > 10000
        )
        // Map each UTXO to a promise that resolves to a validated UTXO or null
        .map(async (utxo) => {
          // Validate UTXO is confirmed and unspent
          const confirmed = await validateUTXO(utxo.txid, utxo.vout);
          
          // Return formatted UTXO if valid, otherwise null
          return confirmed
            ? {
                scriptpubkey: utxo.script_pubkey,  // The scriptPubKey for this output
                txid: utxo.txid,                  // Transaction ID
                value: Number(utxo.satoshis),      // Value in satoshis
                vout: utxo.vout,                   // Output index
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

/**
 * Fetches all UTXOs containing a specific Rune for a given address
 * 
 * @param address - The Bitcoin address to check for Rune UTXOs
 * @param runeId - The ID of the Rune to filter by
 * @returns Array of UTXOs containing the specified Rune
 */
/**
 * Fetches all UTXOs containing a specific Rune for a given address
 * 
 * This function retrieves all UTXOs associated with a specific Rune ID
 * for the given Bitcoin address. It handles pagination and validates
 * each UTXO to ensure it's unspent and confirmed.
 * 
 * @param address - The Bitcoin address to check for Rune UTXOs
 * @param runeId - The ID of the Rune to filter by
 * @returns Array of UTXOs containing the specified Rune with their details
 */
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

    // Use do-while to handle pagination with cursor
    do {
      const res = await axios.get(url, {
        ...config,
        params: cursor ? { cursor } : {},
      });

        // Process UTXOs in parallel for better performance
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
    } while (cursor !== null); // Continue until no more pages

    return utxos;
  } catch (error) {
    console.error("Error fetching UTXOs: ", error);
    return [];
  }
};

/**
 * Fetches UTXOs containing a specific inscription for a given address
 * 
 * @param address - The Bitcoin address to check for inscription UTXOs
 * @param inscriptionId - The ID of the inscription to look for
 * @returns Array of UTXOs containing the specified inscription
 */
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

      // Process UTXOs in parallel for better performance
      const utxoPromises = (res.data.data as any[])
        // Filter for the specific inscription ID
        .filter((utxo) => utxo.inscription_id === inscriptionId)
        // Map each UTXO to a promise that resolves to a validated UTXO or null
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

/**
 * Fetches enough Rune UTXOs to cover a specified amount
 * 
 * This function will accumulate UTXOs until the sum of their values
 * meets or exceeds the requested amount.
 * 
 * @param address - The address to fetch UTXOs from
 * @param runeId - The ID of the Rune to fetch
 * @param runeAmount - The minimum total amount of Runes needed
 * @returns Array of UTXOs that together satisfy the requested amount
 */
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

/**
 * Helper function to delay execution
 * @param ms Number of milliseconds to wait
 */
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Fetches all available inscription UTXOs for a given address with retry logic
 * 
 * @param address - The Bitcoin address to fetch inscription UTXOs for
 * @param maxRetries - Maximum number of retry attempts (default: 3)
 * @param initialDelay - Initial delay between retries in ms (default: 1000)
 * @returns Array of valid inscription UTXOs
 */
export const fetchAvailableInscriptionUTXO = async (
  address: string,
  maxRetries: number = 3,
  initialDelay: number = 1000
) => {
  let retries = 0;
  let delayMs = initialDelay;

  while (retries < maxRetries) {
    try {
      const url = `${GOMAESTRO_URL}/addresses/${address}/inscriptions`;
      let cursor = "";
      const utxos = [];

      const config = {
        headers: {
          "api-key": GOMAESTRO_PRIVATE_KEY,
        },
        // Add a timeout to prevent hanging requests
        timeout: 30000, // 30 seconds
      };

      while (true) {
        try {
          const res = await axios.get(url, 
            cursor 
              ? { ...config, params: { cursor } } 
              : config
          );

          // Process the response
          const utxoPromises = (res.data.data || [])
            .filter((utxo: any) => utxo && inscriptionIdList.includes(utxo.inscription_id))
            .map(async (utxo: any) => {
              try {
                const confirmed = await validateUTXO(utxo.utxo_txid, utxo.utxo_vout);
                return confirmed
                  ? {
                      inscriptionId: utxo.inscription_id,
                      txid: utxo.utxo_txid,
                      vout: utxo.utxo_vout,
                      value: Number(utxo.satoshis),
                    }
                  : null;
              } catch (error) {
                console.error(`Error validating UTXO ${utxo.utxo_txid}:`, error);
                return null;
              }
            });

          // Wait for all UTXO status checks to resolve
          const resolvedUtxos = await Promise.all(utxoPromises);
          utxos.push(...resolvedUtxos.filter((utxo): utxo is any => utxo !== null));

          // If we've found at least one UTXO, we can return early
          if (utxos.length >= 1) {
            return utxos;
          }

          // Get the next cursor for pagination
          cursor = res.data.next_cursor;
          if (!cursor) {
            break;
          }

          // Add a small delay between pagination requests
          await delay(100);
        } catch (error: any) {
          // If we get rate limited, break the inner loop and let the retry logic handle it
          if (error.response?.status === 429) {
            console.log(`Rate limited. Will retry in ${delayMs}ms...`);
            break;
          }
          throw error;
        }
      }

      // If we've made it here, we've processed all pages but didn't find any UTXOs
      return [];

    } catch (error: any) {
      // If we get rate limited or another error, retry with exponential backoff
      if (error.response?.status === 429 || error.code === 'ECONNABORTED') {
        retries++;
        if (retries >= maxRetries) {
          console.error(`Max retries (${maxRetries}) reached. Giving up.`);
          throw new Error("We're hitting our rate limit. Please try again in one minute.");
        }
        
        // Calculate exponential backoff with jitter
        const jitter = Math.random() * 0.5 + 0.75; // Random between 0.75 and 1.25
        const backoff = Math.min(delayMs * 2, 30000) * jitter; // Cap at 30s
        
        console.log(`Rate limited. Retrying in ${Math.round(backoff)}ms (attempt ${retries + 1}/${maxRetries})...`);
        await delay(backoff);
        delayMs = backoff;
      } else {
        // For other errors, log and rethrow
        console.error('Error in fetchAvailableInscriptionUTXO:', error);
        throw error;
      }
    }
  }
  
  // If we've exhausted all retries
  throw new Error("We're hitting our rate limit. Please try again in one minute.");
};

/**
 * Fetches all available inscription UTXOs with validation
 * 
 * This function validates each UTXO to ensure it is confirmed and unspent
 * before including it in the results. Invalid UTXOs are filtered out.
 * 
 * @param address - The Bitcoin address to fetch inscription UTXOs for
 * @returns Array of validated inscription UTXOs
 */
export const fetchAllAvailableInscriptionUTXO = async (address: string) => {
  try {
    const url = `${GOMAESTRO_URL}/addresses/${address}/inscriptions`;
    let cursor = "";
    let res;
    const utxos = [];
    // Counter for tracking pagination (unused in current implementation)
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
          const confirmed = await validateUTXO(utxo.utxo_txid, utxo.utxo_vout);
          if (!confirmed) {
            console.warn(`⚠️  Skipping invalid UTXO: ${utxo.utxo_txid}:${utxo.utxo_vout}`);
            return null;
          }
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
