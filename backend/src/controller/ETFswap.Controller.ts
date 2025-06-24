/**
 * ETF Redemption Controller
 * 
 * @module ETFSwapController
 * @description
 * Core module responsible for handling the ETF (Exchange-Traded Fund) redemption process in the CHIMERA ecosystem.
 * This controller manages the complete lifecycle of ETF token redemption, where users can exchange a single ETF token
 * for the underlying basket of 10 different Rune tokens that the ETF represents.
 *
 * ETF Redemption Process:
 * 1. User initiates redemption of 1 ETF token
 * 2. For each of the 10 underlying Rune tokens:
 *    - A separate transaction is prepared using preGenerateSendRuneToSWAP
 *    - The specified Rune token is sent to the smart contract
 *    - The smart contract verifies and processes the redemption
 * 3. Once all 10 transactions are confirmed, the user receives the equivalent value
 *    in the 10 underlying Rune tokens
 *
 * This process ensures atomicity - either all 10 token transfers succeed or none do,
 * maintaining the integrity of the ETF redemption mechanism.
 *
 * Key Features:
 * - 1:10 Token Redemption: Users swap 1 ETF token to receive 10 different Rune tokens
 * - PSBT (Partially Signed Bitcoin Transaction) generation and processing
 * - Smart contract interactions for secure token swaps
 * - UTXO management for efficient transaction construction
 * - Multi-wallet compatibility (UNISAT, XVERSE, etc.)
 * - Comprehensive error handling and transaction validation
 *
 * Underlying Rune Tokens:
 * 1. First Rune Token  (ID: FIRST_RUNE_TOKEN_ID)
 * 2. Second Rune Token (ID: SECOND_RUNE_TOKEN_ID)
 * 3. Third Rune Token  (ID: THIRD_RUNE_TOKEN_ID)
 * 4. Fourth Rune Token (ID: FORTH_RUNE_TOKEN_ID)
 * 5. Fifth Rune Token  (ID: FIFTH_RUNE_TOKEN_ID)
 * 6. Sixth Rune Token  (ID: SIXTH_RUNE_TOKEN_ID)
 * 7. Seventh Rune Token (ID: SEVENTH_RUNE_TOKEN_ID)
 * 8. Eighth Rune Token (ID: EIGHTH_RUNE_TOKEN_ID)
 * 9. Ninth Rune Token  (ID: NINTH_RUNE_TOKEN_ID)
 * 10. Tenth Rune Token  (ID: SOURCE_RUNE_TOKEN_ID)
 *
 * @see {@link https://github.com/ordinals/runes} for Runes protocol details
 * @see {@link https://github.com/satoshilabs/bitcoinjs-lib} for Bitcoin transaction handling
 *
 * @example
 * // Example of ETF redemption
 * const redemptionResult = await preGenerateRuneSwap(
 *   WalletTypes.UNISAT,          // User's wallet type
 *   'user_payment_address',      // Address for transaction fees
 *   'user_payment_pubkey',       // Public key for transaction signing
 *   'user_ordinal_address',      // Address receiving the Rune tokens
 *   'user_ordinal_pubkey',       // Public key for the receiving address
 *   1                           // Number of ETF tokens to redeem (1 = 10 Rune tokens)
 * );
 * 
 * // After successful redemption, the user will receive all 10 underlying Rune tokens
 * // in their wallet, with amounts proportional to the ETF's composition.
 */

/**
 * Core blockchain and cryptographic libraries
 * 
 * These dependencies provide essential cryptographic and blockchain functionality:
 * - runelib: Utilities for working with Runes protocol
 * - @saturnbtcio/arch-sdk: SDK for interacting with the Arch blockchain
 * - @scure/btc-signer: Secure Bitcoin transaction signing
 * - bitcoinjs-lib: Bitcoin protocol implementation
 * - tiny-secp256k1: Elliptic curve cryptography
 * - ecpair: Elliptic Curve key pair handling
 * - wif: Wallet Import Format encoding/decoding
 * - bip322-js: BIP-322 message signing
 * - borsh: Binary Object Representation Serializer for Hashing
 */
import { none, RuneId, Runestone } from "runelib";
import {
  ArchConnection,  // Connection to Arch blockchain network
  RpcConnection,    // RPC client for blockchain interaction
  MessageUtil,      // Utilities for message handling
  PubkeyUtil,       // Public key utilities
  type Message,     // Type for blockchain messages
  type RuntimeTransaction,  // Type for runtime transactions
  type Instruction,         // Type for smart contract instructions
  type ProcessedTransaction,// Type for processed transactions
} from "@saturnbtcio/arch-sdk";
import * as btc from "@scure/btc-signer";  // Secure Bitcoin transaction signing
import * as Bitcoin from "bitcoinjs-lib";  // Bitcoin protocol implementation
import * as ecc from "tiny-secp256k1";     // Elliptic curve cryptography
import { ECPairFactory, type ECPairInterface } from "ecpair";  // ECDSA key pair handling
import wif from "wif";  // Wallet Import Format encoding/decoding
import bip322 from "bip322-js";  // BIP-322 message signing
import * as borsh from "borsh";  // Binary serialization
import { bytesToHex, hexToBytes } from "@noble/hashes/utils";  // Encoding utilities

