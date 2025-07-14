/**
 * Test various Arch-specific key derivation patterns to understand the architecture
 */

import { RpcConnection, PubkeyUtil } from "@saturnbtcio/arch-sdk";
import { createHash } from 'crypto';
import * as secp256k1 from 'tiny-secp256k1';

const RPC_URL = "http://127.0.0.1:9002";
const rpc = new RpcConnection(RPC_URL);

// Old working keys
const oldAccountPubkey = "ca74c4777b9a4753bd401751d9c33539b9352a152ab92d63a97fd0ab699a0835";
const oldArchPrivateKey = "9d661e76319fc4a151c7857549172c44d9c9d9682ac2233ea8cde251f6378a8a";

// Current problematic address
const currentEscrowAddress = "tb1pdehlzgmjm4jpxcap8c0e4ncwjql9xgqvv3zegp8u953vsufpvjzqsw0ksy";

async function testArchDerivationPatterns() {
  console.log("🧪 TESTING ARCH-SPECIFIC KEY DERIVATION PATTERNS");
  console.log("=".repeat(70));
  
  console.log("\n🎯 GOAL: Find how to generate", currentEscrowAddress);
  console.log("FROM old working keys...");
  
  try {
    // Test 1: Maybe the ACCOUNT_PUBKEY is derived from ARCH_PRIVATE_KEY through Arch methods
    console.log("\n📋 TEST 1: Arch account derivation from private key");
    
    const privateKeyBuffer = Buffer.from(oldArchPrivateKey, 'hex');
    const publicKey = secp256k1.pointFromScalar(privateKeyBuffer, true);
    const xOnlyPubkey = Buffer.from(publicKey).slice(1);
    
    console.log("Private key:", oldArchPrivateKey);
    console.log("Derived x-only:", xOnlyPubkey.toString('hex'));
    console.log("Expected account:", oldAccountPubkey);
    console.log("Match?", xOnlyPubkey.toString('hex') === oldAccountPubkey);
    
    // Test 2: Maybe there's a hash-based derivation
    console.log("\n📋 TEST 2: Hash-based derivations");
    
    // Try various hash combinations
    const privKeyHash = createHash('sha256').update(privateKeyBuffer).digest();
    console.log("SHA256(privkey):", privKeyHash.toString('hex'));
    console.log("Match account?", privKeyHash.toString('hex') === oldAccountPubkey);
    
    const pubKeyHash = createHash('sha256').update(xOnlyPubkey).digest();
    console.log("SHA256(xOnlyPubkey):", pubKeyHash.toString('hex'));
    console.log("Match account?", pubKeyHash.toString('hex') === oldAccountPubkey);
    
    // Test 3: Maybe the account pubkey can generate the current escrow address
    console.log("\n📋 TEST 3: Can old account pubkey generate current escrow?");
    
    const oldAccountAddress = await rpc.getAccountAddress(
      PubkeyUtil.fromHex(oldAccountPubkey)
    );
    console.log("Old account address:", oldAccountAddress);
    console.log("Current escrow:", currentEscrowAddress);
    console.log("Match?", oldAccountAddress === currentEscrowAddress);
    
    // Test 4: Try program IDs from config
    console.log("\n📋 TEST 4: Test with program IDs from config");
    
    const smartContractPubkey = "393cd8d2c014d9e25b31a8a8407ff00986d9f84f40055545aacab3f05dd93240";
    const swapContractPubkey = "91d402e0373f71cd86ca53bc623912bb47a350015bcf5aafa7be9e3fc202e895";
    
    try {
      const smartContractAddress = await rpc.getAccountAddress(
        PubkeyUtil.fromHex(smartContractPubkey)
      );
      console.log("Smart contract address:", smartContractAddress);
      console.log("Match current escrow?", smartContractAddress === currentEscrowAddress);
    } catch (error) {
      console.log("Error with smart contract:", error.message);
    }
    
    try {
      const swapContractAddress = await rpc.getAccountAddress(
        PubkeyUtil.fromHex(swapContractPubkey)
      );
      console.log("Swap contract address:", swapContractAddress);
      console.log("Match current escrow?", swapContractAddress === currentEscrowAddress);
    } catch (error) {
      console.log("Error with swap contract:", error.message);
    }
    
    // Test 5: Try various transformations of the old keys
    console.log("\n📋 TEST 5: Key transformations");
    
    // Try reversing bytes
    const reversedPrivkey = Buffer.from(oldArchPrivateKey, 'hex').reverse().toString('hex');
    console.log("Reversed private key:", reversedPrivkey);
    
    const reversedAccount = Buffer.from(oldAccountPubkey, 'hex').reverse().toString('hex');
    console.log("Reversed account key:", reversedAccount);
    
    try {
      const reversedAccountAddress = await rpc.getAccountAddress(
        PubkeyUtil.fromHex(reversedAccount)
      );
      console.log("Reversed account address:", reversedAccountAddress);
      console.log("Match current escrow?", reversedAccountAddress === currentEscrowAddress);
    } catch (error) {
      console.log("Error with reversed account:", error.message);
    }
    
    // Test 6: XOR combinations
    console.log("\n📋 TEST 6: XOR key combinations");
    
    const privBuffer = Buffer.from(oldArchPrivateKey, 'hex');
    const accountBuffer = Buffer.from(oldAccountPubkey, 'hex');
    const xorResult = Buffer.alloc(32);
    
    for (let i = 0; i < 32; i++) {
      xorResult[i] = privBuffer[i] ^ accountBuffer[i];
    }
    
    console.log("XOR of private and account:", xorResult.toString('hex'));
    
    try {
      const xorAddress = await rpc.getAccountAddress(
        PubkeyUtil.fromHex(xorResult.toString('hex'))
      );
      console.log("XOR address:", xorAddress);
      console.log("Match current escrow?", xorAddress === currentEscrowAddress);
    } catch (error) {
      console.log("Error with XOR:", error.message);
    }
    
  } catch (error) {
    console.log("❌ Error in derivation tests:", error.message);
  }
  
  console.log("\n" + "=".repeat(70));
  console.log("\n🎯 SUMMARY OF DERIVATION TESTS:");
  console.log("• Tested standard crypto derivations: ❌");
  console.log("• Tested hash-based derivations: ❌");
  console.log("• Tested Arch program IDs: ❓");
  console.log("• Tested key transformations: ❓");
  console.log("\n💡 If none match, the current escrow address might be from a completely different source!");
}

// Run the tests
testArchDerivationPatterns().catch(console.error);