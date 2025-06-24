/**
 * PSBT Generation Controller
 * 
 * @module GeneratePSBTController
 * @description
 * This module handles the generation of Partially Signed Bitcoin Transactions (PSBTs) for various operations
 * in the CHIMERA ecosystem, including Rune token transfers, NFT operations, and smart contract interactions.
 * It provides a secure and flexible way to construct, sign, and broadcast transactions on the Bitcoin network.
 *
 * Key Features:
 * - Generation of PSBTs for different transaction types (Rune transfers, NFT operations, etc.)
 * - Support for both mainnet and testnet operations
 * - Integration with the Arch blockchain network
 * - UTXO management and selection
 * - Fee calculation and optimization
 * - Transaction signing and broadcasting
 *
 * @see {@link https://github.com/bitcoin/bips/blob/master/bip-0174.mediawiki} for PSBT specification
 * @see {@link https://docs.saturnbtc.io/} for Arch SDK documentation
 */

// Core Dependencies
import { none, Rune, RuneId, Runestone } from "runelib";
import * as btc from "@scure/btc-signer";
import * as Bitcoin from "bitcoinjs-lib";
import * as ecc from "tiny-secp256k1";
import { ECPairFactory, type ECPairInterface } from "ecpair";
import wif from "wif";
import bip322 from "bip322-js";
import * as borsh from "borsh";
import fs from "fs";

// Blockchain SDKs
import {
  ArchConnection,
  RpcConnection,
  MessageUtil,
  PubkeyUtil,
  type Message,
  type RuntimeTransaction,
  type Instruction,
  type ProcessedTransaction,
} from "@saturnbtcio/arch-sdk";
import { bytesToHex, hexToBytes } from "@noble/hashes/utils";
// Configuration
import {
  SMART_CONTRACT_PUBKEY,  // Public key of the smart contract
  MAX_RETRIES,              // Maximum number of retries for operations
  RPC_URL,                  // URL for the RPC endpoint
  ACCOUNT_PUBKEY,           // Public key of the account
  runeSwapAmount,           // Default rune amount for swaps
  runeId,                   // Rune ID for the token
  inscriptionIdList,        // List of inscription IDs
  START_TIME,               // Start time for time-based operations
  WLList,                   // Whitelist configuration
  WL_CNT,                   // Whitelist count
  NORMAL_CNT,               // Normal count
  WalletTypes,              // Supported wallet types
} from "../config/config";

// Services
import {
  fetchBTCUtxo,                    // Fetches BTC UTXOs
  fetchInscriptionUTXO,            // Fetches inscription UTXOs
  fetchAvailableInscriptionUTXO,    // Fetches available inscription UTXOs
  fetchComfortableRuneUTXO,        // Fetches Rune UTXOs with comfortable balance
  fetchAllAvailableInscriptionUTXO, // Fetches all available inscription UTXOs
} from "../utils/utxo.service";
import { getFeeRate, calculateTxFee } from "../utils/psbt.service";
import { pushRawTx } from "../utils/psbt.service";

// Types
import { type IInscriptionUtxo, type IRuneUtxo } from "../types/type";

// Utilities
import { checkTxValidation } from "../utils/utils.service";

// Schemas
import {
  SwapInscriptionRuneSchema,  // Schema for inscription to rune swaps
  SwapRuneInscriptionSchema,  // Schema for rune to inscription swaps
} from "../config/schema";

// Models
import NFTDataModel from "../model/NftData";
import UserDataModel from "../model/UserData";

// Initialize cryptographic libraries
const ECPair = ECPairFactory(ecc);
Bitcoin.initEccLib(ecc);

/**
 * Testnet4 Network Configuration
 * 
 * @constant {Object} TESTNET4_NETWORK
 * @description Configuration object for Bitcoin testnet4 network parameters
 * @property {string} bech32 - Bech32 prefix for native segwit addresses ('tb' for testnet)
 * @property {number} pubKeyHash - Version byte for P2PKH addresses (0x1c for testnet)
 * @property {number} scriptHash - Version byte for P2SH addresses (0x16 for testnet)
 * @property {number} wif - Version byte for WIF private keys (0x3f for testnet)
 */
export const TESTNET4_NETWORK: typeof btc.NETWORK = {
  bech32: "tb",
  pubKeyHash: 0x1c,
  scriptHash: 0x16,
  wif: 0x3f,
};

// Initialize RPC connection to the Arch blockchain with testnet network
const rpcConnection = new RpcConnection(RPC_URL);
// @ts-ignore - The network property exists but isn't in the type definitions
rpcConnection.network = TESTNET4_NETWORK;
const rpc = ArchConnection(rpcConnection);

// Note: The following are commented out as they're not currently in use
// const client = new ArchRpcClient(RPC_URL);
// const PRIVATE_KEY = process.env.ARCH_PRIVATE_KEY as string;

/**
 * Creates a BIP-322 compatible signature for a given message hash using the provided private key.
 * This is used for signing messages that will be verified on the Bitcoin network.
 * 
 * @param {Uint8Array} messageHash - The hash of the message to be signed
 * @param {string} privateKeyHex - The private key in hexadecimal format
 * @returns {Promise<{signature: Buffer}>} An object containing the Schnorr signature
 * @throws {Error} If address generation fails or signing encounters an error
 * 
 * @example
 * const message = new TextEncoder().encode('Hello, world!');
 * const hash = await crypto.subtle.digest('SHA-256', message);
 * const { signature } = await createSignature(hash, 'private_key_hex');
 */