/**
 * Application services and utilities
 * 
 * These are internal modules that provide specific functionality:
 * - psbt.service: PSBT (Partially Signed Bitcoin Transaction) utilities
 * - schema: TypeScript interfaces and validation schemas
 * - utils.service: General utility functions
 * - utxo.service: UTXO (Unspent Transaction Output) management
 */
import { getFeeRate, calculateTxFee } from "../utils/psbt.service";
import { SwapRuneSchema } from "../config/schema";
import { getRuneBalanceList } from "../utils/utils.service";
import { fetchComfortableRuneUTXO, fetchBTCUtxo } from "../utils/utxo.service";

/**
 * Application configuration
 * 
 * These constants are imported from the config file and control various
 * aspects of the swap functionality:
 * - RPC_URL: URL of the Bitcoin RPC endpoint
 * - MAX_RETRIES: Maximum number of retries for failed operations
 * - ACCOUNT_PUBKEY_SWAP: Public key of the swap account
 * - TOKEN_IDs: Various Rune token identifiers used in the application
 * - SMART_CONTRACT_PUBKEY_SWAP: Public key of the swap smart contract
 * - runeId: ID of the main Rune token
 * - WalletTypes: Enumeration of supported wallet types
 */
import {
  RPC_URL,                   // URL of the Bitcoin RPC endpoint
  MAX_RETRIES,               // Maximum number of retries for failed operations
  ACCOUNT_PUBKEY_SWAP,       // Public key of the swap account
  SOURCE_RUNE_TOKEN_ID,      // ID of the source Rune token
  FIRST_RUNE_TOKEN_ID,       // ID of the first Rune token
  SECOND_RUNE_TOKEN_ID,      // ID of the second Rune token
  THIRD_RUNE_TOKEN_ID,       // ID of the third Rune token
  FORTH_RUNE_TOKEN_ID,       // ID of the fourth Rune token
  FIFTH_RUNE_TOKEN_ID,       // ID of the fifth Rune token
  SIXTH_RUNE_TOKEN_ID,       // ID of the sixth Rune token
  SEVENTH_RUNE_TOKEN_ID,     // ID of the seventh Rune token
  EIGHTH_RUNE_TOKEN_ID,      // ID of the eighth Rune token
  NINTH_RUNE_TOKEN_ID,       // ID of the ninth Rune token
  SMART_CONTRACT_PUBKEY_SWAP,// Public key of the swap smart contract
  runeId,                   // ID of the main Rune token
  WalletTypes,              // Enum of supported wallet types (e.g., UNISAT, XVERSE)
} from "../config/config";

/**
 * Testnet4 Network Configuration
 * 
 * @constant {Object} TESTNET4_NETWORK
 * @description
 * Configuration object defining the network parameters for Bitcoin testnet4.
 * This configuration is used throughout the application for address generation,
 * transaction signing, and network communication.
 * 
 * @property {string} bech32="tb" - The Bech32 human-readable part (HRP) for native
 *   SegWit addresses on testnet (starts with 'tb1').
 * @property {number} pubKeyHash=0x1c - The version byte for Pay-to-Public-Key-Hash
 *   (P2PKH) addresses on testnet (produces addresses starting with 'm' or 'n').
 * @property {number} scriptHash=0x16 - The version byte for Pay-to-Script-Hash
 *   (P2SH) addresses on testnet (produces addresses starting with '2').
 * @property {number} wif=0x3f - The version byte for Wallet Import Format (WIF)
 *   private key export on testnet.
 * 
 * @example
 * // Example of using TESTNET4_NETWORK for address generation
 * const { address } = btc.p2pkh(
 *   hexToBytes('0250863ad64a87ae8a2fe83c1af1a8403cb53f53e486d8511dad8a04887e5b2352'),
 *   TESTNET4_NETWORK
 * );
 */
export const TESTNET4_NETWORK: typeof btc.NETWORK = {
  bech32: "tb",    // Bech32 HRP for native SegWit addresses (tb1...)
  pubKeyHash: 0x1c, // P2PKH address version (m/n...)
  scriptHash: 0x16, // P2SH address version (2...)
  wif: 0x3f,        // WIF private key version
};

// Initialize ECPair factory with the elliptic curve cryptography library
const ECPair = ECPairFactory(ecc);
Bitcoin.initEccLib(ecc);

