/**
 * Comprehensive analysis of old working keys to understand their nature and relationship
 */

import { RpcConnection, PubkeyUtil } from "@saturnbtcio/arch-sdk";
import { createHash } from 'crypto';
import * as secp256k1 from 'tiny-secp256k1';

// Initialize RPC client
const RPC_URL = "http://127.0.0.1:9002";
const rpc = new RpcConnection(RPC_URL);

// Old working keys to analyze
const oldAccountPubkey = "ca74c4777b9a4753bd401751d9c33539b9352a152ab92d63a97fd0ab699a0835";
const oldArchPrivateKey = "9d661e76319fc4a151c7857549172c44d9c9d9682ac2233ea8cde251f6378a8a";

console.log("🔍 COMPREHENSIVE ANALYSIS OF OLD WORKING KEYS");
console.log("=".repeat(60));

async function analyzeKeys() {
  console.log("\n📋 ANALYZING OLD ARCH PRIVATE KEY:");
  console.log("Key: 9d661e76319fc4a151c7857549172c44d9c9d9682ac2233ea8cde251f6378a8a");
  console.log("Length:", oldArchPrivateKey.length, "characters (", oldArchPrivateKey.length/2, "bytes)");
  
  try {
    // Test 1: Derive Bitcoin public key from private key
    const privateKeyBuffer = Buffer.from(oldArchPrivateKey, 'hex');
    
    // Generate compressed public key
    const compressedPubkey = secp256k1.pointFromScalar(privateKeyBuffer, true);
    console.log("Compressed pubkey:", Buffer.from(compressedPubkey).toString('hex'));
    
    // Generate uncompressed public key  
    const uncompressedPubkey = secp256k1.pointFromScalar(privateKeyBuffer, false);
    console.log("Uncompressed pubkey:", Buffer.from(uncompressedPubkey).toString('hex'));
    
    // Extract x-coordinate only (for taproot)
    const xOnlyPubkey = Buffer.from(compressedPubkey).slice(1).toString('hex');
    console.log("X-only pubkey:", xOnlyPubkey);
    
    // Test 2: Check if any of these match the old ACCOUNT_PUBKEY
    console.log("\n🔗 CHECKING RELATIONSHIP TO OLD ACCOUNT_PUBKEY:");
    console.log("Target ACCOUNT_PUBKEY:", oldAccountPubkey);
    console.log("Compressed matches?", Buffer.from(compressedPubkey).toString('hex') === "03" + oldAccountPubkey);
    console.log("X-only matches?", xOnlyPubkey === oldAccountPubkey);
    console.log("Raw matches?", Buffer.from(compressedPubkey).slice(1).toString('hex') === oldAccountPubkey);
    
    // Test 3: Try different Bitcoin address derivations from private key
    console.log("\n🏠 BITCOIN ADDRESSES FROM PRIVATE KEY:");
    
    // Try generating taproot address directly
    try {
      const archAddress = await rpc.getAccountAddress(
        PubkeyUtil.fromHex(xOnlyPubkey)
      );
      console.log("Arch-derived address (x-only):", archAddress);
    } catch (error) {
      console.log("Error with x-only:", error.message);
    }
    
    // Try with compressed pubkey
    try {
      const archAddress2 = await rpc.getAccountAddress(
        PubkeyUtil.fromHex(Buffer.from(compressedPubkey).slice(1).toString('hex'))
      );
      console.log("Arch-derived address (compressed):", archAddress2);
    } catch (error) {
      console.log("Error with compressed:", error.message);
    }
    
  } catch (error) {
    console.log("❌ Error analyzing private key:", error.message);
  }
  
  console.log("\n" + "=".repeat(60));
  console.log("\n📋 ANALYZING OLD ACCOUNT_PUBKEY:");
  console.log("Key: ca74c4777b9a4753bd401751d9c33539b9352a152ab92d63a97fd0ab699a0835");
  console.log("Length:", oldAccountPubkey.length, "characters (", oldAccountPubkey.length/2, "bytes)");
  
  try {
    // Test 1: Use as Arch account public key
    console.log("\n🏠 TESTING AS ARCH ACCOUNT PUBLIC KEY:");
    
    const archEscrowAddress = await rpc.getAccountAddress(
      PubkeyUtil.fromHex(oldAccountPubkey)
    );
    console.log("Generated escrow address:", archEscrowAddress);
    
    // Test 2: Try to construct a Bitcoin public key from it
    console.log("\n🔑 TESTING AS BITCOIN PUBLIC KEY:");
    
    // Try as x-only pubkey (add 02 prefix)
    const testCompressed = "02" + oldAccountPubkey;
    console.log("As compressed pubkey:", testCompressed);
    
    try {
      const archAddress3 = await rpc.getAccountAddress(
        PubkeyUtil.fromHex(oldAccountPubkey)
      );
      console.log("Arch address from raw key:", archAddress3);
    } catch (error) {
      console.log("Error treating as raw pubkey:", error.message);
    }
    
  } catch (error) {
    console.log("❌ Error analyzing account pubkey:", error.message);
  }
  
  console.log("\n" + "=".repeat(60));
  console.log("\n🧮 MATHEMATICAL RELATIONSHIP TESTS:");
  
  try {
    // Test if old ACCOUNT_PUBKEY could be derived from old ARCH_PRIVATE_KEY
    const privateKeyBuffer = Buffer.from(oldArchPrivateKey, 'hex');
    const derivedXOnly = secp256k1.pointFromScalar(privateKeyBuffer, true).slice(1);
    
    console.log("Private key:", oldArchPrivateKey);
    console.log("Derived x-only:", Buffer.from(derivedXOnly).toString('hex'));
    console.log("Account pubkey:", oldAccountPubkey);
    console.log("Direct match?", Buffer.from(derivedXOnly).toString('hex') === oldAccountPubkey);
    
    // Test hash-based derivations
    const sha256Hash = createHash('sha256').update(privateKeyBuffer).digest('hex');
    console.log("SHA256 of private key:", sha256Hash);
    console.log("SHA256 matches account?", sha256Hash === oldAccountPubkey);
    
    // Test if account pubkey could be a hash of the derived pubkey
    const pubkeyHash = createHash('sha256').update(derivedXOnly).digest('hex');
    console.log("SHA256 of derived pubkey:", pubkeyHash);
    console.log("Pubkey hash matches account?", pubkeyHash === oldAccountPubkey);
    
  } catch (error) {
    console.log("❌ Error in mathematical tests:", error.message);
  }
  
  console.log("\n" + "=".repeat(60));
  console.log("\n📊 SUMMARY:");
  console.log("🔸 Old ARCH_PRIVATE_KEY: 32-byte private key");
  console.log("🔸 Old ACCOUNT_PUBKEY: 32-byte key (unknown type)");
  console.log("🔸 Relationship: [Analysis complete - see results above]");
  console.log("\n✅ Analysis complete! Check results to understand key architecture.");
}

// Run the analysis
analyzeKeys().catch(console.error);