const createSignature = async (
  messageHash: Uint8Array,
  privateKeyHex: string
) => {
  try {
    const keyPair = ECPair.fromPrivateKey(Buffer.from(privateKeyHex, "hex"), {
      compressed: true,
      network: Bitcoin.networks.testnet,
    });

    const internalPubkey = keyPair.publicKey.slice(1, 33);
    const { address } = Bitcoin.payments.p2tr({
      internalPubkey,
      network: Bitcoin.networks.testnet,
    });

    if (!address) {
      throw new Error("Failed to generate address");
    }

    const messageString = Buffer.from(messageHash).toString("hex");
    const privateKeyWIF = wif.encode(
      239,
      Buffer.from(privateKeyHex, "hex"),
      true
    );

    const signature = bip322.Signer.sign(
      privateKeyWIF,
      address,
      messageString,
      Bitcoin.networks.testnet
    );

    const signatureBuffer = Buffer.from(signature as string, "base64");
    const schnorrSignature = signatureBuffer.slice(-65, -1);

    return { signature: schnorrSignature };
  } catch (error) {
    console.error("Signature creation error:", error);
    throw error;
  }
};

/**
 * Transfers data to a smart contract on the Arch blockchain by creating and signing a transaction.
 * This function handles the complete lifecycle of creating, signing, and submitting a transaction.
 * 
 * @param {ECPairInterface} keyPair - The ECPair instance containing the private key for signing
 * @param {Instruction} instruction - The instruction to be executed by the smart contract
 * @returns {Promise<ProcessedTransaction>} The result of the transaction submission
 * @throws {Error} If transaction creation or submission fails
 * 
 * @example
 * const keyPair = ECPair.fromWIF('private_key_wif');
 * const instruction = new Instruction({
 *   programId: 'program_id',
 *   data: Buffer.from('data_to_send'),
 *   accounts: []
 * });
 * const result = await transferDataToSmartContract(keyPair, instruction);
 */
