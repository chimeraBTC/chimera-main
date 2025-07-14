/**
 * Test script to analyze old working private keys and understand the original architecture
 */

import { RpcConnection, PubkeyUtil } from "@saturnbtcio/arch-sdk";
import { createHash } from 'crypto';
import * as secp256k1 from 'tiny-secp256k1';

// Initialize RPC client
const RPC_URL = "http://127.0.0.1:9002";
const rpc = new RpcConnection(RPC_URL);

// Old working private keys
const oldArchPrivateKey = "9d661e76319fc4a151c7857549172c44d9c9d9682ac2233ea8cde251f6378a8a";
const envPrivateKey = "af8a0d35093b4f6cae145f4437311bd2fa477d93a99bf6d76cca078c27012773";

// Current target address
const targetAddress = "tb1pdehlzgmjm4jpxcap8c0e4ncwjql9xgqvv3zegp8u953vsufpvjzqsw0ksy";
const currentPubkey = "5eca3cc573ec9385aad3c81e69112c8ae5e54afd0f678e983d241267b4510109";

function derivePublicKey(privateKeyHex) {
  try {
    const privateKeyBuffer = Buffer.from(privateKeyHex, 'hex');
    const publicKey = secp256k1.pointFromScalar(privateKeyBuffer, true);
    return Buffer.from(publicKey).toString('hex');
  } catch (error) {
    console.log("Error deriving public key:", error.message);
    return null;
  }
}

async function testOldArchitecture() {
  console.log("🔍 Analyzing OLD working Arch private key configuration...\n");
  
  try {
    // Test old Arch private key
    console.log("📋 Old Arch Private Key Analysis:");
    console.log("Private key:", oldArchPrivateKey);
    
    const oldPubkey = derivePublicKey(oldArchPrivateKey);
    if (oldPubkey) {
      console.log("Derived public key:", oldPubkey);
      
      // Try with compressed pubkey (33 bytes, remove 04 prefix if present)
      let pubkeyToTest = oldPubkey;
      if (oldPubkey.startsWith('04')) {
        // Uncompressed, convert to compressed
        const x = oldPubkey.slice(2, 66);
        const y = oldPubkey.slice(66);
        const yBigInt = BigInt('0x' + y);
        const prefix = yBigInt % 2n === 0n ? '02' : '03';
        pubkeyToTest = prefix + x;
      }
      
      console.log("Testing with pubkey:", pubkeyToTest);
      
      try {
        const oldAddress = await rpc.getAccountAddress(
          PubkeyUtil.fromHex(pubkeyToTest.slice(2)) // Remove 02/03 prefix for Arch
        );
        console.log("Generated Bitcoin address:", oldAddress);
        console.log("Matches target?", oldAddress === targetAddress);
      } catch (error) {
        console.log("Error with compressed key:", error.message);
        
        // Try with the raw public key
        try {
          const oldAddress2 = await rpc.getAccountAddress(
            PubkeyUtil.fromHex(oldPubkey.slice(2, 66)) // Take x coordinate only
          );
          console.log("Generated Bitcoin address (x-only):", oldAddress2);
          console.log("Matches target?", oldAddress2 === targetAddress);
        } catch (error2) {
          console.log("Error with x-only key:", error2.message);
        }
      }
    }
    
    console.log("\n" + "=".repeat(50) + "\n");
    
    // Test .env private key
    console.log("🔑 .env Private Key Analysis:");
    console.log("Private key:", envPrivateKey);
    
    const envPubkey = derivePublicKey(envPrivateKey);
    if (envPubkey) {
      console.log("Derived public key:", envPubkey);
      
      // Try with compressed pubkey
      let envPubkeyToTest = envPubkey;
      if (envPubkey.startsWith('04')) {
        const x = envPubkey.slice(2, 66);
        const y = envPubkey.slice(66);
        const yBigInt = BigInt('0x' + y);
        const prefix = yBigInt % 2n === 0n ? '02' : '03';
        envPubkeyToTest = prefix + x;
      }
      
      console.log("Testing with pubkey:", envPubkeyToTest);
      
      try {
        const envAddress = await rpc.getAccountAddress(
          PubkeyUtil.fromHex(envPubkeyToTest.slice(2)) // Remove 02/03 prefix
        );
        console.log("Generated Bitcoin address:", envAddress);
        console.log("Matches target?", envAddress === targetAddress);
      } catch (error) {
        console.log("Error with compressed key:", error.message);
        
        // Try with x-only
        try {
          const envAddress2 = await rpc.getAccountAddress(
            PubkeyUtil.fromHex(envPubkey.slice(2, 66))
          );
          console.log("Generated Bitcoin address (x-only):", envAddress2);
          console.log("Matches target?", envAddress2 === targetAddress);
        } catch (error2) {
          console.log("Error with x-only key:", error2.message);
        }
      }
    }
    
    console.log("\n" + "=".repeat(50) + "\n");
    
    // Compare with current setup
    console.log("🔄 Current Setup Comparison:");
    console.log("Current ACCOUNT_PUBKEY:", currentPubkey);
    
    const currentAddress = await rpc.getAccountAddress(
      PubkeyUtil.fromHex(currentPubkey)
    );
    console.log("Current generated address:", currentAddress);
    console.log("Matches target?", currentAddress === targetAddress);
    
    console.log("\n🎯 Target address:", targetAddress);
    
    // Check if current pubkey matches any of our derived keys
    console.log("\n🔍 Checking if current pubkey matches derived keys:");
    if (oldPubkey) {
      const oldPubkeyClean = oldPubkey.startsWith('04') ? oldPubkey.slice(4, 68) : oldPubkey.slice(2);
      console.log("Old key matches current?", oldPubkeyClean === currentPubkey);
    }
    if (envPubkey) {
      const envPubkeyClean = envPubkey.startsWith('04') ? envPubkey.slice(4, 68) : envPubkey.slice(2);
      console.log("Env key matches current?", envPubkeyClean === currentPubkey);
    }
    
  } catch (error) {
    console.error("❌ Error during analysis:", error);
    console.log("\n💡 Make sure your Arch RPC is running on http://127.0.0.1:9002");
  }
}

// Run the analysis
testOldArchitecture().catch(console.error);