// Initialize RPC connection to the Arch blockchain with testnet network
const rpcConnection = new RpcConnection(RPC_URL);
// @ts-ignore - The network property exists but isn't in the type definitions
rpcConnection.network = TESTNET4_NETWORK;
const rpc = ArchConnection(rpcConnection);

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
    process.env.ARCH_SWAP_PRIVATE_KEY!
  );
  const signatureBuffer = new Uint8Array(Buffer.from(signature));

  const tx: RuntimeTransaction = {
    version: 2,
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
 * Prepares a transaction to send the NINTH_RUNE_TOKEN to the swap smart contract
 * as part of the ETF redemption process.
 * 
 * This function is a critical component of the ETF redemption flow, specifically handling
 * the transfer of one of the underlying Rune tokens (NINTH_RUNE_TOKEN_ID) to the smart contract.
 * It's called for each of the 10 underlying tokens during the complete redemption process.
 *
 * @param {string} userAddress - The Bitcoin address of the user initiating the redemption
 * @param {string} userPubkey - The public key of the user in hex format
 * @returns {Promise<Object>} The prepared transaction details
 * @throws {Error} If there's an error preparing the transaction
 * 
 * @example
 * // Example usage in the ETF redemption flow
 * const tx = await preGenerateSendRuneToSWAP(
 *   'user1Address',
 *   'user1PublicKeyHex'
 * );
 */
export const preGenerateSendRuneToSWAP = async (
  userAddress: string,
  userPubkey: string
) => {
  try {
    const {
      totalAmount,
      utxos: runeUtxos,
      divisibility,
    } = await fetchComfortableRuneUTXO(
      userAddress,
      NINTH_RUNE_TOKEN_ID,
      10 ** 10
    );

    const btcUtxos = await fetchBTCUtxo(userAddress);

    const smartcontractPubkey = Buffer.from(ACCOUNT_PUBKEY_SWAP, "hex");

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
        Number(NINTH_RUNE_TOKEN_ID.split(":")[0]),
        Number(NINTH_RUNE_TOKEN_ID.split(":")[1])
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

    // const feeRate = await getFeeRate();
    const feeRate = 3;
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

    if (amount < fee)
      throw "Not enough UTXOs. Please wait for 1 block confirmation, or redeem more tBTC from a faucet.";

    const psbt = tx.toPSBT();

    const hexPsbt = bytesToHex(psbt);

    console.log(hexPsbt);
  } catch (error) {
    console.log(error);
    throw error;
  }
};

export const splitUtxos = async (userPubkey: string) => {
  const userWallet = btc.p2tr(
    Uint8Array.from(Buffer.from(userPubkey, "hex").slice(1, 33)),
    undefined,
    TESTNET4_NETWORK
  );
  let tx = new btc.Transaction({ allowUnknownOutputs: true });
  tx.addInput({
    txid: "6e996ec8f2a28cabead2fc028ba392608854f66ad099a933b74dff9c73b6748b",
    index: 1,
    witnessUtxo: {
      amount: BigInt(183163911),
      script: userWallet.script,
    },
    tapInternalKey: Uint8Array.from(
      Buffer.from(userPubkey, "hex").slice(1, 33)
    ),
  });
  for (let i = 0; i < 100; i++) {
    tx.addOutput({
      script: userWallet.script,
      amount: BigInt(500000),
    });
  }
  tx.addOutput({
    script: userWallet.script,
    amount: BigInt(133156000),
  });

  const psbt = tx.toPSBT();

  const hexPsbt = bytesToHex(psbt);

  console.log(hexPsbt);
};

export const preGenerateRuneSwap = async (
  walletType: WalletTypes,
  userPaymentAddress: string,
  userPaymentPubkey: string,
  userOrdinalAddress: string,
  userOrdinalPubkey: string,
  runeAmount: number
) => {
  try {
    if (runeAmount < 100) throw "Too Small Amount";

    const {
      totalAmount: userRuneAmount,
      utxos: userUtxos,
      divisibility,
    } = await fetchComfortableRuneUTXO(
      userOrdinalAddress,
      SOURCE_RUNE_TOKEN_ID,
      runeAmount
    );

    if (userRuneAmount < runeAmount * 10 ** divisibility)
      throw "You Have not got Enough Rune Tokens";

    const btcUtxos = await fetchBTCUtxo(userPaymentAddress);

    const smartcontractPubkey = Buffer.from(ACCOUNT_PUBKEY_SWAP, "hex");

    const smartContractAddress = await rpc.getAccountAddress(
      new Uint8Array(smartcontractPubkey)
    );
    const smartContractOutScript = btc.OutScript.encode(
      btc.Address(TESTNET4_NETWORK).decode(smartContractAddress)
    );
    console.log("Smart Contract Address => ", smartContractAddress);

    const {
      totalAmount: firstRuneAmount,
      utxos: firstRuneUtxos,
      divisibility: firstDivisibility,
    } = await fetchComfortableRuneUTXO(
      smartContractAddress,
      FIRST_RUNE_TOKEN_ID,
      runeAmount * 0.3
    );

    if (firstRuneAmount < runeAmount * 0.3 * 10 ** firstDivisibility)
      throw "Smart Contract Have not got Enough First Rune Tokens";

    const {
      totalAmount: secondRuneAmount,
      utxos: secondRuneUtxos,
      divisibility: secondDivisibility,
    } = await fetchComfortableRuneUTXO(
      smartContractAddress,
      SECOND_RUNE_TOKEN_ID,
      runeAmount * 0.2
    );

    if (secondRuneAmount < runeAmount * 0.2 * 10 ** secondDivisibility)
      throw "Smart Contract Have not got Enough Second Rune Tokens";

    const {
      totalAmount: thirdRuneAmount,
      utxos: thirdRuneUtxos,
      divisibility: thirdDivisibility,
    } = await fetchComfortableRuneUTXO(
      smartContractAddress,
      THIRD_RUNE_TOKEN_ID,
      runeAmount * 0.15
    );

    if (thirdRuneAmount < runeAmount * 0.15 * 10 ** thirdDivisibility)
      throw "Smart Contract Have not got Enough Third Rune Tokens";

    const {
      totalAmount: forthRuneAmount,
      utxos: forthRuneUtxos,
      divisibility: forthDivisibility,
    } = await fetchComfortableRuneUTXO(
      smartContractAddress,
      FORTH_RUNE_TOKEN_ID,
      runeAmount * 0.1
    );

    if (forthRuneAmount < runeAmount * 0.1 * 10 ** forthDivisibility)
      throw "Smart Contract Have not got Enough Forth Rune Tokens";

    const {
      totalAmount: fifthRuneAmount,
      utxos: fifthRuneUtxos,
      divisibility: fifthDivisibility,
    } = await fetchComfortableRuneUTXO(
      smartContractAddress,
      FIFTH_RUNE_TOKEN_ID,
      runeAmount * 0.07
    );

    if (fifthRuneAmount < runeAmount * 0.07 * 10 ** fifthDivisibility)
      throw "Smart Contract Have not got Enough Fifth Rune Tokens";

    const {
      totalAmount: sixthRuneAmount,
      utxos: sixthRuneUtxos,
      divisibility: sixthDivisibility,
    } = await fetchComfortableRuneUTXO(
      smartContractAddress,
      SIXTH_RUNE_TOKEN_ID,
      runeAmount * 0.05
    );

    if (sixthRuneAmount < runeAmount * 0.05 * 10 ** sixthDivisibility)
      throw "Smart Contract Have not got Enough Sixth Rune Tokens";

    const {
      totalAmount: seventhRuneAmount,
      utxos: seventhRuneUtxos,
      divisibility: seventhDivisibility,
    } = await fetchComfortableRuneUTXO(
      smartContractAddress,
      SEVENTH_RUNE_TOKEN_ID,
      runeAmount * 0.04
    );

    if (seventhRuneAmount < runeAmount * 0.04 * 10 ** seventhDivisibility)
      throw "Smart Contract Have not got Enough Seventh Rune Tokens";

    const {
      totalAmount: eighthRuneAmount,
      utxos: eighthRuneUtxos,
      divisibility: eighthDivisibility,
    } = await fetchComfortableRuneUTXO(
      smartContractAddress,
      EIGHTH_RUNE_TOKEN_ID,
      runeAmount * 0.03
    );

    if (eighthRuneAmount < runeAmount * 0.03 * 10 ** eighthDivisibility)
      throw "Smart Contract Have not got Enough Eighth Rune Tokens";

    const {
      totalAmount: ninethRuneAmount,
      utxos: ninethRuneUtxos,
      divisibility: ninethDivisibility,
    } = await fetchComfortableRuneUTXO(
      smartContractAddress,
      NINTH_RUNE_TOKEN_ID,
      runeAmount * 0.03
    );

    if (ninethRuneAmount < runeAmount * 0.03 * 10 ** ninethDivisibility)
      throw "Smart Contract Have not got Enough Nineth Rune Tokens";

    const {
      totalAmount: chimeraRuneAmount,
      utxos: chimeraRuneUtxos,
      divisibility: chimeraDivisibility,
    } = await fetchComfortableRuneUTXO(
      smartContractAddress,
      runeId,
      runeAmount * 0.03
    );

    if (chimeraRuneAmount < runeAmount * 0.03 * 10 ** chimeraDivisibility)
      throw "Smart Contract Have not got Enough Chimera Rune Tokens";

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

    let amount = 0;
    let fee = 0;
    let cnt = 0;
    const feeRate = await getFeeRate();
    const usedUtxos: string[] = [];
    const signOrdinalIndexes = [];
    const signPaymentIndexes_first = [];
    const signPaymentIndexes_second = [];
    const signPaymentIndexes_third = [];
    const signPaymentIndexes_forth = [];
    const txids_first: string[] = [];
    const vouts_first: number[] = [];
    const txids_second: string[] = [];
    const vouts_second: number[] = [];
    const txids_third: string[] = [];
    const vouts_third: number[] = [];
    const txids_forth: string[] = [];
    const vouts_forth: number[] = [];

    let tx = new btc.Transaction({ allowUnknownOutputs: true });

    // Rune Send Part
    let edicts: any = [];

    edicts.push({
      id: new RuneId(
        Number(SOURCE_RUNE_TOKEN_ID.split(":")[0]),
        Number(SOURCE_RUNE_TOKEN_ID.split(":")[1])
      ),
      amount: runeAmount * 10 ** divisibility,
      output: 1,
    });

    edicts.push({
      id: new RuneId(
        Number(SOURCE_RUNE_TOKEN_ID.split(":")[0]),
        Number(SOURCE_RUNE_TOKEN_ID.split(":")[1])
      ),
      amount:
        userRuneAmount * 10 ** divisibility - runeAmount * 10 ** divisibility,
      output: 2,
    });

    edicts.push({
      id: new RuneId(
        Number(FIRST_RUNE_TOKEN_ID.split(":")[0]),
        Number(FIRST_RUNE_TOKEN_ID.split(":")[1])
      ),
      amount: Number(
        Number(runeAmount * 0.3 * 10 ** firstDivisibility).toFixed()
      ),
      output: 3,
    });

    edicts.push({
      id: new RuneId(
        Number(FIRST_RUNE_TOKEN_ID.split(":")[0]),
        Number(FIRST_RUNE_TOKEN_ID.split(":")[1])
      ),
      amount:
        firstRuneAmount * 10 ** firstDivisibility -
        Number(Number(runeAmount * 0.3 * 10 ** firstDivisibility).toFixed()),
      output: 4,
    });

    edicts.push({
      id: new RuneId(
        Number(SECOND_RUNE_TOKEN_ID.split(":")[0]),
        Number(SECOND_RUNE_TOKEN_ID.split(":")[1])
      ),
      amount: Number(
        Number(runeAmount * 0.2 * 10 ** secondDivisibility).toFixed()
      ),
      output: 5,
    });

    edicts.push({
      id: new RuneId(
        Number(SECOND_RUNE_TOKEN_ID.split(":")[0]),
        Number(SECOND_RUNE_TOKEN_ID.split(":")[1])
      ),
      amount:
        secondRuneAmount * 10 ** secondDivisibility -
        Number(Number(runeAmount * 0.2 * 10 ** secondDivisibility).toFixed()),
      output: 6,
    });

    let transferStone = new Runestone(edicts, none(), none(), none());

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
    tx.addOutput({
      script: userOrdinalWallet.script,
      amount: BigInt(546),
    });
    tx.addOutput({
      script: smartContractOutScript,
      amount: BigInt(546),
    });
    tx.addOutput({
      script: userOrdinalWallet.script,
      amount: BigInt(546),
    });
    tx.addOutput({
      script: smartContractOutScript,
      amount: BigInt(546),
    });

    for (let i = 0; i < userUtxos.length; i++) {
      tx.addInput({
        txid: userUtxos[i].txid,
        index: userUtxos[i].vout,
        witnessUtxo: {
          amount: BigInt(userUtxos[i].value),
          script: userOrdinalWallet.script,
        },
        tapInternalKey: userOrdinalWallet.tapInternalKey,
        sighashType:
          Bitcoin.Transaction.SIGHASH_ALL |
          Bitcoin.Transaction.SIGHASH_ANYONECANPAY,
      });

      signOrdinalIndexes.push(cnt);
      cnt++;
    }

    // BTC Fee Pay Part

    for (let i = 0; i < btcUtxos.length; i++) {
      fee = await calculateTxFee(tx.inputsLength, tx.outputsLength, feeRate);
      fee = fee < 200 ? 200 : fee;
      if (
        amount < fee + 546 * 5 &&
        !usedUtxos.includes(btcUtxos[i].txid + btcUtxos[i].vout)
      ) {
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

        usedUtxos.push(btcUtxos[i].txid + btcUtxos[i].vout);
        signPaymentIndexes_first.push(cnt);
        cnt++;
      }
    }

    if (amount < fee + 546 * 5) throw "Not enough UTXOs or BTC.";

    tx.addOutput({
      script: userPaymentWallet.script,
      amount: BigInt(amount - fee - 546 * 5),
    });

    const psbt_first = tx.toPSBT();
    firstRuneUtxos.map((item) => {
      txids_first.push(item.txid);
      vouts_first.push(item.vout);
    });
    secondRuneUtxos.map((item) => {
      txids_first.push(item.txid);
      vouts_first.push(item.vout);
    });

    // Second Send

    tx = new btc.Transaction({ allowUnknownOutputs: true });

    // Rune Send Part
    edicts = [];

    edicts.push({
      id: new RuneId(
        Number(THIRD_RUNE_TOKEN_ID.split(":")[0]),
        Number(THIRD_RUNE_TOKEN_ID.split(":")[1])
      ),
      amount: Number(
        Number(runeAmount * 0.15 * 10 ** thirdDivisibility).toFixed()
      ),
      output: 1,
    });

    edicts.push({
      id: new RuneId(
        Number(THIRD_RUNE_TOKEN_ID.split(":")[0]),
        Number(THIRD_RUNE_TOKEN_ID.split(":")[1])
      ),
      amount:
        thirdRuneAmount * 10 ** thirdDivisibility -
        Number(Number(runeAmount * 0.15 * 10 ** thirdDivisibility).toFixed()),
      output: 2,
    });

    edicts.push({
      id: new RuneId(
        Number(FORTH_RUNE_TOKEN_ID.split(":")[0]),
        Number(FORTH_RUNE_TOKEN_ID.split(":")[1])
      ),
      amount: Number(
        Number(runeAmount * 0.1 * 10 ** forthDivisibility).toFixed()
      ),
      output: 3,
    });

    edicts.push({
      id: new RuneId(
        Number(FORTH_RUNE_TOKEN_ID.split(":")[0]),
        Number(FORTH_RUNE_TOKEN_ID.split(":")[1])
      ),
      amount:
        forthRuneAmount * 10 ** forthDivisibility -
        Number(Number(runeAmount * 0.1 * 10 ** forthDivisibility).toFixed()),
      output: 4,
    });

    edicts.push({
      id: new RuneId(
        Number(FIFTH_RUNE_TOKEN_ID.split(":")[0]),
        Number(FIFTH_RUNE_TOKEN_ID.split(":")[1])
      ),
      amount: Number(
        Number(runeAmount * 0.07 * 10 ** fifthDivisibility).toFixed()
      ),
      output: 5,
    });

    edicts.push({
      id: new RuneId(
        Number(FIFTH_RUNE_TOKEN_ID.split(":")[0]),
        Number(FIFTH_RUNE_TOKEN_ID.split(":")[1])
      ),
      amount:
        fifthRuneAmount * 10 ** fifthDivisibility -
        Number(Number(runeAmount * 0.07 * 10 ** fifthDivisibility).toFixed()),
      output: 6,
    });

    transferStone = new Runestone(edicts, none(), none(), none());

    tx.addOutput({
      script: Uint8Array.from(transferStone.encipher()),
      amount: BigInt(0),
    });

    tx.addOutput({
      script: userOrdinalWallet.script,
      amount: BigInt(546),
    });
    tx.addOutput({
      script: smartContractOutScript,
      amount: BigInt(546),
    });
    tx.addOutput({
      script: userOrdinalWallet.script,
      amount: BigInt(546),
    });
    tx.addOutput({
      script: smartContractOutScript,
      amount: BigInt(546),
    });
    tx.addOutput({
      script: userOrdinalWallet.script,
      amount: BigInt(546),
    });
    tx.addOutput({
      script: smartContractOutScript,
      amount: BigInt(546),
    });

    // BTC Fee Pay Part
    cnt = 0;
    amount = 0;
    for (let i = 0; i < btcUtxos.length; i++) {
      fee = await calculateTxFee(tx.inputsLength, tx.outputsLength, feeRate);
      fee = fee < 200 ? 200 : fee;
      if (
        amount < fee + 546 * 6 &&
        !usedUtxos.includes(btcUtxos[i].txid + btcUtxos[i].vout)
      ) {
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

        usedUtxos.push(btcUtxos[i].txid + btcUtxos[i].vout);
        signPaymentIndexes_second.push(cnt);
        cnt++;
      }
    }

    if (amount < fee + 546 * 6) throw "Not enough UTXOs or BTC.";

    tx.addOutput({
      script: userOrdinalWallet.script,
      amount: BigInt(amount - fee - 546 * 6),
    });

    const psbt_second = tx.toPSBT();
    thirdRuneUtxos.map((item) => {
      txids_second.push(item.txid);
      vouts_second.push(item.vout);
    });
    forthRuneUtxos.map((item) => {
      txids_second.push(item.txid);
      vouts_second.push(item.vout);
    });
    fifthRuneUtxos.map((item) => {
      txids_second.push(item.txid);
      vouts_second.push(item.vout);
    });

    // Third Send

    tx = new btc.Transaction({ allowUnknownOutputs: true });

    // Rune Send Part
    edicts = [];

    edicts.push({
      id: new RuneId(
        Number(SIXTH_RUNE_TOKEN_ID.split(":")[0]),
        Number(SIXTH_RUNE_TOKEN_ID.split(":")[1])
      ),
      amount: Number(
        Number(runeAmount * 0.05 * 10 ** sixthDivisibility).toFixed()
      ),
      output: 1,
    });

    edicts.push({
      id: new RuneId(
        Number(SIXTH_RUNE_TOKEN_ID.split(":")[0]),
        Number(SIXTH_RUNE_TOKEN_ID.split(":")[1])
      ),
      amount:
        sixthRuneAmount * 10 ** sixthDivisibility -
        Number(Number(runeAmount * 0.05 * 10 ** sixthDivisibility).toFixed()),
      output: 2,
    });

    edicts.push({
      id: new RuneId(
        Number(SEVENTH_RUNE_TOKEN_ID.split(":")[0]),
        Number(SEVENTH_RUNE_TOKEN_ID.split(":")[1])
      ),
      amount: Number(
        Number(runeAmount * 0.04 * 10 ** seventhDivisibility).toFixed()
      ),
      output: 3,
    });

    edicts.push({
      id: new RuneId(
        Number(SEVENTH_RUNE_TOKEN_ID.split(":")[0]),
        Number(SEVENTH_RUNE_TOKEN_ID.split(":")[1])
      ),
      amount:
        seventhRuneAmount * 10 ** seventhDivisibility -
        Number(Number(runeAmount * 0.04 * 10 ** seventhDivisibility).toFixed()),
      output: 4,
    });

    edicts.push({
      id: new RuneId(
        Number(EIGHTH_RUNE_TOKEN_ID.split(":")[0]),
        Number(EIGHTH_RUNE_TOKEN_ID.split(":")[1])
      ),
      amount: Number(
        Number(runeAmount * 0.03 * 10 ** eighthDivisibility).toFixed()
      ),
      output: 5,
    });

    edicts.push({
      id: new RuneId(
        Number(EIGHTH_RUNE_TOKEN_ID.split(":")[0]),
        Number(EIGHTH_RUNE_TOKEN_ID.split(":")[1])
      ),
      amount:
        eighthRuneAmount * 10 ** eighthDivisibility -
        Number(Number(runeAmount * 0.03 * 10 ** eighthDivisibility).toFixed()),
      output: 6,
    });

    transferStone = new Runestone(edicts, none(), none(), none());

    tx.addOutput({
      script: Uint8Array.from(transferStone.encipher()),
      amount: BigInt(0),
    });

    tx.addOutput({
      script: userOrdinalWallet.script,
      amount: BigInt(546),
    });
    tx.addOutput({
      script: smartContractOutScript,
      amount: BigInt(546),
    });
    tx.addOutput({
      script: userOrdinalWallet.script,
      amount: BigInt(546),
    });
    tx.addOutput({
      script: smartContractOutScript,
      amount: BigInt(546),
    });
    tx.addOutput({
      script: userOrdinalWallet.script,
      amount: BigInt(546),
    });
    tx.addOutput({
      script: smartContractOutScript,
      amount: BigInt(546),
    });

    // BTC Fee Pay Part
    cnt = 0;
    amount = 0;
    for (let i = 0; i < btcUtxos.length; i++) {
      fee = await calculateTxFee(tx.inputsLength, tx.outputsLength, feeRate);
      fee = fee < 200 ? 200 : fee;
      if (
        amount < fee + 546 * 6 &&
        !usedUtxos.includes(btcUtxos[i].txid + btcUtxos[i].vout)
      ) {
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

        usedUtxos.push(btcUtxos[i].txid + btcUtxos[i].vout);
        signPaymentIndexes_third.push(cnt);
        cnt++;
      }
    }

    if (amount < fee + 546 * 6) throw "Not enough UTXOs or BTC.";

    tx.addOutput({
      script: userOrdinalWallet.script,
      amount: BigInt(amount - fee - 546 * 6),
    });

    const psbt_third = tx.toPSBT();
    sixthRuneUtxos.map((item) => {
      txids_third.push(item.txid);
      vouts_third.push(item.vout);
    });
    seventhRuneUtxos.map((item) => {
      txids_third.push(item.txid);
      vouts_third.push(item.vout);
    });
    eighthRuneUtxos.map((item) => {
      txids_third.push(item.txid);
      vouts_third.push(item.vout);
    });

    // Forth Send

    tx = new btc.Transaction({ allowUnknownOutputs: true });

    // Rune Send Part
    edicts = [];

    edicts.push({
      id: new RuneId(
        Number(NINTH_RUNE_TOKEN_ID.split(":")[0]),
        Number(NINTH_RUNE_TOKEN_ID.split(":")[1])
      ),
      amount: Number(
        Number(runeAmount * 0.03 * 10 ** ninethDivisibility).toFixed()
      ),
      output: 1,
    });

    edicts.push({
      id: new RuneId(
        Number(NINTH_RUNE_TOKEN_ID.split(":")[0]),
        Number(NINTH_RUNE_TOKEN_ID.split(":")[1])
      ),
      amount:
        ninethRuneAmount * 10 ** ninethDivisibility -
        Number(Number(runeAmount * 0.03 * 10 ** ninethDivisibility).toFixed()),
      output: 2,
    });

    edicts.push({
      id: new RuneId(
        Number(runeId.split(":")[0]),
        Number(runeId.split(":")[1])
      ),
      amount: Number(
        Number(runeAmount * 0.03 * 10 ** chimeraDivisibility).toFixed()
      ),
      output: 3,
    });

    edicts.push({
      id: new RuneId(
        Number(runeId.split(":")[0]),
        Number(runeId.split(":")[1])
      ),
      amount:
        chimeraRuneAmount * 10 ** chimeraDivisibility -
        Number(Number(runeAmount * 0.03 * 10 ** chimeraDivisibility).toFixed()),
      output: 4,
    });

    transferStone = new Runestone(edicts, none(), none(), none());

    tx.addOutput({
      script: Uint8Array.from(transferStone.encipher()),
      amount: BigInt(0),
    });

    tx.addOutput({
      script: userOrdinalWallet.script,
      amount: BigInt(546),
    });
    tx.addOutput({
      script: smartContractOutScript,
      amount: BigInt(546),
    });
    tx.addOutput({
      script: userOrdinalWallet.script,
      amount: BigInt(546),
    });
    tx.addOutput({
      script: smartContractOutScript,
      amount: BigInt(546),
    });

    // BTC Fee Pay Part
    cnt = 0;
    amount = 0;
    for (let i = 0; i < btcUtxos.length; i++) {
      fee = await calculateTxFee(tx.inputsLength, tx.outputsLength, feeRate);
      fee = fee < 200 ? 200 : fee;
      if (
        amount < fee + 546 * 4 &&
        !usedUtxos.includes(btcUtxos[i].txid + btcUtxos[i].vout)
      ) {
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

        usedUtxos.push(btcUtxos[i].txid + btcUtxos[i].vout);
        signPaymentIndexes_forth.push(cnt);
        cnt++;
      }
    }

    if (amount < fee + 546 * 4) throw "Not enough UTXOs or BTC.";

    tx.addOutput({
      script: userOrdinalWallet.script,
      amount: BigInt(amount - fee - 546 * 4),
    });

    const psbt_forth = tx.toPSBT();
    ninethRuneUtxos.map((item) => {
      txids_forth.push(item.txid);
      vouts_forth.push(item.vout);
    });
    chimeraRuneUtxos.map((item) => {
      txids_forth.push(item.txid);
      vouts_forth.push(item.vout);
    });

    const firstHex = bytesToHex(psbt_first);
    const firstBase64 = Bitcoin.Psbt.fromHex(firstHex).toBase64();
    const secondHex = bytesToHex(psbt_second);
    const secondBase64 = Bitcoin.Psbt.fromHex(secondHex).toBase64();
    const thirdHex = bytesToHex(psbt_third);
    const thirdBase64 = Bitcoin.Psbt.fromHex(thirdHex).toBase64();
    const forthHex = bytesToHex(psbt_forth);
    const forthBase64 = Bitcoin.Psbt.fromHex(forthHex).toBase64();

    console.log(
      firstHex,
      secondHex,
      thirdHex,
      forthHex,
      signOrdinalIndexes,
      signPaymentIndexes_first,
      signPaymentIndexes_second,
      signPaymentIndexes_third,
      signPaymentIndexes_forth,
      [txids_first, txids_second, txids_third, txids_forth],
      [vouts_first, vouts_second, vouts_third, vouts_forth]
    );

    return {
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
      txids: [txids_first, txids_second, txids_third, txids_forth],
      vouts: [vouts_first, vouts_second, vouts_third, vouts_forth],
    };
  } catch (error) {
    console.log(error);
    throw error;
  }
};

export const pushSwapPsbt = async (
  walletType: WalletTypes,
  signedPSBT: string[],
  txids: string[][],
  vouts: number[][]
) => {
  try {
    for (let i = 0; i < signedPSBT.length; i++) {
      const client = new RpcConnection(RPC_URL);

      // Process PSBT and prepare transaction data
      let psbt;
      if (walletType === WalletTypes.UNISAT)
        psbt = Bitcoin.Psbt.fromHex(signedPSBT[i]);
      else psbt = Bitcoin.Psbt.fromBase64(signedPSBT[i]);
      psbt.finalizeAllInputs();
      const hexData = hexToBytes(psbt.extractTransaction().toHex());

      // Prepare instruction data
      const sendValue = {
        txids: txids[i],
        vouts: vouts[i],
        user_swap_tx: hexData,
      };
      console.log("SendValue prepared:", sendValue); // Debug object

      // Create key pair from private key
      const keyPair = ECPair.fromPrivateKey(
        Buffer.from(process.env.ARCH_SWAP_PRIVATE_KEY!, "hex"),
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

      const encoded = borsh.serialize(SwapRuneSchema, sendValue);
      const instructionData = new Uint8Array(encoded.length);
      instructionData.set(encoded, 0);
      // Swap instruction
      const instruction: Instruction = {
        program_id: PubkeyUtil.fromHex(SMART_CONTRACT_PUBKEY_SWAP),
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
    }
    // return swapResult;
  } catch (error) {
    console.error("Transaction error:", error);
    throw error;
  }
};

/**
 * Retrieves the Rune token balance of the smart contract
 * 
 * This function fetches the current Rune token balance held by the swap smart contract.
 * It's used to monitor the contract's liquidity and available funds for swaps.
 * 
 * @returns {Promise<Object>} The Rune token balance information
 * @throws {Error} If there's an error fetching the balance
 */
export const getSmartContractRuneBalance = async () => {
  try {
    // Convert the smart contract's public key from hex to buffer
    const smartcontractPubkey = Buffer.from(ACCOUNT_PUBKEY_SWAP, "hex");

    // Get the smart contract's address from its public key
    const smartContractAddress = await rpc.getAccountAddress(
      new Uint8Array(smartcontractPubkey)
    );

    // Fetch the Rune token balance for the smart contract address
    const res = await getRuneBalanceList(smartContractAddress);

    return res;
  } catch (error) {
    console.error('Error fetching smart contract Rune balance:', error);
    throw error;
  }
};