const transferDataToSmartContract = async (
  keyPair: ECPairInterface,
  instruction: Instruction
) => {
  const client = new RpcConnection(RPC_URL);

  const messageObj: Message = {
    signers: [keyPair.publicKey.slice(-32)],
    instructions: [instruction],
  };

  const messageHash = MessageUtil.hash(messageObj);
  const { signature } = await createSignature(
    messageHash,
    process.env.ARCH_PRIVATE_KEY!
  );
  const signatureBuffer = new Uint8Array(Buffer.from(signature));

  const tx: RuntimeTransaction = {
    version: 15,
    signatures: [signatureBuffer],
    message: messageObj,
  };

  for (let i = 0; i < MAX_RETRIES; i++) {
    try {
      const result = await client.sendTransaction(tx);
      return result;
    } catch (error) {
      if (i === MAX_RETRIES - 1) throw error;
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
  }
};

/**
 * Processes and broadcasts a signed PSBT (Partially Signed Bitcoin Transaction).
 * This function handles the final steps of transaction processing including validation,
 * fee calculation, and broadcasting to the network.
 * 
 * @param {WalletTypes} walletType - The type of wallet being used for the transaction
 * @param {string} userAddress - The Bitcoin address of the user initiating the transaction
 * @param {string} signedPSBT - The base64-encoded PSBT that has been signed
 * @param {IInscriptionUtxo} inscriptionUtxo - The UTXO containing the inscription being transacted
 * @param {boolean} [mint=false] - Optional flag indicating if this is a minting operation
 * @returns {Promise<Object>} The result of the transaction broadcast
 * @throws {Error} If PSBT processing or broadcast fails
 * 
 * @example
 * const result = await pushPSBT(
 *   WalletTypes.UNISAT,  // walletType
 *   'tb1qxyz...',        // userAddress
 *   'cHNidP8BA...',      // signedPSBT
 *   {                    // inscriptionUtxo
 *     txid: '...',
 *     vout: 0,
 *     value: 1000,
 *     // ... other UTXO properties
 *   },
 *   true                // mint (optional)
 * );
 */
export const pushPSBT = async (
  walletType: WalletTypes,
  userAddress: string,
  signedPSBT: string,
  inscriptionUtxo: IInscriptionUtxo,
  mint: boolean = false
) => {
  try {
    const client = new RpcConnection(RPC_URL);

    // Process PSBT and prepare transaction data
    let psbt;
    if (walletType === WalletTypes.UNISAT) {
      psbt = Bitcoin.Psbt.fromHex(signedPSBT);
    } else {
      psbt = Bitcoin.Psbt.fromBase64(signedPSBT);
    }
    psbt.finalizeAllInputs();
    const hexData = hexToBytes(psbt.extractTransaction().toHex());

    // Prepare instruction data
    const sendValue = {
      inscription_txid: inscriptionUtxo.txid,
      inscription_vout: inscriptionUtxo.vout,
      user_swap_psbt: hexData,
    };
    console.log("SendValue prepared:", sendValue); // Debug object

    // Create key pair from private key
    const keyPair = ECPair.fromPrivateKey(
      Buffer.from(process.env.ARCH_PRIVATE_KEY!, "hex"),
      {
        compressed: true,
        network: Bitcoin.networks.testnet,
      }
    );

    const pubkeyHex = Buffer.from(keyPair.publicKey.slice(1, 33)).toString(
      "hex"
    );

    // Get Account Address
    const accountAddress = await client.getAccountAddress(
      PubkeyUtil.fromHex(pubkeyHex)
    );
    console.log("Account Address : ", accountAddress);

    // const encodedPubkey = PubkeyUtil.fromHex(SYSTEM_SMART_CONTRACT);
    // const transferInstructionData = new Uint8Array(encodedPubkey.length + 1);
    // transferInstructionData[0] = 3;
    // transferInstructionData.set(encodedPubkey, 1);

    // Transfer Ownership
    // const transferOwnerShipInstruction: Instruction = {
    //   program_id: PubkeyUtil.fromHex(SYSTEM_SMART_CONTRACT),
    //   accounts: [
    //     { pubkey: PubkeyUtil.fromHex(pubkeyHex), is_signer: true, is_writable: true }
    //   ],
    //   data: transferInstructionData,
    // }

    // const transferResult = await transferDataToSmartContract(keyPair, transferOwnerShipInstruction);
    // console.log("Transfer Ownership Result", transferResult);

    const encoded = borsh.serialize(SwapInscriptionRuneSchema, sendValue);
    const instructionData = new Uint8Array(encoded.length + 1);
    instructionData[0] = 0;
    instructionData.set(encoded, 1);
    // Swap instruction
    const instruction: Instruction = {
      program_id: PubkeyUtil.fromHex(SMART_CONTRACT_PUBKEY),
      accounts: [
        {
          pubkey: PubkeyUtil.fromHex(pubkeyHex),
          is_signer: true,
          is_writable: true,
        },
      ],
      data: instructionData,
    };

    const swapResult = (await transferDataToSmartContract(
      keyPair,
      instruction
    )) as string;
    console.log("Swap Result", swapResult);

    let btcBroadcastTxId = "";
    let i = 0;

    while (1) {
      try {
        await new Promise((resolve) => setTimeout(resolve, 10000));

        const btcTxId: ProcessedTransaction =
          (await client.getProcessedTransaction(
            swapResult
          )) as ProcessedTransaction;
        console.log("Bitcoin Txid Result", btcTxId.bitcoin_txid);

        btcBroadcastTxId = btcTxId.bitcoin_txid as string;

        if (mint && btcBroadcastTxId !== "") {
          const txValid = await checkTxValidation(btcBroadcastTxId);
          if (txValid) {
            await NFTDataModel.findOneAndUpdate(
              { name: "Chimera" },
              { $inc: { count: 1 } }, // Increment the mintedCount by 1
              { new: true, upsert: true } // Return the updated document, create if not found
            );
            await UserDataModel.findOneAndUpdate(
              { userAddress },
              { $inc: { cnt: 1 }, $set: { txid: btcBroadcastTxId } }, // Increment the mintedCount by 1
              { new: true, upsert: true } // Return the updated document, create if not found
            );
          } else {
            throw "Transaction Failed! Plz Try Again Later";
          }
        }
        break;
      } catch (error) {
        console.log("Finally Bug Here");
        if (i === MAX_RETRIES - 1) throw error;
      }
      i++;
    }

    return { txid: btcBroadcastTxId };
    // return swapResult;
  } catch (error) {
    console.error("Transaction error:", error);
    throw error;
  }
};

/**
 * Sends an inscription to a specified address by creating and broadcasting a transaction.
 * This function handles the complete process of creating a PSBT, having it signed,
 * and then broadcasting the final transaction to the network.
 * 
 * @param {string} userPubkey - The public key of the user in hexadecimal format
 * @returns {Promise<Object>} The result of the transaction broadcast
 * @throws {Error} If any step in the inscription sending process fails
 * 
 * @example
 * const result = await sendInscription('03abcdef1234...');
 */
export const sendInscription = async (userPubkey: string) => {
  const smartcontractAccountPubkey = Buffer.from(ACCOUNT_PUBKEY, "hex");

  const smartContractAddress = await rpc.getAccountAddress(
    new Uint8Array(smartcontractAccountPubkey)
  );

  const smartContractOutScript = btc.OutScript.encode(
    btc.Address(TESTNET4_NETWORK).decode(smartContractAddress)
  );

  const userWallet = btc.p2tr(
    Uint8Array.from(Buffer.from(userPubkey, "hex").slice(1, 33)),
    undefined,
    TESTNET4_NETWORK
  );
  const btcWallet = btc.p2tr(
    Uint8Array.from(
      Buffer.from(
        "026272fe4cf7746c9c3de3d48afc5f27fe4ba052fc8f72913a6020fa970f7f5823",
        "hex"
      ).slice(1, 33)
    ),
    undefined,
    TESTNET4_NETWORK
  );

  const btcUtxos = await fetchBTCUtxo(
    "tb1pgda5khhwqlc7jmdzn4plca3pa4m7jg38zcspj0mmuyk8hnj5pphskers72"
  );

  const tx = new btc.Transaction({ allowUnknownOutputs: true });

  const inscriptionUtxos = await fetchAllAvailableInscriptionUTXO(
    userWallet.address as string
  );

  for (let i = 0; i < inscriptionUtxos.length; i++) {
    // Inscription Send Part
    tx.addInput({
      index: inscriptionUtxos[i].vout,
      txid: inscriptionUtxos[i].txid,
      witnessUtxo: {
        amount: BigInt(inscriptionUtxos[i].value),
        script: userWallet.script,
      },
      tapInternalKey: userWallet.tapInternalKey,
    });

    tx.addOutput({
      script: smartContractOutScript,
      amount: BigInt(inscriptionUtxos[i].value),
    });
  }

  let amount = 0;
  const feeRate = 2;
  let fee = await calculateTxFee(tx.inputsLength, tx.outputsLength, feeRate);

  for (let i = 0; i < btcUtxos.length; i++) {
    fee = await calculateTxFee(tx.inputsLength, tx.outputsLength, feeRate);
    if (amount < fee) {
      amount += btcUtxos[i].value;
      tx.addInput({
        txid: btcUtxos[i].txid,
        index: btcUtxos[i].vout,
        witnessUtxo: {
          amount: BigInt(btcUtxos[i].value),
          script: btcWallet.script,
        },
        tapInternalKey: btcWallet.tapInternalKey,
      });
    }
  }

  tx.addOutput({
    script: btcWallet.script,
    amount: BigInt(amount - fee),
  });

  const psbt = tx.toPSBT();

  const hexPsbt = bytesToHex(psbt);

  // console.log(hexPsbt);

  fs.writeFileSync("1.txt", hexPsbt);

  return { hexPsbt };
};

/**
 * Pushes a raw transaction to the Bitcoin network after combining and finalizing PSBTs.
 * This function takes multiple signed PSBTs, combines them if necessary, and broadcasts
 * the final transaction.
 * 
 * @param {string} psbt - The base64-encoded original PSBT
 * @param {string} signedPsbt - The first signed PSBT in base64 format
 * @param {string} signedPsbt1 - The second signed PSBT in base64 format (for multi-sig scenarios)
 * @returns {Promise<Object>} The result of the transaction broadcast
 * @throws {Error} If PSBT combination or broadcast fails
 * 
 * @example
 * const result = await pushPsbtRawTx(
 *   'base64_psbt',    // Original PSBT
 *   'signed_psbt_1',  // First signature
 *   'signed_psbt_2'   // Second signature (optional)
 * );
 */
export const pushPsbtRawTx = async (
  psbt: string,
  signedPsbt: string,
  signedPsbt1: string
) => {
  try {
    const apsbt = Bitcoin.Psbt.fromHex(psbt);
    const asignedPsbt = Bitcoin.Psbt.fromHex(signedPsbt);
    const asignedPsbt1 = Bitcoin.Psbt.fromHex(signedPsbt1);
    apsbt.combine(asignedPsbt, asignedPsbt1);

    const tx = apsbt.extractTransaction();
    const txHex = tx.toHex();

    const txId = await pushRawTx(txHex);
    console.log(txId);
  } catch (error) {
    console.log(error);
  }
};

/**
 * Prepares and generates a PSBT for a standard transaction operation.
 * This function handles the creation of a PSBT for transferring assets between addresses,
 * including fetching UTXOs, calculating fees, and constructing the transaction.
 * 
 * @param {WalletTypes} walletType - The type of wallet being used (e.g., UNISAT, XVERSE)
 * @param {string} userPaymentAddress - The Bitcoin address for payment inputs/outputs
 * @param {string} userPaymentPubkey - The public key associated with the payment address
 * @param {string} userOrdinalAddress - The address holding ordinal/inscription UTXOs
 * @param {string} userOrdinalPubkey - The public key associated with the ordinal address
 * @returns {Promise<Object>} An object containing the generated PSBT and related data
 * @throws {Error} If PSBT generation fails due to insufficient funds or other errors
 * 
 * @example
 * const result = await preGeneratePSBT(
 *   WalletTypes.UNISAT,        // walletType
 *   'tb1qpayment...',          // userPaymentAddress
 *   '03abcdef...',             // userPaymentPubkey
 *   'tb1qordinal...',          // userOrdinalAddress
 *   '03fedcba...'              // userOrdinalPubkey
 * );
 */
export const preGeneratePSBT = async (
  walletType: WalletTypes,
  userPaymentAddress: string,
  userPaymentPubkey: string,
  userOrdinalAddress: string,
  userOrdinalPubkey: string
) => {
  try {
    const signPaymentIndexes = [];
    const signOrdinalIndexes = [];
    const btcUtxos = await fetchBTCUtxo(userPaymentAddress);
    const {
      totalAmount,
      utxos: runeUtxos,
      divisibility,
    } = await fetchComfortableRuneUTXO(
      userOrdinalAddress,
      runeId,
      runeSwapAmount
    );
    let inputCnt = 0;

    if (totalAmount * 10 ** divisibility < runeSwapAmount * 10 ** divisibility)
      throw "Invaild Rune Amount";

    const smartcontractPubkey = Buffer.from(ACCOUNT_PUBKEY, "hex");

    const smartContractAddress = await rpc.getAccountAddress(
      new Uint8Array(smartcontractPubkey)
    );

    console.log("Account Address : ", smartContractAddress);
    const availableInscription = await fetchAvailableInscriptionUTXO(
      smartContractAddress
    );

    if (availableInscription.length === 0)
      throw "We're hitting our rate limit. Please try again in one minute.";

    const smartContractOutScript = btc.OutScript.encode(
      btc.Address(TESTNET4_NETWORK).decode(smartContractAddress)
    );

    let userPaymentWallet, userOrdinalWallet;

    if (walletType === WalletTypes.UNISAT) {
      userPaymentWallet = btc.p2tr(
        Uint8Array.from(Buffer.from(userPaymentPubkey, "hex").slice(1, 33)),
        undefined,
        TESTNET4_NETWORK
      );
      userOrdinalWallet = userPaymentWallet;
    } else {
      userPaymentWallet = btc.p2wpkh(
        Uint8Array.from(Buffer.from(userPaymentPubkey, "hex")),
        TESTNET4_NETWORK
      );
      userOrdinalWallet = btc.p2tr(
        Uint8Array.from(Buffer.from(userOrdinalPubkey, "hex")),
        undefined,
        TESTNET4_NETWORK
      );
    }

    const tx = new btc.Transaction({ allowUnknownOutputs: true });

    tx.addOutput({
      script: userOrdinalWallet.script,
      amount: BigInt(availableInscription[0].value),
    });

    // Rune Send Part
    const edicts: any = [];

    edicts.push({
      id: new RuneId(
        Number(runeId.split(":")[0]),
        Number(runeId.split(":")[1])
      ),
      amount: runeSwapAmount * 10 ** divisibility,
      output: 2,
    });
    edicts.push({
      id: new RuneId(
        Number(runeId.split(":")[0]),
        Number(runeId.split(":")[1])
      ),
      amount:
        totalAmount * 10 ** divisibility - runeSwapAmount * 10 ** divisibility,
      output: 3,
    });

    const transferStone = new Runestone(edicts, none(), none(), none());

    for (let i = 0; i < runeUtxos.length; i++) {
      tx.addInput({
        txid: runeUtxos[i].txid,
        index: runeUtxos[i].vout,
        witnessUtxo: {
          amount: BigInt(runeUtxos[i].value),
          script: userOrdinalWallet.script,
        },
        tapInternalKey: userOrdinalWallet.tapInternalKey,
        sighashType:
          Bitcoin.Transaction.SIGHASH_ALL |
          Bitcoin.Transaction.SIGHASH_ANYONECANPAY,
      });
      signOrdinalIndexes.push(inputCnt);
      inputCnt++;
    }

    tx.addOutput({
      script: Uint8Array.from(transferStone.encipher()),
      amount: BigInt(0),
    });

    tx.addOutput({
      script: smartContractOutScript,
      amount: BigInt(546),
    });

    tx.addOutput({
      script: userOrdinalWallet.script,
      amount: BigInt(546),
    });

    // BTC Fee Pay Part

    const feeRate = await getFeeRate();
    let amount = 0;
    let fee = 0;

    for (let i = 0; i < btcUtxos.length; i++) {
      fee = await calculateTxFee(tx.inputsLength, tx.outputsLength, feeRate);
      fee = fee < 200 ? 200 : fee;
      if (amount < fee + 546 * 3) {
        amount += btcUtxos[i].value;
        if (walletType === WalletTypes.UNISAT) {
          tx.addInput({
            txid: btcUtxos[i].txid,
            index: btcUtxos[i].vout,
            witnessUtxo: {
              amount: BigInt(btcUtxos[i].value),
              script: userPaymentWallet.script,
            },
            tapInternalKey: userOrdinalWallet.tapInternalKey,
            sighashType:
              Bitcoin.Transaction.SIGHASH_ALL |
              Bitcoin.Transaction.SIGHASH_ANYONECANPAY,
          });
        } else {
          tx.addInput({
            txid: btcUtxos[i].txid,
            index: btcUtxos[i].vout,
            witnessUtxo: {
              amount: BigInt(btcUtxos[i].value),
              script: userPaymentWallet.script,
            },
            sighashType:
              Bitcoin.Transaction.SIGHASH_ALL |
              Bitcoin.Transaction.SIGHASH_ANYONECANPAY,
          });
        }
        signPaymentIndexes.push(inputCnt);
        inputCnt++;
      }
    }

    if (amount < fee + 546 * 3)
      throw "Not enough UTXOs. Please wait for 1 block confirmation, or redeem more tBTC from a faucet.";

    tx.addOutput({
      script: userPaymentWallet.script,
      amount: BigInt(amount - fee - 546 * 3),
    });

    const psbt = tx.toPSBT();

    const hexPsbt = bytesToHex(psbt);
    const base64Psbt = Bitcoin.Psbt.fromHex(hexPsbt).toBase64();

    console.log(
      base64Psbt,
      hexPsbt,
      signPaymentIndexes,
      signOrdinalIndexes,
      availableInscription[0]
    );

    return {
      base64Psbt,
      hexPsbt,
      signPaymentIndexes,
      signOrdinalIndexes,
      inscriptionUtxo: availableInscription[0],
    };
  } catch (error) {
    console.log(error);
    throw error;
  }
};

/**
 * Prepares and generates a PSBT for reconverting assets, typically used for complex
 * operations like redeeming from a smart contract or converting between asset types.
 * 
 * @param {WalletTypes} walletType - The type of wallet being used (e.g., UNISAT, XVERSE)
 * @param {string} userPaymentAddress - The Bitcoin address for payment inputs/outputs
 * @param {string} userPaymentPubkey - The public key associated with the payment address
 * @param {string} userOrdinalAddress - The address holding ordinal/inscription UTXOs
 * @param {string} userOrdinalPubkey - The public key associated with the ordinal address
 * @param {string} inscriptionId - The ID of the inscription to be reconverted
 * @returns {Promise<Object>} An object containing the generated PSBT and related data
 * @throws {Error} If PSBT generation fails due to insufficient funds or other errors
 * 
 * @example
 * const result = await preGenerateReconvertPSBT(
 *   WalletTypes.UNISAT,        // walletType
 *   'tb1qpayment...',          // userPaymentAddress
 *   '03abcdef...',             // userPaymentPubkey
 *   'tb1qordinal...',          // userOrdinalAddress
 *   '03fedcba...',             // userOrdinalPubkey
 *   'inscription_id_123'       // inscriptionId
 * );
 */
export const preGenerateReconvertPSBT = async (
  walletType: WalletTypes,
  userPaymentAddress: string,
  userPaymentPubkey: string,
  userOrdinalAddress: string,
  userOrdinalPubkey: string,
  inscriptionId: string
) => {
  try {
    const collectionInscription = inscriptionIdList.includes(inscriptionId);
    if (!collectionInscription)
      throw "Inscription Is Not Collection Inscription.";

    const signPaymentIndexes = [];
    const signOrdinalIndexes = [];
    const btcUtxos = await fetchBTCUtxo(userPaymentAddress);

    let inputCnt = 0;

    const smartcontractPubkey = Buffer.from(ACCOUNT_PUBKEY, "hex");

    const smartContractAddress = await rpc.getAccountAddress(
      new Uint8Array(smartcontractPubkey)
    );

    console.log("Account Address : ", smartContractAddress);

    const {
      totalAmount: remainAmount,
      utxos: runeUtxos,
      divisibility,
    } = await fetchComfortableRuneUTXO(
      smartContractAddress,
      runeId,
      runeSwapAmount
    );

    if (remainAmount < runeSwapAmount)
      throw "Not Enough Rune In Smart Contract";

    const inscriptionUtxos = await fetchInscriptionUTXO(
      userOrdinalAddress,
      inscriptionId
    );

    if (inscriptionUtxos.length === 0)
      throw "We're hitting our rate limit on Inscription Swap. Please try again in one minute.";

    const smartContractOutScript = btc.OutScript.encode(
      btc.Address(TESTNET4_NETWORK).decode(smartContractAddress)
    );

    let userPaymentWallet, userOrdinalWallet;

    if (walletType === WalletTypes.UNISAT) {
      userPaymentWallet = btc.p2tr(
        Uint8Array.from(Buffer.from(userPaymentPubkey, "hex").slice(1, 33)),
        undefined,
        TESTNET4_NETWORK
      );
      userOrdinalWallet = userPaymentWallet;
    } else {
      userPaymentWallet = btc.p2wpkh(
        Uint8Array.from(Buffer.from(userPaymentPubkey, "hex")),
        TESTNET4_NETWORK
      );
      userOrdinalWallet = btc.p2tr(
        Uint8Array.from(Buffer.from(userOrdinalPubkey, "hex")),
        undefined,
        TESTNET4_NETWORK
      );
    }

    const tx = new btc.Transaction({ allowUnknownOutputs: true });

    tx.addInput({
      index: inscriptionUtxos[0].vout,
      txid: inscriptionUtxos[0].txid,
      witnessUtxo: {
        amount: BigInt(inscriptionUtxos[0].value),
        script: userOrdinalWallet.script,
      },
      tapInternalKey: userOrdinalWallet.tapInternalKey,
      sighashType:
        Bitcoin.Transaction.SIGHASH_ALL |
        Bitcoin.Transaction.SIGHASH_ANYONECANPAY,
    });
    signOrdinalIndexes.push(inputCnt);
    inputCnt++;

    tx.addOutput({
      script: smartContractOutScript,
      amount: BigInt(inscriptionUtxos[0].value),
    });

    // Rune Send Part
    const edicts: any = [];

    edicts.push({
      id: new RuneId(
        Number(runeId.split(":")[0]),
        Number(runeId.split(":")[1])
      ),
      amount: runeSwapAmount * 10 ** divisibility,
      output: 2,
    });
    if (remainAmount !== 0)
      edicts.push({
        id: new RuneId(
          Number(runeId.split(":")[0]),
          Number(runeId.split(":")[1])
        ),
        amount: remainAmount * 10 ** divisibility,
        output: 3,
      });

    console.log(edicts);
    const transferStone = new Runestone(edicts, none(), none(), none());
    console.log(transferStone.encipher());

    tx.addOutput({
      script: Uint8Array.from(transferStone.encipher()),
      amount: BigInt(0),
    });

    tx.addOutput({
      script: userOrdinalWallet.script,
      amount: BigInt(546),
    });

    if (remainAmount !== 0)
      tx.addOutput({
        script: smartContractOutScript,
        amount: BigInt(546),
      });

    // BTC Fee Pay Part

    const feeRate = await getFeeRate();
    let amount = 0;
    let fee = 0;

    for (let i = 0; i < btcUtxos.length; i++) {
      fee = await calculateTxFee(tx.inputsLength, tx.outputsLength, feeRate);
      fee = fee < 200 ? 200 : fee;
      if (amount < fee + 546 * 2) {
        amount += btcUtxos[i].value;
        if (walletType === WalletTypes.UNISAT) {
          tx.addInput({
            txid: btcUtxos[i].txid,
            index: btcUtxos[i].vout,
            witnessUtxo: {
              amount: BigInt(btcUtxos[i].value),
              script: userPaymentWallet.script,
            },
            tapInternalKey: userOrdinalWallet.tapInternalKey,
            sighashType:
              Bitcoin.Transaction.SIGHASH_ALL |
              Bitcoin.Transaction.SIGHASH_ANYONECANPAY,
          });
        } else {
          tx.addInput({
            txid: btcUtxos[i].txid,
            index: btcUtxos[i].vout,
            witnessUtxo: {
              amount: BigInt(btcUtxos[i].value),
              script: userPaymentWallet.script,
            },
            sighashType:
              Bitcoin.Transaction.SIGHASH_ALL |
              Bitcoin.Transaction.SIGHASH_ANYONECANPAY,
          });
        }
        signPaymentIndexes.push(inputCnt);
        inputCnt++;
      }
    }

    if (amount < fee + 546 * 2)
      throw "Not enough UTXOs. Please wait for 1 block confirmation, or redeem more tBTC from a faucet.";

    tx.addOutput({
      script: userPaymentWallet.script,
      amount: BigInt(amount - fee - 546 * 2),
    });

    const psbt = tx.toPSBT();

    const hexPsbt = bytesToHex(psbt);
    const base64Psbt = Bitcoin.Psbt.fromHex(hexPsbt).toBase64();

    console.log(
      base64Psbt,
      " ",
      hexPsbt,
      signPaymentIndexes,
      signOrdinalIndexes,
      runeUtxos,
      remainAmount
    );

    return {
      base64Psbt,
      hexPsbt,
      signPaymentIndexes,
      signOrdinalIndexes,
      runeUtxos,
      remainAmount,
    };
  } catch (error) {
    console.log(error);
    throw error;
  }
};

/**
 * Processes and broadcasts a signed PSBT for a reconversion operation.
 * This function handles the final steps of a reconversion transaction,
 * including validation and broadcasting to the network.
 * 
 * @param {WalletTypes} walletType - The type of wallet being used (e.g., UNISAT, XVERSE)
 * @param {string} signedPSBT - The base64-encoded PSBT that has been signed
 * @param {IRuneUtxo[]} runeUtxos - Array of Rune UTXOs involved in the transaction
 * @returns {Promise<Object>} The result of the transaction broadcast
 * @throws {Error} If PSBT processing or broadcast fails
 * 
 * @example
 * const result = await pushReconvertPSBT(
 *   WalletTypes.UNISAT,  // walletType
 *   'cHNidP8BA...',      // signedPSBT
 *   [                    // runeUtxos
 *     {
 *       txid: '...',
 *       vout: 0,
 *       value: 1000,
 *       // ... other UTXO properties
 *     }
 *   ]
 * );
 */
export const pushReconvertPSBT = async (
  walletType: WalletTypes,
  signedPSBT: string,
  runeUtxos: IRuneUtxo[]
) => {
  try {
    const client = new RpcConnection(RPC_URL);

    // Process PSBT and prepare transaction data
    let psbt;
    if (walletType === WalletTypes.UNISAT) {
      psbt = Bitcoin.Psbt.fromHex(signedPSBT);
    } else {
      psbt = Bitcoin.Psbt.fromBase64(signedPSBT);
    }
    psbt.finalizeAllInputs();
    console.log(psbt.extractTransaction().toHex());
    const hexData = hexToBytes(psbt.extractTransaction().toHex());
    const runeTxIds = [];
    const runeVouts = [];

    for (const item of runeUtxos) {
      runeTxIds.push(item.txid);
      runeVouts.push(item.vout);
    }

    // Prepare instruction data
    const sendValue = {
      rune_txids: runeTxIds,
      rune_vouts: runeVouts,
      user_swap_psbt: hexData,
    };
    console.log("SendValue prepared:", sendValue); // Debug object

    // Create key pair from private key
    const keyPair = ECPair.fromPrivateKey(
      Buffer.from(process.env.ARCH_PRIVATE_KEY!, "hex"),
      {
        compressed: true,
        network: Bitcoin.networks.testnet,
      }
    );

    const pubkeyHex = Buffer.from(keyPair.publicKey.slice(1, 33)).toString(
      "hex"
    );

    // Get Account Address
    const accountAddress = await client.getAccountAddress(
      PubkeyUtil.fromHex(pubkeyHex)
    );
    console.log("Account Address : ", accountAddress);

    const encoded = borsh.serialize(SwapRuneInscriptionSchema, sendValue);
    const instructionData = new Uint8Array(encoded.length + 1);
    instructionData[0] = 1;
    instructionData.set(encoded, 1);

    // Swap instruction
    const instruction: Instruction = {
      program_id: PubkeyUtil.fromHex(SMART_CONTRACT_PUBKEY),
      accounts: [
        {
          pubkey: PubkeyUtil.fromHex(pubkeyHex),
          is_signer: true,
          is_writable: true,
        },
      ],
      data: instructionData,
    };

    const swapResult = (await transferDataToSmartContract(
      keyPair,
      instruction
    )) as string;
    console.log("Swap Result", swapResult);

    let btcBroadcastTxId = "";
    let i = 0;

    while (1) {
      try {
        await new Promise((resolve) => setTimeout(resolve, 10000));

        const btcTxId: ProcessedTransaction =
          (await client.getProcessedTransaction(
            swapResult
          )) as ProcessedTransaction;
        console.log("Bitcoin Txid Result", btcTxId.bitcoin_txid);

        btcBroadcastTxId = btcTxId.bitcoin_txid as string;

        break;
      } catch (error) {
        console.log("Finally Bug Here");
        if (i === MAX_RETRIES - 1) throw error;
      }
      i++;
    }

    return { txid: btcBroadcastTxId };
  } catch (error) {
    console.log(error);
    throw error;
  }
};

/**
 * Prepares and generates a PSBT for sending Rune tokens to another address.
 * This function handles the creation of a PSBT for Rune token transfers,
 * including fetching UTXOs, calculating fees, and constructing the transaction.
 * 
 * @param {string} userAddress - The Bitcoin address of the sender
 * @param {string} userPubkey - The public key of the sender in hexadecimal format
 * @returns {Promise<Object>} An object containing the generated PSBT and related data
 * @throws {Error} If PSBT generation fails due to insufficient funds or other errors
 * 
 * @example
 * const result = await preGenerateSendRune(
 *   'tb1qaddress...',  // userAddress
 *   '03abcdef...'      // userPubkey
 * );
 */
export const preGenerateSendRune = async (
  userAddress: string,
  userPubkey: string
) => {
  try {
    const {
      totalAmount,
      utxos: runeUtxos,
      divisibility,
    } = await fetchComfortableRuneUTXO(userAddress, runeId, 10 ** 10);

    const btcUtxos = await fetchBTCUtxo(userAddress);

    const smartcontractPubkey = Buffer.from(ACCOUNT_PUBKEY, "hex");

    const smartContractAddress = await rpc.getAccountAddress(
      new Uint8Array(smartcontractPubkey)
    );
    const smartContractOutScript = btc.OutScript.encode(
      btc.Address(TESTNET4_NETWORK).decode(smartContractAddress)
    );
    console.log("Smart Contract Address => ", smartContractAddress);
    console.log("totalAmount => ", totalAmount);

    const userWallet = btc.p2tr(
      Uint8Array.from(Buffer.from(userPubkey, "hex").slice(1, 33)),
      undefined,
      TESTNET4_NETWORK
    );

    const tx = new btc.Transaction({ allowUnknownOutputs: true });

    // Rune Send Part
    const edicts: any = [];

    edicts.push({
      id: new RuneId(
        Number(runeId.split(":")[0]),
        Number(runeId.split(":")[1])
      ),
      amount: (totalAmount * 10 ** divisibility) / 1000,
      output: 1001,
    });

    const transferStone = new Runestone(edicts, none(), none(), none());

    for (let i = 0; i < runeUtxos.length; i++) {
      tx.addInput({
        txid: runeUtxos[i].txid,
        index: runeUtxos[i].vout,
        witnessUtxo: {
          amount: BigInt(runeUtxos[i].value),
          script: userWallet.script,
        },
        tapInternalKey: Uint8Array.from(
          Buffer.from(userPubkey, "hex").slice(1, 33)
        ),
      });
    }

    tx.addOutput({
      script: Uint8Array.from(transferStone.encipher()),
      amount: BigInt(0),
    });

    for (let i = 0; i < 1000; i++) {
      tx.addOutput({
        script: smartContractOutScript,
        amount: BigInt(546),
      });
    }
    // BTC Fee Pay Part

    const feeRate = await getFeeRate();
    let amount = 0;
    let fee = 0;

    for (let i = 0; i < btcUtxos.length; i++) {
      fee = await calculateTxFee(tx.inputsLength, tx.outputsLength, feeRate);
      if (amount < fee + 546 * 1000) {
        amount += btcUtxos[i].value;
        tx.addInput({
          txid: btcUtxos[i].txid,
          index: btcUtxos[i].vout,
          witnessUtxo: {
            amount: BigInt(btcUtxos[i].value),
            script: userWallet.script,
          },
          tapInternalKey: Uint8Array.from(
            Buffer.from(userPubkey, "hex").slice(1, 33)
          ),
        });
      }
    }

    if (amount < fee + 546 * 1000)
      throw "Not enough UTXOs. Please wait for 1 block confirmation, or redeem more tBTC from a faucet.";

    const psbt = tx.toPSBT();

    const hexPsbt = bytesToHex(psbt);

    console.log(hexPsbt);
  } catch (error) {
    console.log(error);
    throw error;
  }
};

/**
 * Prepares and generates a PSBT for claiming Rune tokens from a smart contract.
 * This function handles the creation of a PSBT for claiming tokens that have been
 * locked in a smart contract, including validation and fee calculation.
 * 
 * @param {string} userAddress - The Bitcoin address that will receive the claimed tokens
 * @param {string} userPubkey - The public key of the recipient in hexadecimal format
 * @returns {Promise<Object>} An object containing the generated PSBT and related data
 * @throws {Error} If PSBT generation fails due to validation errors or other issues
 * 
 * @example
 * const result = await preGenerateClaimPSBT(
 *   'tb1qaddress...',  // userAddress
 *   '03abcdef...'      // userPubkey
 * );
 */
export const preGenerateClaimPSBT = async (
  userAddress: string,
  userPubkey: string
) => {
  try {
    const currentTime = new Date().getTime();
    if (currentTime < START_TIME + 24 * 60 * 60 * 1000)
      if (!WLList.includes(userAddress)) throw "You Are Not WL List User";

    const currentUser: any = await UserDataModel.findOne({ userAddress });
    const compareCnt = WLList.includes(userAddress) ? WL_CNT : NORMAL_CNT;

    if (currentUser !== null && currentUser.cnt >= compareCnt)
      throw "You Can Not Claim Anymore";

    const currentData: any = await NFTDataModel.findOne({ name: "Chimera" });
    if (currentData.count >= inscriptionIdList.length)
      throw "Can Not Inscribe Any More";

    const signIndexes = [];
    const btcUtxos = await fetchBTCUtxo(userAddress);
    let inputCnt = 0;

    const smartcontractPubkey = Buffer.from(ACCOUNT_PUBKEY, "hex");

    const smartContractAddress = await rpc.getAccountAddress(
      new Uint8Array(smartcontractPubkey)
    );

    console.log("Account Address : ", smartContractAddress);
    const availableInscription = await fetchAvailableInscriptionUTXO(
      smartContractAddress
    );

    if (availableInscription.length === 0)
      throw "We're hitting our rate limit. Please try again in one minute.";

    const smartContractOutScript = btc.OutScript.encode(
      btc.Address(TESTNET4_NETWORK).decode(smartContractAddress)
    );

    const userWallet = btc.p2tr(
      Uint8Array.from(Buffer.from(userPubkey, "hex").slice(1, 33)),
      undefined,
      TESTNET4_NETWORK
    );

    const tx = new btc.Transaction({ allowUnknownOutputs: true });

    tx.addOutput({
      script: userWallet.script,
      amount: BigInt(availableInscription[0].value),
    });

    // BTC Fee Pay Part

    const feeRate = await getFeeRate();
    let amount = 0;
    let fee = 0;

    for (let i = 0; i < btcUtxos.length; i++) {
      fee = await calculateTxFee(tx.inputsLength, tx.outputsLength, feeRate);
      if (amount < fee + 546) {
        amount += btcUtxos[i].value;
        tx.addInput({
          txid: btcUtxos[i].txid,
          index: btcUtxos[i].vout,
          witnessUtxo: {
            amount: BigInt(btcUtxos[i].value),
            script: userWallet.script,
          },
          tapInternalKey: Uint8Array.from(
            Buffer.from(userPubkey, "hex").slice(1, 33)
          ),
          sighashType:
            Bitcoin.Transaction.SIGHASH_ALL |
            Bitcoin.Transaction.SIGHASH_ANYONECANPAY,
        });
        signIndexes.push(inputCnt);
        inputCnt++;
      }
    }

    console.log("Amount: ", amount);

    if (amount < fee + 546)
      throw "Not enough UTXOs. Please wait for 1 block confirmation, or redeem more tBTC from a faucet.";

    tx.addOutput({
      script: userWallet.script,
      amount: BigInt(amount - fee - 546),
    });

    const psbt = tx.toPSBT();

    const hexPsbt = bytesToHex(psbt);

    console.log(hexPsbt, signIndexes, availableInscription[0]);

    return { hexPsbt, signIndexes, inscriptionUtxo: availableInscription[0] };
  } catch (error) {
    console.log(error);
    throw error;
  }
};
